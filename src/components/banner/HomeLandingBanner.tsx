'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { EffectFade, Autoplay, A11y } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import { ArrowLeft, ArrowRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/elements';

const SLIDE_DELAY = 6000;

const slides = [
  {
    eyebrow: 'Giving has never been easier',
    title: 'You choose the split. Give 100% or share the sale.',
    body: 'Sell what you no longer need and decide how much of every sale goes to the charity you care about.',
    imageSrc: '/images/home/home-banner-modal-1.jpg',
    alt: 'Smiling woman holding a pre-loved jacket',
    stat: { value: 'Up to 100%', label: 'of each sale to charity' },
  },
  {
    eyebrow: 'Join the movement',
    title: 'Together, we can make a real difference.',
    body: 'A marketplace built around verified charities in the United States, Canada and the United Kingdom.',
    imageSrc: '/images/home/home-banner-modal-3.jpg',
    alt: 'Volunteers sorting donated clothing',
    stat: { value: '3 markets', label: 'USA, Canada & UK' },
  },
  {
    eyebrow: 'Your impact matters',
    title: 'Every purchase counts toward a better tomorrow.',
    body: 'Buy pre-loved, see exactly how much reaches the cause, and follow the impact you help create.',
    imageSrc: '/images/home/home-banner-modal-2.jpg',
    alt: 'Hands holding a gift box',
    stat: { value: 'Pre-loved', label: 'good for people and planet' },
  },
];

const HomeLandingBanner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setCycle(c => c + 1);
  }, [activeIndex]);

  const slide = slides[activeIndex];

  return (
    <section className="banner-section bg-white pt-5 pb-4 max-[767px]:pt-3">
      <div className="custom-container">
        <div className="relative overflow-hidden rounded-[32px] bg-[#0B0112] max-[767px]:rounded-[24px]">
          {/* soft brand glow */}
          <div
            className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#611192]/45 blur-[120px]"
            aria-hidden
          />
          <div className="relative grid grid-cols-12 items-stretch max-[991px]:grid-cols-1">
            {/* copy */}
            <div className="col-span-5 flex flex-col justify-between gap-10 p-12 max-[1280px]:p-10 max-[991px]:order-2 max-[991px]:col-span-full max-[767px]:gap-6 max-[767px]:p-6">
              <div key={`copy-${activeIndex}`} className="ap-mega-enter">
                <p className="ap-eyebrow text-[#D9B8EE]!">{slide.eyebrow}</p>
                <h1 className="ap-display mt-5 text-[52px] text-white! max-[1440px]:text-[44px] max-[1280px]:text-[38px] max-[767px]:mt-3 max-[767px]:text-[28px]">
                  {slide.title}
                </h1>
                <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-white/70! max-[767px]:mt-3 max-[767px]:text-sm max-[767px]:leading-6">
                  {slide.body}
                </p>
                <div className="mt-8 flex flex-wrap gap-3 max-[767px]:mt-5">
                  <Link href="/auth/register?intent=sell">
                    <Button variant="primary" className="h-[50px]! px-7! bg-white! border-white! text-[#611192]! [-webkit-text-fill-color:#611192]! hover:bg-[#F2E8F8]!">
                      Start selling
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                  <Link href="/product">
                    <Button
                      variant="secondary"
                      className="h-[50px]! px-7! bg-transparent! border-white/35! text-white! [-webkit-text-fill-color:#fff]! hover:bg-white/10!"
                    >
                      Shop to give
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 max-[767px]:flex-col max-[767px]:items-start">
                <div className="flex flex-1 items-center gap-2" role="tablist" aria-label="Banner slides">
                  {slides.map((s, idx) => (
                    <button
                      key={s.title}
                      type="button"
                      role="tab"
                      aria-selected={activeIndex === idx}
                      aria-label={`Show slide ${idx + 1}`}
                      onClick={() => swiper?.slideToLoop(idx)}
                      className="relative h-1 flex-1 max-w-[64px] overflow-hidden rounded-full bg-white/20"
                    >
                      {activeIndex === idx && (
                        <span
                          key={cycle}
                          className="absolute inset-y-0 left-0 rounded-full bg-white"
                          style={{ animation: `ap-hero-progress ${SLIDE_DELAY}ms linear forwards` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-[767px]:hidden">
                  <button
                    type="button"
                    className="ap-arrow ap-arrow--dark"
                    onClick={() => swiper?.slidePrev()}
                    aria-label="Previous slide"
                  >
                    <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="ap-arrow ap-arrow--dark"
                    onClick={() => swiper?.slideNext()}
                    aria-label="Next slide"
                  >
                    <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            {/* imagery */}
            <div className="relative col-span-7 min-h-[520px] max-[1280px]:min-h-[460px] max-[991px]:order-1 max-[991px]:col-span-full max-[991px]:min-h-[300px] max-[767px]:min-h-[220px]">
              <Swiper
                modules={[EffectFade, Autoplay, A11y]}
                slidesPerView={1}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop
                speed={900}
                onSlideChange={s => setActiveIndex(s.realIndex)}
                autoplay={{
                  delay: SLIDE_DELAY,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                }}
                onSwiper={setSwiper}
                className="absolute! inset-0 h-full w-full"
              >
                {slides.map((s, index) => (
                  <SwiperSlide key={s.imageSrc} className="h-full!">
                    <div className="relative h-full w-full">
                      <Image
                        className="object-cover"
                        fill
                        priority={index === 0}
                        sizes="(max-width: 991px) 100vw, 60vw"
                        src={s.imageSrc}
                        alt={s.alt}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0112] via-[#0B0112]/10 to-transparent max-[991px]:bg-gradient-to-t max-[991px]:from-[#0B0112] max-[991px]:via-[#0B0112]/10" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* floating impact card */}
              <div className="absolute right-6 bottom-6 z-10 w-[260px] rounded-[20px] bg-white/95 p-5 shadow-[0_24px_60px_rgba(11,1,18,0.3)] backdrop-blur max-[991px]:hidden">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E8F8] text-[#611192]">
                    <HeartHandshake className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p key={slide.stat.value} className="ap-mega-enter font-primary text-[22px] leading-none text-[#0B0112]">
                      {slide.stat.value}
                    </p>
                    <p className="mt-1 text-xs text-[#6B686E]">{slide.stat.label}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-[#ECE8EE] pt-3 text-[11px] text-[#474648]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1FC430]" aria-hidden />
                  Verified charities only
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes ap-hero-progress { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
};

export default HomeLandingBanner;
