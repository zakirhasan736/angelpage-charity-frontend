'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  Check,
  Copy,
  Download,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from 'lucide-react';
import { Btn, SectionCard } from '@/components/dashboard/DashKit';
import { AuthField, OtpInput } from '@/components/auth/AuthKit';
import { ToastService } from '@/components/elements/notifications/ToastService';

type Status = {
  enabled: boolean;
  method: 'totp' | 'email' | null;
  enabledAt?: string | null;
  recoveryCodesLeft: number;
  email: string;
  required?: boolean;
};
type Step = 'idle' | 'totp' | 'email' | 'codes' | 'disable' | 'regen';
type SessionTokens = { token: string; refreshToken: string };

const API = process.env.NEXT_PUBLIC_API_URL;
const errMsg = (e: unknown, fb: string) =>
  (axios.isAxiosError(e) && e.response?.data?.message) || fb;

/**
 * Account settings → Two-step verification. Same card for members, charities,
 * charity staff and admins: authenticator app or email codes, recovery codes,
 * and "sign out other devices".
 */
export default function TwoStepCard() {
  const { data: session, update } = useSession() || {};
  const token = session?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const [status, setStatus] = useState<Status | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [setup, setSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    qrCode: string;
  } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  // applied after the recovery codes are saved: refreshing the session reloads settings
  const [pendingSession, setPendingSession] = useState<SessionTokens | null>(
    null
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/auth/mfa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(r.data);
    } catch {
      setStatus(null);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setStep('idle');
    setCode('');
    setSetup(null);
    setEmailSent(false);
  };

  const adoptSession = async (s?: SessionTokens) => {
    if (s?.token)
      await update?.({ token: s.token, refreshToken: s.refreshToken });
  };

  const run = async (fn: () => Promise<void>, fb: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      ToastService.error(errMsg(e, fb));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const startTotp = () =>
    run(async () => {
      const r = await axios.post(`${API}/auth/mfa/totp/setup`, {}, { headers });
      setSetup(r.data);
      setStep('totp');
    }, 'Could not start set-up.');

  const confirmTotp = () =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/mfa/totp/enable`,
        { code },
        { headers }
      );
      setPendingSession(r.data.session || null);
      setCodes(r.data.recoveryCodes || []);
      setStatus(r.data);
      setStep('codes');
      setCode('');
      ToastService.success('Two-step verification is on.');
    }, 'That code isn’t right.');

  const sendEmail = (purpose: 'enable' | 'manage') =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/mfa/email/send`,
        { purpose },
        { headers }
      );
      setEmailSent(true);
      ToastService.success(r.data.message || 'Code sent.');
    }, 'Could not send the code.');

  const confirmEmail = () =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/mfa/email/enable`,
        { code },
        { headers }
      );
      setPendingSession(r.data.session || null);
      setCodes(r.data.recoveryCodes || []);
      setStatus(r.data);
      setStep('codes');
      setCode('');
      ToastService.success('Two-step verification is on.');
    }, 'That code isn’t right.');

  const disable = () =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/mfa/disable`,
        { code },
        { headers }
      );
      setStatus(r.data);
      reset();
      ToastService.success('Two-step verification is off.');
    }, 'That code isn’t right.');

  const regen = () =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/mfa/recovery-codes`,
        { code },
        { headers }
      );
      setCodes(r.data.recoveryCodes || []);
      setStatus(r.data);
      setStep('codes');
      setCode('');
    }, 'That code isn’t right.');

  const signOutOthers = () =>
    run(async () => {
      const r = await axios.post(
        `${API}/auth/sessions/revoke`,
        {},
        { headers }
      );
      await adoptSession({
        token: r.data.token,
        refreshToken: r.data.refreshToken,
      });
      ToastService.success('Signed out on every other device.');
    }, 'Could not sign out other devices.');

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const downloadCodes = () => {
    const blob = new Blob(
      [
        `Angelpage recovery codes\nEach code works once.\n\n${codes.join('\n')}\n`,
      ],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'angelpage-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!status) {
    return (
      <SectionCard
        icon={ShieldCheck}
        title="Two-step verification"
        description="An extra check when you sign in."
      >
        <div className="h-24 animate-pulse rounded-2xl bg-[#F4F1F6]" />
      </SectionCard>
    );
  }

  const on = status.enabled;
  const codeBox = (onDone: () => void, label = 'Enter the 6-digit code') => (
    <div className="max-w-[360px]">
      <p className="mb-2 text-[13px] font-medium text-[#0B0112]">{label}</p>
      <OtpInput
        value={code}
        onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
        disabled={busy}
      />
      <div className="mt-4 flex gap-2">
        <Btn loading={busy} disabled={code.length !== 6} onClick={onDone}>
          Confirm
        </Btn>
        <Btn variant="ghost" onClick={reset}>
          Cancel
        </Btn>
      </div>
    </div>
  );

  return (
    <SectionCard
      icon={ShieldCheck}
      title="Two-step verification"
      description="After your password, we ask for a code from your phone or email. It stops someone who learns your password from getting in."
    >
      {/* status row */}
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 ring-1 ${on ? 'bg-[#EEF8EF] ring-[#CBE8CF]' : 'bg-[#FFF8EC] ring-[#F3DFBC]'}`}
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${on ? 'bg-[#1E6B2E] text-white' : 'bg-[#8A4B00] text-white'}`}
        >
          {on ? (
            <ShieldCheck className="h-5 w-5" aria-hidden />
          ) : (
            <ShieldOff className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-[#0B0112]">
            {on
              ? `On · ${status.method === 'totp' ? 'Authenticator app' : 'Email code'}`
              : 'Off'}
          </p>
          <p className="text-[12.5px] text-[#6B686E]">
            {on
              ? `${status.recoveryCodesLeft} recovery code${status.recoveryCodesLeft === 1 ? '' : 's'} left${status.enabledAt ? ` · since ${new Date(status.enabledAt).toLocaleDateString()}` : ''}`
              : status.required
                ? 'Required for admin accounts. Turn it on to keep using the admin panel.'
                : 'Recommended, especially if you sell or manage a charity.'}
          </p>
        </div>
        {on && step === 'idle' ? (
          <div className="flex flex-wrap gap-2">
            <Btn
              size="sm"
              variant="secondary"
              icon={KeyRound}
              onClick={() => setStep('regen')}
            >
              New recovery codes
            </Btn>
            {!status.required ? (
              <Btn size="sm" variant="ghost" onClick={() => setStep('disable')}>
                Turn off
              </Btn>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* choose a method */}
      {!on && step === 'idle' ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-1">
          <button
            type="button"
            onClick={startTotp}
            disabled={busy}
            className="group rounded-2xl bg-white p-4 text-left ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#611192]" aria-hidden />
              <span className="text-[14.5px] font-semibold text-[#0B0112]">
                Authenticator app
              </span>
              <span className="rounded-full bg-[#F2E8F8] px-2 py-0.5 text-[11px] font-semibold text-[#611192]">
                Recommended
              </span>
            </span>
            <span className="mt-1.5 block text-[13px] leading-relaxed text-[#6B686E]">
              Google Authenticator, Microsoft Authenticator, 1Password or
              similar. Works offline.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              sendEmail('enable');
            }}
            disabled={busy}
            className="rounded-2xl bg-white p-4 text-left ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#611192]" aria-hidden />
              <span className="text-[14.5px] font-semibold text-[#0B0112]">
                Email code
              </span>
            </span>
            <span className="mt-1.5 block text-[13px] leading-relaxed text-[#6B686E]">
              We email a 6-digit code to {status.email} each time you sign in.
            </span>
          </button>
        </div>
      ) : null}

      {/* authenticator set-up */}
      {step === 'totp' && setup ? (
        <div className="mt-4 grid grid-cols-[200px_1fr] gap-6 rounded-2xl bg-[#FAF8FB] p-5 md:grid-cols-1">
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrCode}
              alt="QR code to add Angelpage to your authenticator app"
              className="h-[200px] w-[200px] rounded-xl bg-white p-2 ring-1 ring-[#ECE8EE]"
            />
            <a
              href={setup.otpauthUrl}
              className="mt-3 hidden text-[13px] font-semibold text-[#611192] underline md:inline"
            >
              Open in authenticator app
            </a>
          </div>
          <div>
            <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] text-[#474648]">
              <li>Open your authenticator app and add an account.</li>
              <li>Scan this QR code, or type the key below.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <p className="mt-3 text-[12px] font-semibold tracking-wide text-[#8A888C] uppercase">
              Set-up key
            </p>
            <p className="mt-1 rounded-lg bg-white px-3 py-2 font-mono text-[13px] tracking-wider break-all text-[#0B0112] ring-1 ring-[#ECE8EE]">
              {setup.secret}
            </p>
            <div className="mt-4">{codeBox(confirmTotp)}</div>
          </div>
        </div>
      ) : null}

      {/* email set-up */}
      {step === 'email' ? (
        <div className="mt-4 rounded-2xl bg-[#FAF8FB] p-5">
          <p className="text-[13.5px] text-[#474648]">
            {emailSent
              ? `We sent a code to ${status.email}.`
              : 'Sending a code…'}
          </p>
          <div className="mt-3">{codeBox(confirmEmail)}</div>
          <button
            type="button"
            onClick={() => sendEmail('enable')}
            disabled={busy}
            className="mt-3 text-[13px] font-semibold text-[#611192] hover:underline disabled:opacity-50"
          >
            Send a new code
          </button>
        </div>
      ) : null}

      {/* turn off / new codes: prove it's you */}
      {step === 'disable' || step === 'regen' ? (
        <div className="mt-4 rounded-2xl bg-[#FAF8FB] p-5">
          <p className="text-[13.5px] text-[#474648]">
            {status.method === 'email'
              ? 'Confirm with a code from your email, or a recovery code.'
              : 'Confirm with a code from your authenticator app, or a recovery code.'}
          </p>
          {status.method === 'email' ? (
            <button
              type="button"
              onClick={() => sendEmail('manage')}
              disabled={busy}
              className="mt-2 text-[13px] font-semibold text-[#611192] hover:underline"
            >
              {emailSent ? 'Send a new code' : 'Email me a code'}
            </button>
          ) : null}
          <div className="mt-3 max-w-[360px]">
            <AuthField
              label="Code"
              icon={KeyRound}
              value={code}
              onChange={e => setCode(e.target.value.trim())}
              placeholder="123456 or XXXX-XXXX"
              autoComplete="one-time-code"
            />
            <div className="mt-3 flex gap-2">
              <Btn
                variant={step === 'disable' ? 'danger' : 'primary'}
                loading={busy}
                disabled={code.length < 6}
                onClick={step === 'disable' ? disable : regen}
              >
                {step === 'disable' ? 'Turn off two-step' : 'Make new codes'}
              </Btn>
              <Btn variant="ghost" onClick={reset}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {/* recovery codes, shown once */}
      {step === 'codes' && codes.length ? (
        <div className="mt-4 rounded-2xl bg-[#0B0112] p-5 text-white">
          <p className="text-[15px] font-semibold">Save your recovery codes</p>
          <p className="mt-1 text-[13px] text-white/75">
            If you lose your phone or can’t get email, each code lets you sign
            in once. We won’t show them again.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-[14px] tracking-wider sm:grid-cols-1">
            {codes.map(c => (
              <li
                key={c}
                className="rounded-lg bg-white/10 px-3 py-2 text-center"
              >
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyCodes}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0B0112]"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}{' '}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={downloadCodes}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold text-white ring-1 ring-white/30"
            >
              <Download className="h-4 w-4" aria-hidden /> Download
            </button>
            <button
              type="button"
              onClick={async () => {
                setCodes([]);
                reset();
                const s = pendingSession;
                setPendingSession(null);
                await adoptSession(s || undefined);
              }}
              className="ml-auto inline-flex h-10 items-center rounded-full px-4 text-[13.5px] font-semibold text-white/80 hover:text-white"
            >
              I’ve saved them
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EBF2] pt-4">
        <p className="text-[13px] text-[#6B686E]">
          Signed in on a shared or lost device?
        </p>
        <Btn
          size="sm"
          variant="secondary"
          icon={LogOut}
          loading={busy && step === 'idle'}
          onClick={signOutOthers}
        >
          Sign out other devices
        </Btn>
      </div>
    </SectionCard>
  );
}
