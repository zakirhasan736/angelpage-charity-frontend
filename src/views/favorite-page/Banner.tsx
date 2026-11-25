'use client';
import React from 'react';

interface BannerSectionProps {
  totalProducts: number;
  totalCharities: number;
}

const BannerSection: React.FC<BannerSectionProps> = ({ totalProducts, totalCharities }) => (
  <section className="favorite-banner-section pt-10 pb-6 max-[767px]:pt-5 max-[767px]:pb-4">
    <div className="custom-container flex items-end justify-between gap-6">
      <div>
        <p className="ap-eyebrow">Your collection</p>
        <h1 className="ap-display mt-3 text-[44px] max-[767px]:text-[30px]">Favourites</h1>
      </div>
      <dl className="flex gap-6 text-right max-[767px]:gap-4">
        <div>
          <dt className="text-[12px] text-[#8A888C]">Items</dt>
          <dd className="font-primary text-[26px] leading-none text-[#0B0112] max-[767px]:text-[20px]">{totalProducts || 0}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-[#8A888C]">Charities</dt>
          <dd className="font-primary text-[26px] leading-none text-[#0B0112] max-[767px]:text-[20px]">{totalCharities || 0}</dd>
        </div>
      </dl>
    </div>
  </section>
);

export default BannerSection;
