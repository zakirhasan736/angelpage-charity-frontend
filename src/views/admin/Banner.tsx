'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchAdminData, fetchLiveProducts } from '@utils/api';
import { useSession } from 'next-auth/react';

interface AdminProfile {
  verified: boolean;
  profileCompleted: boolean;
  firstName?: string;
  userName?: string;
  profileImage?: string;
}
interface BannerSectionProps {
  soldItemsCount: number;
  loading: boolean;
}
const BannerSection: React.FC<BannerSectionProps> = ({
  soldItemsCount,
  loading,
}) => {
  const { data: session, status } = useSession() || {};
  const [adminData, setAdminData] = useState<AdminProfile | null>(null);
  const [liveProductsCount, setLiveProductsCount] = useState<number>(0);

  // Fetch admin data
  const fetchData = async () => {
    if (status === 'authenticated' && session?.token) {
      try {
        const data = await fetchAdminData(session.token);
        setAdminData(data as AdminProfile);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      }
    }
  };

  // Fetch live products count
  const fetchLiveProductsData = async () => {
    if (session?.token) {
      try {
        const response = await fetchLiveProducts(session.token);
        if (response && response.products) {
          const liveProducts = response.products.filter(
            (product: { status: string }) => product.status === 'LIVE'
          );
          setLiveProductsCount(liveProducts.length);
        }
      } catch (error) {
        console.error('Failed to fetch live products:', error);
      }
    }
  };

  useEffect(() => {
    fetchLiveProductsData();
    fetchData();
  }, [session, status]);

  const stats = [
    { label: 'Live items on platform', value: liveProductsCount },
    { label: 'Items sold on platform', value: soldItemsCount },
  ];

  return (
    <section className="users-account-banner-section bg-white pt-6 max-[767px]:pt-4">
      <div className="custom-container">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0B0112] p-8 max-[767px]:rounded-[22px] max-[767px]:p-5">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#611192]/50 blur-[90px]" aria-hidden />
          <div className="relative flex items-center justify-between gap-8 max-[991px]:flex-col max-[991px]:items-start max-[991px]:gap-6">
            <div className="flex items-center gap-5 max-[767px]:gap-4">
              {!loading && adminData ? (
                <Image
                  src={adminData.profileImage || '/images/icons/elisp-profile-default-img.svg'}
                  alt="Profile photo"
                  className="h-[72px] w-[72px] rounded-full bg-white object-cover ring-4 ring-white/15 max-[767px]:h-14 max-[767px]:w-14"
                  width={72}
                  height={72}
                />
              ) : (
                <div className="skeleton h-[72px] w-[72px] shrink-0 rounded-full bg-white/10" />
              )}
              <div className="min-w-0">
                <p className="ap-eyebrow ap-eyebrow--plain text-[#D9B8EE]!">Admin console</p>
                <h1 className="ap-display user-profile-name mt-1.5 truncate text-[32px] text-white! max-[767px]:text-[24px]">
                  {!loading && adminData ? adminData?.firstName || 'Admin' : (
                    <span className="skeleton block h-6 w-[160px] rounded-full bg-white/10" />
                  )}
                </h1>
                <p className="user-username mt-0.5 text-sm text-white/60!">
                  {!loading && adminData ? `@${adminData?.userName || 'admin'}` : ''}
                </p>
              </div>
            </div>
            <ul className="list-off-site-info grid grid-cols-2 gap-3 max-[767px]:w-full">
              {stats.map(stat => (
                <li key={stat.label} className="min-w-[180px] rounded-2xl bg-white/8 px-5 py-4 ring-1 ring-white/10 max-[767px]:min-w-0">
                  <p className="font-primary text-[28px] leading-none text-white!">
                    {Number(stat.value || 0).toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-white/60!">{stat.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
