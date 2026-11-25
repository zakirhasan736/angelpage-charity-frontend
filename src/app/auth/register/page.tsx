'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AtSign, BadgeCheck, Building2, Hash, HandHeart, Lock, Mail, Store, User, Wallet } from 'lucide-react';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { UK_DEFAULT_COUNTRY } from '@/utils/ukValidation';
import CaptchaWidget from '@/components/auth/CaptchaWidget';
import { AuthAlert, AuthDivider, AuthField, AuthShell, AuthSubmit, OAuthButtons, PasswordStrength, RoleSwitch } from '@/components/auth/AuthKit';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

type Tab = 'individual' | 'charity';
type Errors = Partial<Record<'userName' | 'firstName' | 'lastName' | 'email' | 'password' | 'charityNumber', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ASIDE = {
  individual: {
    title: 'Sell what you don’t need. Choose who it helps.',
    points: [
      { icon: Store, text: 'List an item in minutes from your phone' },
      { icon: HandHeart, text: `Give up to ${CHARITY_SHARE_PERCENT}% of each sale to a charity you pick` },
      { icon: Wallet, text: 'Keep the rest, paid out once the order arrives' },
    ],
  },
  charity: {
    title: 'A free storefront that raises money while you work.',
    points: [
      { icon: Store, text: 'Sell donated and new stock from your own storefront' },
      { icon: HandHeart, text: 'Receive a share of supporters’ sales automatically' },
      { icon: BadgeCheck, text: 'Verified badge once your charity number is checked' },
    ],
  },
};

const Register = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGuestCheckout = searchParams?.get('from') === 'guest-checkout';
  // ?type=charity opens the charity form (used by "Are you a charity?" links)
  const [activeTab, setActiveTab] = useState<Tab>(searchParams?.get('type') === 'charity' ? 'charity' : 'individual');
  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    charityNumber: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);

  useEffect(() => {
    getProviders().then(providers => {
      if (!providers) return;
      setOauthProviders(Object.keys(providers).filter(p => p !== 'credentials'));
    });
  }, []);

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) setFormData(prev => ({ ...prev, email: emailParam }));
  }, [searchParams]);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (!oauthProviders.includes(provider)) {
      ToastService.error(`${provider === 'google' ? 'Google' : 'Facebook'} sign-up is not set up yet. Please register with email and password.`);
      return;
    }
    try {
      await fetch('/api/auth/oauth-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: activeTab === 'charity' ? 'CHARITY' : 'USER' }),
      });
    } catch {
      /* continue */
    }
    signIn(provider, { callbackUrl: '/product/post-product' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof Errors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!formData.firstName.trim()) next.firstName = 'Enter your first name';
    if (!formData.lastName.trim()) next.lastName = 'Enter your last name';
    if (!EMAIL_RE.test(formData.email.trim())) next.email = 'Enter a valid email address';
    if (formData.password.length < 8) next.password = 'Use at least 8 characters';
    if (formData.userName && !/^@?[A-Za-z0-9._-]{3,30}$/.test(formData.userName.trim())) next.userName = '3–30 letters, numbers, dots or dashes';
    if (activeTab === 'charity' && !formData.charityNumber.trim()) next.charityNumber = 'Enter your registered charity number';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setIsSubmitting(true);

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || ''}/auth/register`;
    const userRole = activeTab === 'individual' ? 'USER' : 'CHARITY';
    const payload = {
      ...formData,
      email: formData.email.trim(),
      userName: formData.userName.trim(),
      role: userRole,
      country: UK_DEFAULT_COUNTRY,
      ...(activeTab === 'individual' ? { charityNumber: undefined } : {}),
      ...(captchaToken ? { captchaToken } : {}),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'We couldn’t create your account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      ToastService.success('Welcome to Angelpage! Setting up your account…');
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: payload.email,
        password: formData.password,
        role: userRole,
      });

      if (signInResult?.ok) {
        router.push(userRole === 'CHARITY' ? '/charity/complete-registrations' : '/product/post-product');
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(payload.email)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const aside = ASIDE[activeTab];

  return (
    <AuthShell
      wide
      eyebrow={activeTab === 'charity' ? 'For charities' : 'Join free'}
      title={activeTab === 'charity' ? 'Register your charity' : 'Create your account'}
      subtitle={activeTab === 'charity' ? 'Open a free storefront and start raising money from sales.' : 'Shop, sell and give, all from one account. It takes under a minute.'}
      asideTitle={aside.title}
      asidePoints={aside.points}
      footer={
        <>
          Already have an account?{' '}
          <Link href={activeTab === 'charity' ? '/auth/login?type=charity' : '/auth/login'} className="font-semibold text-[#611192] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {fromGuestCheckout ? (
        <div className="mb-5">
          <AuthAlert tone="info">Use the same email you used at checkout to save your order to your new account.</AuthAlert>
        </div>
      ) : null}

      <RoleSwitch<Tab>
        value={activeTab}
        onChange={v => {
          setActiveTab(v);
          setErrors({});
          setError('');
        }}
        options={[
          { value: 'individual', label: 'Individual', icon: User },
          { value: 'charity', label: 'Charity or brand', icon: Building2 },
        ]}
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          <AuthField label="First name" name="firstName" autoComplete="given-name" placeholder="Jane" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
          <AuthField label="Last name" name="lastName" autoComplete="family-name" placeholder="Doe" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
        </div>
        <AuthField
          label="Username (optional)"
          name="userName"
          icon={AtSign}
          autoComplete="username"
          autoCapitalize="none"
          placeholder={activeTab === 'charity' ? 'yourcharity' : 'janedoe'}
          value={formData.userName}
          onChange={handleChange}
          error={errors.userName}
          hint="Shown on your listings and profile."
        />
        <AuthField label="Email address" name="email" type="email" icon={Mail} autoComplete="email" inputMode="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
        <div>
          <AuthField label="Password" name="password" type="password" icon={Lock} autoComplete="new-password" placeholder="Create a password" value={formData.password} onChange={handleChange} error={errors.password} />
          <PasswordStrength password={formData.password} />
        </div>
        {activeTab === 'charity' ? (
          <AuthField
            label="Registered charity number"
            name="charityNumber"
            icon={Hash}
            placeholder="e.g. 12-3456789 or 1234567"
            value={formData.charityNumber}
            onChange={handleChange}
            error={errors.charityNumber}
            hint="EIN (USA), BN (Canada) or Charity Commission number (UK). We use it to verify you."
          />
        ) : null}

        <CaptchaWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
        <AuthSubmit loading={isSubmitting} loadingText="Creating account…" className="mt-2">
          {activeTab === 'charity' ? 'Register charity' : 'Create account'}
        </AuthSubmit>
        <p className="text-center text-[12px] leading-relaxed text-[#8A888C]">
          By continuing you agree to our{' '}
          <Link href="/terms-of-service" className="underline hover:text-[#611192]">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="underline hover:text-[#611192]">
            Privacy Policy
          </Link>
          . Angelpage operates in the USA, Canada and the UK.
        </p>
      </form>

      {activeTab === 'individual' ? (
        <>
          <AuthDivider>or sign up with</AuthDivider>
          <OAuthButtons onSelect={handleOAuthSignIn} />
        </>
      ) : null}
    </AuthShell>
  );
};

export default Register;
