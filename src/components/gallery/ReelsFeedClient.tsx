'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Pause,
  Play,
  Plus,
  Share2,
  ShoppingBag,
  Store,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Image from '@/components/common/SafeImage';
import type { ReelsFilterParams } from '@/lib/slugs';
import { buildReelsUrl } from '@/lib/slugs';
import { compactCount, postStoryHref } from '@/lib/community';

export type ReelItem = {
  _id: string;
  slug: string;
  title: string;
  caption?: string;
  kind: string;
  tags?: string[];
  authorName?: string;
  authorAvatar?: string;
  viewCount?: number;
  charityId?: string;
  charityName?: string | null;
  charityProfileImage?: string | null;
  media: {
    url: string;
    thumbnailUrl?: string;
    mediaType: string;
  };
  productId?: string;
  productSlug?: string | null;
};

type Topic = { id: string; label: string; tag?: string };

const TOPICS: Topic[] = [
  { id: 'all', label: 'For you' },
  { id: 'impact', label: 'Impact stories', tag: 'impact' },
  { id: 'thank-you', label: 'Thank-yous', tag: 'thank-you' },
  { id: 'food', label: 'Food relief', tag: 'food' },
  { id: 'healthcare', label: 'Healthcare', tag: 'healthcare' },
  { id: 'education', label: 'Education', tag: 'education' },
];

const KINDS = [
  { id: '', label: 'All' },
  { id: 'reel', label: 'Videos' },
  { id: 'photo', label: 'Photos' },
];

const LIKES_KEY = 'ap-reel-likes';
const isVideo = (r: ReelItem) =>
  ['video', 'reel'].includes(r.media?.mediaType) || r.kind === 'reel';

const readLikes = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
  } catch {
    return {};
  }
};

interface ReelsFeedClientProps {
  initialItems: ReelItem[];
  initialFilters?: ReelsFilterParams;
}

/**
 * Full-screen reels. Native scroll-snap (no wheel hijacking): the reel that
 * fills most of the screen plays, the rest pause. Desktop adds a topic rail
 * and an action column; phones get an app-style overlay.
 */
