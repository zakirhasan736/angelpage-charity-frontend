'use client';
import { signIn, useSession, getProviders, getSession } from 'next-auth/react';
import Link from 'next/link';
import { Lock, Mail, ScrollText, ShieldCheck, Users } from 'lucide-react';
import {
  AuthAlert,
  AuthDivider,
  AuthField,
  AuthShell,
  AuthSubmit,
  OAuthButtons,
} from '@/components/auth/AuthKit';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { isAdminRole } from '@/constants/adminPanels';
import CaptchaWidget from '@/components/auth/CaptchaWidget';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';
import MfaChallenge, {
  parseMfaError,
  type MfaChallengeInfo,
} from '@/components/auth/MfaChallenge';

const waitForAdminSession = async (maxAttempts = 8) => {
  for (let i = 0; i < maxAttempts; i += 1) {
    const session = await getSession();
    if (session?.user?.id && isAdminRole(session.user.role)) {
      return session;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return null;
};

const Login = () => {
  const { data: session, status } = useSession() || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<MfaChallengeInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRole = 'ADMIN';
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [captchaToken, setCaptchaToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    getProviders().then(providers => {
      if (!providers) return;
      setOauthProviders(
        Object.keys(providers).filter(p => p !== 'credentials')
      );
    });
  }, []);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (!oauthProviders.includes(provider)) {
      ToastService.error(
        `${provider === 'google' ? 'Google' : 'Facebook'} login is not set up yet.`
      );
      return;
    }
    try {
      await fetch('/api/auth/oauth-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN' }),
      });
    } catch {
      /* continue */
    }
    signIn(provider, { callbackUrl: '/admin' });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        role: activeRole,
        ...(captchaToken ? { captchaToken } : {}),
      });

      const mfa = parseMfaError(result?.error);
      if (mfa) {
        setChallenge(mfa);
        setPassword('');
        return;
      }

      if (result?.error) {
        let errorMessage = result.error;

        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password. Please try again.';
        }
        setError(errorMessage);
        return;
      }

      const updatedSession = await waitForAdminSession();

      if (updatedSession?.user?.role && updatedSession.user.id) {
        ToastService.success('Login successful! Redirecting...');
        router.push('/admin');
        return;
      }

      const message =
        'Login succeeded but the admin session could not be loaded. Please try again.';
      setError(message);
      ToastService.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      session?.user?.role &&
      session?.user?.id &&
      isAdminRole(session.user.role)
    ) {
      router.replace('/admin');
    }
  }, [session, router]);

  if (status === 'loading') {
    return <FullScreenLoader />;
  }
  if (challenge) {
    return (
      <AuthShell
        eyebrow="Admin team"
        title="Confirm it’s you"
        subtitle="Admin accounts use two-step verification."
      >
        <MfaChallenge
          challenge={challenge}
          onCancel={() => setChallenge(null)}
          onSignedIn={async () => {
            await waitForAdminSession();
            ToastService.success('Login successful! Redirecting...');
            router.push('/admin');
          }}
        />
      </AuthShell>
    );
  }
  return (
    <AuthShell
      eyebrow="Admin team"
      title="Admin sign in"
      subtitle="For Super Admin, Operations, Content and Finance roles."
      asideTitle="Run the marketplace that funds good causes."
      asidePoints={[
        { icon: ShieldCheck, text: 'Each role sees only the panels it needs' },
        {
          icon: Users,
          text: 'Sub-admins are invited by a Super Admin from the Team tab',
        },
        {
          icon: ScrollText,
          text: 'Every admin action is recorded in the audit log',
        },
      ]}
      footer={
        <span className="text-[13px]">
          Admin accounts are created by a Super Admin. Public sign-up is turned
          off.
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <AuthField
          label="Work email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          inputMode="email"
          placeholder="you@angelpage.org"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          labelAction={
            <Link
              href="/auth/request-reset-password?type=admin"
              className="text-[12.5px] font-medium text-[#611192] hover:underline"
            >
              Forgot password?
            </Link>
          }
        />
        <CaptchaWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken('')}
        />
        <AuthSubmit
          loading={isSubmitting}
          loadingText="Signing in…"
          className="mt-2"
        >
          Sign in
        </AuthSubmit>
      </form>
      {oauthProviders.length > 0 ? (
        <>
          <AuthDivider>or continue with</AuthDivider>
          <OAuthButtons onSelect={handleOAuthSignIn} />
        </>
      ) : null}
    </AuthShell>
  );
};

export default Login;
