'use client';
import React from 'react';
import { ArrowRight, BadgeCheck, Hash, HeartHandshake, MapPin, Package, Recycle } from 'lucide-react';

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
  productCount?: number;
  onShop?: () => void;
}

const AboutInfoComponent: React.FC<AboutInfoComponentProps> = ({ charityData, productCount = 0, onShop }) => {
  const {
    charityName = 'This charity',
    charityNumber,
    charityID,
    description = '',
    addresses = [],
  } = charityData || {};

  const address = addresses[0];
  const addressLine = address
    ? [address.address, address.city, address.postcode, address.country].filter(Boolean).join(', ')
    : '';
  const paragraphs = (description || 'This charity has not added a description yet.').split(/\n{2,}/);
  const [lead, ...rest] = paragraphs;

  const facts = [
    charityNumber ? { icon: BadgeCheck, label: 'Charity number', value: charityNumber } : null,
    charityID ? { icon: Hash, label: 'Charity ID', value: charityID } : null,
    addressLine ? { icon: MapPin, label: 'Address', value: addressLine } : null,
  ].filter(Boolean) as { icon: typeof BadgeCheck; label: string; value: string }[];

  const how = [
    { icon: Package, title: 'Shop their store', body: 'Browse pre-loved items listed for this charity.' },
    { icon: HeartHandshake, title: 'See your impact', body: 'Every product shows how much reaches the cause.' },
    { icon: Recycle, title: 'Give items a second life', body: 'Good for the cause and good for the planet.' },
  ];

  return (
    <div className="storefront-about-tabs-cont py-14 max-[767px]:py-6">
      <div className="custom-container">
        <div className="grid grid-cols-12 gap-6 max-[991px]:grid-cols-1">
          <article className="col-span-8 rounded-[28px] bg-white p-12 ring-1 ring-[#ECE8EE] max-[1170px]:p-9 max-[991px]:col-span-full max-[767px]:rounded-[22px] max-[767px]:p-5">
            <p className="ap-eyebrow">Our story</p>
            <h2 className="ap-display mt-4 text-[40px] capitalize max-[767px]:text-[28px]">About {charityName}</h2>
            <p className="mt-6 font-primary text-[22px] leading-[1.55] text-[#0B0112] max-[767px]:text-[18px]">{lead}</p>
            {rest.map((p, i) => (
              <p key={i} className="mt-4 text-[15px] leading-8 text-[#474648]">
                {p}
              </p>
            ))}

            <div className="mt-10 grid grid-cols-3 gap-3 max-[767px]:grid-cols-1">
              {how.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl bg-[#FAF8FB] p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#611192] shadow-[0_4px_12px_rgba(59,5,92,0.08)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold text-[#0B0112]">{title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B686E]">{body}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="col-span-4 flex flex-col gap-6 max-[991px]:col-span-full">
            <div className="rounded-[28px] bg-white p-7 ring-1 ring-[#ECE8EE] max-[767px]:rounded-[22px] max-[767px]:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">Charity details</p>
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
            </div>

            <div className="relative overflow-hidden rounded-[28px] bg-[#0B0112] p-7 text-white max-[767px]:rounded-[22px] max-[767px]:p-5">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#611192]/60 blur-3xl" aria-hidden />
              <p className="relative font-primary text-[26px] leading-tight text-white!">
                {productCount} {productCount === 1 ? 'item' : 'items'} waiting for a new home
              </p>
              <p className="relative mt-2 text-[13px] text-white/70!">Shop now and support {charityName}.</p>
              <button
                type="button"
                onClick={onShop}
                className="relative mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#611192]"
              >
                Shop the store <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AboutInfoComponent;
