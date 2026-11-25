'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { Autoplay, EffectFade, A11y } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
  LayoutDashboard,
  PlusCircle,
  Search,
} from 'lucide-react';
import { getAccountPathForRole } from '@/utils/navigationPaths';

const features = [
  {
    eyebrow: 'This week on Angelpage',
    title: 'New-season finds, chosen for good causes',
    cta: 'Shop new in',
    href: '/product',
    image: '/images/home/home-banner-modal-1.jpg',
  },
  {
    eyebrow: 'Clear out, give back',
    title: 'List an item in minutes and pick your charity split',
    cta: 'Sell an item',
    href: '/product/post-product',
    image: '/images/home/home-banner-modal-3.jpg',
  },
  {
    eyebrow: 'Events & appeals',
    title: 'Join a live session or support an appeal',
    cta: 'See events',
    href: '/events',
    image: '/images/home/home-banner-modal-2.jpg',
  },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const HomeMemberBanner = () => {
  const { data: session } = useSession() || {};
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const user = session?.user as
    | { id?: string; name?: string; role?: string; charityId?: string }
    | undefined;
  const firstName = (user?.name || '').split(' ')[0];
  const accountPath = getAccountPathForRole(user?.role, user?.id, user?.charityId);

  const actions = [
    { label: 'Sell an item', href: '/product/post-product', icon: PlusCircle, primary: true },
    { label: 'Browse all', href: '/product', icon: Search },
    { label: 'Favourites', href: '/favourite', icon: Heart },
    { label: 'My dashboard', href: accountPath, icon: LayoutDashboard },
  ];

  return (
    <section className="banner-section bg-white pt-6 pb-4 max-[767px]:pt-3">
      <div className="custom-container">
        <div className="grid grid-cols-12 gap-5 max-[991px]:grid-cols-1">
          {/* welcome panel */}
          <div className="relative col-span-5 flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#FCF2FF] p-9 max-[1280px]:p-7 max-[991px]:col-span-full max-[767px]:rounded-[22px] max-[767px]:p-5">
            <div
              className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#E4D0F0] blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <p className="ap-eyebrow">{greeting()}</p>
              <h1 className="ap-display mt-4 text-[44px] max-[1280px]:text-[36px] max-[767px]:text-[28px]">
                {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
              </h1>
              <p className="mt-3 max-w-[380px] text-[15px] leading-7 text-[#5C5560] max-[767px]:text-sm max-[767px]:leading-6">
                Pick up where you left off. Every item you buy or sell sends money to a charity.
              </p>
            </div>

            <div className="relative mt-8 grid grid-cols-2 gap-3 max-[767px]:mt-5 max-[767px]:gap-2">
              {actions.map(({ label, href, icon: Icon, primary }) => (
                <Link
                  key={label}
                  href={href}
                  className={`group flex items-center justify-between gap-2 rounded-2xl px-4 py-4 text-sm font-medium transition duration-300 max-[767px]:px-3 max-[767px]:py-3 max-[767px]:text-[13px] ${
                    primary
                      ? 'bg-[#611192] text-white! shadow-[0_10px_24px_rgba(97,17,146,0.28)] hover:bg-[#3B055C]'
                      : 'bg-white text-[#0B0112]! ring-1 ring-[#ECE8EE] hover:ring-[#611192]/40 hover:shadow-[0_10px_24px_rgba(59,5,92,0.08)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-[18px] w-[18px] ${primary ? 'text-white' : 'text-[#611192]'}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {label}
                  </span>
                  <ArrowUpRight
                    className={`h-4 w-4 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 max-[767px]:hidden ${
                      primary ? 'text-white' : 'text-[#611192]'
                    }`}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* featured slider */}
          <div className="relative col-span-7 min-h-[440px] overflow-hidden rounded-[28px] bg-[#0B0112] max-[991px]:col-span-full max-[991px]:min-h-[320px] max-[767px]:min-h-[260px] max-[767px]:rounded-[22px]">
            <Swiper
              modules={[Autoplay, EffectFade, A11y]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              loop
              speed={800}
              autoplay={{ delay: 5500, disableOnInteraction: false }}
              onSwiper={setSwiper}
              onSlideChange={s => setActive(s.realIndex)}
              className="absolute! inset-0 h-full w-full"
            >
              {features.map((f, i) => (
                <SwiperSlide key={f.title} className="h-full!">
                  <div className="relative h-full w-full">
                    <Image
                      src={f.image}
                      alt=""
                      fill
                      priority={i === 0}
                      sizes="(max-width: 991px) 100vw, 60vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/90 via-[#0B0112]/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-9 pb-24 max-[767px]:p-5 max-[767px]:pb-20">
                      <p className="ap-eyebrow text-[#E4D0F0]!">{f.eyebrow}</p>
                      <h2 className="ap-display mt-3 max-w-[520px] text-[34px] text-white! max-[767px]:text-[22px]">
                        {f.title}
                      </h2>
                      <Link
                        href={f.href}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#611192]! transition hover:bg-[#F2E8F8]"
                      >
                        {f.cta}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="absolute inset-x-9 bottom-7 z-10 flex items-center justify-between max-[767px]:inset-x-5 max-[767px]:bottom-5">
              <div className="flex items-center gap-1.5">
                {features.map((f, i) => (
                  <button
                    key={f.title}
                    type="button"
                    onClick={() => swiper?.slideToLoop(i)}
                    aria-label={`Show feature ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      active === i ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="ap-arrow ap-arrow--dark h-10! w-10!"
                  onClick={() => swiper?.slidePrev()}
                  aria-label="Previous feature"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="ap-arrow ap-arrow--dark h-10! w-10!"
                  onClick={() => swiper?.slideNext()}
                  aria-label="Next feature"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeMemberBanner;
