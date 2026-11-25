'use client';
import React from 'react';
import { BadgeCheck, Hash, MapPin, Heart } from 'lucide-react';

interface Address {
  address?: string;
  city?: string;
  country?: string;
  postcode?: string;
}

interface AboutInfoComponentProps {
  charityData?: {
    charityName?: string;
    charityNumber?: string;
    charityID?: string;
    description?: string;
    storefrontId?: string;
    addresses?: Address[];
    profileImage?: string;
    charityBannerImage?: string;
  } | null;
}

const AboutInfoComponent: React.FC<AboutInfoComponentProps> = ({ charityData }) => {
  const {
    charityName = 'This charity',
    charityNumber,
    charityID,
    description = 'No description available for this charity yet.',
    addresses = [],
  } = charityData || {};

  const address = addresses[0];
  const addressLine = address
    ? [address.address, address.city, address.postcode, address.country].filter(Boolean).join(', ')
    : '';

  const facts = [
    charityNumber ? { icon: BadgeCheck, label: 'Charity number', value: charityNumber } : null,
    charityID ? { icon: Hash, label: 'Charity ID', value: charityID } : null,
    addressLine ? { icon: MapPin, label: 'Address', value: addressLine } : null,
  ].filter(Boolean) as { icon: typeof BadgeCheck; label: string; value: string }[];

  return (
    <div className="storefront-about-tabs-cont bg-[#FAF8FB] py-14 max-[767px]:py-8">
      <div className="custom-container">
        <div className="grid grid-cols-12 gap-6 max-[991px]:grid-cols-1">
          <article className="ap-card col-span-8 p-10 max-[991px]:col-span-full max-[767px]:p-6">
            <p className="ap-eyebrow">Our mission</p>
            <h2 className="ap-display mt-4 text-[34px] capitalize max-[767px]:text-[26px]">
              About {charityName}
            </h2>
            <p className="mt-5 max-w-[680px] whitespace-pre-line text-[15px] leading-8 text-[#474648]">
              {description}
            </p>
            <div className="mt-8 flex items-start gap-4 rounded-2xl bg-[#FCF2FF] p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#611192]">
                <Heart className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm leading-6 text-[#3B055C]">
                Every item bought from this storefront sends money directly to {charityName}. You
                can see the exact amount on each product before you check out.
              </p>
            </div>
          </article>

          <aside className="ap-card col-span-4 p-8 max-[991px]:col-span-full max-[767px]:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">
              Charity details
            </p>
            {facts.length ? (
              <ul className="mt-5 flex flex-col divide-y divide-[#ECE8EE]">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-[#8A888C]">{label}</p>
                      <p className="mt-0.5 break-words text-sm font-medium text-[#0B0112]">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#6B686E]">Details will appear here once provided.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AboutInfoComponent;
