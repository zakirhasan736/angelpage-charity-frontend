'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Building2, KeyRound, Mail, MailCheck, ShieldCheck, User } from 'lucide-react';
import { requestPasswordReset } from '@/utils/api';
import CaptchaWidget from '@/components/auth/CaptchaWidget';
import { AuthAlert, AuthField, AuthGhostButton, AuthShell, AuthStatus, AuthSubmit, RoleSwitch } from '@/components/auth/AuthKit';

type Role = 'USER' | 'CHARITY' | 'ADMIN';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialRole = (t?: string | null): Role => (t === 'charity' ? 'CHARITY' : t === 'admin' ? 'ADMIN' : 'USER');

export default function RequestPasswordReset() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams?.get('email') || '');
  const [role, setRole] = useState<Role>(initialRole(searchParams?.get('type')));
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const isAdmin = searchParams?.get('type') === 'admin';

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = (sentTo || email).trim();
    if (!EMAIL_RE.test(target)) {
      setFieldError('Enter the email you signed up with');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(target, role, captchaToken);
      setSentTo(target);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'We couldn’t send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = role === 'ADMIN' ? '/admin/login' : role === 'CHARITY' ? '/auth/login?type=charity' : '/auth/login';

  if (sentTo) {
    return (
      <AuthShell eyebrow="Step 2 of 3" title="Check your inbox" back={{ href: loginHref, label: 'Back to sign in' }}>
        <AuthStatus icon={MailCheck} title="Reset link sent">
          We sent a link to <strong className="font-semibold text-[#0B0112]">{sentTo}</strong>. It works for 10 minutes. Check your spam folder if it doesn’t arrive.
        </AuthStatus>
        {error ? (
          <div className="mt-6">
            <AuthAlert>{error}</AuthAlert>
          </div>
        ) : null}
        <div className="mt-8 space-y-3">
          <Link href={loginHref} className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#611192] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73]">
            Back to sign in
          </Link>          <AuthGhostButton onClick={() => send()} disabled={loading}>
            {loading ? 'Sending…' : 'Send it again'}
          </AuthGhostButton>
          <button type="button" onClick={() => setSentTo('')} className="w-full py-2 text-[13.5px] font-medium text-[#611192] hover:underline">
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Step 1 of 3"
      title="Forgot your password?"
      subtitle="Enter the email on your account and we’ll send you a secure link to choose a new one."
      back={{ href: loginHref, label: 'Back to sign in' }}
      asideTitle="Locked out? You’ll be back in a minute."
      asidePoints={[
        { icon: Mail, text: 'We email you a one-time reset link' },
        { icon: KeyRound, text: 'Choose a new password on the next screen' },
        { icon: ShieldCheck, text: 'Links expire after 10 minutes for your safety' },
      ]}
      footer={
        <>
          Remembered it?{' '}
          <Link href={loginHref} className="font-semibold text-[#611192] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={send} className="space-y-4" noValidate>
        {!isAdmin ? (
          <RoleSwitch<Role>
            label="Which account?"
            value={role}
            onChange={setRole}
            options={[
              { value: 'USER', label: 'Individual', icon: User },
              { value: 'CHARITY', label: 'Charity or brand', icon: Building2 },
            ]}
          />
        ) : (
          <AuthAlert tone="info">Resetting an admin team password.</AuthAlert>
        )}
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <AuthField
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setFieldError('');
          }}
          error={fieldError}
        />
        <CaptchaWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
        <AuthSubmit loading={loading} loadingText="Sending link…">
          Send reset link
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
