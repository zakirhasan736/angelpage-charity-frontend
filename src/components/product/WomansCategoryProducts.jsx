'use client';

import React from 'react';
import ProductRail from '../common/product-slider/ProductRail';
import { useGetProductsByCategoryPathQuery } from '@/store/api/angelpageApi';

const WomansCategoryProducts = ({ secClassName }) => {
  const { data = [], isLoading, isError } = useGetProductsByCategoryPathQuery('women');

  return (
    <ProductRail
      eyebrow="Women"
      title="Shop women’s"
      description="Wardrobe pieces with a second life, from everyday staples to statement looks."
      products={data}
      loading={isLoading}
      error={isError ? 'We could not load these items right now.' : null}
      viewAllHref="/shop/women"
      className={secClassName || 'bg-[#FAF8FB]'}
    />
  );
};

export default WomansCategoryProducts;
