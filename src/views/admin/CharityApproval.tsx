'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Landmark } from 'lucide-react';
import { Btn, ConfirmDialog, RowSkeleton, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { ToastService } from '@/components/elements/notifications/ToastService';

interface CharityRow {
  _id: string;
  charityName: string;
  totalHeldFunds: number;
  email?: string;
  stripeAccountId?: string;
}

const CharityApproval = () => {
  const { data: session } = useSession() || {};
  const [charities, setCharities] = useState<CharityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchCharities = useCallback(async () => {
    if (!session?.token) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/charities/pending-approval`,
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      setCharities(
        Array.isArray(response.data) ? response.data : response.data.charities || []
      );
    } catch {
      setError('Error fetching charities pending payout.');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchCharities();
  }, [fetchCharities]);

  const handleApproveFundsRelease = async (charityId: string) => {
    setApprovingId(charityId);
    setError('');
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/funds/release/${charityId}`,
        {},
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      ToastService.success('Payout approved and transferred.');
      setCharities(prev => prev.filter(c => c._id !== charityId));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response
          ?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to approve payout.';
      setError(msg);
      ToastService.error(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const pending = charities.find(c => c._id === confirmId);
  const total = charities.reduce((sum, c) => sum + Number(c.totalHeldFunds || 0), 0);

  return (
    <SectionCard icon={Landmark} title="Charity payouts awaiting approval" description="Approving transfers held funds to the charity’s connected Stripe account." action={!loading && charities.length ? <span className="text-[13px] font-semibold tabular-nums text-[#611192]">{formatMoney(total)} held</span> : null}>
      {error ? (
        <p className="mb-4 rounded-xl bg-[#FFF1F4] px-3 py-2 text-[13px] text-[#9F1239]" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <RowSkeleton rows={2} />
      ) : charities.length === 0 ? (
        <p className="rounded-2xl bg-[#FAF8FB] px-4 py-6 text-center text-[13.5px] text-[#6B686E]">No payouts waiting.</p>
      ) : (
        <ul className="space-y-2">
          {charities.map(charity => (
            <li key={charity._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-3.5 ring-1 ring-[#ECE8EE]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] font-primary text-[18px] text-[#611192]">{charity.charityName?.charAt(0) || 'C'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#0B0112]">{charity.charityName}</p>
                <p className="truncate text-[12px] text-[#8A888C]">{charity.email}</p>
              </div>
              <StatusPill status={charity.stripeAccountId ? 'Stripe connected' : 'No Stripe account'} tone={charity.stripeAccountId ? 'green' : 'amber'} />
              <p className="w-24 text-right text-[15px] font-semibold tabular-nums text-[#0B0112] sm:w-auto">{formatMoney(charity.totalHeldFunds)}</p>
              <Btn size="sm" loading={approvingId === charity._id} disabled={!charity.stripeAccountId} onClick={() => setConfirmId(charity._id)} className="sm:w-full">
                Approve payout
              </Btn>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        tone="primary"
        title="Send this payout?"
        body={pending ? `${formatMoney(pending.totalHeldFunds)} will be transferred to ${pending.charityName}’s Stripe account. This can’t be undone.` : null}
        confirmLabel="Approve & transfer"
        loading={Boolean(approvingId)}
        onConfirm={async () => {
          if (confirmId) await handleApproveFundsRelease(confirmId);
          setConfirmId(null);
        }}
        onClose={() => setConfirmId(null)}
      />
    </SectionCard>
  );
};

export default CharityApproval;
