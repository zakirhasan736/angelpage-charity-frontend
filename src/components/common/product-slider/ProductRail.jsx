'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import ProductCard from '../cards/product/productCard';
import ProductSkeletonCard from '../cards/product/productskeletonCard';
import SectionHeading from './SectionHeading';
import { formatProductLocation } from '@/lib/productLocation';

/** Prev / next arrows that drive a Swiper instance. */
export const RailArrows = ({ swiper, state, tone = 'light', label = 'items' }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      className={`ap-arrow ${tone === 'dark' ? 'ap-arrow--dark' : ''}`}
      onClick={() => swiper?.slidePrev()}
      disabled={!swiper || state.isBeginning}
      aria-label={`Previous ${label}`}
    >
      <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
    </button>
    <button
      type="button"
      className={`ap-arrow ${tone === 'dark' ? 'ap-arrow--dark' : ''}`}
      onClick={() => swiper?.slideNext()}
      disabled={!swiper || state.isEnd}
      aria-label={`Next ${label}`}
    >
      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
    </button>
  </div>
);

export const useRailState = () => {
  const [swiper, setSwiper] = useState(null);
  const [state, setState] = useState({ isBeginning: true, isEnd: false, progress: 0 });
  const sync = useCallback(s => {
    setState({
      isBeginning: s.isBeginning,
      isEnd: s.isEnd,
      progress: Math.max(0, Math.min(1, s.progress || 0)),
    });
  }, []);
  return { swiper, setSwiper, state, sync };
};

const mapProduct = item => ({
  ...item,
  id: item._id || item.id,
  slug: item.slug,
  charityImageSrc: item.charity?.profileImage,
  charityImageAlt: item.charity?.charityName || 'Charity',
  location: formatProductLocation(item.seller, item.charity),
});

/**
 * Category rail used on both home pages.
 * Header (eyebrow, title, copy, arrows, view-all) + Swiper of ProductCards + progress bar.
 * @param {{ eyebrow?: string, title: string, description?: string, products?: any[],
 *   loading?: boolean, error?: string | null, viewAllHref?: string, viewAllLabel?: string,
 *   className?: string, autoplay?: boolean, id?: string }} props
 */
const ProductRail = ({
  eyebrow,
  title,
  description,
  products = [],
  loading = false,
  error = null,
  viewAllHref = '/product',
  viewAllLabel = 'View all',
  className = 'bg-white',
  autoplay = false,
  id,
}) => {
  const { swiper, setSwiper, state, sync } = useRailState();

  if (!loading && !error && products.length === 0) return null;

  const items = loading ? Array.from({ length: 5 }) : products;

  return (
    <section className={`ap-section product-section overflow-hidden ${className}`} id={id}>
      <div className="custom-container">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            <>
              <Link
                href={viewAllHref}
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-[#611192] transition hover:bg-[#FCF2FF] max-[767px]:hidden"
              >
                {viewAllLabel}
                <ArrowUpRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </Link>
              <div className="max-[767px]:hidden">
                <RailArrows swiper={swiper} state={state} label={title} />
              </div>
            </>
          }
        />

        {error ? (
          <p className="mt-8 rounded-2xl bg-[#FFF1F4] px-5 py-4 text-sm text-[#B0002A]">{error}</p>
        ) : (
          <div className="mt-9 max-[767px]:mt-6 max-[767px]:-mr-4">
            <Swiper
              modules={[A11y, Keyboard, Autoplay]}
              onSwiper={s => {
                setSwiper(s);
                sync(s);
              }}
              onSlideChange={sync}
              onProgress={sync}
              onResize={sync}
              keyboard={{ enabled: true, onlyInViewport: true }}
              autoplay={
                autoplay && !loading
                  ? { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }
                  : false
              }
              spaceBetween={16}
              slidesPerView={1.6}
              breakpoints={{
                480: { slidesPerView: 2.15, spaceBetween: 14 },
                768: { slidesPerView: 3, spaceBetween: 18 },
                1100: { slidesPerView: 4, spaceBetween: 20 },
                1440: { slidesPerView: 4.4, spaceBetween: 24 },
              }}
              className="overflow-visible! max-[767px]:pr-4"
            >
              {items.map((item, index) => (
                <SwiperSlide key={loading ? `sk-${index}` : item._id || item.id} className="h-auto!">
                  {loading ? <ProductSkeletonCard /> : <ProductCard {...mapProduct(item)} />}
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-8 flex items-center gap-6 max-[767px]:mt-6 max-[767px]:pr-4">
              <div className="ap-progress flex-1">
                <span
                  style={{
                    width: `${Math.max(12, Math.round(state.progress * 100))}%`,
                  }}
                />
              </div>
              <Link
                href={viewAllHref}
                className="hidden items-center gap-1.5 text-sm font-medium text-[#611192] max-[767px]:inline-flex"
              >
                {viewAllLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductRail;
