'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { AuthAlert, AuthShell } from '@/components/auth/AuthKit';
import MfaChallenge from '@/components/auth/MfaChallenge';
import { getAccountPathForRole } from '@/utils/navigationPaths';

/** Where Google/Facebook sign-ins land when the account has two-step on. */
function TwoStep() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get('t') || '';
  const method = params?.get('m') === 'email' ? 'email' : 'totp';
  const hint = params?.get('e') || undefined;

  if (!token) {
    return (
      <AuthShell
        eyebrow="Two-step verification"
        title="This link has expired"
        subtitle="Sign in again to get a new code."
      >
        <AuthAlert tone="info">
          <Link href="/auth/login" className="font-semibold underline">
            Back to sign in
          </Link>
        </AuthAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Confirm it’s you"
      subtitle="Your account has two-step verification on."
    >
      <MfaChallenge
        challenge={{ token, method, hint }}
        onCancel={() => router.push('/auth/login')}
        onSignedIn={async () => {
          const s = await getSession();
          const u = s?.user as
            { role?: string; id?: string; charityId?: string } | undefined;
          router.push(
            u?.role && /ADMIN/.test(u.role)
              ? '/admin'
              : u?.role === 'CHARITY_STAFF' && u.charityId
                ? getAccountPathForRole(u.role, u.id, u.charityId)
                : '/'
          );
        }}
      />
    </AuthShell>
  );
}

export default function TwoStepPage() {
  return (
    <Suspense fallback={null}>
      <TwoStep />
    </Suspense>
  );
}
