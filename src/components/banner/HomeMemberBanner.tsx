'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  HandCoins,
  Heart,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Package,
  PlusCircle,
  Search,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { getAccountPathForRole } from '@/utils/navigationPaths';
import { isAdminRole } from '@/constants/adminPanels';
import { formatMoney } from '@/lib/money';

type Nudge = { icon: LucideIcon; text: string; href: string; cta: string };
type Action = { label: string; href: string; icon: LucideIcon; primary?: boolean };

const SLIDES = [
  {
    imageSrc: '/images/home/home-banner-modal-1.jpg',
    eyebrow: 'Clear out, give back',
    title: 'List an item in minutes and choose your charity split',
    cta: 'Sell an item',
    href: '/product/post-product',
  },
  {
    imageSrc: '/images/home/home-banner-modal-3.jpg',
    eyebrow: 'Shop for good',
    title: 'Pre-loved finds that fund the causes you care about',
    cta: 'Browse the shop',
    href: '/product',
  },
  {
    imageSrc: '/images/home/home-banner-modal-2.jpg',
    eyebrow: 'Events',
    title: 'Back an appeal or vote on what a charity funds next',
    cta: 'See events',
    href: '/events',
  },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Signed-in home banner: greeting, the one thing that needs the member most
 * (orders to ship, unread messages, first listing), live stats, role-aware
 * shortcuts and a promo slider.
 */
const HomeMemberBanner = () => {
  const { data: session } = useSession();
  const user = session?.user as { id?: string; name?: string; role?: string; charityId?: string } | undefined;
  const isCharity = user?.role === 'CHARITY' || user?.role === 'CHARITY_STAFF';
  const isAdmin = isAdminRole(user?.role);
  const favourites = useSelector((state: { favorites?: { count?: number } }) => state.favorites?.count || 0);
  const { data, loading } = useDashboardOverview(session?.token as string | undefined, 'month');
  const [hello, setHello] = useState('Welcome back');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setHello(greeting()), []);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);
    return () => window.clearInterval(id);
  }, [paused]);

  const firstName = (user?.name || '').split(' ')[0];
  const initial = (firstName || 'A').charAt(0).toUpperCase();
  const roleLabel = isAdmin ? 'Admin' : isCharity ? 'Charity' : 'Member';
  const accountPath = getAccountPathForRole(user?.role, user?.id, user?.charityId);
  const tab = (t: string) => `${accountPath}${accountPath.includes('?') ? '&' : '?'}tab=${t}`;

  const seller = (data?.seller || {}) as Record<string, unknown>;
  const status = (seller.statusSummary || {}) as Record<string, number>;
  const toShip = num(status.pending) + num(status.confirmed);
  const unread = num(data?.messaging?.unreadCount);
  const live = num(data?.listings?.live);
  const toCharity = num(seller.charityProfit);

  const nudge: Nudge = useMemo(() => {
    if (toShip > 0) return { icon: Truck, text: `You have ${toShip} order${toShip === 1 ? '' : 's'} to ship`, href: tab('sold'), cta: 'View orders' };
    if (unread > 0) return { icon: Inbox, text: `You have ${unread} unread message${unread === 1 ? '' : 's'}`, href: '/messaging', cta: 'Open inbox' };
    if (!loading && live === 0 && !isAdmin)
      return { icon: PlusCircle, text: isCharity ? 'Add your first shop item' : 'List your first item in two minutes', href: '/product/post-product', cta: 'Start' };
    if (isAdmin) return { icon: ClipboardCheck, text: 'Check the listings waiting for review', href: '/admin?tab=review', cta: 'Review' };
    return { icon: Sparkles, text: 'New pre-loved finds just landed', href: '/product', cta: 'Browse' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toShip, unread, live, loading, isCharity, isAdmin, accountPath]);

  const stats = [
    { label: isCharity ? 'Raised this month' : 'To charity this month', value: formatMoney(toCharity) },
    { label: 'Live listings', value: String(live) },
    { label: 'Unread messages', value: String(unread) },
  ];

  const actions: Action[] = isAdmin
    ? [
        { label: 'Review queue', href: '/admin?tab=review', icon: ClipboardCheck, primary: true },
        { label: 'Browse all', href: '/product', icon: Search },
        { label: 'Admin dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Promoted', href: '/admin?tab=promoted', icon: Megaphone },
      ]
    : isCharity
      ? [
          { label: 'Add an item', href: '/product/post-product', icon: PlusCircle, primary: true },
          { label: 'Browse all', href: '/product', icon: Search },
          { label: 'Payouts', href: tab('payouts'), icon: HandCoins },
          { label: 'My listings', href: tab('listings'), icon: Package },
        ]
      : [
          { label: 'Sell an item', href: '/product/post-product', icon: PlusCircle, primary: true },
          { label: 'Browse all', href: '/product', icon: Search },
          { label: favourites ? `Favourites · ${favourites}` : 'Favourites', href: '/favourite', icon: Heart },
          { label: 'My listings', href: tab('listings'), icon: Package },
        ];

  const NudgeIcon = nudge.icon;
  const current = SLIDES[slide];

  return (
    <section className="pt-6 pb-4 sm:pt-3">
      <div className="custom-container">
        <div className="grid grid-cols-[0.82fr_1.18fr] gap-4 md:grid-cols-1">
          {/* member card */}
          <div className="rounded-[28px] bg-gradient-to-br from-[#F4E9FB] via-[#F8F1FD] to-[#FCF9FE] p-6 ring-1 ring-[#EFE2F8] sm:rounded-[24px] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#611192] text-[16px] font-semibold text-white">{initial}</span>
              <div>
                <p className="text-[12px] text-[#8A888C]">{hello}</p>
                <p className="text-[14px] font-semibold text-[#0B0112]">{roleLabel}</p>
              </div>
            </div>
            <h1 className="ap-display mt-5 text-[34px] leading-tight laptop-m:text-[30px] sm:mt-4 sm:text-[28px]">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>

            <Link href={nudge.href} className="group mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_6px_18px_rgba(59,5,92,0.06)] transition hover:shadow-[0_10px_24px_rgba(59,5,92,0.1)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#611192] text-white">
                <NudgeIcon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-medium text-[#0B0112]">{nudge.text}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#611192]">
                {nudge.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>

            {!isAdmin ? (
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {stats.map(s => (
                  <div key={s.label} className="rounded-2xl bg-white/80 px-3 py-3 ring-1 ring-white">
                    <dt className="text-[11px] leading-tight text-[#8A888C]">{s.label}</dt>
                    <dd className={`mt-1.5 font-primary text-[20px] leading-none text-[#0B0112] sm:text-[18px] ${loading ? 'animate-pulse text-[#C9C4CC]' : ''}`}>
                      {loading ? '—' : s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              {actions.map(a => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={`group flex h-11 items-center gap-2 rounded-2xl px-3.5 text-[13px] font-medium transition ${
                      a.primary
                        ? 'bg-[#611192] text-white shadow-[0_8px_20px_rgba(97,17,146,0.28)] hover:bg-[#4C0D73]'
                        : 'bg-white text-[#0B0112] ring-1 ring-[#ECE8EE] hover:ring-[#611192]/40'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${a.primary ? '' : 'text-[#611192]'}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 ${a.primary ? 'text-white/70' : 'text-[#B9B3BD]'}`} aria-hidden />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* promo slider */}
          <div
            className="relative isolate min-h-[340px] overflow-hidden rounded-[28px] bg-[#14021F] md:min-h-[300px] sm:min-h-[260px] sm:rounded-[24px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Highlights"
          >
            {SLIDES.map((s, i) => (
              <Image
                key={s.imageSrc}
                src={s.imageSrc}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 991px) 100vw, 58vw"
                className={`-z-10 object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#14021F]/90 via-[#14021F]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7 sm:p-5" aria-live="polite">
              <div className="max-w-[460px]">
                <p className="ap-eyebrow text-white/80!">{current.eyebrow}</p>
                <h2 className="mt-3 font-primary text-[30px] leading-[1.15] text-white md:text-[26px] sm:text-[22px]">{current.title}</h2>
                <Link href={current.href} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition hover:bg-[#F2E8F8] sm:h-10">
                  {current.cta} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
                  aria-label="Previous highlight"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setSlide(s => (s + 1) % SLIDES.length)}
                  aria-label="Next highlight"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeMemberBanner;
