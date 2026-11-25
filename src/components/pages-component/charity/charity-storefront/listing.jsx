'use client';
import React, { useState, useEffect } from 'react';
import FilterSidebar from '@/components/elements/search/FilterSidebar';
import ProductList from '@/components/product/ProductList';
import Pagination from '@/components/elements/Pagination';
// import { Product } from '@/types/productTypes';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/common/loading/Skeleton';
// import { ToastService } from '@/components/elements/notifications/ToastService';

const CharityStoreListing = ({
  storefrontid,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: [],
    subCategory: [],
    brand: [],
    condition: [],
  });
  const [sort, setSort] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const productsPerPage = 12;

  // Fetch products for the charity by storefrontId
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/storefront/${storefrontid}/products`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.charity.listedProducts);
        setFilteredProducts(data.charity.listedProducts);
        // ToastService.success('Products loaded successfully.');
      } catch (error) {
        console.error('Error fetching products:', error);
        // ToastService.error('Error loading products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storefrontid]);

  // Effect to filter and sort products whenever filters or search change
  useEffect(() => {
    filterAndSortProducts(filters, sort, searchQuery);
    setCurrentPage(1); // Reset to the first page on filter or search change
  }, [filters, sort, searchQuery, products]);

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
  };

  const handleSortChange = newSort => {
    setSort(newSort);
  };

  const handleSearch = query => {
    setSearchQuery(query);
  };

  const removeFilter = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: prevFilters[filterType].filter(item => item !== value),
    }));
  };

  const filterAndSortProducts = (filters, sort, query) => {
    let updatedProducts = [...products];

    // Filter logic
    if (filters.category.length > 0) {
      updatedProducts = updatedProducts.filter(
        product =>
          product.category !== undefined &&
          filters.category.includes(product.category)
      );
    }
    if (filters.subCategory.length > 0) {
      updatedProducts = updatedProducts.filter(
        product =>
          product.subcategory !== undefined &&
          filters.subCategory.includes(product.subcategory)
      );
    }
    if (filters.brand.length > 0) {
      updatedProducts = updatedProducts.filter(
        product =>
          product.brand !== undefined && filters.brand.includes(product.brand)
      );
    }
    if (filters.condition.length > 0) {
      updatedProducts = updatedProducts.filter(
        product =>
          product.condition !== undefined &&
          filters.condition.includes(product.condition)
      );
    }

    // Search logic
    if (query) {
      updatedProducts = updatedProducts.filter(
        product =>
          (product.name &&
            product.name.toLowerCase().includes(query.toLowerCase())) ||
          (product.category &&
            product.category.toLowerCase().includes(query.toLowerCase())) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(query.toLowerCase())) ||
          (product.brand &&
            product.brand.toLowerCase().includes(query.toLowerCase()))
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

    setFilteredProducts(updatedProducts);
    setTotalPages(Math.ceil(updatedProducts.length / productsPerPage));
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  );
  const activeFilterCount =
    filters.category.length +
    filters.subCategory.length +
    filters.brand.length +
    filters.condition.length;
  const chips = Object.entries(filters).flatMap(([type, values]) =>
    values.map(value => ({ type, value }))
  );
  const sidebarProducts = products.map(product => ({
    ...product,
    category: product.category || '',
    subcategory: product.subcategory || '',
    brand: product.brand || '',
    condition: product.condition || '',
  }));

  const setCategory = cat =>
    setFilters(prev => ({ ...prev, category: cat ? [cat] : [], subCategory: [] }));

  return (
    <section className="products-lists-section bg-[#FAF8FB] pt-8 pb-16 max-[767px]:pt-4 max-[767px]:pb-8">
      <div className="custom-container">
        {/* toolbar */}
        <div className="flex items-center gap-3 max-[767px]:flex-wrap">
          <label className="relative flex-1 max-[767px]:basis-full">
            <span className="sr-only">Search this storefront</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder={`Search ${products.length} items`}
              className="h-12 w-full rounded-full! border border-[#ECE8EE] bg-white pr-4 pl-11 text-[14px] text-[#0B0112] outline-none transition focus:border-[#611192]/40 focus:shadow-[0_0_0_4px_rgba(97,17,146,0.08)] max-[767px]:text-[16px]"
            />
          </label>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#ECE8EE] bg-white px-5 text-[14px] font-medium text-[#0B0112] transition hover:border-[#611192]/40 max-[767px]:flex-1 max-[767px]:justify-center"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#611192] px-2 py-0.5 text-[11px] text-white">{activeFilterCount}</span>
            )}
          </button>
          <label className="relative max-[767px]:flex-1">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={e => handleSortChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-full! border border-[#ECE8EE]! bg-white py-0 pr-10 pl-5 text-[14px] font-medium text-[#0B0112] outline-none"
            >
              <option value="">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <svg className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#6B686E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </div>

        {/* category chips */}
        {categories.length > 1 && (
          <div className="ap-no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
            {[null, ...categories].map(cat => {
              const active = cat ? filters.category.includes(cat) : filters.category.length === 0;
              return (
                <button
                  key={cat || 'all'}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-medium capitalize transition ${
                    active ? 'bg-[#0B0112] text-white' : 'bg-white text-[#474648] ring-1 ring-[#ECE8EE] hover:ring-[#611192]/40'
                  }`}
                >
                  {cat || 'All items'}
                </button>
              );
            })}
          </div>
        )}

        {/* active filter chips */}
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map(({ type, value }) => (
              <button
                key={`${type}-${value}`}
                type="button"
                onClick={() => removeFilter(type, value)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F2E8F8] pr-2 pl-3 text-[12px] font-medium capitalize text-[#611192]"
              >
                {value}
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters({ category: [], subCategory: [], brand: [], condition: [] })}
              className="text-[12px] font-medium text-[#6B686E] underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}

        <p className="mt-6 mb-4 text-[13px] text-[#6B686E]">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          {searchQuery ? ` for “${searchQuery}”` : ''}
        </p>

        {/* grid */}
        {loading ? (
          <div className="grid grid-cols-4 gap-5 max-[1170px]:grid-cols-3 max-[767px]:grid-cols-2 max-[767px]:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : currentProducts.length === 0 ? (
          <div className="rounded-[24px] bg-white px-6 py-16 text-center ring-1 ring-[#ECE8EE]">
            <p className="font-primary text-[24px] text-[#0B0112]">No items match</p>
            <p className="mt-2 text-[14px] text-[#6B686E]">Try a different search or clear your filters.</p>
          </div>
        ) : (
          <div className="ap-store-grid">
            <ProductList products={currentProducts} isLoggedIn={true} />
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <p className="text-[12px] text-[#8A888C]">
              Showing {startIndex + 1}–{Math.min(startIndex + productsPerPage, filteredProducts.length)} of{' '}
              {filteredProducts.length}
            </p>
          </div>
        )}
      </div>

      {/* filter drawer: right panel on desktop, bottom sheet on phones */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-[#0B0112]/40 backdrop-blur-[2px]"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="ap-drawer absolute top-0 right-0 bottom-0 flex w-[400px] flex-col bg-white shadow-[0_0_60px_rgba(11,1,18,0.2)] max-[767px]:top-auto max-[767px]:h-[85vh] max-[767px]:w-full max-[767px]:rounded-t-[28px]">
            <div className="flex items-center justify-between border-b border-[#ECE8EE] px-6 py-5">
              <p className="font-primary text-[22px] text-[#0B0112]">Filters</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1F6]"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FilterSidebar
                availableProducts={sidebarProducts}
                selectedFilters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-3 border-t border-[#ECE8EE] px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setFilters({ category: [], subCategory: [], brand: [], condition: [] })}
                className="h-12 flex-1 rounded-full border border-[#DCD5E0] text-[14px] font-medium text-[#0B0112]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-12 flex-[2] rounded-full bg-[#611192] text-[14px] font-medium text-white shadow-[0_8px_20px_rgba(97,17,146,0.24)]"
              >
                Show {filteredProducts.length} items
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CharityStoreListing;
