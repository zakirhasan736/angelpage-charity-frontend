'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Grid2x2,
  Square,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useShopFilter } from '@/components/product/ShopFilterContext';
import ProductList from '@/components/product/ProductList';
import ProductSkeletonCard from '../common/cards/product/productskeletonCard';
import ShopFilters, {
  DELIVERY_LABELS,
  EMPTY_FILTERS,
  deliveryGroup,
  type ShopFilterState,
} from '@/components/product/shop/ShopFilters';
import {
  useGetAllProductsQuery,
  useGetCategoryProductsQuery,
} from '@/store/api/angelpageApi';
import { shopHref } from '@/lib/shopUrls';
import { Product } from '@/types/productTypes';

interface ProductsListsSecProps {
  category: string;
  subcategory?: string;
}

type ShopItem = Product & {
  createdAt?: string;
  fulfillmentType?: string;
  charityProfit?: number;
};

const PAGE_STEP = 24;

const SORTS: { value: string; label: string }[] = [
  { value: '', label: 'Recommended' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};

function applyFilters(list: ShopItem[], f: ShopFilterState, sort: string) {
  const min = f.priceMin === '' ? -Infinity : num(f.priceMin);
  const max = f.priceMax === '' ? Infinity : num(f.priceMax);
  const out = list.filter(
    p =>
      (!f.category.length || f.category.includes(p.category || '')) &&
      (!f.subCategory.length || f.subCategory.includes(p.subcategory || '')) &&
      (!f.brand.length || f.brand.includes(p.brand || '')) &&
      (!f.condition.length || f.condition.includes(p.condition || '')) &&
      (!f.delivery.length ||
        f.delivery.includes(deliveryGroup(p.fulfillmentType))) &&
      num(p.price) >= min &&
      num(p.price) <= max
  );
  if (sort === 'price-asc') out.sort((a, b) => num(a.price) - num(b.price));
  else if (sort === 'price-desc')
    out.sort((a, b) => num(b.price) - num(a.price));
  else if (sort === 'date-desc')
    out.sort(
      (a, b) =>
        Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '') || 0
    );
  return out;
}

function activeChips(f: ShopFilterState) {
  const chips: {
    key: string;
    label: string;
    clear: (s: ShopFilterState) => ShopFilterState;
  }[] = [];
  (
    ['category', 'subCategory', 'condition', 'brand', 'delivery'] as const
  ).forEach(k =>
    f[k].forEach(v =>
      chips.push({
        key: `${k}:${v}`,
        label: k === 'delivery' ? DELIVERY_LABELS[v] || v : v,
        clear: s => ({ ...s, [k]: s[k].filter(x => x !== v) }),
      })
    )
  );
  if (f.priceMin || f.priceMax) {
    const label =
      f.priceMin && f.priceMax
        ? `$${f.priceMin} – $${f.priceMax}`
        : f.priceMin
          ? `From $${f.priceMin}`
          : `Up to $${f.priceMax}`;
    chips.push({
      key: 'price',
      label,
      clear: s => ({ ...s, priceMin: '', priceMax: '' }),
    });
  }
  return chips;
}

