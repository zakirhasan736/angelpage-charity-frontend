'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarDays, HelpCircle, LayoutGrid, Newspaper, Plus, Store, UserRound, X } from 'lucide-react';
import GlobalSearchSecondary from '../elements/search/globalSearchSecondary';
import { MobileCatalogMenu, closeMobileDrawer } from './bottomNavMegamenu';
import { getAccountPathForRole } from '@/utils/navigationPaths';

/** Full-screen, app-style menu for phones. */
const MobileViewOffcanvas = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.id);
  const accountPath = getAccountPathForRole(session?.user?.role, session?.user?.id, session?.user?.charityId);

  // close the drawer whenever the route changes
  useEffect(() => {
    closeMobileDrawer();
  }, [pathname]);

  const tiles = [
    { href: '/product', label: 'Shop all', icon: LayoutGrid },
    { href: '/charity/find-a-charity', label: 'Charities', icon: Store },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/blog', label: 'Journal', icon: Newspaper },
    { href: '/how-it-works', label: 'How it works', icon: HelpCircle },
    {
      href: signedIn ? '/product/post-product' : '/auth/register?intent=sell',
      label: 'Sell an item',
      icon: Plus,
      primary: true,
    },
  ];

  return (
    <div className="mobile-view-offcanvas hidden sm:block">
      <div className="drawer drawer-start">
        <input id="my-drawer-mobile-menu" type="checkbox" className="drawer-toggle" aria-label="Open menu" />
        <div className="drawer-content">
          <label
            htmlFor="my-drawer-mobile-menu"
            className="drawer-button flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition active:bg-[#F4F1F6]"
            aria-label="Open menu"
          >
            <Image src="/images/header-trigger.svg" alt="" width={24} height={24} />
          </label>
        </div>
        <div className="drawer-side z-[1001]">
          <label htmlFor="my-drawer-mobile-menu" aria-label="Close menu" className="drawer-overlay" />
          <div className="flex min-h-full w-full flex-col bg-[#FAF8FB]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ECE8EE] bg-white/95 px-4 py-3 backdrop-blur-xl">
              <Link href="/" onClick={closeMobileDrawer} aria-label="Angelpage home">
                <Image src="/images/brand-logo-black.svg" alt="Angelpage" width={108} height={33} />
              </Link>
              <label
                htmlFor="my-drawer-mobile-menu"
                aria-label="Close menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F4F1F6]"
              >
                <X className="h-5 w-5" aria-hidden />
              </label>
            </div>

            <div className="px-4 pt-4">
              <div className="rounded-2xl bg-white p-1 ring-1 ring-[#ECE8EE]">
                <GlobalSearchSecondary />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 pt-4 pb-5">
              {tiles.map(({ href, label, icon: Icon, primary }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={closeMobileDrawer}
                  className={`flex flex-col items-start gap-3 rounded-2xl p-3 text-[12.5px] font-medium transition active:scale-[0.97] ${
                    primary ? 'bg-[#611192] text-white!' : 'bg-white text-[#0B0112]! ring-1 ring-[#ECE8EE]'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${primary ? 'text-white' : 'text-[#611192]'}`} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              ))}
            </div>

            <MobileCatalogMenu />

            <div className="mt-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
              <Link
                href={signedIn ? accountPath : '/auth/login'}
                onClick={closeMobileDrawer}
                className="flex items-center gap-3 rounded-2xl bg-[#0B0112] p-4 text-white!"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <UserRound className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium">
                    {signedIn ? session?.user?.name || 'My account' : 'Sign in or join'}
                  </span>
                  <span className="block text-[12px] text-white/60">
                    {signedIn ? 'Open your dashboard' : 'Buy, sell and give with Angelpage'}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileViewOffcanvas;
