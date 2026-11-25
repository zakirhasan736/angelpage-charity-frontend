'use client';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

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
export const TOPIC_LABEL: Record<string, string> = { guides: 'Guides', stories: 'Stories', news: 'News' };
export const tagLabel = (tag?: string) => (tag ? TAG_LABEL[tag.toLowerCase()] || tag : 'Story');

/** Standard story card. */
export function BlogCard({ blog }: { blog: BlogCardData }) {
  const date = formatBlogDate(blog.date);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,5,92,0.10)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F2E8F8]">
        <Image src={blog.image} alt="" fill sizes="(max-width: 767px) 92vw, (max-width: 991px) 45vw, 380px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
        <span className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-semibold text-[#0B0112] capitalize shadow-sm">
          {TOPIC_LABEL[(blog.tag || '').toLowerCase()] || blog.tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-4">
        <p className="text-[12px] text-[#8A888C]">
          {date}
          {blog.readMins ? ` · ${blog.readMins} min read` : ''}
        </p>
        <h3 className="mt-2 line-clamp-2 font-primary text-[20px] leading-snug text-[#0B0112] transition group-hover:text-[#611192] sm:text-[18px]">
          <Link href={`/blog/${blog.id}`} className="after:absolute after:inset-0">
            {blog.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#6B686E]">{blog.description}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-semibold text-[#611192]">
          Read story <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

/** Lead story: photo with the text laid over it. */
export function BlogFeatureCard({ blog }: { blog: BlogCardData }) {
  const date = formatBlogDate(blog.date);
  return (
    <article className="group relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden rounded-[28px] bg-[#14021F] md:min-h-[380px] sm:min-h-[400px] sm:rounded-[24px]">
      <Image src={blog.image} alt="" fill priority sizes="(max-width: 1240px) 100vw, 1200px" className="-z-10 object-cover transition duration-1000 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#14021F] via-[#14021F]/55 to-transparent" />
      <div className="flex items-end justify-between gap-6 p-8 md:flex-col md:items-start sm:p-5">
        <div className="max-w-[640px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-semibold text-[#611192]">Featured · {TOPIC_LABEL[(blog.tag || '').toLowerCase()] || blog.tag}</span>
            {date ? <span className="text-[12px] text-white/70">{date}</span> : null}
          </div>
          <h2 className="mt-4 font-primary text-[36px] leading-[1.15] text-white md:text-[30px] sm:text-[24px]">
            <Link href={`/blog/${blog.id}`} className="after:absolute after:inset-0">
              {blog.title}
            </Link>
          </h2>
          <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-white/75 sm:text-[14px]">{blog.description}</p>
        </div>
        <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition group-hover:bg-[#F2E8F8]">
          Read the story <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}

/** Grid of cards; `featured` makes the first one the lead story. */
const BlogList: React.FC<BlogListProps> = ({ blogData = [], featured = false }) => {
  const [lead, ...rest] = blogData;
  if (!lead) return null;
  const grid = (items: BlogCardData[]) => (
    <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1">
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
