'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import axios from 'axios';
import { fetchCharityData, fetchCharityProfileData } from '@utils/api';
import { useRouter } from 'next/navigation';
import { Button, ProgressBar } from '@/components/elements';
import { ToastService } from '@/components/elements/notifications/ToastService';


const BannerSection = () => {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
   const [dashboardData, setDashboardData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [userData, setUserData] = useState(null);
  const [image, setImage] = useState(
    '/images/charity-storefront/charity-banner-img1.png'
  );
  const [file, setFile] = useState(null);

  // Fetch Seller Data
  useEffect(() => {
    if (session?.token) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/order/seller/${session.user.id}/sold`,
            {
              headers: { Authorization: `Bearer ${session.token}` },
            }
          );
          console.log(response.data);
          setDashboardData(response.data);
        } catch (err) {
          console.error('Error fetching seller dashboard data:', err);
          setError('Failed to fetch seller analytics data.');
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [session?.token]);

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated' && session?.token) {
        const data = await fetchCharityData(session.token);
        if (data) {
          setUserData(data);
          setImage(
            data.charityBannerImage ||
              '/images/charity-storefront/charity-banner-img1.png'
          );
        } else {
          console.error('Error fetching charity data:', error);
          ToastService.error('Failed to load charity data.');
        }
      }
    };

    fetchData();
  }, [session, status]);

  // Handle image file selection
  const handleImageChange = e => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImage(URL.createObjectURL(selectedFile));
    }
  };

  // Save the updated image
  const handleSave = async () => {
    if (!file) {
      alert('Please select an image to upload');
      return;
    }

    const formData = new FormData();
    formData.append('charityBannerImage', file);

    try {
      setLoading(false);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.user?.charityBannerImage) {
        setImage(response.data.user.charityBannerImage);
        setIsEditing(false);
        // Show success toast notification
        ToastService.success('Banner image updated successfully!');
      } else {
        console.error('Invalid response structure:', response.data);
        // Show error toast notification
        ToastService.error('Failed to update banner image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          setLoading(true);
          const response = await fetchCharityProfileData(session.user.email);
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
    if (!loading) return null;
    return (
      <section className="bg-white pt-6 max-[767px]:pt-4" aria-busy="true">
        <div className="custom-container">
          <div className="h-[300px] animate-pulse rounded-[28px] bg-[#F4F1F6] max-[767px]:h-[200px] max-[767px]:rounded-[22px]" />
        </div>
      </section>
    );
  }

  return (
    <section className="charity-account-banner-section bg-white pt-6 max-[767px]:pt-4">
      <div className="custom-container">
        {!profileData.profileCompleted && (
          <div className="profile-status-area mb-4 flex items-center gap-5 rounded-2xl bg-[#FCF2FF] px-6 py-4 ring-1 ring-[#E4D0F0] max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3 max-[767px]:px-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-mono-100">
                Complete your charity profile ({Math.round(progress)}%)
              </p>
              <p className="mt-0.5 text-xs text-[#6B686E]">
                Open the Account tab to add the remaining details.
              </p>
            </div>
            <div className="w-[280px] shrink-0 max-[767px]:w-full">
              <ProgressBar progress={progress} className="h-2 w-full rounded-full" />
            </div>
          </div>
        )}

        <div className="charity-account-banner-wrapper relative h-[300px] overflow-hidden rounded-[28px] bg-[#F2E8F8] max-[767px]:h-[200px] max-[767px]:rounded-[22px]">
          <Image
            src={image}
            className="object-cover object-center"
            alt="Storefront cover"
            fill
            sizes="(max-width: 1248px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/85 via-[#0B0112]/25 to-transparent" />
          <div className="chang-image-btn-box absolute right-5 top-5 flex items-center gap-2">
            {isEditing && (
              <Button variant="accent" className="change-storefront-img relative h-10! overflow-hidden">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </Button>
            )}
            <Button
              onClick={isEditing ? handleSave : () => setIsEditing(!isEditing)}
              variant="primary"
              className="change-storefront-img h-10! bg-white/95! border-white! text-[#611192]! [-webkit-text-fill-color:#611192]!"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Save cover' : 'Change cover'}
            </Button>
          </div>
          <div className="charity-account-banner-cont absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3 max-[767px]:p-5">
            <div className="flex items-end gap-4">
              {userData ? (
                <Image
                  src={userData.profileImage || '/images/icons/charity-img.png'}
                  className="h-[72px] w-[72px] rounded-[20px] bg-white object-cover p-1 shadow-lg max-[767px]:h-14 max-[767px]:w-14"
                  alt="Charity logo"
                  width={72}
                  height={72}
                />
              ) : (
                <span className="skeleton h-[72px] w-[72px] rounded-[20px] bg-white/20" />
              )}
              <div>
                <p className="ap-eyebrow ap-eyebrow--plain text-[#E4D0F0]!">Charity dashboard</p>
                <h1 className="ap-display charity-account-banner-tittle mt-1.5 text-[32px] text-white! max-[767px]:text-[22px]">
                  {userData?.charityName || 'Add your charity name'}
                </h1>
              </div>
            </div>
            <ul className="list-info flex flex-wrap items-center gap-2">
              {userData?.storefrontId ? (
                <li>
                  <a href={`/charity/store/${userData.storefrontId}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#3B055C]">
                    View storefront
                  </a>
                </li>
              ) : null}
              <li className="rounded-full bg-white/15 px-4 py-2 text-[13px] text-white! backdrop-blur">
                <strong className="font-semibold text-white!">{userData?.listedProducts?.length || 0}</strong> for sale
              </li>
              <li className="rounded-full bg-white/15 px-4 py-2 text-[13px] text-white! backdrop-blur">
                <strong className="font-semibold text-white!">{dashboardData?.totalSold || 0}</strong> sold
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
