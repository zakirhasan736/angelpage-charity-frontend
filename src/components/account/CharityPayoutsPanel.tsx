'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { ToastService } from '@/components/elements/notifications/ToastService';
import StatCard from '@/components/dashboard/StatCard';
import { formatMoney } from '@/lib/money';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';
import { BadgeCheck, Banknote, CreditCard, HandHeart, Hourglass, Lock, Percent } from 'lucide-react';
import useDashboardOverview from '@/hooks/useDashboardOverview';

const CharityPayoutsPanel = () => {
  const { data: session } = useSession() || {};
  const { data: dashboard } = useDashboardOverview(session?.token, 'month');
  const charityFunds = dashboard?.charityFunds;
  const [onboarding, setOnboarding] = useState(false);

  const charityId = (session?.user as { charityId?: string })?.charityId || session?.user?.id;

  const startStripeOnboard = async () => {
    if (!session?.token || !charityId) return;
    setOnboarding(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/onboard`,
        { charityId },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        ToastService.success('Stripe account connected or already set up.');
      }
    } catch {
      ToastService.error('Could not start Stripe onboarding.');
    } finally {
      setOnboarding(false);
    }
  };

  const steps = [
    { icon: Lock, t: 'Held in escrow', b: 'Buyer payment is held until delivery is confirmed.' },
    { icon: Hourglass, t: 'Pending balance', b: 'After the hold period, funds move to your pending balance.' },
    { icon: BadgeCheck, t: 'Approved', b: 'An admin approves the payout to your connected Stripe account.' },
    { icon: Banknote, t: 'Paid out', b: 'You get an email when the funds are transferred.' },
  ];

  return (
    <div className="charity-payouts-panel space-y-5">
      <section className="relative overflow-hidden rounded-[24px] bg-[#0B0112] p-7 text-white max-[767px]:rounded-[20px] max-[767px]:p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#611192]/60 blur-[80px]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[12px] text-white/60!">Pending payout</p>
            <p className="mt-1 font-primary text-[48px] leading-none tabular-nums text-white! max-[767px]:text-[36px]">
              {formatMoney(charityFunds?.totalHeldFunds)}
            </p>
            <p className="mt-2 text-[13px] text-white/60!">Released to your Stripe account after admin approval.</p>
          </div>
          <button
            type="button"
            onClick={startStripeOnboard}
            disabled={onboarding}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#611192] transition hover:bg-[#F2E8F8] disabled:opacity-60 max-[767px]:w-full max-[767px]:justify-center"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {onboarding ? 'Redirecting…' : 'Connect Stripe account'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3">
        <StatCard label="Profit received" value={formatMoney(charityFunds?.totalEarned)} subtitle="all time" accent="green" icon={<HandHeart className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="Pending payout" value={formatMoney(charityFunds?.totalHeldFunds)} subtitle="awaiting admin release" accent="amber" icon={<Hourglass className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="Charity share" value={`${CHARITY_SHARE_PERCENT}%`} subtitle="of each sale, by default" accent="purple" icon={<Percent className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
      </div>

      <section className="rounded-[20px] border border-[#ECE8EE] bg-white p-6 max-[767px]:p-4">
        <h4 className="text-[15px] font-semibold text-mono-100">How payouts work</h4>
        <ol className="mt-5 grid grid-cols-4 gap-3 max-[991px]:grid-cols-2 max-[767px]:grid-cols-1">
          {steps.map(({ icon: Icon, t, b }, i) => (
            <li key={t} className="relative rounded-2xl bg-[#FAF8FB] p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#611192] shadow-[0_4px_12px_rgba(59,5,92,0.08)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-[12px] font-semibold text-[#C9C8CA]">0{i + 1}</span>
              </div>
              <p className="mt-4 text-[14px] font-semibold text-mono-100">{t}</p>
              <p className="mt-1 text-[13px] leading-5 text-mono-70">{b}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default CharityPayoutsPanel;
