'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { shopHref } from '@/lib/shopUrls';
import { categoriesData } from '@/libs/categoriesData';
import { fetchCategories, type Category } from '@/lib/categories';

const TOPIC_IMAGES: Record<string, string> = {
  women: '/images/home/category/topics/women.jpg',
  men: '/images/home/category/topics/men.jpg',
  children: '/images/home/category/topics/children.jpg',
  clothing: '/images/home/category/topics/clothing.jpg',
  shoes: '/images/home/category/topics/shoes.jpg',
  bags: '/images/home/category/topics/bags.jpg',
  accessories: '/images/home/category/topics/accessories.jpg',
  jewellery: '/images/home/category/topics/jewellery.jpg',
  homeware: '/images/home/category/topics/homeware.jpg',
  books: '/images/home/category/topics/books.jpg',
  electronics: '/images/home/category/topics/electronics.jpg',
};

function categoryBlurb(category: Category) {
  const names = category.subCategories
    .slice(0, 3)
    .map(item => item.name)
    .filter(Boolean);
  if (names.length === 0) {
    return `Browse ${category.name} and support a charity with every purchase.`;
  }
  return `Shop ${names.join(', ')} and more.`;
}

const OurPlatformSection = () => {
  const [categories, setCategories] = useState<Category[]>(
    categoriesData.categories as Category[],
  );

  useEffect(() => {
    fetchCategories()
      .then(list => {
        if (list.length > 0) setCategories(list);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="our-platform-section ap-section bg-[#FCF7FE]">
      <div className="custom-container">
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-5">
          <div>
            <p className="ap-eyebrow">Shop by department</p>
            <h2 className="ap-display mt-2 text-[36px] leading-tight md:text-[30px] sm:text-[26px]">Everything pre-loved, all for good</h2>
            <p className="mt-2 max-w-[520px] text-[15px] text-[#6B686E] sm:text-[13px]">Every department opens the live listings, and every purchase supports a charity.</p>
          </div>
          <Link href="/product" className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-[#611192]">
            Browse everything <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className="grid auto-rows-[190px] grid-cols-4 gap-4 md:grid-cols-3 sm:auto-rows-[150px] sm:grid-cols-2 sm:gap-3">
          {categories.map((category, i) => (
            <Link
              key={category.id}
              href={shopHref(category.id)}
              className={`group relative block overflow-hidden rounded-[24px] bg-[#F2E8F8] sm:rounded-[20px] ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <Image
                src={TOPIC_IMAGES[category.id] || TOPIC_IMAGES.clothing}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes={i === 0 ? '(max-width: 767px) 100vw, 50vw' : '(max-width: 767px) 50vw, 25vw'}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/80 via-[#0B0112]/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-3.5">
                <span className="min-w-0">
                  <span className={`block font-primary leading-tight text-white ${i === 0 ? 'text-[32px] sm:text-[24px]' : 'text-[22px] sm:text-[17px]'}`}>{category.name}</span>
                  {i === 0 ? <span className="mt-1 block max-w-xs text-[13px] text-white/80">{categoryBlurb(category)}</span> : null}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#611192] transition group-hover:bg-white sm:h-8 sm:w-8">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurPlatformSection;
