'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import LanguageSwitch from './LanguageSwitch';
import { categoriesData } from '@/libs/categoriesData';
import { fetchCategories, type Category } from '@/lib/categories';

const fallback = categoriesData.categories as Category[];

export function categoryHref(categoryId: string, subcategoryId?: string) {
  const params = new URLSearchParams({ category: categoryId });
  if (subcategoryId) params.set('subcategory', subcategoryId);
  return `/product?${params.toString()}`;
}

function useCatalog() {
  const [categories, setCategories] = useState<Category[]>(fallback);

  useEffect(() => {
    fetchCategories()
      .then(list => {
        if (list.length > 0) setCategories(list);
      })
      .catch(() => undefined);
  }, []);

  return categories;
}

const BottomNavMegamenu = () => {
  const pathname = usePathname();
  const categories = useCatalog();
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const open = categories.find(category => category.id === openId) || null;

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenId(null), 180);
  };

  const reveal = (id: string) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    cancelClose();
    setOpenId(id);
  };

  const promoImages = [
    '/images/home/category/category-card-img1.png',
    '/images/home/category/category-card-img2.png',
    '/images/home/category/category-card-img3.png',
    '/images/home/category/category-card-img4.png',
  ];
  const openIndex = open ? categories.findIndex(c => c.id === open.id) : 0;

  return (
    <nav
      ref={rootRef}
      className="header-bottom-navbar navbar-megamenu-area relative"
      onMouseLeave={scheduleClose}
      aria-label="Shop by category"
    >
      <div className="custom-container flex items-center justify-between gap-6">
        <ul className="ap-no-scrollbar -ml-3 flex min-w-0 flex-1 items-center overflow-x-auto">
          {categories.map(category => {
            const active = openId === category.id;
            return (
              <li key={category.id} onMouseEnter={() => reveal(category.id)}>
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls="catalog-mega-panel"
                  className="ap-nav-link"
                  onClick={() => {
                    cancelClose();
                    setOpenId(active ? null : category.id);
                  }}
                >
                  {category.name}
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 opacity-50 transition-transform duration-200 ${active ? 'rotate-180 opacity-100' : ''}`}
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex shrink-0 items-center gap-1 border-l border-[#ECE8EE] pl-4 max-[1280px]:hidden">
          <Link href="/charity/find-a-charity" className="ap-nav-link">
            Charities
          </Link>
          <Link href="/events" className="ap-nav-link">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-[#E50035]" aria-hidden />
            Events
          </Link>
          <Link href="/blog" className="ap-nav-link">
            Journal
          </Link>
        </div>
        <LanguageSwitch />
      </div>

      {open && (
        <div
          id="catalog-mega-panel"
          className="ap-mega-enter absolute left-0 right-0 top-full z-[80] border-y border-[#ECE8EE] bg-white shadow-[0_32px_64px_rgba(11,1,18,0.10)]"
          onMouseEnter={cancelClose}
        >
          <div className="custom-container grid grid-cols-12 gap-10 py-9 max-[1280px]:gap-6">
            <div className="col-span-3 flex flex-col">
              <p className="ap-eyebrow">Shop</p>
              <h3 className="ap-display mt-3 text-[34px]">{open.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5C5560]">
                {open.subCategories.length} sections of pre-loved finds. Every purchase supports a
                verified charity.
              </p>
              <Link
                href={categoryHref(open.id)}
                onClick={() => setOpenId(null)}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#611192] px-5 py-2.5 text-sm font-medium text-white! shadow-[0_8px_20px_rgba(97,17,146,0.22)] transition hover:bg-[#3B055C]"
              >
                Shop all {open.name}
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M11.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4l3.3-3.3H3a1 1 0 1 1 0-2h11.6l-3.3-3.3a1 1 0 0 1 0-1.4z" />
                </svg>
              </Link>
            </div>

            <div className="col-span-6 border-l border-[#ECE8EE] pl-10 max-[1280px]:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">
                Browse {open.name.toLowerCase()}
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-x-6 gap-y-0.5 max-[1280px]:grid-cols-2">
                {open.subCategories.map(sub => (
                  <li key={sub.id}>
                    <Link
                      href={categoryHref(open.id, sub.id)}
                      onClick={() => setOpenId(null)}
                      className="group -mx-2 flex items-center justify-between rounded-lg px-2 py-2 text-[14px] capitalize text-[#0B0112] transition hover:bg-[#FCF2FF] hover:text-[#611192]"
                    >
                      {sub.name}
                      <span className="text-[#611192] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={categoryHref(open.id)}
              onClick={() => setOpenId(null)}
              className="group relative col-span-3 block min-h-[240px] overflow-hidden rounded-[24px] bg-[#F2E8F8]"
            >
              <Image
                src={promoImages[Math.max(0, openIndex) % promoImages.length]}
                alt=""
                fill
                sizes="300px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/80 via-[#0B0112]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75!">
                  New in {open.name}
                </p>
                <p className="mt-1 font-primary text-[22px] leading-tight text-white!">
                  Fresh finds, real impact
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export function MobileCatalogMenu() {
  const categories = useCatalog();
  const [openId, setOpenId] = useState<string | null>(null);

  const closeDrawer = () => {
    const input = document.getElementById('my-drawer-mobile-menu') as HTMLInputElement | null;
    if (input) input.checked = false;
  };

  return (
    <div className="px-4 pb-8">
      <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#611192]">
        Shop
      </p>
      <ul className="flex flex-col">
        {categories.map(category => {
          const open = openId === category.id;
          return (
            <li key={category.id} className="border-b border-[#E6E3E7]">
              <button
                type="button"
                aria-expanded={open}
                className="flex w-full items-center justify-between py-4 text-left font-primary text-2xl text-[#0B0112]"
                onClick={() => setOpenId(open ? null : category.id)}
              >
                {category.name}
                <span className="text-lg text-[#611192]">{open ? '–' : '+'}</span>
              </button>
              {open && (
                <div className="pb-4">
                  <Link
                    href={categoryHref(category.id)}
                    onClick={closeDrawer}
                    className="mb-2 block rounded-full bg-[#611192] px-4 py-2 text-center text-sm font-medium text-white"
                  >
                    Shop all {category.name}
                  </Link>
                  <ul className="grid grid-cols-2 gap-1">
                    {category.subCategories.map(sub => (
                      <li key={sub.id}>
                        <Link
                          href={categoryHref(category.id, sub.id)}
                          onClick={closeDrawer}
                          className="block rounded-xl px-2 py-2 text-sm capitalize text-[#0B0112]"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BottomNavMegamenu;
