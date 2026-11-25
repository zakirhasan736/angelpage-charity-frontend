'use client';
import React, { useState } from 'react';
import Image from '@/components/common/SafeImage';
import { ArrowDown, BadgeCheck, Check, HeartHandshake, MapPin, Package, Share2 } from 'lucide-react';

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
  onShop?: () => void;
}

const StoreFrontBanner: React.FC<StoreFrontBannerProps> = ({
  charityStore = {},
  productCount,
  actions,
  onShop,
}) => {
  const [copied, setCopied] = useState(false);
  const location = charityStore.addresses?.[0];
  const locationLabel = [location?.city, location?.country].filter(Boolean).join(', ');
  const name = charityStore.charityName || 'Charity';

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelled */
    }
  };

  const stats = [
    { icon: Package, label: 'For sale', value: `${productCount || 0} items` },
    locationLabel ? { icon: MapPin, label: 'Based in', value: locationLabel } : null,
    charityStore.charityNumber ? { icon: BadgeCheck, label: 'Registered', value: `No. ${charityStore.charityNumber}` } : null,
  ].filter(Boolean) as { icon: typeof Package; label: string; value: string }[];

  return (
    <section className="storefront-banner-component bg-white pt-5 max-[767px]:pt-0">
      <div className="custom-container max-[767px]:px-0!">
        <div className="relative isolate min-h-[480px] overflow-hidden rounded-[32px] bg-[#0B0112] max-[767px]:min-h-[520px] max-[767px]:rounded-none max-[767px]:rounded-b-[28px]">
          <Image
            src={charityStore.charityBannerImage || '/images/charity-storefront/charity-banner-img1.png'}
            alt=""
            fill
            priority
            sizes="(max-width: 1248px) 100vw, 1200px"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B0112]/95 via-[#0B0112]/60 to-[#0B0112]/5 max-[991px]:bg-gradient-to-t max-[991px]:from-[#0B0112] max-[991px]:via-[#0B0112]/70 max-[991px]:to-[#0B0112]/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 -z-10 h-96 w-96 rounded-full bg-[#611192]/50 blur-[110px]" aria-hidden />

          <div className="flex min-h-[480px] items-end justify-between gap-10 p-12 max-[1170px]:p-9 max-[991px]:flex-col max-[991px]:items-start max-[991px]:justify-end max-[767px]:min-h-[520px] max-[767px]:gap-6 max-[767px]:p-5 max-[767px]:pb-7">
            <div className="max-w-[620px]">
              <div className="flex items-center gap-4">
                <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[24px] bg-white p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] max-[767px]:h-16 max-[767px]:w-16 max-[767px]:rounded-[18px]">
                  <Image
                    src={charityStore.profileImage || '/images/icons/charity-img.png'}
                    alt={`${name} logo`}
                    width={84}
                    height={84}
                    className="h-full w-full rounded-[18px] object-cover max-[767px]:rounded-[13px]"
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-medium text-white! ring-1 ring-white/20 backdrop-blur">
                  <BadgeCheck className="h-4 w-4 text-[#7BEA87]" aria-hidden />
                  Verified charity
                </span>
              </div>
              <h1 className="ap-display mt-6 text-[60px] capitalize text-white! max-[1170px]:text-[48px] max-[767px]:mt-4 max-[767px]:text-[34px]">
                {name}
              </h1>
              {charityStore.description ? (
                <p className="mt-4 line-clamp-2 max-w-[520px] text-[15px] leading-7 text-white/75! max-[767px]:text-[14px] max-[767px]:leading-6">
                  {charityStore.description}
                </p>
              ) : null}
              <div className="mt-7 flex items-center gap-2.5 max-[767px]:mt-5">
                <button
                  type="button"
                  onClick={onShop}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#611192] transition hover:bg-[#F2E8F8] max-[767px]:flex-1 max-[767px]:justify-center"
                >
                  Shop the store
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
                {actions}
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white/12 px-5 text-[14px] font-medium text-white! ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20 max-[767px]:w-12 max-[767px]:justify-center max-[767px]:px-0"
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                  <span className="max-[767px]:sr-only">{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            <div className="w-[300px] shrink-0 rounded-[24px] bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-xl max-[991px]:w-full max-[767px]:p-4">
              <div className="flex items-start gap-3 border-b border-white/15 pb-4 max-[767px]:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#611192]">
                  <HeartHandshake className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-[13px] leading-5 text-white/85!">
                  Every purchase here sends money straight to <strong className="text-white!">{name}</strong>.
                </p>
              </div>
              <dl className="mt-4 grid gap-3 max-[991px]:grid-cols-3 max-[767px]:mt-0 max-[767px]:gap-2">
                {stats.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-[#D9B8EE] max-[767px]:hidden" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-[11px] text-white/55!">{label}</dt>
                      <dd className="truncate text-[14px] font-medium text-white! max-[767px]:text-[12px]">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreFrontBanner;
