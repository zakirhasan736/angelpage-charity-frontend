'use client';

import React from 'react';
import ProductRail from '../common/product-slider/ProductRail';
import { useGetLatestProductsQuery } from '@/store/api/angelpageApi';

const GiftFeaturedCategoryProducts = ({ secClassName }) => {
  const { data = [], isLoading, isError } = useGetLatestProductsQuery();

  return (
    <ProductRail
      eyebrow="Gift guide"
      title="Gifts for a loved one"
      description="Thoughtful presents that give twice: once to them, once to a charity."
      products={data}
      loading={isLoading}
      error={isError ? 'We could not load these items right now.' : null}
      viewAllHref="/product"
      className={secClassName || 'bg-[#FAF8FB]'}
    />
  );
};

export default GiftFeaturedCategoryProducts;
