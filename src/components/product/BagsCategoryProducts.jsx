'use client';

import React from 'react';
import ProductRail from '../common/product-slider/ProductRail';
import { useGetProductsByCategoryPathQuery } from '@/store/api/angelpageApi';

const BagsCategoryProducts = ({ secClassName }) => {
  const { data = [], isLoading, isError } = useGetProductsByCategoryPathQuery('bags');

  return (
    <ProductRail
      eyebrow="Bags"
      title="Bags worth carrying"
      description="From vintage leather to new-season totes."
      products={data}
      loading={isLoading}
      error={isError ? 'We could not load these items right now.' : null}
      viewAllHref="/shop/bags"
      className={secClassName || 'bg-white'}
    />
  );
};

export default BagsCategoryProducts;
