'use client';
import HomeLandingBanner from '@/components/banner/HomeLandingBanner';
import HomeValueStrip from '@/components/homepage/HomeValueStrip';
import HomeMissionSection from '@/components/homepage/HomeMissionSection';
import HowItWorkSection from '@/components/homepage/HowItWorkSection';
import OurPlatformSection from '@/components/homepage/OurPlatformSection';
import TopCategoryProduct from '@/components/product/TopCategoryProducts';
import WomansCategoryProducts from '@/components/product/WomansCategoryProducts';
import PromotedProductsStrip from '@/components/product/PromotedProductsStrip';
import HomeEventsSection from '@/components/homepage/HomeEventsSection';
import HomeCharitiesStrip from '@/components/homepage/HomeCharitiesStrip';
import LatestBlogsSection from '@/components/homepage/LatestBlogsSection';
import React from 'react';

const HomeLanding = () => {
  return (
    <div className="homepage-main-wrapper">
      {/* 1. what it is */}
      <HomeLandingBanner />
      <HomeValueStrip />
      {/* 2. how it works, before any selling */}
      <HowItWorkSection />
      {/* 3. find your way in */}
      <OurPlatformSection />
      <TopCategoryProduct secClassName="" />
      <PromotedProductsStrip />
      <WomansCategoryProducts secClassName="" />
      {/* 4. who it helps */}
      <HomeCharitiesStrip />
      <HomeEventsSection />
      <HomeMissionSection />
      <LatestBlogsSection />
    </div>
  );
};

export default HomeLanding;
