'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  ClipboardCheck,
  Heart,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { getAccountPathForRole } from '@/utils/navigationPaths';
import { isAdminRole } from '@/constants/adminPanels';
import { formatMoney } from '@/lib/money';

type Nudge = { icon: LucideIcon; title: string; body: string; href: string; cta: string };

const FEATURED = [
  { imageSrc: '/images/home/home-banner-modal-1.jpg', caption: 'You choose the split' },
  { imageSrc: '/images/home/home-banner-modal-3.jpg', caption: 'Pre-loved, for good' },
  { imageSrc: '/images/home/home-banner-modal-2.jpg', caption: 'Every listing counts' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Signed-in home banner: greets the member, shows the one thing that needs
 * them most (orders to ship, unread messages, first listing), live stats
 * and role-aware shortcuts.
 */
const HomeMemberBanner = () => {
  const { data: session } = useSession();
  const user = session?.user as { id?: string; name?: string; role?: string; charityId?: string } | undefined;
  const isCharity = user?.role === 'CHARITY' || user?.role === 'CHARITY_STAFF';
  const isAdmin = isAdminRole(user?.role);
  const { data, loading } = useDashboardOverview(session?.token as string | undefined, 'month');
  const [hello, setHello] = useState('Welcome back');
  const [slide, setSlide] = useState(0);

  useEffect(() => setHello(greeting()), []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setSlide(s => (s + 1) % FEATURED.length), 5500);
    return () => window.clearInterval(id);
  }, []);

  const firstName = (user?.name || '').split(' ')[0];
  const accountPath = getAccountPathForRole(user?.role, user?.id, user?.charityId);
  const tab = (t: string) => `${accountPath}${accountPath.includes('?') ? '&' : '?'}tab=${t}`;

  const seller = (data?.seller || {}) as Record<string, unknown>;
  const status = (seller.statusSummary || {}) as Record<string, number>;
  const toShip = num(status.pending) + num(status.confirmed);
  const unread = num(data?.messaging?.unreadCount);
  const live = num(data?.listings?.live);
  const raised = isCharity ? num(data?.charityFunds?.totalEarned) : num(seller.charityProfit);

  const nudge: Nudge = useMemo(() => {
    if (toShip > 0)
      return {
        icon: Truck,
        title: `${toShip} order${toShip === 1 ? '' : 's'} to ship`,
        body: 'Buyers are waiting. Funds are released once the item arrives.',
        href: tab('sold'),
        cta: 'Ship now',
      };
    if (unread > 0)
      return {
        icon: Inbox,
        title: `${unread} unread message${unread === 1 ? '' : 's'}`,
        body: 'Quick replies help items sell faster.',
        href: '/messaging',
        cta: 'Open inbox',
      };
    if (!loading && live === 0 && !isAdmin)
      return {
        icon: Plus,
        title: isCharity ? 'Add your first shop item' : 'List your first item',
        body: 'It takes about two minutes, and you pick how much goes to charity.',
        href: '/product/post-product',
        cta: 'Start listing',
      };
    return {
      icon: Search,
      title: 'New in today',
      body: 'Fresh pre-loved finds from sellers and charity shops.',
      href: '/product',
      cta: 'Browse',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toShip, unread, live, loading, isCharity, isAdmin, accountPath]);

  const stats = [
    { label: isCharity ? 'Raised' : 'Given to charity', value: formatMoney(raised, { compact: true }), icon: HeartHandshake },
    { label: 'Live listings', value: String(live), icon: Store },
    { label: 'Sold this month', value: String(num(seller.itemsSold)), icon: PackageCheck },
  ];

  const actions = isAdmin
    ? [
        { label: 'Review queue', href: '/admin?tab=review', icon: ClipboardCheck, primary: true },
        { label: 'Admin dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Browse shop', href: '/product', icon: Search },
      ]
    : isCharity
      ? [
          { label: 'Add item', href: '/product/post-product', icon: Plus, primary: true },
          { label: 'Payouts', href: tab('payouts'), icon: HeartHandshake },
          { label: 'Dashboard', href: accountPath, icon: LayoutDashboard },
        ]
      : [
          { label: 'Sell an item', href: '/product/post-product', icon: Plus, primary: true },
          { label: 'My orders', href: tab('bought'), icon: ShoppingBag },
          { label: 'Saved', href: '/favourite', icon: Heart },
          { label: 'Dashboard', href: accountPath, icon: LayoutDashboard },
        ];

  const NudgeIcon = nudge.icon;

  return (
    <section className="ap-section pt-8! pb-6! sm:pt-4!">
      <div className="custom-container">
        <div className="grid grid-cols-[1.35fr_1fr] gap-5 md:grid-cols-1">
          <div className="relative overflow-hidden rounded-[28px] bg-[#1A0329] p-8 text-white md:p-7 sm:rounded-[24px] sm:p-5">
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#611192] opacity-60 blur-3xl" />
            <div className="relative">
              <p className="text-[13px] text-white/60!">{hello}{firstName ? ',' : ''}</p>
              <h1 className="ap-display mt-1 text-[38px] leading-tight text-white! md:text-[32px] sm:text-[26px]">
                {firstName || 'Welcome back'}
              </h1>

              <Link
                href={nudge.href}
                className="group mt-6 flex items-center gap-4 rounded-[20px] border border-white/12 bg-white/[0.07] p-4 transition hover:bg-white/[0.12] sm:mt-5 sm:p-3.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#611192]">
                  <NudgeIcon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-white">{nudge.title}</span>
                  <span className="mt-0.5 block text-[13px] text-white/65 sm:line-clamp-2">{nudge.body}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#E6CCF7] sm:hidden">
                  {nudge.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
                <ArrowRight className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
              </Link>

              <dl className={`mt-6 grid grid-cols-3 gap-3 sm:mt-5 sm:gap-2 ${isAdmin ? 'hidden' : ''}`}>
                {stats.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-2xl bg-white/[0.05] px-4 py-3 sm:px-3">
                      <dt className="flex items-center gap-1.5 text-[12px] text-white/60 sm:text-[11px]">
                        <Icon className="h-3.5 w-3.5 sm:hidden" aria-hidden />
                        {s.label}
                      </dt>
                      <dd className={`mt-1 text-[22px] font-semibold sm:text-[18px] ${loading ? 'animate-pulse text-white/30' : 'text-white'}`}>
                        {loading ? '—' : s.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2 sm:mt-5">
                {actions.map(a => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium transition sm:h-10 sm:px-4 sm:text-[13px] ${
                        a.primary ? 'bg-white text-[#611192] hover:bg-[#F2E8F8]' : 'border border-white/20 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {a.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <Link
            href="/product"
            className="group relative min-h-[320px] overflow-hidden rounded-[28px] bg-[#F2E8F8] md:min-h-[220px] sm:hidden"
            aria-label="Browse the shop"
          >
            {FEATURED.map((f, i) => (
              <Image
                key={f.imageSrc}
                src={f.imageSrc}
                alt=""
                fill
                sizes="(max-width: 991px) 100vw, 40vw"
                className={`object-cover transition-all duration-1000 group-hover:scale-[1.03] ${i === slide ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <span className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/80 via-transparent to-transparent" />
            <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
              <span>
                <span className="ap-eyebrow text-[#E6CCF7]!">Shop for good</span>
                <span className="mt-2 block font-primary text-[26px] leading-tight text-white">{FEATURED[slide].caption}</span>
              </span>
              <span className="flex gap-1.5" aria-hidden>
                {FEATURED.map((f, i) => (
                  <span key={f.imageSrc} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                ))}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeMemberBanner;
