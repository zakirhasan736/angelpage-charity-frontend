'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleCheck, Link2Off, Lock } from 'lucide-react';
import { resetPassword } from '@/utils/api';
import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthStatus,
  AuthSubmit,
  PasswordStrength,
} from '@/components/auth/AuthKit';

export default function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams()?.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {}
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Use at least 8 characters';
    if (confirm !== password) next.confirm = 'Passwords don’t match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(
        message && !/status code/i.test(message)
          ? message
          : 'This link is invalid or has expired. Request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell eyebrow="Reset password" title="This link doesn’t work">
        <AuthStatus icon={Link2Off} title="Missing or broken link">
          Open the link from your reset email again, or request a new one. Links
          expire after 10 minutes.
        </AuthStatus>
        <Link
          href="/auth/request-reset-password"
          className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#611192] text-[15px] font-semibold text-white"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell eyebrow="All set" title="Password updated">
        <AuthStatus icon={CircleCheck} tone="success" title="You’re all set">
          Your password has been changed. Taking you to sign in…
        </AuthStatus>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#611192] text-[15px] font-semibold text-white"
        >
          Sign in now
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Step 3 of 3"
      title="Choose a new password"
      subtitle="Make it something you haven’t used on Angelpage before."
      back={{ href: '/auth/login', label: 'Back to sign in' }}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ? (
          <AuthAlert>
            {error}{' '}
            <Link
              href="/auth/request-reset-password"
              className="font-semibold underline"
            >
              Get a new link
            </Link>
          </AuthAlert>
        ) : null}
        <div>
          <AuthField
            label="New password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setErrors(p => ({ ...p, password: undefined }));
            }}
            error={errors.password}
          />
          <PasswordStrength password={password} />
        </div>
        <AuthField
          label="Confirm new password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Type it again"
          value={confirm}
          onChange={e => {
            setConfirm(e.target.value);
            setErrors(p => ({ ...p, confirm: undefined }));
          }}
          error={errors.confirm}
        />
        <AuthSubmit loading={loading} loadingText="Saving…" className="mt-2">
          Update password
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
