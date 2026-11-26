'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export type ShopFilterState = {
  category: string[];
  subCategory: string[];
  brand: string[];
  condition: string[];
  delivery: string[];
  priceMin: string;
  priceMax: string;
};

export const EMPTY_FILTERS: ShopFilterState = {
  category: [],
  subCategory: [],
  brand: [],
  condition: [],
  delivery: [],
  priceMin: '',
  priceMax: '',
};

type ShopProduct = {
  category?: string;
  subcategory?: string;
  brand?: string;
  condition?: string;
  fulfillmentType?: string;
};

export const DELIVERY_LABELS: Record<string, string> = {
  ships: 'Ships to you',
  collect: 'Local pickup',
  personal: 'Hand delivery',
};

/** Groups the backend fulfilment types into three shopper-friendly options. */
export function deliveryGroup(type?: string) {
  if (type === 'self_collect' || type === 'local_only') return 'collect';
  if (type === 'personal_delivery') return 'personal';
  return 'ships';
}

const CONDITION_ORDER = [
  'New with tags',
  'New',
  'Like new',
  'Very good',
  'Good',
  'Fair',
];

const PRICE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $50', min: '25', max: '50' },
  { label: '$50 – $100', min: '50', max: '100' },
  { label: '$100+', min: '100', max: '' },
];

