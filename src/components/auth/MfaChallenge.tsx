'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import axios from 'axios';
import { KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import {
  AuthAlert,
  AuthField,
  AuthGhostButton,
  AuthSubmit,
  OtpInput,
} from './AuthKit';

export type MfaChallengeInfo = {
  token: string;
  method: 'totp' | 'email';
  hint?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** NextAuth surfaces the API's two-step answer as an error string: MFA_REQUIRED|token|method|hint */
export function parseMfaError(error?: string | null): MfaChallengeInfo | null {
  if (!error || !error.startsWith('MFA_REQUIRED|')) return null;
  const [, token, method, hint] = error.split('|');
  if (!token) return null;
  return {
    token,
    method: method === 'email' ? 'email' : 'totp',
    hint: hint || undefined,
  };
}

/**
 * Second step of sign-in: authenticator code, emailed code, or a recovery code.
 * Completes the NextAuth session through the "mfa" credentials provider.
 */
export default function MfaChallenge({
  challenge,
  onCancel,
  onSignedIn,
}: {
  challenge: MfaChallengeInfo;
  onCancel?: () => void;
  onSignedIn: () => void;
}) {
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(
    challenge.method === 'email' ? 30 : 0
  );
  const [note, setNote] = useState('');
  const submitted = useRef('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value = code) => {
    const v = value.trim();
    if (!v || busy) return;
    submitted.current = v;
    setBusy(true);
    setError('');
    const res = await signIn('mfa', {
      redirect: false,
      mfaToken: challenge.token,
      code: v,
      method: recovery ? 'recovery' : challenge.method,
    });
    if (res?.error) {
      const expired = /expired|sign in again/i.test(res.error);
      setError(
        res.error === 'CredentialsSignin'
          ? 'That code isn’t right. Check it and try again.'
          : res.error
      );
      setBusy(false);
      setCode('');
      if (expired) setTimeout(() => onCancel?.(), 1800);
      return;
    }
    onSignedIn();
  };

  // auto-submit a complete 6-digit code once
  useEffect(() => {
    if (!recovery && /^\d{6}$/.test(code) && submitted.current !== code)
      submit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, recovery]);

  const resend = async () => {
    setNote('');
    setError('');
    try {
      const r = await axios.post(`${API_URL}/auth/mfa/resend`, {
        mfaToken: challenge.token,
      });
      setNote(r.data?.message || 'We sent a new code.');
      setCooldown(30);
    } catch (e) {
      setError(
        (axios.isAxiosError(e) && e.response?.data?.message) ||
          'Could not send a new code.'
      );
    }
  };

  const Icon = recovery
    ? KeyRound
    : challenge.method === 'email'
      ? Mail
      : Smartphone;

  return (
    <div>
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192]">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.12em] text-[#611192] uppercase">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Two-step
            verification
          </p>
          <h2 className="mt-1 font-primary text-[24px] leading-tight text-[#0B0112]">
            {recovery
              ? 'Use a recovery code'
              : challenge.method === 'email'
                ? 'Check your email'
                : 'Open your authenticator app'}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B686E]">
            {recovery
              ? 'Enter one of the 10 codes you saved when you turned on two-step. Each code works once.'
              : challenge.method === 'email'
                ? `We sent a 6-digit code to ${challenge.hint || 'your email'}. It expires in 10 minutes.`
                : 'Enter the 6-digit code shown for Angelpage. It changes every 30 seconds.'}
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        {note ? <AuthAlert tone="success">{note}</AuthAlert> : null}
        {recovery ? (
          <AuthField
            label="Recovery code"
            name="recovery"
            icon={KeyRound}
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="XXXX-XXXX"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
        ) : (
          <div>
            <OtpInput
              value={code}
              onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
              disabled={busy}
              invalid={Boolean(error)}
            />
          </div>
        )}
        <AuthSubmit
          loading={busy}
          loadingText="Checking…"
          disabled={recovery ? code.trim().length < 8 : code.length !== 6}
        >
          Verify and sign in
        </AuthSubmit>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => {
            setRecovery(r => !r);
            setCode('');
            setError('');
            submitted.current = '';
          }}
          className="font-semibold text-[#611192] hover:underline"
        >
          {recovery
            ? challenge.method === 'email'
              ? 'Use the emailed code'
              : 'Use my authenticator app'
            : 'Use a recovery code instead'}
        </button>
        {challenge.method === 'email' && !recovery ? (
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-medium text-[#474648] hover:text-[#611192] disabled:text-[#B9B3BD]"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        ) : null}
      </div>
      {onCancel ? (
        <AuthGhostButton
          type="button"
          onClick={onCancel}
          className="mt-5 w-full"
        >
          Back to sign in
        </AuthGhostButton>
      ) : null}
    </div>
  );
}
