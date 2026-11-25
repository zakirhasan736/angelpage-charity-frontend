'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Building2, CheckCircle2, Globe, HandHeart, Landmark, Phone, Store } from 'lucide-react';
import { AuthField, AuthShell, AuthSubmit, AuthTextarea } from '@/components/auth/AuthKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { getAccountPathForRole } from '@/utils/navigationPaths';
import StripOnboarding from '@/components/pages-component/charity/charity-account/StripOnboarding';

/**
 * Post-register charity onboarding: finish profile details + Stripe Connect.
 */
const CharityRegistrationPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [charityName, setCharityName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }
    if (status !== 'authenticated' || !session?.token) return;

    const role = session.user?.role;
    if (role !== 'CHARITY' && role !== 'CHARITY_STAFF') {
      router.replace(getAccountPathForRole(role, session.user?.id));
      return;
    }

    const loadProfile = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/charity/profile`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        const charity = data?.user || data?.charity || data;
        setCharityName(charity?.charityName || '');
        setDescription(charity?.description || '');
        setWebsiteLink(charity?.websiteLink || '');
        setPhoneNumber(charity?.phoneNumber || '');
      } catch (err) {
        console.error(err);
        ToastService.error('Could not load charity profile.');
      } finally {
        setLoaded(true);
      }
    };

    loadProfile();
  }, [status, session, router]);

  const accountPath = getAccountPathForRole(
    session?.user?.role,
    session?.user?.id,
    session?.user?.charityId
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    setIsSaving(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/profile`,
        {
          charityName: charityName.trim(),
          description: description.trim(),
          websiteLink: websiteLink.trim(),
          phoneNumber: phoneNumber.trim(),
        },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      ToastService.success('Charity profile saved.');
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to save profile.';
      ToastService.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { label: 'Account created', done: true },
    { label: 'Public profile', done: Boolean(charityName && description) },
    { label: 'Payouts', done: false },
  ];

  if (status === 'loading' || !loaded) {
    return (
      <AuthShell wide eyebrow="Charity setup" title="Set up your storefront">
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[52px] animate-pulse rounded-2xl bg-[#F1ECF4]" />
          ))}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      wide
      eyebrow="Charity setup"
      title="Set up your storefront"
      subtitle="Two quick steps: tell supporters who you are, then connect Stripe to receive payouts."
      asideTitle="Your storefront is almost ready."
      asidePoints={[
        { icon: Store, text: 'Your profile appears on your storefront and every listing' },
        { icon: HandHeart, text: 'Supporters can list items for you and pick your charity' },
        { icon: Landmark, text: 'Stripe pays sale proceeds straight to your bank' },
      ]}
      footer={
        <Link href={`${accountPath}?tab=account`} className="font-semibold text-[#611192] hover:underline">
          Skip for now, go to my dashboard
        </Link>
      }
    >
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Setup progress">
        {steps.map((st, i) => (
          <li key={st.label} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${st.done ? 'bg-[#611192]' : 'bg-[#E7E0EB]'}`} />
            <span className={`flex items-center gap-1.5 text-[12px] font-medium ${st.done ? 'text-[#611192]' : 'text-[#8A888C]'}`}>
              {st.done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 ring-current text-[9px]">{i + 1}</span>}
              {st.label}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-[15px] font-semibold text-[#0B0112]">1. Public profile</p>
        <AuthField label="Charity name" icon={Building2} value={charityName} onChange={e => setCharityName(e.target.value)} required />
        <AuthTextarea label="What your charity does" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="One or two sentences supporters will see on your storefront." hint={`${description.trim().length}/300 · Aim for 120+ characters`} maxLength={300} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          <AuthField label="Website" icon={Globe} type="url" inputMode="url" value={websiteLink} onChange={e => setWebsiteLink(e.target.value)} placeholder="https://" />
          <AuthField label="Phone" icon={Phone} type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
        </div>
        <AuthSubmit loading={isSaving} loadingText="Saving…">
          Save profile
        </AuthSubmit>
      </form>

      <div className="mt-8 border-t border-[#F0EBF2] pt-6">
        <p className="mb-3 text-[15px] font-semibold text-[#0B0112]">2. Payouts</p>
        <StripOnboarding />
      </div>
    </AuthShell>
  );
};

export default CharityRegistrationPage;
