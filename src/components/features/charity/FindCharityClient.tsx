'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BadgeCheck, HandHeart, Search, ShoppingBag, Store, X } from 'lucide-react';
import FavoriteButton from '@/components/elements/button/FavoriteButton';
import Pagination from '@/components/elements/Pagination';
import type { CharitiesListResponse, CharityRecord } from '@/lib/server-api';
import { useGetCharitiesQuery } from '@/store/api/angelpageApi';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

const COLLAGE = ['/images/charity/charity1.png', '/images/charity/charity2.png', '/images/charity/charity3.png', '/images/charity/charity4.png'];
const BANNER_FALLBACKS = ['/images/charity/charity5.png', '/images/charity/charity6.png', '/images/charity/charity2.png', '/images/charity/charity4.png'];
const PAGE_SIZE = 12;

type Charity = CharityRecord & { charityBannerImage?: string; websiteLink?: string };
type ListResponse = CharitiesListResponse & { totalCharities?: number };

const STEPS = [
  { icon: Search, title: 'Pick a charity', text: 'Search by name and open its storefront.' },
  { icon: ShoppingBag, title: 'Shop or list for it', text: 'Buy from its shop, or list your own items for it.' },
  { icon: HandHeart, title: 'Most of the sale reaches it', text: `Up to ${CHARITY_SHARE_PERCENT}% of every sale, shown on each listing.` },
];

