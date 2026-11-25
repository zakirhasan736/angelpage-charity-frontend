'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Link as LinkIcon, ListOrdered, Share2 } from 'lucide-react';
import { FacebookIcon, LinkedinIcon, TwitterIcon } from '@/icons';
import { Button } from '@/components/elements';
import { BlogCard, TOPIC_LABEL, formatBlogDate } from '@/components/common/cards/blog/blogCards';
import { blogPosts as staticPosts } from '@/libs/blogs';
import { sanitizeHtml } from '@/lib/sanitize';
import { mapBlogToCard, readingMinutes, type BlogPostRecord } from '@/lib/server-api';
import { useGetBlogBySlugQuery, useGetBlogPostsQuery } from '@/store/api/angelpageApi';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';

type BlogDetailClientProps = {
  slug: string;
  initialPost?: BlogPostRecord | null;
};

type Heading = { id: string; text: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/** Gives every h2 an id and returns the list for the contents panel. */
function withHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let id = slugify(text) || `section-${headings.length + 1}`;
    while (used.has(id)) id = `${id}-x`;
    used.add(id);
    headings.push({ id, text });
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, '');
    return `<h2 id="${id}"${cleanAttrs}>${inner}</h2>`;
  });
  return { html: out, headings };
}

export default function BlogDetailClient({ slug, initialPost }: BlogDetailClientProps) {
  const { data: fetchedPost, isLoading } = useGetBlogBySlugQuery(slug, { skip: !slug });
  const staticMatch = staticPosts.find(p => p.slug === slug || p._id === slug);
  const post = (fetchedPost as BlogPostRecord | undefined) ?? initialPost ?? staticMatch ?? null;

  if (isLoading && !post) return <FullScreenLoader label="Loading article" />;

  if (!post) {
    return (
      <section className="custom-container py-24 text-center sm:py-16">
        <h1 className="font-primary text-[40px] text-[#0B0112]">Blog post not found</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-[#6B686E]">This article may have been removed or is still under review.</p>
        <Link href="/blog" className="mt-6 inline-block">
          <Button variant="primary">Back to blog</Button>
        </Link>
      </section>
    );
  }

  return <BlogArticle post={post} slug={post.slug || slug} />;
}

function BlogArticle({ post, slug }: { post: BlogPostRecord; slug: string }) {
  const { html, headings } = useMemo(() => withHeadingIds(sanitizeHtml(post.content || `<p>${post.excerpt || ''}</p>`)), [post.content, post.excerpt]);
  const readMins = readingMinutes(post.content || post.excerpt);
  const dateLabel = formatBlogDate(post.publishedAt, 'long');
  const cover = post.coverImage || '/images/blog/blog1.jpg';

  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>('');
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const articleRef = useRef<HTMLElement>(null);

  const { data: apiPosts } = useGetBlogPostsQuery({});
  const all = ((apiPosts as BlogPostRecord[] | undefined)?.length ? (apiPosts as BlogPostRecord[]) : staticPosts)
    .slice()
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  const idx = all.findIndex(p => (p.slug || p._id) === slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const sameTopic = all.filter(p => (p.slug || p._id) !== slug && p.category === post.category);
  const related = [...sameTopic, ...all.filter(p => (p.slug || p._id) !== slug && p.category !== post.category)].slice(0, 3);

  useEffect(() => setUrl(window.location.href), []);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!headings.length) return;
    const nodes = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [headings]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelled */
    }
  };
  const enc = encodeURIComponent;
  const shareLinks = [
    { label: 'Share on X', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(post.title)}`, Icon: TwitterIcon },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, Icon: FacebookIcon },
    { label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, Icon: LinkedinIcon },
  ];

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  const shareRow = (
    <div className="flex items-center gap-2">
      {shareLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF2FF] hover:ring-[#611192]/40 [&_svg]:h-4 [&_svg]:w-4"
        >
          <Icon />
        </a>
      ))}
      <button
        type="button"
        onClick={share}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF2FF]"
      >
        {copied ? <Check className="h-4 w-4 text-[#611192]" aria-hidden /> : <LinkIcon className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );

  const authorName = post.authorName || 'Angelpage Team';
  const toc = (
    <ol className="mt-3 space-y-1 border-l border-[#ECE8EE]">
      {headings.map(h => {
        const on = activeId === h.id;
        return (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => jump(h.id)}
              aria-current={on ? 'location' : undefined}
              className={`-ml-px block w-full border-l-2 py-1.5 pl-4 text-left text-[13px] leading-snug transition ${
                on ? 'border-[#611192] font-medium text-[#611192]' : 'border-transparent text-[#6B686E] hover:text-[#0B0112]'
              }`}
            >
              {h.text}
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="bg-white pb-20 sm:pb-10">
      <div className="fixed inset-x-0 top-0 z-[95] h-[3px]" aria-hidden>
        <div className="h-full bg-[#611192] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* hero */}
      <header className="custom-container pt-10 md:pt-6 sm:px-0! sm:pt-0">
        <div className="grid grid-cols-[1fr_1fr] items-center gap-12 md:grid-cols-1 md:gap-6">
          <div className="order-1 md:order-2 sm:px-4">
            <Link href="/blog" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F4F1F6] pr-3.5 pl-2.5 text-[12px] font-medium text-[#474648] transition hover:bg-[#F2E8F8] hover:text-[#611192] sm:hidden">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Journal
            </Link>
            <div className="mt-6 flex items-center gap-3 sm:mt-0">
              <span className="inline-flex h-7 items-center rounded-full bg-[#F2E8F8] px-3 text-[12px] font-semibold text-[#611192] capitalize">{TOPIC_LABEL[(post.category || '').toLowerCase()] || post.category || 'Stories'}</span>
              <span className="inline-flex items-center gap-1 text-[12px] text-[#8A888C]">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {readMins} min read
              </span>
            </div>
            <h1 className="ap-display mt-5 text-[46px] leading-[1.1] laptop-m:text-[40px] md:text-[36px] sm:mt-4 sm:text-[28px]">{post.title}</h1>
            {post.excerpt ? <p className="mt-4 text-[17px] leading-relaxed text-[#5C5560] sm:text-[15px]">{post.excerpt}</p> : null}
            <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#F0EBF2] pt-5 sm:mt-5">
              <div className="flex items-center gap-3">
                {post.authorAvatar ? (
                  <Image src={post.authorAvatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#611192] text-[14px] font-semibold text-white">{authorName.charAt(0)}</span>
                )}
                <div>
                  <p className="text-[14px] font-medium text-[#0B0112]">{authorName}</p>
                  <p className="text-[12px] text-[#8A888C]">{dateLabel}</p>
                </div>
              </div>
              <button type="button" onClick={share} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F1F6] px-4 text-[13px] font-medium text-[#474648] transition hover:bg-[#F2E8F8] hover:text-[#611192]">
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />} {copied ? 'Copied' : 'Share'}
              </button>
            </div>
            {/* phone/tablet contents */}
            {headings.length > 1 ? (
              <div className="mt-5 hidden overflow-hidden rounded-2xl bg-[#FAF8FB] md:block">
                <button
                  type="button"
                  onClick={() => setTocOpen(o => !o)}
                  aria-expanded={tocOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[14px] font-medium text-[#0B0112]"
                >
                  <span className="inline-flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-[#611192]" aria-hidden /> On this page
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${tocOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {tocOpen ? <div className="border-t border-[#ECE8EE] px-3 pb-3">{toc}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="relative order-2 aspect-[5/6] overflow-hidden rounded-[28px] bg-[#F2E8F8] md:order-1 md:aspect-[16/10] sm:aspect-[4/3] sm:rounded-none sm:rounded-b-[28px]">
            <Image src={cover} alt="" fill priority sizes="(max-width: 991px) 100vw, 50vw" className="object-cover" />
            <Link href="/blog" aria-label="Back to the journal" className="absolute top-4 left-4 hidden h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0B0112] shadow sm:flex">
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div className="custom-container mt-16 md:mt-10 sm:mt-8">
        <div className="mx-auto grid max-w-[1080px] grid-cols-[220px_minmax(0,1fr)] gap-14 md:grid-cols-1 md:gap-0">
          <aside className="md:hidden">
            <div className="sticky top-8 space-y-8">
              {headings.length > 1 ? (
                <nav aria-label="On this page">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A888C] uppercase">On this page</p>
                  {toc}
                </nav>
              ) : null}
              <div>
                <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-[#8A888C] uppercase">Share</p>
                {shareRow}
              </div>
            </div>
          </aside>

          <div className="min-w-0 max-w-[720px]">
            <article ref={articleRef} className="ap-prose" dangerouslySetInnerHTML={{ __html: html }} />

            {post.tags?.length ? (
              <div className="mt-10 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[12px] text-[#8A888C]">Topics</span>
                {post.tags.map(t => (
                  <span key={t} className="rounded-full bg-[#F4F1F6] px-3 py-1.5 text-[12px] font-medium text-[#474648] capitalize">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 hidden items-center justify-between gap-3 rounded-2xl bg-[#FAF8FB] p-3 md:flex">
              <p className="pl-2 text-[13px] font-medium text-[#0B0112]">Share this story</p>
              {shareRow}
            </div>

            {newer || older ? (
              <nav aria-label="More stories" className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-1">
                {newer ? (
                  <Link href={`/blog/${newer.slug || newer._id}`} className="group rounded-2xl p-5 ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF7FE]">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#8A888C]">
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Newer
                    </span>
                    <span className="mt-1.5 line-clamp-2 block font-primary text-[17px] leading-snug text-[#0B0112] group-hover:text-[#611192]">{newer.title}</span>
                  </Link>
                ) : (
                  <span className="sm:hidden" />
                )}
                {older ? (
                  <Link href={`/blog/${older.slug || older._id}`} className="group rounded-2xl p-5 text-right ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF7FE] sm:text-left">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#8A888C]">
                      Older <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="mt-1.5 line-clamp-2 block font-primary text-[17px] leading-snug text-[#0B0112] group-hover:text-[#611192]">{older.title}</span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="custom-container mt-20 sm:mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="ap-display text-[30px] sm:text-[24px]">Keep reading</h2>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#611192]">
              All stories <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1 sm:gap-4">
            {related.map(p => (
              <div key={p._id || p.slug}>
                <BlogCard blog={mapBlogToCard(p)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
