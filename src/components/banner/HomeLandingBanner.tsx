'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Globe2,
  Lock,
  Pause,
  Play,
} from 'lucide-react';
import { CHARITY_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from '@/constants/brand';
import { formatMoney } from '@/lib/money';

const SLIDE_MS = 6500;

const SLIDES = [
  {
    tab: 'Choose your split',
    eyebrow: 'Giving has never been easier',
    title: `Give up to ${CHARITY_SHARE_PERCENT}% of every sale to a cause you love.`,
    body: 'Sell what you no longer need and decide how much of each sale goes to the charity you care about. Buyers see the split before they pay.',
    imageSrc: '/images/home/home-banner-modal-1.jpg',
    alt: 'Smiling woman holding a pre-loved jacket',
  },
  {
    tab: 'Verified charities',
    eyebrow: 'Charities you can trust',
    title: 'Shop pre-loved from charities we check first.',
    body: 'Every charity is reviewed before its storefront opens. Browse their shops in the United States, Canada and the United Kingdom.',
    imageSrc: '/images/home/home-banner-modal-3.jpg',
    alt: 'Volunteers sorting donated clothing',
  },
  {
    tab: 'Every sale counts',
    eyebrow: 'Your impact matters',
    title: 'Every purchase funds a better tomorrow.',
    body: 'Buy something you love, see exactly how much reaches the cause, and relax: your payment is held until the item arrives.',
    imageSrc: '/images/home/home-banner-modal-2.jpg',
    alt: 'Hands holding a wrapped gift box',
  },
];

/** Example sale shown on the floating card (uses the real fee and maximum share). */
const EXAMPLE_PRICE = 40;
const exampleCharity = (EXAMPLE_PRICE * CHARITY_SHARE_PERCENT) / 100;
const exampleFee = (EXAMPLE_PRICE * PLATFORM_FEE_PERCENT) / 100;

/**
 * Guest hero. No layout shift between slides:
 *  - all slide texts sit in one grid cell (stacked), so the copy block is
 *    always as tall as the longest slide; only opacity changes
 *  - images cross-fade inside a fixed aspect-ratio box
 * Autoplay pauses on hover, keyboard focus, hidden tab and reduced motion.
 */
const HomeLandingBanner = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduced = useRef(false);
  // market currency after mount (server renders USD, so hydration matches)
  const [money, setMoney] = useState<(n: number) => string>(
    () => (n: number) => `$${n.toFixed(2)}`
  );
  useEffect(() => setMoney(() => (n: number) => formatMoney(n)), []);

  useEffect(() => {
    reduced.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduced.current) setUserPaused(true);
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const go = useCallback((i: number) => {
    setActive((i + SLIDES.length) % SLIDES.length);
    setCycle(c => c + 1);
  }, []);

  const running = !paused && !userPaused;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => go(active + 1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [active, running, cycle, go]);

  return (
    <section
      className="banner-section bg-white pt-5 pb-4 sm:pt-3"
      aria-roledescription="carousel"
      aria-label="Angelpage highlights"
    >
      <div className="custom-container">
        <div
          className="relative isolate overflow-hidden rounded-[32px] bg-[#0B0112] sm:rounded-[24px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* soft brand glow, kept away from the text so it never bands behind words */}
          <div
            className="pointer-events-none absolute -bottom-48 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-[#611192]/35 blur-[140px]"
            aria-hidden
          />

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:grid-cols-1">
            {/* copy */}
            <div className="relative z-10 flex flex-col justify-between gap-8 py-12 pr-4 pl-12 laptop-m:py-10 laptop-m:pl-10 md:order-2 md:p-8 sm:gap-6 sm:p-5">
              <div className="grid" aria-live="polite">
                {SLIDES.map((s, i) => {
                  const on = i === active;
                  return (
                    <div
                      key={s.tab}
                      aria-hidden={!on}
                      className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${on ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
                    >
                      <p className="ap-eyebrow text-[#D9B8EE]!">{s.eyebrow}</p>
                      {/* one real H1 (first slide); the others are visual headings */}
                      {i === 0 ? (
                        <h1 className="ap-display mt-5 max-w-[520px] text-[46px] leading-[1.12] text-balance text-white! laptop-x:text-[42px] laptop-m:text-[38px] lg:text-[34px] sm:mt-3 sm:text-[28px]">
                          {s.title}
                        </h1>
                      ) : (
                        <p className="ap-display mt-5 max-w-[520px] text-[46px] leading-[1.12] text-balance text-white! laptop-x:text-[42px] laptop-m:text-[38px] lg:text-[34px] sm:mt-3 sm:text-[28px]">
                          {s.title}
                        </p>
                      )}
                      <p className="mt-5 max-w-[460px] text-[15px] leading-7 text-pretty text-white/80! sm:mt-3 sm:text-[14px] sm:leading-6">
                        {s.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/auth/register?intent=sell"
                    className="inline-flex h-[50px] items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-[#611192] transition hover:bg-[#F2E8F8] sm:h-12 sm:px-6"
                  >
                    Start selling <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/product"
                    className="inline-flex h-[50px] items-center rounded-full px-7 text-[15px] font-medium text-white ring-1 ring-white/35 transition hover:bg-white/10 sm:h-12 sm:px-6"
                  >
                    Shop to give
                  </Link>
                </div>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-white/80 sm:mt-5">
                  <li className="inline-flex items-center gap-1.5">
                    <BadgeCheck
                      className="h-4 w-4 text-[#7FE0C5]"
                      aria-hidden
                    />{' '}
                    Verified charities
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-[#D9B8EE]" aria-hidden />{' '}
                    Payment held until delivery
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <Globe2 className="h-4 w-4 text-[#D9B8EE]" aria-hidden />{' '}
                    USA · Canada · UK
                  </li>
                </ul>

                {/* story tabs with progress */}
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 sm:mt-6">
                  <div
                    className="grid flex-1 grid-cols-3 gap-2"
                    role="tablist"
                    aria-label="Choose a highlight"
                  >
                    {SLIDES.map((s, i) => {
                      const on = i === active;
                      return (
                        <button
                          key={s.tab}
                          type="button"
                          role="tab"
                          aria-selected={on}
                          onClick={() => go(i)}
                          className={`group min-w-0 text-left text-[12px] font-medium transition ${on ? 'text-white' : 'text-white/60 hover:text-white'}`}
                        >
                          <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/15">
                            {on ? (
                              <span
                                key={`${cycle}-${running}`}
                                className="absolute inset-y-0 left-0 rounded-full bg-white"
                                style={
                                  running
                                    ? {
                                        animation: `ap-hero-progress ${SLIDE_MS}ms linear forwards`,
                                      }
                                    : { width: '100%' }
                                }
                              />
                            ) : null}
                          </span>
                          <span className="mt-2 block truncate sm:hidden">
                            {s.tab}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => go(active - 1)}
                      aria-label="Previous highlight"
                      className="ap-arrow ap-arrow--dark h-9! w-9! sm:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(active + 1)}
                      aria-label="Next highlight"
                      className="ap-arrow ap-arrow--dark h-9! w-9! sm:hidden"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPaused(p => !p)}
                      aria-label={
                        userPaused ? 'Play slideshow' : 'Pause slideshow'
                      }
                      className="ap-arrow ap-arrow--dark h-9! w-9!"
                    >
                      {userPaused ? (
                        <Play className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Pause className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* imagery: fixed box, cross-fade only */}
            {/* the photo fades into the panel with a mask, not a black overlay: no seam, no band over the words */}
            <div className="relative min-h-[560px] [mask-image:linear-gradient(to_right,transparent_0%,#000_22%)] laptop-m:min-h-[520px] md:order-1 md:aspect-[16/9] md:min-h-0 md:[mask-image:linear-gradient(to_top,transparent_0%,#000_28%)] sm:aspect-[4/3]">
              {SLIDES.map((s, i) => (
                <div
                  key={s.imageSrc}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === active ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={i !== active}
                >
                  <Image
                    src={s.imageSrc}
                    alt={s.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 991px) 100vw, 55vw"
                    className={`object-cover transition-transform duration-[7000ms] ease-out ${i === active && running ? 'scale-[1.06]' : 'scale-100'}`}
                  />
                </div>
              ))}

              {/* example split card */}
              <div className="absolute right-6 bottom-6 w-[290px] rounded-[22px] bg-white/95 p-5 shadow-[0_24px_60px_rgba(11,1,18,0.3)] backdrop-blur md:hidden">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                  Example: a {money(EXAMPLE_PRICE).replace(/\.00$/, '')} sale
                </p>
                <div
                  className="mt-3 flex h-2.5 overflow-hidden rounded-full"
                  aria-hidden
                >
                  <span
                    className="bg-[#C2771A]"
                    style={{ width: `${PLATFORM_FEE_PERCENT}%` }}
                  />
                  <span className="ml-[2px] flex-1 bg-[#8A3FC7]" />
                </div>
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-2 text-[#474648]">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px] bg-[#8A3FC7]"
                        aria-hidden
                      />
                      To charity (up to)
                    </dt>
                    <dd className="font-semibold text-[#0B0112]">
                      {money(exampleCharity)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-2 text-[#474648]">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px] bg-[#C2771A]"
                        aria-hidden
                      />
                      Platform fee
                    </dt>
                    <dd className="text-[#474648]">{money(exampleFee)}</dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-[#ECE8EE] pt-3 text-[11px] leading-snug text-[#6B686E]">
                  Sellers can keep part of the sale; the split is shown on every
                  listing.
                </p>
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
