'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  HandHeart,
  HeartHandshake,
  type LucideIcon,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import SectionHeading from '../common/product-slider/SectionHeading';
import { calculateProfitSplit } from '@/lib/profitSplit';
import { formatMoney } from '@/lib/money';
import { CHARITY_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from '@/constants/brand';

type Side = {
  step: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  href: string;
  cta: string;
  steps: { icon: LucideIcon; title: string; text: string }[];
};

const SIDES: Side[] = [
  {
    step: '01',
    eyebrow: 'For sellers',
    title: 'Where sellers are donors',
    body: 'List your pre-loved items on the storefront of the charity you choose, and decide how much of each sale goes to the cause.',
    image: '/images/home/how-it-works-modal-img1.jpeg',
    href: '/how-it-works',
    cta: 'How selling works',
    steps: [
      { icon: Camera, title: 'List in minutes', text: 'A few photos, a price and a short description.' },
      { icon: HandHeart, title: 'Pick a charity and split', text: `Give up to ${CHARITY_SHARE_PERCENT}%, or keep part of the sale.` },
      { icon: Truck, title: 'Ship and get paid', text: 'Funds are released once the buyer has the item.' },
    ],
  },
  {
    step: '02',
    eyebrow: 'For buyers',
    title: '…and buyers are givers',
    body: 'Shop pre-loved finds from people and charity shops. Every listing shows exactly how much of the price reaches the cause.',
    image: '/images/home/how-it-works-modal-img2.jpeg',
    href: '/product',
    cta: 'Start shopping',
    steps: [
      { icon: Search, title: 'Find something you love', text: 'Fashion, homeware, books, electronics and more.' },
      { icon: HeartHandshake, title: 'See where the money goes', text: 'The charity share is on every product.' },
      { icon: ShieldCheck, title: 'Pay safely', text: 'Your payment is held until the order is delivered.' },
    ],
  },
];

function SideCard({ side, mirrored = false }: { side: Side; mirrored?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] bg-[#0B0112] text-white transition duration-300 hover:shadow-[0_28px_60px_rgba(59,5,92,0.22)] sm:rounded-[22px]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={side.image} alt="" fill sizes="(max-width: 1170px) 50vw, 33vw" className={`object-cover transition duration-700 group-hover:scale-105 ${mirrored ? 'object-right' : 'object-left'}`} />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0B0112] via-[#0B0112]/20 to-transparent" aria-hidden />
        <span className="absolute top-4 left-4 inline-flex h-8 items-center gap-2 rounded-full bg-white/15 px-3 text-[12px] font-semibold text-white backdrop-blur-md">
          <span className="font-primary text-[15px] leading-none">{side.step}</span>
          <span className="h-3 w-px bg-white/30" aria-hidden />
          {side.eyebrow}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7 pt-2 laptop-m:p-6 laptop-m:pt-2 sm:p-5 sm:pt-1">
        <h3 className="font-primary text-[28px] leading-tight text-white! sm:text-[23px]">{side.title}</h3>
        <p className="mt-2.5 text-[14px] leading-6 text-white/70!">{side.body}</p>
        <ol className="mt-6 space-y-3.5">
          {side.steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3.5">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#D9B8EE] ring-1 ring-white/10">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#611192] text-[10px] font-semibold text-white">{i + 1}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{title}</span>
                <span className="block text-[13px] leading-5 text-white/60">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-auto pt-7">
          <Link href={side.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition hover:bg-[#F2E8F8]">
            {side.cta} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

const EXAMPLE_PRICE = 40;

/** Centre panel: the shared outcome, with a live split for an example sale. */
function SharedOutcome() {
  const [sellerKeeps, setSellerKeeps] = useState(0);
  const [money, setMoney] = useState<(n: number) => string>(() => (n: number) => `$${n.toFixed(2)}`);
  useEffect(() => setMoney(() => (n: number) => formatMoney(n)), []);
  const split = calculateProfitSplit(EXAMPLE_PRICE, sellerKeeps);

  return (
    <div className="flex h-full flex-col rounded-[28px] bg-[#F6EEFA] p-7 ring-1 ring-[#EBDDF5] laptop-m:p-6 sm:rounded-[22px] sm:p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#611192] shadow-sm">
        <HeartHandshake className="h-6 w-6" aria-hidden />
      </span>
      <p className="ap-eyebrow mt-5">One shared outcome</p>
      <h3 className="mt-2 font-primary text-[26px] leading-tight text-[#0B0112]">More money for the causes people care about</h3>
      <p className="mt-2 text-[13px] leading-5 text-[#6B686E]">Try it: on a {money(EXAMPLE_PRICE).replace(/\.00$/, '')} sale, move the slider to choose how much the seller keeps.</p>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(59,5,92,0.06)]">
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
          <span className="bg-[#C2771A] transition-all duration-300" style={{ width: `${PLATFORM_FEE_PERCENT}%` }} />
          {split.sellerProfit > 0 ? <span className="ml-[2px] bg-[#00977A] transition-all duration-300" style={{ width: `${(split.sellerProfit / EXAMPLE_PRICE) * 100}%` }} /> : null}
          <span className="ml-[2px] flex-1 bg-[#8A3FC7] transition-all duration-300" />
        </div>
        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-center justify-between font-semibold text-[#0B0112]">
            <dt className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#8A3FC7]" aria-hidden />
              Charity
            </dt>
            <dd className="font-primary text-[20px] font-normal">{money(split.charityProfit)}</dd>
          </div>
          <div className="flex items-center justify-between text-[#474648]">
            <dt className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#00977A]" aria-hidden />
              Seller keeps
            </dt>
            <dd>{money(split.sellerProfit)}</dd>
          </div>
          <div className="flex items-center justify-between text-[#474648]">
            <dt className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#C2771A]" aria-hidden />
              Platform fee ({PLATFORM_FEE_PERCENT}%)
            </dt>
            <dd>{money(split.platformFee)}</dd>
          </div>
        </dl>
        <label className="mt-4 block">
          <span className="flex items-center justify-between text-[12px] font-medium text-[#474648]">
            Seller keeps <span className="text-[#611192]">{sellerKeeps}% of the rest</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={sellerKeeps}
            onChange={e => setSellerKeeps(Number(e.target.value))}
            className="ap-range mt-2 w-full accent-[#611192]"
            aria-valuetext={`Seller keeps ${sellerKeeps}%, charity receives ${money(split.charityProfit)}`}
          />
        </label>
      </div>

      <ul className="mt-auto space-y-2 pt-5 text-[13px] text-[#474648]">
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-[#00977A]" aria-hidden /> Charities are verified before they can sell
        </li>
        <li className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-[#611192]" aria-hidden /> The split is shown on every listing
        </li>
      </ul>
    </div>
  );
}

/**
 * Home "How it works": the two sides of a sale (sellers and buyers) around
 * the outcome they share. Desktop: seller · outcome · buyer. Tablet: the two
 * cards side by side with the outcome below. Phone: a single column.
 */
const HowItWorkSection = () => (
  <section className="how-it-works-section ap-section bg-white">
    <div className="custom-container">
      <SectionHeading
        eyebrow="How it works"
        title="A marketplace where every sale gives"
        description="Two simple sides, one shared outcome: more money for the causes people care about."
        className="mb-10 max-[767px]:mb-6"
      />
      <div className="grid grid-cols-[1fr_minmax(300px,0.82fr)_1fr] items-stretch gap-5 lg:grid-cols-2 sm:grid-cols-1 sm:gap-4">
        <SideCard side={SIDES[0]} />
        <div className="lg:col-span-2 lg:row-start-2 sm:col-span-1 sm:row-start-auto">
          <SharedOutcome />
        </div>
        <SideCard side={SIDES[1]} mirrored />
      </div>
      <p className="mt-6 text-center text-[13px] text-[#8A888C]">
        Want the detail?{' '}
        <Link href="/how-it-works" className="font-medium text-[#611192] underline underline-offset-4">
          Read the full guide to selling, buying and payouts
        </Link>
      </p>
    </div>
  </section>
);

export default HowItWorkSection;
