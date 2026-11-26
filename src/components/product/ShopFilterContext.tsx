'use client';

import React, { createContext, useContext } from 'react';
import { useSearchParams } from 'next/navigation';

type ShopFilter = { category: string; subcategory: string };

const ShopFilterContext = createContext<ShopFilter | null>(null);

/** Supplies the category from the URL path on /shop/[category]/[subcategory]. */
export function ShopFilterProvider({
  category = '',
  subcategory = '',
  children,
}: {
  category?: string;
  subcategory?: string;
  children: React.ReactNode;
}) {
  return (
    <ShopFilterContext.Provider value={{ category, subcategory }}>
      {children}
    </ShopFilterContext.Provider>
  );
}

/** Category from /shop/… paths, falling back to ?category= on /product. */
export function useShopFilter(): ShopFilter {
  const fromPath = useContext(ShopFilterContext);
  const searchParams = useSearchParams();
  if (fromPath) return fromPath;
  return {
    category: searchParams?.get('category') || '',
    subcategory: searchParams?.get('subcategory') || '',
  };
}
