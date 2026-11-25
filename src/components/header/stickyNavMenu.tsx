'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSelector } from 'react-redux';
import { Heart, Home, LayoutGrid, Plus, Store, UserRound } from 'lucide-react';
import { getAccountPathForRole } from '@/utils/navigationPaths';

interface StickyNavbar {
  toggleDropdown: () => void;
  session: object;
}

type Tab = {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (p: string) => boolean;
  badge?: number;
};

/** App-style bottom tab bar (phones only). */
const StickyNavMenu: React.FC<StickyNavbar> = () => {
  const { data: session } = useSession();
  const pathname = usePathname() || '/';
  const favoriteCount = useSelector((state: { favorites?: { count?: number } }) => state.favorites?.count || 0);
  const signedIn = Boolean(session?.user?.id);
  const accountPath = getAccountPathForRole(session?.user?.role, session?.user?.id, session?.user?.charityId);

  const left: Tab[] = [
    { href: '/', label: 'Home', icon: Home, match: p => p === '/' || p === '/internal-home' },
    { href: '/product', label: 'Shop', icon: LayoutGrid, match: p => p.startsWith('/product') && p !== '/product/post-product' },
  ];
  const right: Tab[] = signedIn
    ? [
        { href: '/favourite', label: 'Saved', icon: Heart, match: p => p.startsWith('/favourite'), badge: favoriteCount },
        {
          href: accountPath,
          label: 'Account',
          icon: UserRound,
          match: p => p.startsWith('/user/account') || p.startsWith('/charity/account') || p.startsWith('/admin'),
        },
      ]
    : [
        { href: '/charity/find-a-charity', label: 'Charities', icon: Store, match: p => p.startsWith('/charity') },
        { href: '/auth/login', label: 'Sign in', icon: UserRound, match: p => p.startsWith('/auth') },
      ];

  const sellHref = signedIn ? '/product/post-product' : '/auth/register?intent=sell';

  const renderTab = (t: Tab) => {
    const active = t.match(pathname);
    const Icon = t.icon;
    return (
      <li key={t.label} className="flex-1">
        <Link
          href={t.href}
          aria-current={active ? 'page' : undefined}
          className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
            active ? 'text-[#611192]' : 'text-[#8A888C]'
          }`}
        >
          <span className={`relative flex h-8 w-12 items-center justify-center rounded-full transition ${active ? 'bg-[#F2E8F8]' : ''}`}>
            <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.1 : 1.75} aria-hidden />
            {t.badge ? (
              <span className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E50035] px-1 text-[9px] font-semibold text-white">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            ) : null}
          </span>
          {t.label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="sticky-mobilenav-elements fixed inset-x-0 bottom-0 z-999 hidden border-t border-[#ECE8EE] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(11,1,18,0.06)] backdrop-blur-xl sm:block"
    >
      <ul className="flex h-[66px] items-stretch px-2">
        {left.map(renderTab)}
        <li className="flex w-[72px] shrink-0 items-start justify-center">
          <Link
            href={sellHref}
            aria-label="Sell an item"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#611192] text-white shadow-[0_10px_24px_rgba(97,17,146,0.4)] ring-4 ring-white transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden />
          </Link>
        </li>
        {right.map(renderTab)}
      </ul>
    </nav>
  );
};

export default StickyNavMenu;
