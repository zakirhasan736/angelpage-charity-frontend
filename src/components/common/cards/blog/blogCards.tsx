'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';

export interface BlogCardData {
  id: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  date?: string;
  author?: string;
  readMins?: number;
}

interface BlogListProps {
  blogData: BlogCardData[];
  featured?: boolean;
}

export function formatBlogDate(value?: string, month: 'short' | 'long' = 'short') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { month, day: 'numeric', year: 'numeric' }).format(date);
}

const TAG_LABEL: Record<string, string> = { guides: 'Guide', stories: 'Story', news: 'News' };
export const tagLabel = (tag?: string) => (tag ? TAG_LABEL[tag.toLowerCase()] || tag : 'Story');

/** Standard story card. On phones it becomes a compact row (thumb + text). */
export function BlogCard({ blog }: { blog: BlogCardData }) {
  const date = formatBlogDate(blog.date);
  return (
    <article className="group relative flex h-full flex-col sm:flex-row sm:items-center sm:gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#F2E8F8] sm:aspect-square sm:w-[108px] sm:shrink-0 sm:rounded-2xl">
        <Image
          src={blog.image}
          alt=""
          fill
          sizes="(max-width: 767px) 108px, (max-width: 991px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        <span className="ap-chip ap-chip--glass absolute top-3 left-3 sm:hidden">{tagLabel(blog.tag)}</span>
      </div>
      <div className="flex flex-1 flex-col pt-5 sm:min-w-0 sm:pt-0">
        <p className="flex items-center gap-2 text-[12px] text-[#8A888C]">
          <span className="hidden font-medium text-[#611192] sm:inline">{tagLabel(blog.tag)}</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          {date ? <span>{date}</span> : null}
          {blog.readMins ? (
            <>
              <span aria-hidden>·</span>
              <span>{blog.readMins} min read</span>
            </>
          ) : null}
        </p>
        <h3 className="mt-2 font-primary text-[22px] leading-[1.25] text-[#0B0112] transition group-hover:text-[#611192] sm:mt-1 sm:line-clamp-2 sm:text-[16px]">
          <Link href={`/blog/${blog.id}`} className="after:absolute after:inset-0">
            {blog.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[#6B686E] sm:hidden">{blog.description}</p>
      </div>
    </article>
  );
}

/** Large lead story: image with text panel overlapping. */
export function BlogFeatureCard({ blog }: { blog: BlogCardData }) {
  const date = formatBlogDate(blog.date, 'long');
  return (
    <article className="group relative grid grid-cols-[1.25fr_1fr] overflow-hidden rounded-[32px] bg-[#1A0329] md:grid-cols-1 sm:rounded-[24px]">
      <div className="relative min-h-[420px] md:min-h-[300px] sm:min-h-[220px]">
        <Image
          src={blog.image}
          alt=""
          fill
          priority
          sizes="(max-width: 991px) 100vw, 60vw"
          className="object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="relative flex flex-col justify-center p-10 md:p-8 sm:p-5">
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#611192] opacity-50 blur-3xl" />
        <span className="ap-chip ap-chip--glass relative w-fit">Featured · {tagLabel(blog.tag)}</span>
        <h2 className="relative mt-5 font-primary text-[36px] leading-[1.15] text-white md:text-[30px] sm:mt-4 sm:text-[24px]">
          <Link href={`/blog/${blog.id}`} className="after:absolute after:inset-0">
            {blog.title}
          </Link>
        </h2>
        <p className="relative mt-4 line-clamp-3 text-[15px] leading-relaxed text-white/70 sm:text-[14px]">{blog.description}</p>
        <div className="relative mt-8 flex items-center justify-between gap-4 sm:mt-6">
          <p className="flex items-center gap-2 text-[13px] text-white/60">
            {date}
            {blog.readMins ? (
              <>
                <span aria-hidden>·</span>
                <Clock className="h-3.5 w-3.5" aria-hidden /> {blog.readMins} min
              </>
            ) : null}
          </p>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#611192] transition group-hover:rotate-45" aria-hidden>
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Grid of cards; `featured` makes the first one the lead story. */
const BlogList: React.FC<BlogListProps> = ({ blogData = [], featured = false }) => {
  const [lead, ...rest] = blogData;
  if (!lead) return null;
  const grid = (items: BlogCardData[]) => (
    <div className="grid grid-cols-3 gap-x-6 gap-y-10 md:grid-cols-2 sm:grid-cols-1 sm:gap-y-4">
      {items.map(b => (
        <BlogCard key={b.id} blog={b} />
      ))}
    </div>
  );
  if (!featured) return grid(blogData);
  return (
    <div className="flex flex-col gap-12 sm:gap-8">
      <BlogFeatureCard blog={lead} />
      {rest.length > 0 ? grid(rest) : null}
    </div>
  );
};

export default BlogList;
