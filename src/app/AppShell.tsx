'use client';

import { Footer, Header } from '@/components';
import AuthProvider from '@utils/AuthProvider';
import AdminBrowseBar from '@/components/admin/AdminBrowseBar';
import MarketPreferenceDialog from '@/components/market/MarketPreferenceDialog';
import CookieConsent from '@/components/cookies/CookieConsent';
import { useSyncApiAuth } from '@/hooks/useSyncApiAuth';
import { usePathname } from 'next/navigation';

function AppShellContent({ children }: { children: React.ReactNode }) {
  useSyncApiAuth();
  const pathname = usePathname();
  const isReelsPage = pathname === '/reels';
  const isAppScreen = /^\/(user\/account|charity\/account|admin|favourite|messaging|auth|charity\/complete-registrations)/.test(pathname || '');

  if (isReelsPage) {
    return (
      <>
        {children}
        <CookieConsent />
      </>
    );
  }

  return (
    <div className="angelpage-main-wrapper">
      <AdminBrowseBar />
      <Header />
      <main className="ap-app-main">{children}</main>
      <div className={isAppScreen ? 'max-[767px]:hidden' : ''}>
        <Footer />
      </div>
      <MarketPreferenceDialog />
      <CookieConsent />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