function CharityCard({ charity, index }: { charity: Charity; index: number }) {
  const href = charity.storefrontId ? `/charity/store/${charity.storefrontId}` : `/charity/find-a-charity/${charity._id}`;
  const banner = charity.charityBannerImage || BANNER_FALLBACKS[index % BANNER_FALLBACKS.length];
  const initial = (charity.charityName || 'C').charAt(0).toUpperCase();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,5,92,0.10)]">
      <div className="relative aspect-[16/8] overflow-hidden bg-[#F2E8F8]">
        <Image src={banner} alt="" fill sizes="(max-width: 767px) 92vw, (max-width: 1170px) 45vw, 380px" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0B0112]/40 to-transparent" aria-hidden />
        <span className="absolute top-3 right-3 z-10 rounded-full bg-white/95 shadow">
          <FavoriteButton itemId={charity._id} type="Charity" />
        </span>
      </div>
      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <span className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(11,1,18,0.12)] ring-4 ring-white">
          {charity.profileImage ? (
            <Image src={charity.profileImage} alt="" width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <span className="font-primary text-[26px] text-[#611192]">{initial}</span>
          )}
        </span>
        <h2 className="mt-3 font-primary text-[20px] leading-snug text-[#0B0112] capitalize">
          <Link href={href} className="after:absolute after:inset-0 hover:text-[#611192]">
            {charity.charityName}
          </Link>
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-[#8A888C]">
          <span className="inline-flex items-center gap-1 text-[#00775F]">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> On Angelpage
          </span>
          {charity.charityNumber ? <span>· Reg. {charity.charityNumber}</span> : null}
        </p>
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[#6B686E]">{charity.description || 'Shop pre-loved items that fund this charity’s work.'}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-[#F0EBF2] pt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#611192]">
            {charity.storefrontId ? <Store className="h-4 w-4" aria-hidden /> : null}
            {charity.storefrontId ? 'Visit storefront' : 'View charity'}
          </span>
          <ArrowUpRight className="h-4 w-4 text-[#B9B3BD] transition group-hover:text-[#611192]" aria-hidden />
          </div>
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#ECE8EE]" aria-hidden>
      <div className="aspect-[16/8] animate-pulse bg-[#F2E8F8]" />
      <div className="space-y-3 px-5 pb-5">
        <div className="-mt-8 h-16 w-16 rounded-2xl bg-[#EFEAF2] ring-4 ring-white" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-[#EFEAF2]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFEAF2]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#EFEAF2]" />
      </div>
    </div>
  );
}

type FindCharityClientProps = {
  initialData?: CharitiesListResponse | null;
};

export default function FindCharityClient({ initialData }: FindCharityClientProps) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // live search: debounce typing; 2+ characters, or empty to show all
  useEffect(() => {
    const term = input.trim();
    const id = window.setTimeout(() => {
      if (term.length === 0 || term.length >= 2) {
        setSearch(term);
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [input]);

  const { data, isFetching } = useGetCharitiesQuery({ page, limit: PAGE_SIZE, search });
  const fallback = !search && page === 1 ? (initialData as ListResponse | null) : null;
  const result = (data as ListResponse | undefined) ?? fallback ?? undefined;
  const charities = useMemo(() => (result?.charities ?? []) as Charity[], [result]);
  const totalPages = result?.totalPages ?? 0;
  const total = result?.totalCharities;
  const loading = !result && isFetching;

  const changePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    document.getElementById('charity-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#FAF8FB]">
      {/* hero */}
      <section className="custom-container pt-6 sm:px-0! sm:pt-0">
        <div className="relative isolate grid grid-cols-[1.05fr_1fr] items-center gap-10 overflow-hidden rounded-[32px] bg-[#14021F] p-10 md:grid-cols-1 md:p-8 sm:rounded-none sm:rounded-b-[28px] sm:p-5 sm:pb-7">
          <div className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[420px] w-[420px] rounded-full bg-[#611192] opacity-60 blur-[110px]" aria-hidden />
          <div>
            <p className="ap-eyebrow text-[#D9B8F0]!">Charities</p>
            <h1 className="ap-display mt-4 text-[48px] leading-[1.08] text-white! laptop-m:text-[42px] sm:text-[32px]">Find a charity to support</h1>
            <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-white/70 sm:text-[14px]">
              Every charity here has its own storefront. Shop what it sells, or list your pre-loved items for it, and most of each sale goes to its work.
            </p>
            <label className="relative mt-7 block max-w-[520px]">
              <span className="sr-only">Search charities by name</span>
              <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-[#8A888C]" aria-hidden />
              <input
                type="search"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search charities by name"
                className="h-14 w-full rounded-full bg-white pr-12 text-[15px] text-[#0B0112] shadow-[0_12px_30px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#8A888C] focus:ring-4 focus:ring-[#D9B8F0]/50 sm:h-13"
                style={{ paddingLeft: 52 }}
              />
              {input ? (
                <button type="button" onClick={() => setInput('')} aria-label="Clear search" className="absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8A888C] hover:bg-[#F4F1F6]">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </label>
            <p className="mt-4 text-[13px] text-white/60" aria-live="polite">
              {search
                ? isFetching
                  ? 'Searching…'
                  : `${total ?? charities.length} result${(total ?? charities.length) === 1 ? '' : 's'} for “${search}”`
                : typeof total === 'number'
                  ? `${total.toLocaleString()} charities on Angelpage`
                  : 'Verified charities in the USA, Canada and the UK'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:hidden" aria-hidden>
            {COLLAGE.map((src, i) => (
              <div key={src} className={`relative overflow-hidden rounded-[22px] ${i % 2 ? 'mt-8 aspect-[4/5]' : 'aspect-[4/5]'}`}>
                <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how supporting works */}
      <section className="custom-container mt-6 sm:mt-4">
        <ol className="grid grid-cols-3 gap-3 sm:grid-cols-1">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#611192] text-[10px] font-semibold text-white">{i + 1}</span>
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-[#0B0112]">{title}</span>
                <span className="block text-[13px] leading-5 text-[#6B686E]">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* results */}
      <section id="charity-results" className="custom-container scroll-mt-4 pt-10 pb-6 sm:pt-6">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="ap-display text-[28px] sm:text-[23px]">{search ? 'Search results' : 'All charities'}</h2>
          {totalPages > 1 ? (
            <span className="text-[13px] text-[#8A888C]">
              Page {page} of {totalPages}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : charities.length ? (
          <div className={`grid grid-cols-3 gap-5 transition-opacity md:grid-cols-2 sm:grid-cols-1 sm:gap-4 ${isFetching ? 'opacity-60' : ''}`}>
            {charities.map((c, i) => (
              <CharityCard key={c._id} charity={c} index={i} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-[440px] rounded-[24px] bg-white px-6 py-12 text-center ring-1 ring-[#ECE8EE]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192]">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-5 font-primary text-[22px] text-[#0B0112]">No charity matches “{search}”</p>
            <p className="mt-2 text-[14px] text-[#6B686E]">Check the spelling, or try part of the name.</p>
            <button type="button" onClick={() => setInput('')} className="mt-6 inline-flex h-11 items-center rounded-full bg-[#611192] px-6 text-[14px] font-medium text-white">
              Show all charities
            </button>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
          </div>
        ) : null}
      </section>

      {/* for charities */}
      <section className="custom-container pt-6 pb-16 sm:pb-8">
        <div className="relative isolate flex items-center justify-between gap-6 overflow-hidden rounded-[28px] bg-[#F6EEFA] p-8 ring-1 ring-[#EBDDF5] md:flex-col md:items-start sm:rounded-[22px] sm:p-5">
          <div className="max-w-[560px]">
            <p className="ap-eyebrow">For charities</p>
            <h2 className="mt-3 font-primary text-[28px] leading-tight text-[#0B0112] sm:text-[23px]">Are you a charity? Open your free storefront</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
              Sell donated and new stock, receive a share of supporters’ sales, run appeals and votes, and get paid out to your connected account.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/auth/register?type=charity" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#611192] px-6 text-[14px] font-semibold text-white transition hover:bg-[#4C0D73]">
              Register your charity <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/how-it-works" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[14px] font-medium text-[#611192] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
