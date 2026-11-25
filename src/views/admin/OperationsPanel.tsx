'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Download, Receipt, ShieldAlert, Vault } from 'lucide-react';
import { Btn, ConfirmDialog, humanizeStatus, MiniStats, RowSkeleton, SectionCard, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { ToastService } from '@/components/elements/notifications/ToastService';

interface OrderRow {
  _id: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  escrowStatus?: string;
  disputeStatus?: string;
  disputeNotes?: string;
  escrowReleaseAt?: string;
  createdAt: string;
  guestEmail?: string;
  guestName?: string;
  buyerId?: { firstName?: string; lastName?: string; email?: string };
}

const OperationsPanel: React.FC = () => {
  const { data: session } = useSession() || {};
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [escrowReady, setEscrowReady] = useState<OrderRow[]>([]);
  const [disputes, setDisputes] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [acting, setActing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ kind: 'release' | 'resolve' | 'resolve-release'; order: OrderRow } | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL;

  const fetchAll = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.token}` };
      const [ordersRes, escrowRes, disputesRes] = await Promise.all([
        axios.get(`${api}/admin/operations/orders`, { headers, params: { limit: 30 } }),
        axios.get(`${api}/admin/operations/escrow`, { headers }),
        axios.get(`${api}/admin/operations/disputes`, { headers }),
      ]);
      setOrders(ordersRes.data.orders || []);
      setEscrowReady(escrowRes.data.ready || []);
      setDisputes(disputesRes.data.disputes || []);
    } catch {
      ToastService.error('Failed to load operations data.');
    } finally {
      setLoading(false);
    }
  }, [api, session?.token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const releaseEscrow = async (orderId: string) => {
    try {
      await axios.post(
        `${api}/admin/operations/escrow/${orderId}/release`,
        {},
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      ToastService.success('Escrow released.');
      fetchAll();
    } catch {
      ToastService.error('Failed to release escrow.');
    }
  };

  const resolveDispute = async (orderId: string, releaseEscrowAfter = false) => {
    const resolution = window.prompt('Resolution notes for this dispute:');
    if (resolution === null) return;
    try {
      await axios.post(
        `${api}/admin/operations/disputes/${orderId}/resolve`,
        { resolution, releaseEscrow: releaseEscrowAfter },
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      ToastService.success('Dispute resolved.');
      fetchAll();
    } catch {
      ToastService.error('Failed to resolve dispute.');
    }
  };

  const downloadExport = async () => {
    if (!session?.token) return;
    const res = await fetch(`${api}/admin/operations/export/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const buyerLabel = (o: OrderRow) =>
    o.guestEmail ||
    o.buyerId?.email ||
    `${o.buyerId?.firstName || ''} ${o.buyerId?.lastName || ''}`.trim() ||
    '—';


  const runPending = async () => {
    if (!pendingAction) return;
    setActing(true);
    try {
      if (pendingAction.kind === 'release') await releaseEscrow(pendingAction.order._id);
      else await resolveDispute(pendingAction.order._id, pendingAction.kind === 'resolve-release');
    } finally {
      setActing(false);
      setPendingAction(null);
    }
  };

  if (loading) return <RowSkeleton rows={4} />;

  const term = q.trim().toLowerCase();
  const recent = orders.filter(o => !term || `${o._id} ${buyerLabel(o)} ${o.status} ${o.paymentStatus}`.toLowerCase().includes(term));

  return (
    <div className="operations-panel space-y-5">
      <MiniStats
        items={[
          { label: 'Escrow to release', value: escrowReady.length, icon: Vault },
          { label: 'Open disputes', value: disputes.length, icon: ShieldAlert },
          { label: 'Recent orders', value: orders.length, icon: Receipt },
        ]}
      />

      <SectionCard icon={Vault} title="Escrow ready for release" description="Delivered orders whose funds can be released to sellers and charities.">
        {escrowReady.length === 0 ? (
          <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">Nothing waiting.</p>
        ) : (
          <ul className="space-y-2">
            {escrowReady.map(order => (
              <li key={order._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-3.5 ring-1 ring-[#ECE8EE]">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#0B0112]">#{order._id.slice(-8)}</p>
                  <p className="truncate text-[12.5px] text-[#8A888C]">{buyerLabel(order)}</p>
                </div>
                <StatusPill status={order.escrowStatus} tone="amber" />
                <p className="w-24 text-right text-[14px] font-semibold tabular-nums">{formatMoney(order.grandTotal)}</p>
                <Btn size="sm" onClick={() => setPendingAction({ kind: 'release', order })} className="sm:w-full">
                  Release
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard icon={ShieldAlert} tone={disputes.length ? 'danger' : 'default'} title="Open disputes" description="Buyer or seller has raised a problem with the order.">
        {disputes.length === 0 ? (
          <p className="rounded-2xl bg-[#FAF8FB] px-4 py-5 text-center text-[13.5px] text-[#6B686E]">No active disputes.</p>
        ) : (
          <ul className="space-y-2">
            {disputes.map(order => (
              <li key={order._id} className="rounded-2xl p-3.5 ring-1 ring-[#F7C9D3]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#0B0112]">#{order._id.slice(-8)}</p>
                    <p className="truncate text-[12.5px] text-[#8A888C]">{buyerLabel(order)}</p>
                  </div>
                  <StatusPill status={humanizeStatus(order.status)} />
                </div>
                {order.disputeNotes ? <p className="mt-3 rounded-xl bg-[#FFF7F8] px-3 py-2 text-[13px] text-[#474648]">{order.disputeNotes}</p> : null}
                <div className="mt-3 flex justify-end gap-2 sm:flex-col">
                  <Btn size="sm" variant="secondary" onClick={() => setPendingAction({ kind: 'resolve', order })}>
                    Resolve
                  </Btn>
                  <Btn size="sm" onClick={() => setPendingAction({ kind: 'resolve-release', order })}>
                    Resolve &amp; release funds
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard icon={Receipt} title="Recent orders" action={<Btn size="sm" variant="secondary" icon={Download} onClick={downloadExport}>Export CSV</Btn>}>
        <Toolbar search={q} onSearch={setQ} placeholder="Search order, buyer or status" />
        <ul className="divide-y divide-[#F3EFF5]">
          {recent.map(order => (
            <li key={order._id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#0B0112]">{buyerLabel(order)}</p>
                <p className="text-[12px] text-[#8A888C]">#{order._id.slice(-8)}</p>
              </div>
              <StatusPill status={humanizeStatus(order.status)} />
              <StatusPill status={order.paymentStatus} />
              <p className="w-24 text-right text-[14px] font-semibold tabular-nums">{formatMoney(order.grandTotal)}</p>
            </li>
          ))}
          {recent.length === 0 ? <li className="py-6 text-center text-[13.5px] text-[#6B686E]">No orders match.</li> : null}
        </ul>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        tone="primary"
        title={pendingAction?.kind === 'resolve' ? 'Mark dispute as resolved?' : 'Release funds?'}
        body={pendingAction ? `Order #${pendingAction.order._id.slice(-8)} · ${formatMoney(pendingAction.order.grandTotal)}. ${pendingAction.kind === 'resolve' ? 'Funds stay held.' : 'Money goes to the seller and charity. This can’t be undone.'}` : null}
        confirmLabel={pendingAction?.kind === 'resolve' ? 'Resolve' : 'Release funds'}
        loading={acting}
        onConfirm={runPending}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
};

export default OperationsPanel;
