'use client';

import React from 'react';
import ProductRail from '../common/product-slider/ProductRail';
import { useGetAllProductsQuery } from '@/store/api/angelpageApi';

const PromotedProductsStrip = () => {
  const { data: products = [], isLoading } = useGetAllProductsQuery({
    promoted: 'true',
  });

  return (
    <ProductRail
      eyebrow="Featured"
      title="Promoted listings"
      description="Hand-picked items supporting charities on Angelpage this week."
      products={products}
      loading={isLoading}
      viewAllHref="/product"
      viewAllLabel="View marketplace"
      className="bg-gradient-to-b from-[#FCF2FF] to-white"
      autoplay
    />
  );
};

export default PromotedProductsStrip;
