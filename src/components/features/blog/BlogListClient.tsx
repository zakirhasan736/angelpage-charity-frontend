'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Search, X } from 'lucide-react';
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
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition ${
                    active ? 'bg-[#0B0112] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'
                  }`}
                >
                  {key === 'all' ? 'All Stories' : TOPIC_LABEL[key] || tagLabel(key)}
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
              className="h-10 w-full rounded-full bg-white pr-10 pl-10 text-[14px] text-[#0B0112] ring-1 ring-[#ECE8EE] outline-none placeholder:text-[#8A888C] focus:ring-2 focus:ring-[#611192]/30"
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
              {browsing ? <span className="text-[13px] text-[#8A888C]">{rest.filter(Boolean).length} more</span> : null}
            </div>
            <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1 sm:gap-4">
              {rest.filter(Boolean).map(b => (
                <div key={b!.id}>
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

        {/* closing cards */}
        <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-1 sm:mt-10">
          <section className="relative isolate overflow-hidden rounded-[24px] bg-[#14021F] p-7 text-white sm:p-5">
            <div className="pointer-events-none absolute -right-16 -bottom-24 -z-10 h-64 w-64 rounded-full bg-[#611192] opacity-60 blur-3xl" />
            <Mail className="h-6 w-6 text-[#D9B8F0]" aria-hidden />
            <h2 className="mt-4 font-primary text-[24px] text-white">New stories, straight to your inbox</h2>
            <p className="mt-2 text-[14px] text-white/65">Sign up at the bottom of any page for impact updates and tips.</p>
            <button
              type="button"
              onClick={() => document.querySelector('footer input[type="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0B0112]"
            >
              Go to sign-up <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </section>
          <section className="rounded-[24px] bg-[#FBF4FE] p-7 sm:p-5">
            <p className="ap-eyebrow">For charities</p>
            <h2 className="mt-3 font-primary text-[24px] text-[#0B0112]">Have a story to share?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
              Charities with blogging access can write posts from the Community tab of their dashboard. Our team reviews every post before it goes live.
            </p>
            <Link href="/contact" className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#611192] px-4 text-[13px] font-semibold text-white transition hover:bg-[#4C0D73]">
              Get in touch <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
