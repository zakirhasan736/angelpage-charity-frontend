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
import HomeReelsStrip from '@/components/homepage/HomeReelsStrip';
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
      {/* 3. the people behind it — community first, so visitors see real impact before products */}
      <HomeReelsStrip />
      {/* 4. find your way in */}
      <OurPlatformSection />
      <TopCategoryProduct secClassName="" />
      <PromotedProductsStrip />
      <WomansCategoryProducts secClassName="" />
      {/* 5. who it helps */}
      <HomeEventsSection />
      <HomeCharitiesStrip />
      <HomeMissionSection />
      <LatestBlogsSection />
    </div>
  );
};

export default HomeLanding;
