'use client';
import React, { useState } from 'react';
import {
  Checkmark,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from '@/icons';
import Link from 'next/link';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { getHomePathForRole } from '@/utils/navigationPaths';
import Image from 'next/image';
import { Button } from '../elements';

import { ToastService } from '@/components/elements/notifications/ToastService';
import { useLocale } from '@/i18n/LocaleProvider';

const Footer = () => {
  const { data: session } = useSession();
  const { t } = useLocale();
  const homePath = getHomePathForRole(session?.user?.role);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [storeNotice, setStoreNotice] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      ToastService.error(t('footer.emailRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/email/subscribe`,
        { email }
      );
      console.log('email subscribed', response);
      if (response.status === 200) {
        ToastService.success(t('footer.subscribedOk'));
        setIsSubscribed(true);
        setEmail('');
      } else {
        ToastService.error(t('footer.already'));
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      ToastService.error(t('footer.already'));
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = (store: 'Google Play' | 'the App Store') => {
    const message = `Coming soon. The Angelpage app for ${store} is on the way.`;
    setStoreNotice(message);
    ToastService.info(message);
  };

  const year = new Date().getFullYear();
  const columns = [
    {
      title: 'Marketplace',
      links: [
        { href: '/product', label: t('footer.products') },
        { href: '/charity/find-a-charity', label: 'Find a charity' },
        { href: '/events', label: t('footer.events') },
        { href: '/product/post-product', label: 'Sell an item' },
      ],
    },
    {
      title: 'Angelpage',
      links: [
        { href: '/how-it-works', label: t('footer.howItWorks') },
        { href: '/about', label: 'About us' },
        { href: '/blog', label: t('footer.blog') },
        { href: '/faq', label: t('footer.faq') },
        { href: '/contact', label: t('footer.contact') },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy-policy', label: t('footer.privacy') },
        { href: '/cookie-policy', label: t('footer.cookies') },
        { href: '/terms-of-service', label: t('footer.terms') },
        { href: '/admin/login', label: t('footer.admin') },
      ],
    },
  ];
  const socials = [
    { label: 'Facebook', Icon: FacebookIcon },
    { label: 'X (Twitter)', Icon: TwitterIcon },
    { label: 'Instagram', Icon: InstagramIcon },
    { label: 'LinkedIn', Icon: LinkedinIcon },
  ];

  return (
    <footer className="footer-section border-t-0! bg-white pt-16 pb-10 sm:pt-8 sm:pb-[120px]">
      <div className="custom-container">
        {/* newsletter band */}
        <div className="relative overflow-hidden rounded-[32px] bg-[#0B0112] px-14 py-12 laptop-m:px-10 sm:rounded-[24px] sm:px-5 sm:py-8">
          <div className="pointer-events-none absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full bg-[#611192]/50 blur-[100px]" aria-hidden />
          <div className="relative grid grid-cols-12 items-center gap-10 md:grid-cols-1 md:gap-6">
            <div className="col-span-6 md:col-span-full">
              <p className="ap-eyebrow text-[#D9B8EE]!">Newsletter</p>
              <h2 className="ap-display mt-4 text-[36px] text-white! sm:text-[26px]">{t('footer.joinTitle')}</h2>
              <p className="mt-3 max-w-[460px] text-sm leading-6 text-white/70!">{t('footer.joinBody')}</p>
            </div>
            <div className="col-span-6 md:col-span-full">
              <form className="subscription-form w-full" onSubmit={handleSubmit}>
                <div className="flex items-center gap-2 rounded-full bg-white p-1.5 sm:flex-col sm:items-stretch sm:rounded-[20px]">
                  <label htmlFor="footer-email" className="sr-only">
                    {t('footer.emailPlaceholder')}
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    name="email"
                    value={email}
                    placeholder={t('footer.emailPlaceholder')}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-full! border-0! bg-transparent px-5 text-sm text-mono-100 outline-none! focus:ring-0 sm:text-[16px]"
                  />
                  <Button
                    variant="primary"
                    className="inline-flex h-12! items-center gap-2 px-7!"
                    type="submit"
                    disabled={loading || isSubscribed}
                  >
                    {loading ? (
                      t('footer.submitting')
                    ) : isSubscribed ? (
                      <>
                        {t('footer.subscribed')} <Checkmark />
                      </>
                    ) : (
                      t('footer.subscribe')
                    )}
                  </Button>
                </div>
              </form>
              <p className="mt-3 pl-5 text-xs text-white/50! sm:pl-1">No spam. Unsubscribe at any time.</p>
            </div>
          </div>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-12 gap-8 pt-16 pb-12 md:grid-cols-6 sm:grid-cols-2 sm:gap-y-10 sm:pt-10">
          <div className="col-span-4 md:col-span-full sm:col-span-2">
            <Link href={homePath} aria-label="Angelpage home">
              <Image src="/images/brand-logo-black.svg" alt="Angelpage" width={132} height={40} className="h-auto w-[132px]" />
            </Link>
            <p className="mt-5 max-w-[320px] text-sm leading-6 text-[#5C5560]">
              The charity marketplace. Buy and sell pre-loved goods and send most of each sale to a cause you believe in.
            </p>
            <ul className="mt-6 flex items-center gap-2">
              {socials.map(({ label, Icon }) => (
                <li key={label}>
                  <Link
                    href="/"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF2FF] hover:ring-[#611192]/40 [&_svg]:h-[18px] [&_svg]:w-[18px]"
                  >
                    <Icon />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {columns.map(col => (
            <div key={col.title} className="col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">{col.title}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[#0B0112] transition hover:text-[#611192]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-full sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">Get the app</p>
            <div className="mt-5 flex flex-col gap-2.5 md:flex-row sm:flex-col">
              <button
                type="button"
                onClick={() => handleStoreClick('Google Play')}
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#0B0112] px-4 text-left text-white! transition hover:bg-[#3B055C]"
                aria-label="Google Play, coming soon"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path fill="#34A853" d="M3 20.5 13.5 12 3 3.5v17z" />
                  <path fill="#FBBC04" d="M16.2 14.8 13.5 12l2.7-2.8 4.2 2.4c.8.5.8 1.3 0 1.8l-4.2 2.4z" />
                  <path fill="#4285F4" d="M3 3.5 13.5 12l2.7-2.8L5.2 2.1A1.5 1.5 0 0 0 3 3.5z" />
                  <path fill="#EA4335" d="M13.5 12 3 20.5a1.5 1.5 0 0 0 2.2 1.4l11-6.3L13.5 12z" />
                </svg>
                <span className="leading-tight">
                  <span className="block text-[9px] uppercase tracking-wide text-white/70!">Get it on</span>
                  <span className="block text-[13px] font-medium text-white!">Google Play</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleStoreClick('the App Store')}
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#0B0112] px-4 text-left text-white! transition hover:bg-[#3B055C]"
                aria-label="App Store, coming soon"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                  <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.9-.8-3.1-.8c-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7 2-.1 2.9-2.4c.7-1 1.2-2.1 1.5-3.2-3.9-1.5-3.8-5.4-1.8-6.5z" />
                  <path d="M14.2 6.2c.6-.8 1.1-1.9.9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.2 1.8-.9 2.9 1.1.1 2.1-.5 2.8-1.3z" />
                </svg>
                <span className="leading-tight">
                  <span className="block text-[9px] uppercase tracking-wide text-white/70!">Download on the</span>
                  <span className="block text-[13px] font-medium text-white!">App Store</span>
                </span>
              </button>
            </div>
            {storeNotice ? <p className="mt-3 text-xs text-[#611192]">{storeNotice}</p> : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#ECE8EE] pt-6 text-xs text-[#8A888C] sm:flex-col sm:text-center">
          <p>© {year} Angelpage. All rights reserved.</p>
          <p>
            {t('footer.support')}:{' '}
            <Link href="/contact" className="text-[#611192] hover:underline">
              {t('footer.contact')}
            </Link>
            <span className="mx-2">·</span>
            USA · Canada · UK
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
