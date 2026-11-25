'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, MapPin, Package, Share2, Check } from 'lucide-react';

interface CharityStore {
  _id?: string;
  charityName?: string;
  charityNumber?: string;
  charityID?: string;
  description?: string;
  storefrontId?: string;
  addresses?: Array<{
    address: string;
    city: string;
    country: string;
    postcode: string;
  }>;
  profileImage?: string;
  charityBannerImage?: string;
}

interface StoreFrontBannerProps {
  charityStore?: CharityStore;
  productCount: number;
  actions?: React.ReactNode;
}

const StoreFrontBanner: React.FC<StoreFrontBannerProps> = ({
  charityStore = {},
  productCount,
  actions,
}) => {
  const [copied, setCopied] = useState(false);
  const location = charityStore.addresses?.[0];
  const locationLabel = [location?.city, location?.country].filter(Boolean).join(', ');

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: charityStore.charityName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <section className="storefront-banner-component bg-white pt-5 max-[767px]:pt-3">
      <div className="custom-container">
        <div className="relative h-[340px] overflow-hidden rounded-[32px] bg-[#F2E8F8] max-[1280px]:h-[300px] max-[767px]:h-[170px] max-[767px]:rounded-[22px]">
          <Image
            src={
              charityStore.charityBannerImage ||
              '/images/charity-storefront/charity-banner-img1.png'
            }
            className="object-cover object-center"
            alt=""
            fill
            priority
            sizes="(max-width: 1248px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/55 via-transparent to-transparent" />
        </div>

        <div className="relative flex items-start justify-between gap-6 px-8 max-[767px]:flex-col max-[767px]:gap-4 max-[767px]:px-2">
          <div className="flex items-start gap-5 max-[767px]:gap-3">
            <div className="relative -mt-14 h-[124px] w-[124px] shrink-0 overflow-hidden rounded-[28px] bg-white p-1.5 shadow-[0_18px_40px_rgba(59,5,92,0.18)] max-[767px]:-mt-9 max-[767px]:h-20 max-[767px]:w-20 max-[767px]:rounded-[20px]">
              <Image
                src={charityStore.profileImage || '/images/icons/charity-img.png'}
                className="h-full w-full rounded-[22px] object-cover max-[767px]:rounded-[16px]"
                alt={`${charityStore.charityName || 'Charity'} logo`}
                width={124}
                height={124}
              />
            </div>
            <div className="pt-5 max-[767px]:pt-3">
              <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#611192]">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Verified charity storefront
              </p>
              <h1 className="ap-display mt-1 text-[36px] capitalize max-[767px]:text-[24px]">
                {charityStore.charityName || 'Charity'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="ap-chip">
                  <Package className="h-3.5 w-3.5" aria-hidden />
                  {productCount || 0} items for sale
                </span>
                {locationLabel ? (
                  <span className="ap-chip bg-[#FAF8FB]! text-[#474648]! ring-1 ring-[#ECE8EE]">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {locationLabel}
                  </span>
                ) : null}
                {charityStore.charityNumber ? (
                  <span className="ap-chip bg-[#FAF8FB]! text-[#474648]! ring-1 ring-[#ECE8EE]">
                    Reg. {charityStore.charityNumber}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-6 max-[767px]:pt-0">
            {actions}
            <button
              type="button"
              onClick={share}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#611192] ring-1 ring-[#DCD5E0] transition hover:bg-[#FCF2FF]"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreFrontBanner;
