'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Link as LinkIcon, Share2 } from 'lucide-react';
import { FacebookIcon, LinkedinIcon, TwitterIcon } from '@/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/elements';
import { blogData } from '@/libs/blogs';
import { sanitizeHtml } from '@/lib/sanitize';
import type { BlogPostRecord } from '@/lib/server-api';
import { useGetBlogBySlugQuery, useGetBlogPostsQuery } from '@/store/api/angelpageApi';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';

type BlogDetailClientProps = {
  slug: string;
  initialPost?: BlogPostRecord | null;
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function BlogDetailClient({
  slug,
  initialPost,
}: BlogDetailClientProps) {
  const { data: fetchedPost, isLoading } = useGetBlogBySlugQuery(slug, {
    skip: !slug,
  });

  const post = fetchedPost ?? initialPost;
  const staticMatch = blogData.find(b => b.id === slug);

  if (isLoading && !initialPost && !staticMatch) {
    return <FullScreenLoader label="Loading article" />;
  }

  const resolved =
    post ||
    (staticMatch
      ? ({
          title: staticMatch.title,
          excerpt: staticMatch.description,
          content: staticMatch.description,
          coverImage: staticMatch.image,
          authorName: 'Angelpage',
          category: staticMatch.tag,
        } as BlogPostRecord)
      : null);

  if (!resolved) {
    return (
      <section className="custom-container py-24 text-center max-[767px]:py-16">
        <h1 className="font-primary text-[40px] text-[#0B0112]">
          Blog post not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-[#6B686E]">
          This article may have been removed or is still under review.
        </p>
        <Link href="/blog" className="mt-6 inline-block">
          <Button variant="primary">Back to blog</Button>
        </Link>
      </section>
    );
  }

  const cover = resolved.coverImage || '/images/blog/blog1.jpg';
  const safeContent = sanitizeHtml(resolved.content || resolved.excerpt || '');
  const dateLabel = formatDate(resolved.publishedAt);
  const words = safeContent.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 220));

  return <BlogArticle post={resolved} slug={slug} cover={cover} html={safeContent} dateLabel={dateLabel} readMins={readMins} />;
}

