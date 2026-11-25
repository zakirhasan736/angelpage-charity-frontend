'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from '../elements';
import MobileViewOffcanvas from './mobileViewOffcanvas';
import MiniCart from '../cart/miniCart';
import FavoritesAlert from './favoritesAlert';
import GlobalSearch from '../elements/search/globalSearch';
import BottomNavMegamenu from './bottomNavMegamenu';
import StickyNavMenu from './stickyNavMenu';
import NotificationButton from './NotificationButton';
import NotificationDropdown from './NotificationDropdown';
import UserAccountMenu from './UserAccountMenu';
import { useSession } from 'next-auth/react';
import { getHomePathForRole } from '@/utils/navigationPaths';
import LanguageSwitch from './LanguageSwitch';
import { useLocale } from '@/i18n/LocaleProvider';
import { Plus } from 'lucide-react';

const Header = () => {
  const { data: session } = useSession();
  const { t } = useLocale();
  const homePath = getHomePathForRole(session?.user?.role);
  const pathname = usePathname();

  const hideBottomNavPaths = ['/auth/login', '/auth/register'];
  const isAuthPage = hideBottomNavPaths.includes(pathname || '');
  const isPostProductPage = pathname === '/product/post-product';
  const isCheckoutPage =
    pathname === '/checkout' || pathname === '/checkout/confirmation/';
  const isTempLogin = pathname === '/internal-home';

  const showCategoryBar = !isAuthPage && !isPostProductPage && !isCheckoutPage;
  const showTools = isTempLogin || (!isPostProductPage && !isCheckoutPage);
  const showMemberTools = isTempLogin || (!isAuthPage && Boolean(session));
  const showEnvBanner = process.env.NEXT_PUBLIC_SHOW_ENV_BANNER === 'true';
  const envBannerLabel =
    process.env.NEXT_PUBLIC_ENV_BANNER_TEXT ||
    (isTempLogin ? 'Demo Mode, Launching soon!' : 'Test Mode');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);

  return (
    <>
      <header
        className={`ap-header header-section ${isCheckoutPage ? 'is-dark' : ''} ${
          isTempLogin ? 'z-9999' : ''
        }`}
      >
        {showEnvBanner && (
          <div className="notice-banner bg-[#3B055C] py-1.5">
            <p className="text-center text-[12px] font-medium tracking-wide text-white">
              {envBannerLabel}
            </p>
          </div>
        )}

        <div className="header-top-cont relative border-b border-[#ECE8EE]!">
          <div className="custom-container">
            <div className="header-top-wrapper flex h-[76px] items-center gap-8 max-[1280px]:gap-5 max-[767px]:h-16 max-[767px]:gap-3">
              {/* left: burger (mobile) + logo */}
              <div className="flex shrink-0 items-center gap-3">
                {!isCheckoutPage && <MobileViewOffcanvas />}
                <Link href={homePath} className="site-brand-logo block" aria-label="Angelpage home">
                  <Image
                    src={
                      isCheckoutPage
                        ? '/images/brand-logo-white.svg'
                        : '/images/brand-logo-black.svg'
                    }
                    alt="Angelpage"
                    width={124}
                    height={38}
                    priority
                    className="h-auto w-[124px] max-[767px]:w-[104px]"
                  />
                </Link>
              </div>

              {/* center: search */}
              {showTools ? (
                <div className="min-w-0 flex-1 max-[767px]:hidden">
                  <div className="mx-auto max-w-[560px]">
                    <GlobalSearch className="w-full" />
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* right: actions */}
              <div className="header-right-cont flex shrink-0 items-center gap-1.5 max-[767px]:ml-auto">
                {showTools && (
                  <>
                    {!session && !isTempLogin && (
                      <>
                        <Link
                          href="/how-it-works"
                          className="rounded-full px-3 py-2 text-[13px] font-medium text-[#474648] transition hover:text-[#611192] max-[1280px]:hidden"
                        >
                          How it works
                        </Link>
                        <Link
                          href="/auth/login"
                          className="rounded-full px-3 py-2 text-[13px] font-medium text-[#474648] transition hover:text-[#611192] max-[767px]:hidden"
                        >
                          Sign in
                        </Link>
                        <Link href="/auth/register?intent=sell" className="mr-1.5 max-[767px]:hidden">
                          <Button variant="primary" className="h-10! px-5!">
                            Start selling
                          </Button>
                        </Link>
                      </>
                    )}

                    {showMemberTools && (
                      <Link href="/product/post-product/" className="mr-2 max-[767px]:hidden">
                        <Button variant="primary" className="h-10! px-5! gap-1.5!">
                          <Plus className="h-4 w-4" aria-hidden />
                          {t('nav.sell')}
                        </Button>
                      </Link>
                    )}

                    {showMemberTools && (
                      <>
                        <div className="ap-icon-btn relative max-[767px]:hidden">
                          <FavoritesAlert className="" />
                        </div>
                        <div className="notification-dropdown-area ap-icon-btn relative max-[767px]:static">
                          <NotificationButton
                            notificationBtnClass=""
                            toggleDropdown={toggleDropdown}
                          />
                          {isDropdownOpen && (
                            <NotificationDropdown
                              isDropdownOpen={isDropdownOpen}
                              toggleDropdown={toggleDropdown}
                            />
                          )}
                        </div>
                      </>
                    )}

                    <div className="ap-icon-btn relative">
                      <MiniCart />
                    </div>

                    {(session || isTempLogin) && <UserAccountMenu className="max-[767px]:hidden" />}
                  </>
                )}

                {isCheckoutPage && (
                  <div className="checkout-header-right-cont flex items-center gap-3 rounded-full bg-white/10 px-4 py-2">
                    <Image
                      src="/images/icons/shield-one.svg"
                      alt=""
                      width={16}
                      height={18}
                    />
                    <p className="text-[13px] font-medium text-mono-0!">
                      {t('nav.secureCheckout')}
                    </p>
                  </div>
                )}

                {showCategoryBar ? (
                  <div className="hidden max-[767px]:block">
                    <LanguageSwitch tone="light" />
                  </div>
                ) : (
                  <LanguageSwitch tone={isCheckoutPage ? 'dark' : 'light'} />
                )}
              </div>
            </div>
          </div>
        </div>

        {showCategoryBar && (
          <div className="header-bottom-cont border-b border-[#ECE8EE]! max-[767px]:hidden">
            <BottomNavMegamenu />
          </div>
        )}
      </header>
      {isPostProductPage ? null : (
        <StickyNavMenu session={{ session }} toggleDropdown={toggleDropdown} />
      )}
    </>
  );
};

export default Header;
