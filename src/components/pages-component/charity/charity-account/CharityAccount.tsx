'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';
import axios from 'axios';
import BannerSection from './Banner';
import CharityAccountInfoMain from './account';
import DeleteAccountPanel from '@/components/account/DeleteAccountPanel';
import ListingsManager from '@/components/account/ListingsManager';
import { Product } from '@/types/productTypes';
import OrdersWorkspace from '@/components/account/OrdersWorkspace';
import AnalyticsPage from './Analytics';
import CharityCommunityPanel from '@/components/charity/account/CharityCommunityPanel';
import CharityStaffPanel from '@/components/charity/account/CharityStaffPanel';
import AccountMessagingPanel from '@/components/account/AccountMessagingPanel';
import NotificationsCentre from '@/components/account/NotificationsCentre';
import CharityPayoutsPanel from '@/components/account/CharityPayoutsPanel';
import CharityProductIntegrationPanel from '@/components/charity/account/CharityProductIntegrationPanel';
import AffiliateDashboard from '@/components/affiliate/AffiliateDashboard';
import SocialDashboard from '@/components/social/SocialDashboard';
import GalleryPanel from '@/components/gallery/GalleryPanel';
import LogoutButton from '@/components/elements/button/LogoutButton';
import {
  type AccountTab,
  type AccountTabGroup,
} from '@/components/account/AccountTabNav';
import DashboardLayout from '@/components/account/DashboardLayout';
import { getCharityTabsForSession } from '@/constants/charityPanels';

const CHARITY_TAB_GROUP_DEFS: AccountTabGroup[] = [
  { id: 'shop', label: 'Shop', tabIds: ['listings', 'sold', 'product-sync', 'affiliate'] },
  { id: 'money', label: 'Money', tabIds: ['payouts'] },
  { id: 'community', label: 'Community', tabIds: ['community', 'gallery', 'social'] },
  { id: 'inbox', label: 'Inbox', tabIds: ['messages', 'notifications'] },
  { id: 'organisation', label: 'Organisation', tabIds: ['team'] },
];

interface ProductResponse {
  products: Product[];
}

const CharityAccount = () => {
  const { data: session } = useSession() || {};
  const role = session?.user?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const staffRole = (session?.user as { staffRole?: string })?.staffRole;
  const visibleTabs = getCharityTabsForSession(role, permissions);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab');
  const defaultTab = visibleTabs.some(t => t.id === 'analytics') ? 'analytics' : visibleTabs[0]?.id || 'listings';
  const [activeTabId, setActiveTabId] = useState<string>(tabFromUrl || defaultTab);

  useEffect(() => {
    if (tabFromUrl) setActiveTabId(tabFromUrl);
  }, [tabFromUrl]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const allowed = activeTabId === 'delete' ? role === 'CHARITY' : visibleTabs.some(t => t.id === activeTabId);
    if (visibleTabs.length && !allowed) {
      setActiveTabId(defaultTab);
    }
  }, [role, permissions, visibleTabs, activeTabId, defaultTab]);

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ProductResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/products/listings`,
        {
          headers: {
            Authorization: `Bearer ${session?.token}`,
          },
        }
      );
      setProductsCount(response.data.products.length);
    } catch (error) {
      console.error('Error fetching charity products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.token) {
      fetchUserProducts();
    }
  }, [session?.token]);

  if (!session) {
    return <FullScreenLoader />;
  }

  const charityNavTabs: AccountTab[] = [
    ...visibleTabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      badge: tab.id === 'listings' && !loading ? productsCount : undefined,
    })),
    ...(role === 'CHARITY'
      ? [{ id: 'delete', label: 'Delete account' }]
      : []),
  ];

  const visibleIds = new Set(charityNavTabs.map(t => t.id));
  const charityGroups = CHARITY_TAB_GROUP_DEFS.map(g => ({
    ...g,
    tabIds: g.tabIds.filter(id => visibleIds.has(id)),
  })).filter(g => g.tabIds.length > 0);

  return (
    <div className="charity-account-main-wrapper">
      <div className={activeTabId === 'analytics' ? '' : 'max-[991px]:hidden'}>
        <BannerSection />
      </div>
      {role === 'CHARITY_STAFF' && (
        <div className="custom-container mt-4">
          <p className="flex items-center gap-2 rounded-2xl bg-[#F6EEFA] px-4 py-3 text-[13px] text-[#3B055C] ring-1 ring-[#EBDDF5]">
            <span className="rounded-full bg-[#611192] px-2 py-0.5 text-[11px] font-semibold text-white">Staff</span>
            You can manage listings, orders and community.{staffRole === 'MANAGER' ? ' As a manager you also see analytics.' : ''}
          </p>
        </div>
      )}
      <DashboardLayout
        tabs={charityNavTabs}
        groups={charityGroups}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        trailing={<LogoutButton />}
        title="Charity dashboard"
      >
            {activeTabId === 'analytics' && (
              <li className="tabs-cont-item">
                <AnalyticsPage />
              </li>
            )}
            {activeTabId === 'account' && (
              <li className="tabs-cont-item">
                <CharityAccountInfoMain />
              </li>
            )}
            {activeTabId === 'listings' && (
              <li className="tabs-cont-item">
                <ListingsManager role="CHARITY" />
              </li>
            )}
            {activeTabId === 'product-sync' && (
              <li className="tabs-cont-item">
                <CharityProductIntegrationPanel />
              </li>
            )}
            {activeTabId === 'affiliate' && (
              <li className="tabs-cont-item">
                <AffiliateDashboard />
              </li>
            )}
            {activeTabId === 'gallery' && (
              <li className="tabs-cont-item">
                <GalleryPanel />
              </li>
            )}
            {activeTabId === 'social' && (
              <li className="tabs-cont-item">
                <SocialDashboard />
              </li>
            )}
            {activeTabId === 'sold' && (
              <li className="tabs-cont-item">
                <OrdersWorkspace mode="sold" />
              </li>
            )}
            {activeTabId === 'messages' && (
              <li className="tabs-cont-item">
                <AccountMessagingPanel />
              </li>
            )}
            {activeTabId === 'notifications' && (
              <li className="tabs-cont-item">
                <NotificationsCentre />
              </li>
            )}
            {activeTabId === 'payouts' && (
              <li className="tabs-cont-item">
                <CharityPayoutsPanel />
              </li>
            )}
            {activeTabId === 'community' && (
              <li className="tabs-cont-item">
                <CharityCommunityPanel />
              </li>
            )}
            {activeTabId === 'team' && (
              <li className="tabs-cont-item">
                <CharityStaffPanel />
              </li>
            )}
            {activeTabId === 'delete' && (
              <li className="tabs-cont-item">
                <DeleteAccountPanel isCharity />
              </li>
            )}
      </DashboardLayout>
    </div>
  );
};

export default CharityAccount;