function countBy(
  products: ShopProduct[],
  pick: (p: ShopProduct) => string | undefined
) {
  const m = new Map<string, number>();
  products.forEach(p => {
    const v = (pick(p) || '').trim();
    if (v && !/^unknown/i.test(v)) m.set(v, (m.get(v) || 0) + 1);
  });
  return m;
}

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#EEEAF0] py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#0B0112]">
          {title}
          {count ? (
            <span className="rounded-full bg-[#611192] px-1.5 py-px text-[10px] font-semibold text-white">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#8A888C] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? <div className="pt-3">{children}</div> : null}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#F7F2FA]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#611192]/40 ${checked ? 'border-[#611192] bg-[#611192]' : 'border-[#CFC9D3] bg-white group-hover:border-[#611192]'}`}
      >
        {checked ? (
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M2.5 6.2 5 8.5l4.5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="flex-1 truncate text-[14px] text-[#2A2330] capitalize">
        {label}
      </span>
      <span className="text-[12px] text-[#8A888C] tabular-nums">{count}</span>
    </label>
  );
}

export default function ShopFilters({
  products,
  value,
  onChange,
  hideCategory = false,
}: {
  products: ShopProduct[];
  value: ShopFilterState;
  onChange: (next: ShopFilterState) => void;
  hideCategory?: boolean;
}) {
  const [brandQuery, setBrandQuery] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);

  const categories = useMemo(
    () => countBy(products, p => p.category),
    [products]
  );
  const subcats = useMemo(
    () => countBy(products, p => p.subcategory),
    [products]
  );
  const brands = useMemo(() => countBy(products, p => p.brand), [products]);
  const conditions = useMemo(
    () => countBy(products, p => p.condition),
    [products]
  );
  const delivery = useMemo(
    () => countBy(products, p => deliveryGroup(p.fulfillmentType)),
    [products]
  );

  const toggle = (
    key: 'category' | 'subCategory' | 'brand' | 'condition' | 'delivery',
    v: string
  ) => {
    const list = value[key];
    onChange({
      ...value,
      [key]: list.includes(v) ? list.filter(x => x !== v) : [...list, v],
    });
  };

  const sortedConditions = [...conditions.keys()].sort((a, b) => {
    const ia = CONDITION_ORDER.findIndex(
      c => c.toLowerCase() === a.toLowerCase()
    );
    const ib = CONDITION_ORDER.findIndex(
      c => c.toLowerCase() === b.toLowerCase()
    );
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const brandList = [...brands.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .filter(([b]) => b.toLowerCase().includes(brandQuery.trim().toLowerCase()));
  const visibleBrands =
    showAllBrands || brandQuery ? brandList : brandList.slice(0, 8);
  const activePreset = PRICE_PRESETS.find(
    p => p.min === value.priceMin && p.max === value.priceMax
  );

  return (
    <div className="ap-shop-filters">
      {!hideCategory && categories.size > 1 ? (
        <Section title="Category" count={value.category.length}>
          <div className="-mx-2 space-y-0.5">
            {[...categories.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <CheckRow
                  key={c}
                  label={c}
                  count={n}
                  checked={value.category.includes(c)}
                  onChange={() => toggle('category', c)}
                />
              ))}
          </div>
        </Section>
      ) : null}

      {subcats.size > 1 ? (
        <Section
          title="Type"
          count={value.subCategory.length}
          defaultOpen={hideCategory}
        >
          <div className="-mx-2 max-h-[248px] space-y-0.5 overflow-y-auto pr-1">
            {[...subcats.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <CheckRow
                  key={c}
                  label={c}
                  count={n}
                  checked={value.subCategory.includes(c)}
                  onChange={() => toggle('subCategory', c)}
                />
              ))}
          </div>
        </Section>
      ) : null}

      <Section title="Price" count={value.priceMin || value.priceMax ? 1 : 0}>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map(p => {
            const on = activePreset === p;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    ...value,
                    priceMin: on ? '' : p.min,
                    priceMax: on ? '' : p.max,
                  })
                }
                className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition ${on ? 'border-[#611192] bg-[#611192] text-white' : 'border-[#E2DDE5] bg-white text-[#2A2330] hover:border-[#611192]'}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {(['priceMin', 'priceMax'] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i === 1 ? <span className="text-[#8A888C]">–</span> : null}
              <label className="flex h-11 flex-1 items-center gap-1 rounded-xl border border-[#E2DDE5] bg-white px-3 focus-within:border-[#611192] focus-within:ring-2 focus-within:ring-[#611192]/15">
                <span className="text-[13px] text-[#8A888C]">$</span>
                <input
                  inputMode="decimal"
                  value={value[k]}
                  onChange={e =>
                    onChange({
                      ...value,
                      [k]: e.target.value.replace(/[^\d.]/g, ''),
                    })
                  }
                  placeholder={i === 0 ? 'Min' : 'Max'}
                  aria-label={i === 0 ? 'Minimum price' : 'Maximum price'}
                  className="w-full min-w-0 border-0 bg-transparent p-0 text-[14px] text-[#0B0112] outline-none placeholder:text-[#B3AEB7]"
                />
              </label>
            </React.Fragment>
          ))}
        </div>
      </Section>

      {sortedConditions.length ? (
        <Section title="Condition" count={value.condition.length}>
          <div className="flex flex-wrap gap-2">
            {sortedConditions.map(c => {
              const on = value.condition.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle('condition', c)}
                  className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition ${on ? 'border-[#611192] bg-[#F2E8F8] text-[#3B055C]' : 'border-[#E2DDE5] bg-white text-[#2A2330] hover:border-[#611192]'}`}
                >
                  {c}
                  <span className="ml-1.5 text-[11px] text-[#8A888C]">
                    {conditions.get(c)}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      ) : null}

      {brands.size ? (
        <Section title="Brand" count={value.brand.length}>
          {brands.size > 8 ? (
            <label className="mb-2 flex h-10 items-center gap-2 rounded-xl bg-[#F6F3F8] px-3">
              <Search className="h-4 w-4 text-[#8A888C]" aria-hidden />
              <input
                value={brandQuery}
                onChange={e => setBrandQuery(e.target.value)}
                placeholder="Find a brand"
                aria-label="Find a brand"
                className="w-full border-0 bg-transparent p-0 text-[14px] outline-none placeholder:text-[#8A888C]"
              />
            </label>
          ) : null}
          <div className="-mx-2 space-y-0.5">
            {visibleBrands.map(([b, n]) => (
              <CheckRow
                key={b}
                label={b}
                count={n}
                checked={value.brand.includes(b)}
                onChange={() => toggle('brand', b)}
              />
            ))}
            {!visibleBrands.length ? (
              <p className="px-2 py-2 text-[13px] text-[#8A888C]">
                No brand matches “{brandQuery}”.
              </p>
            ) : null}
          </div>
          {!brandQuery && brandList.length > 8 ? (
            <button
              type="button"
              onClick={() => setShowAllBrands(s => !s)}
              className="mt-2 text-[13px] font-semibold text-[#611192] hover:underline"
            >
              {showAllBrands
                ? 'Show fewer'
                : `Show all ${brandList.length} brands`}
            </button>
          ) : null}
        </Section>
      ) : null}

      {delivery.size ? (
        <Section title="Delivery" count={value.delivery.length}>
          <div className="-mx-2 space-y-0.5">
            {Object.keys(DELIVERY_LABELS)
              .filter(k => delivery.has(k))
              .map(k => (
                <CheckRow
                  key={k}
                  label={DELIVERY_LABELS[k]}
                  count={delivery.get(k) || 0}
                  checked={value.delivery.includes(k)}
                  onChange={() => toggle('delivery', k)}
                />
              ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
