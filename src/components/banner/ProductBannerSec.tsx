'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronRight, HeartHandshake } from 'lucide-react';
import { shopHref } from '@/lib/shopUrls';

const ProductBannerSec = ({
  category,
  subcategory,
}: {
  category: string;
  subcategory?: string;
}) => {
  const isAll = !category || category === 'All Products';
  const title = isAll ? 'Shop pre-loved' : subcategory || category;
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: isAll ? undefined : '/product' },
  ];
  if (!isAll)
    crumbs.push(
      subcategory
        ? { label: category, href: shopHref(category) }
        : { label: category }
    );
  if (subcategory) crumbs.push({ label: subcategory });

  return (
    <section className="product-banner-section bg-white pt-8 pb-6 sm:pt-5 sm:pb-4">
      <div className="custom-container">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#8A888C]">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5 capitalize">
                {c.href ? (
                  <Link
                    href={c.href}
                    className="transition hover:text-[#611192]"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-[#0B0112]">
                    {c.label}
                  </span>
                )}
                {i < crumbs.length - 1 ? (
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-4 flex items-end justify-between gap-6 sm:mt-3 sm:flex-col sm:items-start sm:gap-3">
          <div>
            <h1 className="ap-display current-category-title text-[44px] leading-[1.05] first-letter:uppercase md:text-[36px] sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-2 max-w-[560px] text-[15px] text-[#5C5560] sm:text-[14px]">
              {isAll
                ? 'One-of-a-kind finds from people and charity shops across the USA.'
                : `Pre-loved ${String(title).toLowerCase()}, checked by sellers and charity shops.`}
            </p>
          </div>
          <p className="flex shrink-0 items-center gap-2 rounded-full bg-[#F2E8F8] px-4 py-2 text-[13px] font-medium text-[#3B055C]">
            <HeartHandshake className="h-4 w-4 text-[#611192]" aria-hidden />
            Up to 90% of every sale goes to charity
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductBannerSec;
