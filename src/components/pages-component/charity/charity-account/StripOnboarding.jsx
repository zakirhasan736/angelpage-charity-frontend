'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { ArrowUpRight, BadgeCheck, Landmark, Loader2 } from 'lucide-react';

/** Starts (or resumes) Stripe Connect onboarding and sends the charity straight to Stripe. */
const StripeOnboarding = ({ compact = false }) => {
  const { data: session } = useSession() || {};
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const handleOnboard = async () => {
    setLoading(true);
    setError('');
    try {
      const charityId = session?.user?.charityId || session?.user?.id;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/onboard`,
        { charityId },
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      const url = response.data?.onboardingUrl;
      if (!url && response.data?.stripeAccountId) {
        setConnected(true);
        return;
      }
      if (!url) throw new Error('No onboarding link returned');
      setOnboardingUrl(url);
      window.location.assign(url);
    } catch (err) {
      setError('We couldn’t open Stripe right now. Please try again.');
      console.error('Error onboarding charity:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? '' : 'rounded-2xl bg-white p-5 ring-1 ring-[#ECE8EE]'}>
      {!compact && (
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
            <Landmark className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#0B0112]">Payouts with Stripe</p>
            <p className="text-[13px] leading-snug text-[#6B686E]">Stripe checks your details and sends sale proceeds to your bank. It takes about 5 minutes.</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleOnboard}
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B0112] px-5 text-[14.5px] font-semibold text-white transition hover:bg-[#2A1A35] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {loading ? 'Opening Stripe…' : 'Connect with Stripe'}
        {!loading && <ArrowUpRight className="h-4 w-4" aria-hidden />}
      </button>
      {connected && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#00754F]">
          <BadgeCheck className="h-4 w-4" aria-hidden /> Stripe is already connected to this charity.
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-[#C0143C]" role="alert">{error}</p>}
      {onboardingUrl && (
        <p className="mt-2 text-[12.5px] text-[#6B686E]">
          Not redirected?{' '}
          <a href={onboardingUrl} className="font-medium text-[#611192] underline">
            Open Stripe setup
          </a>
        </p>
      )}
    </div>
  );
};

export default StripeOnboarding;