/** Sort menu: a real listbox-style popover instead of the bare <select>. */
function SortMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === 'Escape'
          : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  const current = SORTS.find(s => s.value === value) || SORTS[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-11 items-center gap-2 rounded-full border border-[#E2DDE5] bg-white pr-3 pl-4 text-[14px] font-medium text-[#0B0112] transition hover:border-[#611192]"
      >
        <ArrowUpDown className="h-4 w-4 text-[#611192]" aria-hidden />
        <span className="sm:hidden">Sort:</span>
        <span className="font-semibold sm:hidden">{current.label}</span>
        <span className="hidden font-semibold sm:inline">Sort</span>
        <ChevronDown
          className={`h-4 w-4 text-[#8A888C] transition sm:hidden ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Sort products"
          className="absolute top-[calc(100%+8px)] right-0 z-40 w-[230px] overflow-hidden rounded-2xl border border-[#ECE8EE] bg-white p-1.5 shadow-[0_18px_50px_rgba(11,1,18,0.14)]"
        >
          {SORTS.map(s => (
            <li key={s.value}>
              <button
                type="button"
                role="option"
                aria-selected={s.value === value}
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] transition hover:bg-[#F7F2FA] ${s.value === value ? 'font-semibold text-[#611192]' : 'text-[#2A2330]'}`}
              >
                {s.label}
                {s.value === value ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Phone filter sheet: slides up over the tab bar, with a sticky "Show N results" footer. */
function FilterSheet({
  open,
  onClose,
  count,
  onClear,
  children,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[10050]"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <div
        className="ap-fade-in absolute inset-0 bg-[#0B0112]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="ap-sheet absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-white shadow-[0_-20px_60px_rgba(11,1,18,0.25)]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#E2DDE5]" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="ap-display text-[22px]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F1F6]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {children}
        </div>
        <div className="flex gap-3 border-t border-[#EEEAF0] px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClear}
            className="h-12 rounded-full border border-[#E2DDE5] px-5 text-[15px] font-semibold text-[#0B0112]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-full bg-[#611192] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.3)]"
          >
            {count === 0
              ? 'No matches'
              : `Show ${count} ${count === 1 ? 'item' : 'items'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const ProductsListsSec: React.FC<ProductsListsSecProps> = () => {
  const { status } = useSession() || {};
  const isLoggedIn = status === 'authenticated';
  const { category, subcategory } = useShopFilter();
  const hasCategoryFilter = !!(category || subcategory);

  const cat = useGetCategoryProductsQuery(
    { category, subcategory, status: 'LIVE' },
    { skip: !hasCategoryFilter }
  );
  const all = useGetAllProductsQuery(
    { status: 'LIVE' },
    { skip: hasCategoryFilter }
  );
  const source = hasCategoryFilter ? cat : all;
  const products = useMemo(
    () => ((source.data as ShopItem[] | undefined) || []).filter(Boolean),
    [source.data]
  );
  const loading = source.isLoading;
  const failed = source.isError;

  const [filters, setFilters] = useState<ShopFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState('');
  const [visible, setVisible] = useState(PAGE_STEP);
  const [dense, setDense] = useState(false);
  const [sheet, setSheet] = useState(false);

  // Phones start at two per row, desktops at three.
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) setDense(true);
  }, []);

  // A new category (client navigation) starts from a clean slate.
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setVisible(PAGE_STEP);
  }, [category, subcategory]);
  useEffect(() => setVisible(PAGE_STEP), [filters, sort]);

  const results = useMemo(
    () => applyFilters(products, filters, sort),
    [products, filters, sort]
  );
  const chips = activeChips(filters);
  const shown = results.slice(0, visible);

  // Quick links: categories on /product, sub-categories inside a category.
  const quickLinks = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach(p => {
      const k =
        (subcategory ? '' : category ? p.subcategory : p.category) || '';
      if (k && !/^(unknown|uncategori[sz]ed)/i.test(k))
        m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [products, category, subcategory]);

  const filterPanel = (
    <ShopFilters
      products={products}
      value={filters}
      onChange={setFilters}
      hideCategory={hasCategoryFilter}
    />
  );
  const clearAll = () => setFilters(EMPTY_FILTERS);

  if (failed) {
    return (
      <section className="custom-container py-16">
        <div className="mx-auto max-w-[520px] rounded-[28px] border border-[#ECE8EE] bg-white p-10 text-center sm:p-7">
          <h2 className="ap-display text-[26px]">We couldn’t load the shop</h2>
          <p className="mt-2 text-[15px] text-[#5C5560]">
            Check your connection and try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => source.refetch()}
              className="h-12 rounded-full bg-[#611192] px-6 text-[15px] font-semibold text-white"
            >
              Try again
            </button>
            <Link
              href="/"
              className="flex h-12 items-center rounded-full border border-[#E2DDE5] px-6 text-[15px] font-semibold text-[#0B0112]"
            >
              Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-lists-section bg-white pb-16 sm:pb-24">
      {!hasCategoryFilter && quickLinks.length > 1 ? (
        <div className="custom-container">
          <nav
            aria-label="Shop by category"
            className="ap-no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            <span className="flex h-10 shrink-0 items-center rounded-full bg-[#0B0112] px-4 text-[14px] font-semibold text-white">
              All
            </span>
            {quickLinks.map(([name, n]) => (
              <Link
                key={name}
                href={category ? shopHref(category, name) : shopHref(name)}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#E2DDE5] bg-white px-4 text-[14px] font-medium text-[#2A2330] capitalize transition hover:border-[#611192] hover:text-[#611192]"
              >
                {name}
                <span className="text-[12px] text-[#8A888C]">{n}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 mt-5 border-y border-[#EEEAF0] bg-white/90 backdrop-blur-xl sm:mt-4">
        <div className="custom-container flex h-[68px] items-center justify-between gap-3 sm:h-[60px]">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="hidden h-11 items-center gap-2 rounded-full bg-[#0B0112] pr-4 pl-3.5 text-[14px] font-semibold text-white md:flex"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
              {chips.length ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#0B0112]">
                  {chips.length}
                </span>
              ) : null}
            </button>
            <p
              className="truncate text-[14px] text-[#5C5560] sm:hidden"
              aria-live="polite"
            >
              {loading ? (
                'Loading…'
              ) : (
                <>
                  <span className="font-semibold text-[#0B0112]">
                    {results.length.toLocaleString('en-US')}
                  </span>{' '}
                  {results.length === 1 ? 'item' : 'items'}
                  {chips.length
                    ? ` of ${products.length.toLocaleString('en-US')}`
                    : ''}
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SortMenu value={sort} onChange={setSort} />
            <div
              className="flex h-11 items-center rounded-full border border-[#E2DDE5] bg-white p-1"
              role="group"
              aria-label="Grid size"
            >
              {[false, true].map(d => {
                const Icon = d ? Grid2x2 : Square;
                return (
                  <button
                    key={String(d)}
                    type="button"
                    aria-pressed={dense === d}
                    aria-label={d ? 'More per row' : 'Bigger photos'}
                    onClick={() => setDense(d)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${dense === d ? 'bg-[#F2E8F8] text-[#611192]' : 'text-[#8A888C] hover:text-[#0B0112]'}`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="custom-container pt-6 sm:pt-4">
        <div className="flex items-start gap-10 lg:gap-7">
          {/* Desktop filter rail */}
          <aside
            aria-label="Filters"
            className="sticky top-[92px] max-h-[calc(100vh-110px)] w-[264px] shrink-0 overflow-y-auto pr-2 md:hidden"
          >
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-[13px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                Filters
              </h2>
              {chips.length ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[13px] font-semibold text-[#611192] hover:underline"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            {filterPanel}
          </aside>

          <div className="min-w-0 flex-1">
            {chips.length ? (
              <div className="ap-no-scrollbar mb-5 flex items-center gap-2 overflow-x-auto sm:mb-4">
                {chips.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setFilters(c.clear)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#F2E8F8] pr-2.5 pl-3.5 text-[13px] font-medium text-[#3B055C] transition hover:bg-[#E9D9F3]"
                    aria-label={`Remove ${c.label}`}
                  >
                    {c.label}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-9 shrink-0 px-2 text-[13px] font-semibold text-[#611192] hover:underline"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <div
              className={`ap-shop-grid ${dense ? 'ap-shop-grid--dense' : ''}`}
            >
              {loading ? (
                <div className="product-list grid gap-x-5 gap-y-9">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <ProductSkeletonCard key={i} />
                  ))}
                </div>
              ) : results.length ? (
                <ProductList products={shown} isLoggedIn={isLoggedIn} />
              ) : (
                <div className="rounded-[28px] border border-dashed border-[#DCD3E2] bg-[#FCF8FE] px-6 py-16 text-center">
                  <h3 className="ap-display text-[24px]">
                    {products.length
                      ? 'Nothing matches those filters'
                      : 'No items here yet'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-[#5C5560]">
                    {products.length
                      ? 'Try removing a filter or widening the price range.'
                      : 'New pre-loved finds are listed every day. Check back soon, or browse the whole shop.'}
                  </p>
                  {products.length ? (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="mt-6 h-12 rounded-full bg-[#611192] px-6 text-[15px] font-semibold text-white"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <Link
                      href="/product"
                      className="mt-6 inline-flex h-12 items-center rounded-full bg-[#611192] px-6 text-[15px] font-semibold text-white"
                    >
                      Browse the shop
                    </Link>
                  )}
                </div>
              )}
            </div>

            {!loading && results.length > 0 ? (
              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-[14px] text-[#5C5560]">
                  You’ve seen{' '}
                  <span className="font-semibold text-[#0B0112]">
                    {shown.length}
                  </span>{' '}
                  of {results.length.toLocaleString('en-US')}
                </p>
                <div className="h-1 w-[220px] overflow-hidden rounded-full bg-[#EEEAF0]">
                  <div
                    className="h-full rounded-full bg-[#611192] transition-all"
                    style={{
                      width: `${Math.min(100, (shown.length / results.length) * 100)}%`,
                    }}
                  />
                </div>
                {shown.length < results.length ? (
                  <button
                    type="button"
                    onClick={() => setVisible(v => v + PAGE_STEP)}
                    className="mt-1 h-12 rounded-full border border-[#0B0112] px-8 text-[15px] font-semibold text-[#0B0112] transition hover:bg-[#0B0112] hover:text-white"
                  >
                    Show more
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <FilterSheet
        open={sheet}
        onClose={() => setSheet(false)}
        count={results.length}
        onClear={clearAll}
      >
        {filterPanel}
      </FilterSheet>
    </section>
  );
};

export default ProductsListsSec;
