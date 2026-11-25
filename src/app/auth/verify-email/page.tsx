'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleCheck, Mail, MailOpen, Pencil } from 'lucide-react';
import * as authApi from '@/utils/api';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { AuthAlert, AuthField, AuthShell, AuthStatus, AuthSubmit, OtpInput } from '@/components/auth/AuthKit';

// utils/api is plain JS with loose JSDoc; pin the shapes used here
const verifyEmail = authApi.verifyEmail as unknown as (a: { email: string; verificationCode: string }) => Promise<unknown>;
const resendVerificationEmail = authApi.resendVerificationEmail as unknown as (a: { email: string }) => Promise<unknown>;

const CODE_LENGTH = 6;
const RESEND_WAIT = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params?.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter the email you signed up with.');
      setEditingEmail(true);
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits from the email.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email: email.trim(), verificationCode: code });
      setDone(true);
      setTimeout(() => router.push(`/auth/login?email=${encodeURIComponent(email.trim())}`), 2000);
    } catch (err) {
      const message = (err as { message?: string })?.message || '';
      setError(/expired/i.test(message) ? 'That code has expired. Send a new one below.' : /invalid/i.test(message) ? 'That code isn’t right. Check the email and try again.' : 'We couldn’t verify your email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // submit automatically once all digits are in
  useEffect(() => {
    if (code.length === CODE_LENGTH && !loading && !done && EMAIL_RE.test(email.trim())) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter your email first.');
      setEditingEmail(true);
      return;
    }
    setResending(true);
    setError('');
    try {
      await resendVerificationEmail({ email: email.trim() });
      ToastService.success('A new code is on its way.');
      setCode('');
      setCooldown(RESEND_WAIT);
    } catch {
      setError('We couldn’t send a new code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="Verified" title="Email confirmed">
        <AuthStatus icon={CircleCheck} tone="success" title="You’re verified">
          Thanks for confirming your email. Taking you to sign in…
        </AuthStatus>
        <Link href="/auth/login" className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#611192] text-[15px] font-semibold text-white">
          Sign in now
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="One last step"
      title="Verify your email"
      asideTitle="One quick check keeps every account on Angelpage real."
      back={{ href: '/auth/login', label: 'Back to sign in' }}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-[#F6EEFA] p-4 ring-1 ring-[#EBDDF5]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#611192]">
          <MailOpen className="h-5 w-5" aria-hidden />
        </span>
        {editingEmail ? (
          <p className="text-[14px] leading-snug text-[#3B055C]">Enter your email, then the {CODE_LENGTH}-digit code we sent you. Codes last 15 minutes.</p>
        ) : (
          <p className="min-w-0 text-[14px] leading-snug text-[#3B055C]">
            We sent a {CODE_LENGTH}-digit code to <strong className="break-all font-semibold">{email}</strong>.{' '}
            <button type="button" onClick={() => setEditingEmail(true)} className="inline-flex items-center gap-1 font-medium text-[#611192] underline">
              <Pencil className="h-3 w-3" aria-hidden /> Change
            </button>
          </p>
        )}
      </div>

      <form onSubmit={verify} className="mt-6 space-y-5" noValidate>
        {editingEmail ? (
          <AuthField label="Email address" type="email" icon={Mail} autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        ) : null}
        <div>
          <p className="mb-2 text-[13px] font-medium text-[#2A2730]">Verification code</p>
          <OtpInput value={code} onChange={v => { setCode(v); setError(''); }} length={CODE_LENGTH} disabled={loading} invalid={Boolean(error) && code.length === CODE_LENGTH} />
        </div>
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <AuthSubmit loading={loading} loadingText="Checking…">
          Verify email
        </AuthSubmit>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#6B686E]">
        Didn’t get it?{' '}
        {cooldown > 0 ? (
          <span className="text-[#8A888C]">Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} disabled={resending} className="font-semibold text-[#611192] hover:underline disabled:opacity-60">
            {resending ? 'Sending…' : 'Send a new code'}
          </button>
        )}
      </p>
    </AuthShell>
  );
}