export default function ReelsFeedClient({
  initialItems,
  initialFilters = {},
}: ReelsFeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession() || {};
  const scroller = useRef<HTMLDivElement>(null);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});

  const filters = useMemo(
    () => ({
      kind: searchParams?.get('kind') ?? initialFilters.kind ?? '',
      tag: searchParams?.get('tag') ?? initialFilters.tag ?? '',
      charityId:
        searchParams?.get('charityId') ?? initialFilters.charityId ?? '',
      item: searchParams?.get('item') ?? initialFilters.item ?? '',
    }),
    [searchParams, initialFilters]
  );

  const [items, setItems] = useState<ReelItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [burst, setBurst] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const firstLoad = useRef(true);

  useEffect(() => setLikes(readLikes()), []);

  // refetch when the filters change (the server already rendered the first set)
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/gallery`, {
        params: {
          limit: 24,
          ...(filters.kind ? { kind: filters.kind } : {}),
          ...(filters.tag ? { tag: filters.tag } : {}),
          ...(filters.charityId ? { charityId: filters.charityId } : {}),
        },
      })
      .then(r => !cancelled && setItems(r.data?.items || []))
      .catch(() => !cancelled && setItems([]))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setActive(0);
        scroller.current?.scrollTo({ top: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [filters.kind, filters.tag, filters.charityId]);

  // the reel filling most of the viewport becomes active
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.6)
            setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { root, threshold: [0.6] }
    );
    root.querySelectorAll('[data-reel]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  // play only the active video
  useEffect(() => {
    items.forEach((r, i) => {
      const v = videos.current[r._id];
      if (!v) return;
      v.muted = muted;
      if (i === active && !paused) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, paused, muted, items]);

  const scrollTo = useCallback((i: number) => {
    const el = scroller.current?.querySelector<HTMLElement>(
      `[data-index="${i}"]`
    );
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // deep link: /reels?item=<slug>
  useEffect(() => {
    if (!filters.item) return;
    const i = items.findIndex(r => r.slug === filters.item);
    if (i > 0)
      requestAnimationFrame(() =>
        scroller.current
          ?.querySelector<HTMLElement>(`[data-index="${i}"]`)
          ?.scrollIntoView()
      );
  }, [filters.item, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollTo(Math.min(active + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollTo(Math.max(active - 1, 0));
      } else if (e.key === 'm') setMuted(m => !m);
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, items.length, scrollTo]);

  const toggleLike = (id: string, force?: boolean) => {
    setLikes(prev => {
      const next = { ...prev, [id]: force ?? !prev[id] };
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  const share = async (r: ReelItem) => {
    const url = `${window.location.origin}${buildReelsUrl({ item: r.slug })}`;
    const text = r.charityName
      ? `${r.title} · ${r.charityName} on Angelpage`
      : `${r.title} on Angelpage`;
    try {
      if (navigator.share) {
        await navigator.share({ title: r.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(r._id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* dismissed */
    }
  };

  const setFilter = (next: Partial<ReelsFilterParams>) => {
    router.push(
      buildReelsUrl({
        kind: filters.kind || undefined,
        tag: filters.tag || undefined,
        charityId: filters.charityId || undefined,
        ...next,
      }),
      { scroll: false }
    );
  };

  const activeTopic =
    TOPICS.find(t => (t.tag || '') === filters.tag)?.id || 'all';
  const postHref = postStoryHref(session);

  return (
    <div className="fixed inset-0 z-[60] flex bg-[#0B0112] text-white">
      {/* desktop rail */}
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/10 px-6 py-7 lg:w-[260px] md:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Angelpage
        </Link>
        <p className="mt-8 font-primary text-[34px] leading-none">Reels</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/65">
          Real stories from the people and charities behind every sale.
        </p>

        <nav aria-label="Topics" className="mt-8">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Topics
          </p>
          <ul className="space-y-1">
            {TOPICS.map(t => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setFilter({ tag: t.tag })}
                  aria-current={activeTopic === t.id ? 'true' : undefined}
                  className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[14px] transition ${activeTopic === t.id ? 'bg-white font-semibold text-[#0B0112]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Show
          </p>
          <div
            role="radiogroup"
            className="grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1"
          >
            {KINDS.map(k => (
              <button
                key={k.id || 'all'}
                type="button"
                role="radio"
                aria-checked={filters.kind === k.id}
                onClick={() => setFilter({ kind: k.id || undefined })}
                className={`h-9 rounded-lg text-[13px] font-medium transition ${filters.kind === k.id ? 'bg-white text-[#0B0112]' : 'text-white/75 hover:text-white'}`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-[20px] bg-gradient-to-br from-[#611192] to-[#3B055C] p-5">
          <p className="font-primary text-[20px] leading-snug">
            Share your story
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-white/80">
            Post a reel of what you sold, bought or funded. Charities: show the
            impact.
          </p>
          <Link
            href={postHref}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#3B055C]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Post a reel
          </Link>
        </div>
        <p className="mt-4 text-[11.5px] text-white/40">
          ↑ ↓ to browse · M to mute · Space to pause
        </p>
      </aside>

      {/* feed */}
      <div className="relative min-w-0 flex-1">
        {/* phone top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden bg-gradient-to-b from-black/60 to-transparent px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-6 md:block">
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/"
              aria-label="Back to Angelpage"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/35 backdrop-blur"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="ap-no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter({ tag: t.tag })}
                  className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium backdrop-blur transition ${activeTopic === t.id ? 'bg-white text-[#0B0112]' : 'bg-black/35 text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Link
              href={postHref}
              aria-label="Post a reel"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#611192]"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* desktop up/down */}
        {items.length > 1 ? (
          <div className="absolute top-1/2 right-6 z-20 flex -translate-y-1/2 flex-col gap-2 md:hidden">
            <button
              type="button"
              onClick={() => scrollTo(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label="Previous reel"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronUp className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(active + 1, items.length - 1))}
              disabled={active >= items.length - 1}
              aria-label="Next reel"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronDown className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}

        <div
          ref={scroller}
          className={`ap-no-scrollbar h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain transition-opacity ${loading ? 'opacity-50' : ''}`}
        >
          {items.length === 0 ? (
            <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/10">
                <Play className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-5 font-primary text-[28px]">
                {loading ? 'Loading stories…' : 'No stories here yet'}
              </p>
              {!loading ? (
                <>
                  <p className="mt-2 max-w-[360px] text-[14.5px] text-white/65">
                    Be the first to share what your sale, purchase or donation
                    made possible.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Link
                      href={postHref}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#3B055C]"
                    >
                      <Plus className="h-4 w-4" aria-hidden /> Post a reel
                    </Link>
                    {filters.tag || filters.kind ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFilter({ tag: undefined, kind: undefined })
                        }
                        className="h-11 rounded-full px-5 text-[14px] text-white ring-1 ring-white/30"
                      >
                        See all stories
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            items.map((r, i) => {
              const video = isVideo(r);
              const liked = Boolean(likes[r._id]);
              const near = Math.abs(i - active) <= 1;
              const poster =
                r.media.thumbnailUrl || (video ? undefined : r.media.url);
              const charityHref = r.charityId
                ? `/charity/find-a-charity/${r.charityId}`
                : null;
              const caption = r.caption || '';
              return (
                <section
                  key={r._id}
                  data-reel
                  data-index={i}
                  aria-label={r.title}
                  className="flex h-dvh snap-start snap-always items-center justify-center py-6 md:py-0"
                >
                  <div className="flex h-full items-end gap-4 md:w-full">
                    {/* card */}
                    <div
                      className="relative aspect-[9/16] h-full max-h-[calc(100dvh-48px)] overflow-hidden rounded-[28px] bg-[#1A0B26] shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:aspect-auto md:max-h-none md:w-full md:rounded-none"
                      onDoubleClick={() => {
                        toggleLike(r._id, true);
                        setBurst(r._id);
                        setTimeout(() => setBurst(null), 700);
                      }}
                    >
                      {video ? (
                        near ? (
                          <video
                            ref={el => {
                              videos.current[r._id] = el;
                            }}
                            src={r.media.url}
                            poster={poster}
                            className="h-full w-full object-cover"
                            loop
                            playsInline
                            muted={muted}
                            preload="metadata"
                            onClick={() => setPaused(p => !p)}
                          />
                        ) : poster ? (
                          <Image
                            src={poster}
                            alt=""
                            fill
                            sizes="460px"
                            className="object-cover"
                          />
                        ) : null
                      ) : (
                        <Image
                          src={r.media.url}
                          alt={r.title}
                          fill
                          sizes="(max-width: 991px) 100vw, 460px"
                          className="object-cover"
                          priority={i === 0}
                        />
                      )}

                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20"
                        aria-hidden
                      />

                      {video && i === active && paused ? (
                        <button
                          type="button"
                          onClick={() => setPaused(false)}
                          aria-label="Play"
                          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur"
                        >
                          <Play className="ml-1 h-7 w-7" aria-hidden />
                        </button>
                      ) : null}

                      {burst === r._id ? (
                        <Heart
                          className="pointer-events-none absolute inset-0 m-auto h-24 w-24 animate-ping fill-white text-white"
                          aria-hidden
                        />
                      ) : null}

                      {/* info */}
                      <div className="absolute inset-x-0 bottom-0 p-5 pr-20 md:pb-[calc(28px+env(safe-area-inset-bottom))]">
                        <div className="flex items-center gap-2.5">
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/70">
                            {r.charityProfileImage || r.authorAvatar ? (
                              <Image
                                src={
                                  (r.charityProfileImage ||
                                    r.authorAvatar) as string
                                }
                                alt=""
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold">
                              {r.charityName ||
                                r.authorName ||
                                'Angelpage community'}
                            </p>
                            {r.charityName && r.authorName ? (
                              <p className="truncate text-[12px] text-white/70">
                                by {r.authorName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-3 text-[15px] font-semibold leading-snug">
                          {r.title}
                        </p>
                        {caption ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(x => ({ ...x, [r._id]: !x[r._id] }))
                            }
                            className={`mt-1 block text-left text-[13.5px] leading-snug text-white/85 ${expanded[r._id] ? '' : 'line-clamp-2'}`}
                          >
                            {caption}
                          </button>
                        ) : null}
                        {r.tags?.length ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {r.tags.slice(0, 3).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setFilter({ tag: t })}
                                className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium backdrop-blur hover:bg-white/25"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {r.productSlug ? (
                          <Link
                            href={`/product/${r.productSlug}`}
                            className="mt-3.5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0B0112]"
                          >
                            <ShoppingBag
                              className="h-4 w-4 text-[#611192]"
                              aria-hidden
                            />{' '}
                            Shop this item
                          </Link>
                        ) : null}
                      </div>

                      {/* phone actions (overlay) */}
                      <div className="absolute right-3 bottom-[calc(28px+env(safe-area-inset-bottom))] hidden flex-col items-center gap-4 md:flex">
                        <ActionButtons
                          r={r}
                          liked={liked}
                          video={video}
                          muted={muted}
                          copied={copied === r._id}
                          charityHref={charityHref}
                          onLike={() => toggleLike(r._id)}
                          onShare={() => share(r)}
                          onMute={() => setMuted(m => !m)}
                        />
                      </div>
                    </div>

                    {/* desktop actions (beside the card) */}
                    <div className="flex flex-col items-center gap-4 pb-4 md:hidden">
                      <ActionButtons
                        r={r}
                        liked={liked}
                        video={video}
                        muted={muted}
                        copied={copied === r._id}
                        charityHref={charityHref}
                        onLike={() => toggleLike(r._id)}
                        onShare={() => share(r)}
                        onMute={() => setMuted(m => !m)}
                      />
                      {video ? (
                        <button
                          type="button"
                          onClick={() => setPaused(p => !p)}
                          aria-label={paused ? 'Play' : 'Pause'}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        >
                          {paused ? (
                            <Play className="h-5 w-5" aria-hidden />
                          ) : (
                            <Pause className="h-5 w-5" aria-hidden />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButtons({
  r,
  liked,
  video,
  muted,
  copied,
  charityHref,
  onLike,
  onShare,
  onMute,
}: {
  r: ReelItem;
  liked: boolean;
  video: boolean;
  muted: boolean;
  copied: boolean;
  charityHref: string | null;
  onLike: () => void;
  onShare: () => void;
  onMute: () => void;
}) {
  const btn =
    'flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 md:bg-black/35';
  const views = compactCount(r.viewCount);
  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={btn}
        >
          <Heart
            className={`h-6 w-6 transition ${liked ? 'scale-110 fill-[#FF4D7E] text-[#FF4D7E]' : ''}`}
            aria-hidden
          />
        </button>
        <span className="text-[11.5px] font-medium text-white/80">
          {liked ? 'Liked' : 'Like'}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onShare}
          aria-label="Share"
          className={btn}
        >
          {copied ? (
            <Check className="h-6 w-6" aria-hidden />
          ) : (
            <Share2 className="h-6 w-6" aria-hidden />
          )}
        </button>
        <span className="text-[11.5px] font-medium text-white/80">
          {copied ? 'Copied' : 'Share'}
        </span>
      </div>
      {charityHref ? (
        <div className="flex flex-col items-center gap-1">
          <Link
            href={charityHref}
            aria-label={`Visit ${r.charityName || 'the charity'}`}
            className={btn}
          >
            <Store className="h-6 w-6" aria-hidden />
          </Link>
          <span className="text-[11.5px] font-medium text-white/80">
            Charity
          </span>
        </div>
      ) : null}
      {video ? (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className={btn}
          >
            {muted ? (
              <VolumeX className="h-6 w-6" aria-hidden />
            ) : (
              <Volume2 className="h-6 w-6" aria-hidden />
            )}
          </button>
          <span className="text-[11.5px] font-medium text-white/80">
            {muted ? 'Sound off' : 'Sound on'}
          </span>
        </div>
      ) : null}
      {views ? (
        <div className="flex flex-col items-center gap-1 text-white/70">
          <Eye className="h-5 w-5" aria-hidden />
          <span className="text-[11.5px] font-medium">{views}</span>
        </div>
      ) : null}
    </>
  );
}
