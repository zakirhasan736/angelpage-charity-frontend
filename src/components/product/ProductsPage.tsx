'use client';
import React from 'react';
import { useShopFilter } from '@/components/product/ShopFilterContext';
import ProductBannerSec from '@/components/banner/ProductBannerSec';
import ProductsListsSec from '@/components/product/ProductsListsSec';

const ProductsPage = ({ hideBanner = false }: { hideBanner?: boolean }) => {
  const filter = useShopFilter();
  const category = filter.category || 'All Products';
  const subcategory = filter.subcategory || undefined;

  return (
    <div className="products-page-main-wrapper">
      {hideBanner ? null : (
        <ProductBannerSec category={category} subcategory={subcategory} />
      )}
      <ProductsListsSec category={category} subcategory={subcategory} />
    </div>
  );
};

export default ProductsPage;
