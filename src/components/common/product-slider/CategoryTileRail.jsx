'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { RailArrows, useRailState } from './ProductRail';

/**
 * Rail of sub-category tiles (Homeware, Electronics) with soft product shots.
 * @param {{ eyebrow?: string, title: string, description?: string,
 *   tiles?: Array<{ title: string, image: string, href: string }>,
 *   viewAllHref?: string, className?: string }} props
 */
const CategoryTileRail = ({
  eyebrow,
  title,
  description,
  tiles = [],
  viewAllHref,
  className = 'bg-[#FAF8FB]',
}) => {
  const { swiper, setSwiper, state, sync } = useRailState();

  return (
    <section className={`ap-section overflow-hidden ${className}`}>
      <div className="custom-container">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            <>
              {viewAllHref ? (
                <Link
                  href={viewAllHref}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-[#611192] transition hover:bg-[#FCF2FF] max-[767px]:hidden"
                >
                  Shop the edit
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
              <div className="max-[767px]:hidden">
                <RailArrows swiper={swiper} state={state} label={title} />
              </div>
            </>
          }
        />
        <div className="mt-9 max-[767px]:mt-6 max-[767px]:-mr-4">
          <Swiper
            modules={[A11y, Keyboard]}
            onSwiper={s => {
              setSwiper(s);
              sync(s);
            }}
            onSlideChange={sync}
            onProgress={sync}
            onResize={sync}
            keyboard={{ enabled: true, onlyInViewport: true }}
            spaceBetween={14}
            slidesPerView={2.2}
            breakpoints={{
              768: { slidesPerView: 3.2, spaceBetween: 18 },
              1100: { slidesPerView: 5, spaceBetween: 20 },
            }}
            className="overflow-visible! max-[767px]:pr-4"
          >
            {tiles.map(tile => (
              <SwiperSlide key={tile.href} className="h-auto!">
                <Link
                  href={tile.href}
                  className="group block h-full rounded-[24px] bg-white p-3 ring-1 ring-[#ECE8EE] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(59,5,92,0.12)] hover:ring-[#DCD5E0]"
                >
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-b from-[#FCF2FF] to-[#F2E8F8]">
                    <Image
                      src={tile.image}
                      alt={tile.title}
                      width={180}
                      height={180}
                      className="h-auto w-[62%] object-contain drop-shadow-[0_18px_24px_rgba(59,5,92,0.18)] transition duration-500 group-hover:scale-[1.06]"
                    />
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-[#611192] opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-4 pb-2">
                    <p className="font-primary text-[18px] text-[#0B0112]">{tile.title}</p>
                    <span className="text-xs font-medium text-[#611192] opacity-0 transition group-hover:opacity-100">
                      Shop
                    </span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default CategoryTileRail;