function BlogArticle({
  post,
  slug,
  cover,
  html,
  dateLabel,
  readMins,
}: {
  post: BlogPostRecord;
  slug: string;
  cover: string;
  html: string;
  dateLabel: string;
  readMins: number;
}) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const { data: more = [] } = useGetBlogPostsQuery({ limit: 4 });
  const related = (more as BlogPostRecord[]).filter(p => (p.slug || p._id) !== slug).slice(0, 3);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const url = typeof window !== 'undefined' ? window.location.href : '';
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

  return (
    <div className="bg-white pb-20 max-[767px]:pb-10">
      {/* reading progress */}
      <div className="fixed inset-x-0 top-0 z-[95] h-[3px] bg-transparent" aria-hidden>
        <div className="h-full bg-[#611192] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      <header className="custom-container pt-10 max-[767px]:pt-5">
        <Link
          href="/blog"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F1F6] pr-4 pl-3 text-[13px] font-medium text-[#474648] transition hover:bg-[#F2E8F8] hover:text-[#611192]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All stories
        </Link>
        <div className="mx-auto mt-8 max-w-[820px] text-center max-[767px]:mt-6 max-[767px]:text-left">
          {post.category ? <span className="ap-chip capitalize">{post.category}</span> : null}
          <h1 className="ap-display mt-5 text-[52px] max-[991px]:text-[42px] max-[767px]:mt-4 max-[767px]:text-[30px]">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mx-auto mt-5 max-w-[640px] text-[18px] leading-8 text-[#5C5560] max-[767px]:text-[16px] max-[767px]:leading-7">
              {post.excerpt}
            </p>
          ) : null}
          <div className="mt-7 flex items-center justify-center gap-3 max-[767px]:justify-start">
            <Image
              src={post.authorAvatar || '/images/blog/author.png'}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-[#F2E8F8]"
            />
            <div className="text-left">
              <p className="text-[14px] font-medium text-[#0B0112]">{post.authorName || 'Angelpage'}</p>
              <p className="text-[12px] text-[#8A888C]">
                {dateLabel || 'Community'} · {readMins} min read
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="custom-container mt-10 max-[767px]:mt-6 max-[767px]:px-0!">
        <div className="relative mx-auto aspect-[21/9] max-w-[1200px] overflow-hidden rounded-[32px] bg-[#F2E8F8] max-[767px]:aspect-[4/3] max-[767px]:rounded-none">
          <Image src={cover} alt={post.title} fill priority sizes="(max-width: 1248px) 100vw, 1200px" className="object-cover" />
        </div>
      </div>

      <div className="custom-container mt-14 max-[767px]:mt-8">
        <div className="mx-auto grid max-w-[980px] grid-cols-[64px_minmax(0,1fr)] gap-10 max-[991px]:grid-cols-1 max-[991px]:gap-0">
          <aside className="max-[991px]:hidden">
            <div className="sticky top-10 flex flex-col items-center gap-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">Share</p>
              {shareLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF2FF] hover:ring-[#611192]/40 [&_svg]:h-4 [&_svg]:w-4"
                >
                  <Icon />
                </a>
              ))}
              <button
                type="button"
                onClick={share}
                aria-label="Copy link"
                className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[#ECE8EE] transition hover:bg-[#FCF2FF]"
              >
                {copied ? <Check className="h-4 w-4 text-[#611192]" aria-hidden /> : <LinkIcon className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </aside>

          <article ref={articleRef} className="ap-prose max-w-[720px]" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {/* mobile share bar */}
        <div className="mx-auto mt-10 hidden max-w-[720px] items-center justify-between gap-3 rounded-2xl bg-[#FAF8FB] p-3 max-[991px]:flex">
          <p className="pl-2 text-[13px] font-medium text-[#0B0112]">Enjoyed this story?</p>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#611192] px-4 text-[13px] font-medium text-white"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
            {copied ? 'Link copied' : 'Share'}
          </button>
        </div>

        <div className="mx-auto mt-14 flex max-w-[720px] items-center gap-5 rounded-[24px] bg-[#FCF2FF] p-6 max-[767px]:mt-8 max-[767px]:flex-col max-[767px]:items-start max-[767px]:p-5">
          <Image
            src={post.authorAvatar || '/images/blog/author.png'}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#611192]">Written by</p>
            <p className="mt-1 font-primary text-[22px] text-[#0B0112]">{post.authorName || 'Angelpage'}</p>
            <p className="text-[13px] text-[#6B686E]">Stories from Angelpage, our charities and community.</p>
          </div>
          <Link href="/blog">
            <Button variant="secondary">More stories</Button>
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="custom-container mt-20 max-[767px]:mt-12">
          <h2 className="ap-display text-[32px] max-[767px]:text-[24px]">Keep reading</h2>
          <div className="ap-no-scrollbar mt-6 grid grid-cols-3 gap-5 max-[767px]:-mx-4 max-[767px]:flex max-[767px]:overflow-x-auto max-[767px]:px-4">
            {related.map(p => (
              <Link
                key={p._id || p.slug}
                href={`/blog/${p.slug || p._id}`}
                className="group block rounded-[24px] bg-white ring-1 ring-[#ECE8EE] transition hover:shadow-[0_18px_40px_rgba(59,5,92,0.1)] max-[767px]:w-[78%] max-[767px]:shrink-0"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-[24px] bg-[#F2E8F8]">
                  <Image src={p.coverImage || '/images/blog/blog1.jpg'} alt="" fill sizes="400px" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  {p.category ? <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#611192]">{p.category}</span> : null}
                  <p className="mt-2 line-clamp-2 font-primary text-[19px] leading-snug text-[#0B0112]">{p.title}</p>
                  <p className="mt-2 line-clamp-2 text-[13px] text-[#6B686E]">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
