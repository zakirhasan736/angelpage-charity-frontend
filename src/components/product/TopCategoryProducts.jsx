'use client';

import React from 'react';
import ProductRail from '../common/product-slider/ProductRail';
import { useGetLatestProductsQuery } from '@/store/api/angelpageApi';

const TopCategoryProducts = ({ secClassName }) => {
  const { data = [], isLoading, isError } = useGetLatestProductsQuery();

  return (
    <ProductRail
      eyebrow="Just listed"
      title="Shop now to support a great cause"
      description="Fresh pre-loved finds. Every purchase sends money to a charity you can see on the card."
      products={data}
      loading={isLoading}
      error={isError ? 'We could not load these items right now.' : null}
      viewAllHref="/product"
      className={secClassName || 'bg-white'}
    />
  );
};

export default TopCategoryProducts;
