'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserIcon } from '@/icons';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { isAdminRole } from '@/constants/adminPanels';
import {
  getAccountPathForRole,
} from '@/utils/navigationPaths';

interface UserAccountMenuProps {
  className?: string;
  dropdownPlacement?: 'below' | 'above';
  showLabel?: boolean;
  label?: string;
}

const UserAccountMenu = ({
  className = '',
  dropdownPlacement = 'below',
  showLabel = false,
  label = 'Account',
}: UserAccountMenuProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const accountPath = getAccountPathForRole(
    userRole,
    userId,
    (session?.user as { charityId?: string })?.charityId
  );
  const isAdmin = isAdminRole(userRole);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      ToastService.success('Logout successful!');
      setIsOpen(false);
      router.push('/auth/login');
    } catch (error) {
      ToastService.error('Failed to logout. Please try again.');
      console.error('Logout Error:', error);
    }
  };

  const dropdownPositionClass =
    dropdownPlacement === 'above'
      ? 'bottom-full right-0 mb-2'
      : 'top-full right-0 mt-2';

  if (!session?.user?.id) {
    return (
      <Link
        href="/auth/login"
        aria-label={showLabel ? undefined : 'Sign in'}
        className={`user-account flex items-center ${showLabel ? 'flex-col gap-[13px]' : ''} ${className}`}
      >
        <div className={showLabel ? 'icons-box' : ''}>
          <UserIcon />
        </div>
        {showLabel && (
          <p className="link-title font-secondary font-normal text-center text-mono-100 text-body-small xxs:text-[13px] leading-[150%]">
            {label}
          </p>
        )}
      </Link>
    );
  }

  const displayName = session.user.name || session.user.email || 'Your account';
  const initial = (displayName || 'A').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`user-account-dropdown-area relative ${showLabel ? 'text-center' : ''} ${className}`}
      ref={menuRef}
    >
      <button
        type="button"
        className={`user-account flex items-center cursor-pointer ${showLabel ? 'flex-col gap-[13px] w-full' : 'ap-icon-btn'}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        {showLabel ? (
          <div className="icons-box">
            <UserIcon />
          </div>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#611192] text-sm font-semibold text-white ring-2 ring-[#F2E8F8]">
            {initial}
          </span>
        )}
        {showLabel && (
          <p className="link-title font-secondary font-normal text-center text-mono-100 text-body-small xxs:text-[13px] leading-[150%]">
            {label}
          </p>
        )}
      </button>

      {isOpen && (
        <div
          className={`user-account-dropdown ap-mega-enter absolute z-999 w-[248px] overflow-hidden rounded-2xl border border-[#ECE8EE] bg-white text-left shadow-[0_24px_48px_rgba(11,1,18,0.12)] ${dropdownPositionClass}`}
        >
          <div className="flex items-center gap-3 border-b border-[#ECE8EE] bg-[#FCF2FF] px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#611192] text-sm font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-mono-100">{displayName}</p>
              <p className="truncate text-xs text-mono-70">
                {isAdmin ? 'Administrator' : userRole === 'CHARITY' || userRole === 'CHARITY_STAFF' ? 'Charity account' : 'Member'}
              </p>
            </div>
          </div>
          <div className="p-2">
            <Link
              href={accountPath}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm text-mono-100 transition hover:bg-[#FCF2FF] hover:text-[#611192]"
              onClick={() => setIsOpen(false)}
            >
              {isAdmin ? 'Admin dashboard' : 'Dashboard'}
            </Link>
            {!isAdmin && (
              <Link
                href="/favourite"
                className="flex items-center rounded-xl px-3 py-2.5 text-sm text-mono-100 transition hover:bg-[#FCF2FF] hover:text-[#611192]"
                onClick={() => setIsOpen(false)}
              >
                Favourites
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/"
                className="flex items-center rounded-xl px-3 py-2.5 text-sm text-mono-100 transition hover:bg-[#FCF2FF] hover:text-[#611192]"
                onClick={() => setIsOpen(false)}
              >
                View storefront
              </Link>
            )}
          </div>
          <div className="border-t border-[#ECE8EE] p-2">
            <button
              type="button"
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-[#B0002A] transition hover:bg-[#FFF1F4]"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccountMenu;
