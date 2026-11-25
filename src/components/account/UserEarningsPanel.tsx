'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { formatMoney } from '@/lib/money';
import { CircleCheck, Download, Hourglass, ShieldAlert, Wallet } from 'lucide-react';

const UserEarningsPanel = () => {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<{
    totalEarned: number;
    pendingEscrow: number;
    releasedEscrow: number;
    disputedAmount: number;
    orderCount: number;
    recentOrders: { id: string; amount: number; escrowStatus?: string; disputeStatus?: string; status: string; createdAt: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.token) return;
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/earnings`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.token]);

  const downloadExport = async (mode: 'sold' | 'bought') => {
    if (!session?.token) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/export/orders?mode=${mode}`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode}-orders.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 min-[1100px]:grid-cols-4">
        {[1, 2, 3, 4].map(k => (
          <StatCard key={k} label="" value="" loading />
        ))}
      </div>
    );
  }

  const orders = data?.recentOrders || [];

  return (
    <div className="user-earnings-panel space-y-5">
      <section className="relative overflow-hidden rounded-[24px] bg-[#0B0112] p-7 text-white max-[767px]:rounded-[20px] max-[767px]:p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#611192]/60 blur-[80px]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[12px] text-white/60!">Total earned</p>
            <p className="mt-1 font-primary text-[48px] leading-none tabular-nums text-white! max-[767px]:text-[36px]">
              {formatMoney(data?.totalEarned)}
            </p>
            <p className="mt-2 text-[13px] text-white/60!">Seller revenue, escrow holds and order history for your records.</p>
          </div>
          <div className="flex gap-2 max-[767px]:w-full">
            {(['sold', 'bought'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => downloadExport(mode)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-medium text-white! ring-1 ring-white/15 transition hover:bg-white hover:text-[#611192]! max-[767px]:flex-1 max-[767px]:justify-center"
              >
                <Download className="h-4 w-4" aria-hidden />
                Export {mode}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 max-[767px]:gap-3 min-[1100px]:grid-cols-4">
        <StatCard label="Total earned" value={formatMoney(data?.totalEarned)} accent="purple" icon={<Wallet className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="In escrow" value={formatMoney(data?.pendingEscrow)} subtitle="held until release" accent="amber" icon={<Hourglass className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="Released" value={formatMoney(data?.releasedEscrow)} accent="green" icon={<CircleCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="In dispute" value={formatMoney(data?.disputedAmount)} accent="blue" icon={<ShieldAlert className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
      </div>

      <section className="overflow-hidden rounded-[20px] border border-[#ECE8EE] bg-white">
        <header className="flex items-center justify-between border-b border-[#F1EEF3] px-5 py-4">
          <h4 className="text-[15px] font-semibold text-mono-100">Recent seller orders</h4>
          <span className="text-[12px] text-mono-70">{orders.length} orders</span>
        </header>
        {orders.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13px] text-mono-70">No seller orders yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto max-[767px]:hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-5 text-left">Order</th>
                    <th className="px-5 text-left">Status</th>
                    <th className="px-5 text-left">Escrow</th>
                    <th className="px-5 text-left">Dispute</th>
                    <th className="px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-[#F1EEF3]">
                      <td className="px-5 font-mono text-[12px] text-mono-90">#{String(o.id).slice(-8)}</td>
                      <td className="px-5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 text-mono-90">{o.escrowStatus || '—'}</td>
                      <td className="px-5 text-mono-90">{o.disputeStatus || 'None'}</td>
                      <td className="px-5 text-right font-semibold tabular-nums">{formatMoney(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="hidden divide-y divide-[#F1EEF3] max-[767px]:block">
              {orders.map(o => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[12px] text-mono-90">#{String(o.id).slice(-8)}</p>
                    <p className="mt-1 text-[11px] text-mono-70">
                      Escrow {o.escrowStatus || '—'} · Dispute {o.disputeStatus || 'none'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[14px] font-semibold tabular-nums">{formatMoney(o.amount)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

export default UserEarningsPanel;
