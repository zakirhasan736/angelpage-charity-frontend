'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button, ProgressBar } from '@/components/elements';
import { fetchUserData, fetchUserProfileData } from '@utils/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ToastService,
} from '@/components/elements/notifications/ToastService';

interface UserProfile {
  verified: boolean;
  profileCompleted: boolean;
  firstName?: string;
  userName?: string;
  profileImage?: string;
}

const BannerSection = () => {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [userData, setUserData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated' && session?.token) {
        const data = await fetchUserData(session.token);
        if (data) {
          setUserData(data as UserProfile);
        } else {
          console.error('Failed to fetch user data');
        }
      }
    };

    fetchData();
  }, [session, status]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          setLoading(true);
          const response = await fetchUserProfileData(session.user.email);
          if (!response?.user) {
            ToastService.error('Failed to load profile data.');
            return;
          }
          const { user, profileCompletionPercentage } = response;
          setProfileData(user);
          setProgress(profileCompletionPercentage || 0);
        } catch (error) {
          console.error('Error fetching profile data:', error);
          ToastService.error('Failed to load profile data.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/auth/login');
      }
    };

    fetchProfile();
  }, [session, status, router]);



  if (!profileData) {
    return <p>Failed to load profile data.</p>;
  }

  return (
    <section className="users-account-banner-section bg-white pt-6 max-[767px]:pt-4">
      <div className="custom-container">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FCF2FF] via-white to-[#F2E8F8] p-8 ring-1 ring-[#ECE8EE] max-[767px]:rounded-[22px] max-[767px]:p-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E4D0F0]/70 blur-3xl" aria-hidden />
          <div className="relative flex items-center justify-between gap-8 max-[991px]:flex-col max-[991px]:items-start max-[991px]:gap-6">
            <div className="flex items-center gap-5 max-[767px]:gap-4">
              {!loading && userData ? (
                <Image
                  src={userData.profileImage || '/images/icons/elisp-profile-default-img.svg'}
                  alt="Profile photo"
                  className="h-[72px] w-[72px] rounded-full object-cover ring-4 ring-white shadow-[0_10px_24px_rgba(59,5,92,0.14)] max-[767px]:h-14 max-[767px]:w-14"
                  width={72}
                  height={72}
                />
              ) : (
                <div className="skeleton h-[72px] w-[72px] shrink-0 rounded-full bg-mono-40" />
              )}
              <div className="min-w-0">
                <p className="ap-eyebrow ap-eyebrow--plain">Seller dashboard</p>
                <h1 className="ap-display user-profile-name mt-1.5 truncate text-[32px] max-[767px]:text-[24px]">
                  {userData?.firstName || 'Welcome'}
                </h1>
                <p className="user-username mt-0.5 text-sm text-[#6B686E]">
                  @{userData?.userName || 'member'}
                </p>
              </div>
            </div>

            <div className="w-full max-w-[380px] rounded-2xl bg-white/80 p-5 ring-1 ring-[#ECE8EE] backdrop-blur max-[991px]:max-w-full">
              {profileData.profileCompleted ? (
                <p className="flex items-center gap-2 text-sm font-medium text-[#138A21]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E7F8E9]">✓</span>
                  Your profile is complete
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-mono-100">Profile completion</span>
                    <span className="font-semibold text-[#611192]">{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar progress={progress} className="mt-3 h-2 w-full rounded-full" />
                  <p className="mt-2 text-xs text-[#6B686E]">
                    Finish your details in the Account tab to start selling faster.
                  </p>
                </>
              )}
              {!profileData.verified && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#FFF1F4] px-3 py-2.5">
                  <p className="text-xs text-[#B0002A]">Your email is not verified yet.</p>
                  <Button
                    variant="accend-link"
                    onClick={() => router.push('/auth/verify-email')}
                    className="text-xs! text-[#B0002A]! [-webkit-text-fill-color:#B0002A]! underline!"
                  >
                    Verify email
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
