'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PenLine, Search, X } from 'lucide-react';
import { BlogCard, BlogFeatureCard, tagLabel } from '@/components/common/cards/blog/blogCards';
import { mapBlogToCard, type BlogPostRecord } from '@/lib/server-api';
import { blogPosts as staticPosts } from '@/libs/blogs';
import { useGetBlogPostsQuery } from '@/store/api/angelpageApi';

type BlogListClientProps = {
  initialPosts?: BlogPostRecord[];
};

const TOPIC_ORDER = ['guides', 'stories', 'news'];
const TOPIC_LABEL: Record<string, string> = { guides: 'Guides', stories: 'Stories', news: 'News' };

export default function BlogListClient({ initialPosts = [] }: BlogListClientProps) {
  const { data: posts } = useGetBlogPostsQuery({});
  const resolved = (posts ?? initialPosts) as BlogPostRecord[];
  const source = resolved.length > 0 ? resolved : staticPosts;

  const [topic, setTopic] = useState<string>('all');
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () =>
      [...source].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      }),
    [source],
  );

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    sorted.forEach(p => {
      const k = (p.category || 'stories').toLowerCase();
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => {
      const ia = TOPIC_ORDER.indexOf(a[0]);
      const ib = TOPIC_ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [sorted]);

  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(p => {
    if (topic !== 'all' && (p.category || 'stories').toLowerCase() !== topic) return false;
    if (!q) return true;
    return [p.title, p.excerpt, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q);
  });
  const browsing = topic === 'all' && !q;
  const cards = filtered.map(mapBlogToCard);
  const [lead, ...rest] = browsing ? cards : [undefined, ...cards];

  return (
    <div className="bg-white">
      {/* banner (kept as approved) */}
      <div className="bg-[#FCF2FF]">
        <div className="custom-container py-16 sm:py-10">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#611192] uppercase">Journal</p>
          <h1 className="mt-3 font-primary text-[48px] leading-none text-[#0B0112] sm:text-[34px]">Blog</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3B055C]">
            Stories, guides, and news from Angelpage. See how shopping here supports charities in the United States, Canada, and the United
            Kingdom. We started in the USA.
          </p>
        </div>
      </div>

      {/* topic bar */}
      <div className="sticky top-0 z-30 border-b border-[#F0EBF2] bg-white/95 backdrop-blur-md">
        <div className="custom-container flex items-center justify-between gap-4 py-3 sm:flex-col sm:items-stretch sm:gap-2.5">
          <div className="ap-no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Topics">
            {[['all', sorted.length] as [string, number], ...topics].map(([key, count]) => {
              const active = topic === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTopic(key)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition ${
                    active ? 'bg-[#611192] text-white' : 'bg-[#F6F3F7] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'
                  }`}
                >
                  {key === 'all' ? 'All stories' : TOPIC_LABEL[key] || tagLabel(key)}
                  <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-white text-[#8A888C]'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <label className="relative w-[280px] shrink-0 sm:w-full">
            <span className="sr-only">Search stories</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stories"
              className="h-10 w-full rounded-full bg-[#F6F3F7] pr-10 pl-10 text-[14px] text-[#0B0112] outline-none placeholder:text-[#8A888C] focus:bg-white focus:ring-2 focus:ring-[#611192]/30"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8A888C]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </label>
        </div>
      </div>

      <div className="custom-container py-12 sm:py-6">
        {lead ? (
          <div className="mb-14 sm:mb-8">
            <BlogFeatureCard blog={lead} />
          </div>
        ) : null}

        {rest.filter(Boolean).length > 0 ? (
          <>
            <div className="mb-6 flex items-baseline justify-between sm:mb-4">
              <h2 className="ap-display text-[28px] sm:text-[22px]">{browsing ? 'Latest stories' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}</h2>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-12 md:grid-cols-2 sm:grid-cols-1 sm:gap-y-0 sm:divide-y sm:divide-[#F0EBF2]">
              {rest.filter(Boolean).map(b => (
                <div key={b!.id} className="sm:py-4">
                  <BlogCard blog={b!} />
                </div>
              ))}
            </div>
          </>
        ) : !lead ? (
          <div className="rounded-[24px] bg-[#FCF7FE] px-6 py-14 text-center">
            <p className="font-primary text-[24px] text-[#0B0112]">No stories match</p>
            <p className="mt-2 text-[14px] text-[#6B686E]">Try another word or topic.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setTopic('all');
              }}
              className="mt-5 inline-flex h-10 items-center rounded-full bg-[#611192] px-5 text-[14px] font-medium text-white"
            >
              Show all stories
            </button>
          </div>
        ) : null}

        {/* contribute */}
        <section className="mt-20 grid grid-cols-[auto_1fr_auto] items-center gap-6 rounded-[28px] border border-[#ECE8EE] p-8 md:grid-cols-[auto_1fr] sm:mt-12 sm:grid-cols-1 sm:p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192]">
            <PenLine className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-primary text-[24px] text-[#0B0112] sm:text-[20px]">Have a story to share?</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6B686E]">
              Charities can post updates from the Community tab in their dashboard. Tell supporters what their purchases made possible.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center gap-2 justify-self-end rounded-full bg-[#611192] px-5 text-[14px] font-medium text-white transition hover:bg-[#4C0D73] md:col-span-2 md:justify-self-start sm:col-span-1"
          >
            Get in touch <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  );
}
