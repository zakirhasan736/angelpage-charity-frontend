'use client';
import React, { useState, useMemo } from 'react';
import ProductList from '@/components/product/ProductList';
import Pagination from '@/components/elements/Pagination';
import { Search } from 'lucide-react';
import { Product } from '@/types/productTypes';

interface FavoriteProductListingProps {
  products: Product[];
  isLoggedin: boolean;
}

const FavoriteProductListing: React.FC<FavoriteProductListingProps> = ({
  products = [],
  isLoggedin,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const productsPerPage = 12;

  const filterAndSortProducts = (
    products: Product[],
    sort: string,
    query: string
  ) => {
    let updatedProducts = [...products];

    // Search logic
    if (query) {
      updatedProducts = updatedProducts.filter(
        product =>
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          product.category?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sorting logic
    if (sort === 'price-asc') {
      updatedProducts.sort(
        (a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0')
      );
    } else if (sort === 'price-desc') {
      updatedProducts.sort(
        (a, b) => parseFloat(b.price || '0') - parseFloat(a.price || '0')
      );
    } else if (sort === 'name-asc') {
      updatedProducts.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
    } else if (sort === 'name-desc') {
      updatedProducts.sort((a, b) =>
        (b.name || '').localeCompare(a.name || '')
      );
    }

    return updatedProducts;
  };

  // Apply filtering, sorting, and searching using useMemo for performance
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, sort, searchQuery);
  }, [sort, searchQuery, products]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!products.length) return null;

  return (
    <section className="products-lists-section pb-10">
      <div className="flex items-center gap-3 max-[767px]:flex-wrap">
        <label className="relative flex-1 max-[767px]:basis-full">
          <span className="sr-only">Search saved items</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder={`Search ${products.length} saved items`}
            className="h-12 w-full rounded-full! border border-[#ECE8EE] bg-white pr-4 pl-11 text-[14px] outline-none transition focus:border-[#611192]/40 focus:shadow-[0_0_0_4px_rgba(97,17,146,0.08)] max-[767px]:text-[16px]"
          />
        </label>
        <label className="relative max-[767px]:flex-1">
          <span className="sr-only">Sort</span>
          <select
            value={sort}
            onChange={e => handleSortChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-full! border border-[#ECE8EE]! bg-white py-0 pr-10 pl-5 text-[14px] font-medium outline-none"
          >
            <option value="">Recently saved</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <svg className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#6B686E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>
      </div>

      <p className="mt-5 mb-4 text-[13px] text-[#6B686E]">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
      </p>

      {currentProducts.length === 0 ? (
        <div className="rounded-[24px] bg-white px-6 py-14 text-center ring-1 ring-[#ECE8EE]">
          <p className="font-primary text-[22px] text-[#0B0112]">Nothing matches “{searchQuery}”</p>
          <p className="mt-2 text-[14px] text-[#6B686E]">Try another word.</p>
        </div>
      ) : (
        <div className="ap-store-grid">
          <ProductList isLoggedIn={isLoggedin} products={currentProducts} />
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </section>
  );
};

export default FavoriteProductListing;
