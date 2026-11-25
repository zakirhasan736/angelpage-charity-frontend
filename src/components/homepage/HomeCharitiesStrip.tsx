'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from '@/components/common/SafeImage';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck } from 'lucide-react';
import { useGetCharitiesQuery } from '@/store/api/angelpageApi';
import type { CharityRecord } from '@/lib/server-api';

type Charity = CharityRecord & { charityBannerImage?: string };
const FALLBACKS = ['/images/charity/charity1.png', '/images/charity/charity3.png', '/images/charity/charity5.png', '/images/charity/charity2.png'];

/** Guest home: real charities you can support, linking to their storefronts. */
export default function HomeCharitiesStrip() {
  const { data, isLoading } = useGetCharitiesQuery({ page: 1, limit: 10, search: '' });
  const charities = ((data?.charities ?? []) as Charity[]).filter(c => c.charityName);
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: 'smooth' });

  if (!isLoading && charities.length === 0) return null;

  return (
    <section className="ap-section overflow-hidden">
      <div className="custom-container">
        <div className="mb-7 flex items-end justify-between gap-6 sm:mb-5">
          <div>
            <p className="ap-eyebrow">Charities</p>
            <h2 className="ap-display mt-2 text-[34px] leading-tight md:text-[28px] sm:text-[24px]">Charities you can support</h2>
            <p className="mt-2 max-w-[520px] text-[15px] text-[#6B686E] sm:text-[13px]">Each one has its own storefront. Shop it, or list your items for it.</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/charity/find-a-charity" className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[#611192]">
              Find a charity <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <div className="flex gap-2 sm:hidden">
              <button type="button" className="ap-arrow" onClick={() => scroll(-1)} aria-label="Previous charities">
                <ArrowLeft className="h-[18px] w-[18px]" aria-hidden />
              </button>
              <button type="button" className="ap-arrow" onClick={() => scroll(1)} aria-label="Next charities">
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div ref={rail} className="ap-no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 sm:gap-3">
          {(isLoading ? Array.from({ length: 5 }) : charities).map((c, i) => {
            if (!c) {
              return <div key={`sk-${i}`} className="h-[236px] w-[260px] shrink-0 animate-pulse rounded-[22px] bg-[#F2E8F8]" aria-hidden />;
            }
            const charity = c as Charity;
            const href = charity.storefrontId ? `/charity/store/${charity.storefrontId}` : `/charity/find-a-charity/${charity._id}`;
            return (
              <Link
                key={charity._id}
                href={href}
                className="group relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,5,92,0.10)] sm:w-[220px]"
              >
                <span className="relative block aspect-[16/8] bg-[#F2E8F8]">
                  <Image src={charity.charityBannerImage || FALLBACKS[i % FALLBACKS.length]} alt="" fill sizes="260px" className="object-cover" />
                </span>
                <span className="flex flex-1 flex-col px-4 pb-4">
                  <span className="-mt-7 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-4 ring-white">
                    {charity.profileImage ? (
                      <Image src={charity.profileImage} alt="" width={56} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-primary text-[22px] text-[#611192]">{charity.charityName.charAt(0)}</span>
                    )}
                  </span>
                  <span className="mt-2.5 line-clamp-1 font-primary text-[17px] text-[#0B0112] capitalize group-hover:text-[#611192]">{charity.charityName}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-[#00775F]">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> On Angelpage
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#611192]">
                    {charity.storefrontId ? 'Visit storefront' : 'View charity'} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
