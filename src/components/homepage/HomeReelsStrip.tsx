'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ArrowRight, Camera, Play, Plus } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import type { ReelItem } from '@/components/gallery/ReelsFeedClient';
import { buildReelsUrl } from '@/lib/slugs';
import { compactCount, postStoryHref } from '@/lib/community';

const isVideo = (r: ReelItem) =>
  ['video', 'reel'].includes(r.media?.mediaType) || r.kind === 'reel';

/**
 * "Stories from the community" — the reels shelf on the home pages.
 * Sits high on the page so new visitors see real people and charities
 * before products. Hover previews a video; tap opens the full-screen feed
 * at that reel. Hides itself when there is nothing published yet.
 */
export default function HomeReelsStrip({
  variant = 'guest',
}: {
  variant?: 'guest' | 'member';
}) {
  const { data: session } = useSession() || {};
  const [items, setItems] = useState<ReelItem[] | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/gallery`, {
        params: { limit: 12 },
      })
      .then(
        r =>
          !cancelled &&
          setItems((r.data?.items || []).filter((i: ReelItem) => i?.media?.url))
      )
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (items && items.length === 0) return null;

  const nudge = (dir: 1 | -1) =>
    track.current?.scrollBy({
      left: dir * track.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  const postHref = postStoryHref(session);

  return (
    <section
      className="ap-section overflow-hidden bg-white"
      aria-labelledby="home-reels-title"
    >
      <div className="custom-container">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5 sm:mb-5">
          <div className="max-w-[620px]">
            <p className="ap-eyebrow">Community</p>
            <h2
              id="home-reels-title"
              className="ap-display mt-2 text-[38px] leading-[1.12] md:text-[32px] sm:text-[27px]"
            >
              {variant === 'member'
                ? 'New from the community'
                : 'See where your money goes'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6B686E] sm:text-[14px]">
              Short videos and photos from charities and members: the kitchens,
              clinics and classrooms your purchases keep running.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Scroll back"
              className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[#E2DCE6] transition hover:ring-[#611192] sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Scroll forward"
              className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[#E2DCE6] transition hover:ring-[#611192] sm:hidden"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <Link
              href="/reels"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0B0112] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2A1A35]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden /> Watch reels
            </Link>
          </div>
        </div>

        <div
          ref={track}
          className="ap-no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:gap-3"
        >
          {/* post tile first: invites people to add their own */}
          <Link
            href={postHref}
            className="group flex aspect-[9/16] w-[220px] shrink-0 snap-start flex-col justify-between rounded-[24px] bg-gradient-to-br from-[#611192] to-[#3B055C] p-5 text-white laptop-m:w-[200px] sm:w-[160px] sm:rounded-[20px] sm:p-4"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 transition group-hover:bg-white/25">
              <Camera className="h-6 w-6" aria-hidden />
            </span>
            <span>
              <span className="block font-primary text-[22px] leading-snug sm:text-[18px]">
                Share your story
              </span>
              <span className="mt-1.5 block text-[13px] leading-snug text-white/80 sm:text-[12px]">
                Show what you sold, bought or funded.
              </span>
              <span className="mt-4 inline-flex h-9 items-center gap-1 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#3B055C]">
                <Plus className="h-4 w-4" aria-hidden /> Post
              </span>
            </span>
          </Link>

          {items === null
            ? [0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="aspect-[9/16] w-[220px] shrink-0 animate-pulse rounded-[24px] bg-[#F2E8F8] laptop-m:w-[200px] sm:w-[160px]"
                  aria-hidden
                />
              ))
            : items.map(r => <ReelTile key={r._id} r={r} />)}
        </div>
      </div>
    </section>
  );
}

function ReelTile({ r }: { r: ReelItem }) {
  const video = isVideo(r);
  const ref = useRef<HTMLVideoElement>(null);
  const poster = r.media.thumbnailUrl || (video ? undefined : r.media.url);
  const views = compactCount(r.viewCount);
  return (
    <Link
      href={buildReelsUrl({ item: r.slug })}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (!ref.current) return;
        ref.current.pause();
        ref.current.currentTime = 0;
      }}
      className="group relative isolate block aspect-[9/16] w-[220px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[#1A0B26] laptop-m:w-[200px] sm:w-[160px] sm:rounded-[20px]"
    >
      {video ? (
        <video
          ref={ref}
          src={r.media.url}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={r.media.url}
          alt=""
          fill
          sizes="220px"
          className="-z-10 object-cover transition duration-700 group-hover:scale-[1.04]"
        />
      )}
      <span
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/5 to-black/25"
        aria-hidden
      />
      <span className="absolute top-3 left-3 flex items-center gap-1.5">
        {video ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur">
            <Play
              className="ml-0.5 h-3.5 w-3.5 fill-white text-white"
              aria-hidden
            />
          </span>
        ) : null}
        {views ? (
          <span className="rounded-full bg-black/40 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            {views} views
          </span>
        ) : null}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-3">
        <span className="flex items-center gap-2">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/25 ring-2 ring-white/70">
            {r.charityProfileImage || r.authorAvatar ? (
              <Image
                src={(r.charityProfileImage || r.authorAvatar) as string}
                alt=""
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : null}
          </span>
          <span className="truncate text-[12.5px] font-semibold">
            {r.charityName || r.authorName || 'Angelpage'}
          </span>
        </span>
        <span className="mt-2 line-clamp-2 block text-[14px] leading-snug font-medium sm:text-[13px]">
          {r.title}
        </span>
      </span>
    </Link>
  );
}
