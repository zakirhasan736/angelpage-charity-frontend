'use client';
import HomeLandingBanner from '@/components/banner/HomeLandingBanner';
import HomeValueStrip from '@/components/homepage/HomeValueStrip';
import HomeMissionSection from '@/components/homepage/HomeMissionSection';
// import CharitySection from '@/components/homepage/CharitySection'
import HowItWorkSection from '@/components/homepage/HowItWorkSection';
import OurPlatformSection from '@/components/homepage/OurPlatformSection';
import TopCategoryProduct from '@/components/product/TopCategoryProducts';
import WomansCategoryProducts from '@/components/product/WomansCategoryProducts';
import PromotedProductsStrip from '@/components/product/PromotedProductsStrip';
import HomeEventsSection from '@/components/homepage/HomeEventsSection';
import LatestBlogsSection from '@/components/homepage/LatestBlogsSection';
import React from 'react';

const HomeLanding = () => {
  return (
    <div className="homepage-main-wrapper">
      <HomeLandingBanner />
      <HomeValueStrip />
      <PromotedProductsStrip />
      <TopCategoryProduct secClassName="" />
      <WomansCategoryProducts secClassName="" />
      <HowItWorkSection />
      <HomeEventsSection />
      {/* <CharitySection /> */}
      <HomeMissionSection />
      <OurPlatformSection />
      <LatestBlogsSection />
    </div>
  );
};

export default HomeLanding;
