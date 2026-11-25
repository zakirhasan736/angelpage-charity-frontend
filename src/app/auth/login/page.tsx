'use client';
import { signIn, useSession, getProviders } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Lock, Mail, User } from 'lucide-react';
import { ToastService } from '@/components/elements/notifications/ToastService';
import CaptchaWidget from '@/components/auth/CaptchaWidget';
import { AuthAlert, AuthDivider, AuthField, AuthShell, AuthSubmit, OAuthButtons, RoleSwitch } from '@/components/auth/AuthKit';

type LoginRole = 'USER' | 'CHARITY';

const Login = () => {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRole, setActiveRole] = useState<LoginRole>('USER');
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [captchaToken, setCaptchaToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  useEffect(() => {
    getProviders().then(providers => {
      if (!providers) return;
      setOauthProviders(Object.keys(providers).filter(p => p !== 'credentials'));
    });
  }, []);

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) setEmail(emailParam);
    if (searchParams?.get('type') === 'charity') setActiveRole('CHARITY');
  }, [searchParams]);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (!oauthProviders.includes(provider)) {
      ToastService.error(`${provider === 'google' ? 'Google' : 'Facebook'} login is not set up yet. Please use email and password.`);
      return;
    }
    try {
      await fetch('/api/auth/oauth-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: activeRole }),
      });
    } catch {
      /* continue */
    }
    signIn(provider, { callbackUrl: callbackUrl || '/' });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setIsSubmitting(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: email.trim(),
      password,
      role: activeRole,
      captchaToken,
      callbackUrl: callbackUrl || '/',
    });

    if (result?.error) {
      let errorMessage = result.error;
      if (result.error === 'CredentialsSignin') {
        errorMessage =
          activeRole === 'CHARITY'
            ? 'That email and password don’t match a charity account. Owners and staff both sign in here.'
            : 'That email and password don’t match. Check them and try again.';
      }
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }

    ToastService.success('Signed in. Redirecting…');
    router.push(callbackUrl || '/');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (session?.user?.role && session?.user?.id) {
      const userRole = session.user.role;
      const t = setTimeout(() => {
        if (userRole === 'USER' || userRole === 'CHARITY') {
          router.push(`/`);
        } else if (userRole === 'CHARITY_STAFF') {
          const charityId = (session?.user as { charityId?: string })?.charityId;
          router.push(charityId ? `/charity/account/${charityId}` : `/`);
        }
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [session, router]);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Angelpage"
      subtitle="Pick up where you left off: your orders, listings and the charities you support."
      footer={
        <>
          New to Angelpage?{' '}
          <Link href={activeRole === 'CHARITY' ? '/auth/register?type=charity' : '/auth/register'} className="font-semibold text-[#611192] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <RoleSwitch<LoginRole>
        value={activeRole}
        onChange={v => {
          setActiveRole(v);
          setError('');
        }}
        options={[
          { value: 'USER', label: 'Individual', icon: User },
          { value: 'CHARITY', label: 'Charity or brand', icon: Building2 },
        ]}
      />
      {activeRole === 'CHARITY' ? (
        <p className="mt-3 text-[12.5px] text-[#8A888C]">Owners and staff use the same login. Your charity admin sets staff access.</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <AuthField
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
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
          required
          labelAction={
            <Link href={`/auth/request-reset-password${activeRole === 'CHARITY' ? '?type=charity' : ''}`} className="text-[12.5px] font-medium text-[#611192] hover:underline">
              Forgot password?
            </Link>
          }
        />
        <CaptchaWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
        <AuthSubmit loading={isSubmitting} loadingText="Signing in…" className="mt-2">
          Sign in
        </AuthSubmit>
      </form>

      <AuthDivider>or continue with</AuthDivider>
      <OAuthButtons onSelect={handleOAuthSignIn} />
    </AuthShell>
  );
};

export default Login;
