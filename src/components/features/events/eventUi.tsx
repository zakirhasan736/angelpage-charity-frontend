'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, CalendarClock, HeartHandshake, type LucideIcon, Radio, Users } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';
import { type DisplayEventType, type EventTiming, getDisplayEventType, getDonationProgress, getEventTiming } from './eventUtils';

export const EVENT_FALLBACK_IMAGES: Record<DisplayEventType, string> = {
  donation: '/images/events/donation_hands.jpg',
  poll: '/images/events/community_poll_bg.jpg',
  live: '/images/events/charity_event_hero.jpg',
  general: '/images/events/charity_event_hero.jpg',
};

export const TYPE_META: Record<DisplayEventType, { label: string; plural: string; verb: string; icon: LucideIcon; tint: string; ink: string; dot: string }> = {
  donation: { label: 'Appeal', plural: 'Appeals', verb: 'Give', icon: HeartHandshake, tint: '#E6F6F2', ink: '#00775F', dot: '#00977A' },
  poll: { label: 'Poll', plural: 'Polls', verb: 'Vote', icon: BarChart3, tint: '#F2E8F8', ink: '#611192', dot: '#8A3FC7' },
  live: { label: 'Live', plural: 'Live sessions', verb: 'Join', icon: Radio, tint: '#FDECEF', ink: '#B80030', dot: '#E50035' },
  general: { label: 'Community', plural: 'Community', verb: 'View', icon: Users, tint: '#EEF1F8', ink: '#1B264F', dot: '#1B264F' },
};

export const eventImage = (e: CommunityEventRecord) => e.coverImage || EVENT_FALLBACK_IMAGES[getDisplayEventType(e)];
export const eventHref = (e: CommunityEventRecord) => `/events/${e.slug || e._id}`;
export const pollTotal = (e: CommunityEventRecord) => (e.pollOptions || []).reduce((s, o) => s + (o.votes || 0), 0);

/** Live countdown to a date; null until mounted (no hydration mismatch). */
export function useCountdown(target?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!target || now === null) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 };
  return {
    done: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

/** Timing resolved after mount, so server and client agree. */
export function useTiming(e?: CommunityEventRecord | null): EventTiming {
  const [t, setT] = useState<EventTiming>('open');
  useEffect(() => {
    if (!e) return;
    setT(getEventTiming(e));
    const id = window.setInterval(() => setT(getEventTiming(e)), 30000);
    return () => window.clearInterval(id);
  }, [e]);
  return t;
}

export function TypeChip({ type, glass = false }: { type: DisplayEventType; glass?: boolean }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold ${glass ? 'bg-white/90 backdrop-blur' : ''}`}
      style={{ background: glass ? undefined : m.tint, color: m.ink }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

/** "Live now" only for live sessions; other running events read "Open". */
export function EventStatus({ event, timing, dark = false }: { event: CommunityEventRecord; timing: EventTiming; dark?: boolean }) {
  const type = getDisplayEventType(event);
  if (timing === 'live' && type === 'live') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#E50035] px-2.5 text-[12px] font-semibold text-white">
        <span className="ap-live-dot" aria-hidden /> Live now
      </span>
    );
  }
  const label = timing === 'upcoming' ? 'Upcoming' : timing === 'ended' ? 'Ended' : 'Open';
  const cls =
    timing === 'ended'
      ? dark
        ? 'bg-white/10 text-white/60'
        : 'bg-[#F1EFF2] text-[#6B686E]'
      : timing === 'upcoming'
        ? dark
          ? 'bg-white/15 text-white'
          : 'bg-[#FFF4E5] text-[#8A4B00]'
        : dark
          ? 'bg-[#7FE0C5]/20 text-[#7FE0C5]'
          : 'bg-[#E6F6F2] text-[#00775F]';
  return <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-semibold ${cls}`}>{label}</span>;
}

export function formatDateBlock(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleString('en-US', { weekday: 'short' }),
    time: d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

/** Tear-off calendar block. */
export function DateBlock({ iso, size = 'md' }: { iso?: string; size?: 'sm' | 'md' }) {
  const b = formatDateBlock(iso);
  if (!b) return null;
  const sm = size === 'sm';
  return (
    <span className={`flex shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-center shadow-[0_6px_18px_rgba(11,1,18,0.12)] ${sm ? 'w-12' : 'w-14'}`}>
      <span className={`bg-[#611192] font-semibold tracking-[0.12em] text-white ${sm ? 'py-0.5 text-[9px]' : 'py-1 text-[10px]'}`}>{b.month}</span>
      <span className={`font-primary leading-none text-[#0B0112] ${sm ? 'py-1.5 text-[20px]' : 'py-2 text-[24px]'}`}>{b.day}</span>
    </span>
  );
}

export function ProgressBar({ percent, dark = false }: { percent: number; dark?: boolean }) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-[#EDE7F1]'}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-[#8A3FC7] to-[#611192]" style={{ width: `${Math.max(2, percent)}%` }} />
    </div>
  );
}

/** Circular progress (used in spotlights). */
export function ProgressRing({ percent, size = 76, dark = false }: { percent: number; size?: number; dark?: boolean }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} className={dark ? 'stroke-white/15' : 'stroke-[#EDE7F1]'} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          stroke={dark ? '#D9B8F0' : '#611192'}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, percent) / 100)}
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[15px] font-semibold ${dark ? 'text-white' : 'text-[#0B0112]'}`}>{percent}%</span>
    </span>
  );
}

/** One-line context for a card footer: progress, votes, start time. */
export function EventMeta({ event, timing, dark = false }: { event: CommunityEventRecord; timing: EventTiming; dark?: boolean }) {
  const type = getDisplayEventType(event);
  const muted = dark ? 'text-white/65' : 'text-[#6B686E]';
  const strong = dark ? 'text-white' : 'text-[#0B0112]';
  if (type === 'donation') {
    const d = getDonationProgress(event);
    return (
      <div>
        <ProgressBar percent={d.percent} dark={dark} />
        <p className={`mt-2 flex justify-between text-[13px] ${muted}`}>
          <span>
            <strong className={`font-semibold ${strong}`}>{formatMoney(d.raised, { compact: true })}</strong> raised
          </span>
          {d.goal ? <span>of {formatMoney(d.goal, { compact: true })}</span> : null}
        </p>
      </div>
    );
  }
  if (type === 'poll') {
    const total = pollTotal(event);
    return (
      <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
        <BarChart3 className="h-4 w-4" aria-hidden />
        <strong className={`font-semibold ${strong}`}>{total.toLocaleString()}</strong> vote{total === 1 ? '' : 's'} · {(event.pollOptions || []).length} options
      </p>
    );
  }
  const b = formatDateBlock(event.startAt);
  return (
    <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
      <CalendarClock className="h-4 w-4" aria-hidden />
      {timing === 'live' && type === 'live' ? 'Streaming now' : b ? `${b.weekday} ${b.day} ${b.month.toLowerCase()} · ${b.time}` : 'Date to be announced'}
    </p>
  );
}

/** Standard event card. */
export function EventTile({ event, priority = false }: { event: CommunityEventRecord; priority?: boolean }) {
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  return (
    <article className="ap-card ap-card--hover group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F2E8F8]">
        <Image
          src={eventImage(event)}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 767px) 90vw, (max-width: 1170px) 45vw, 380px"
          className={`object-cover transition duration-700 group-hover:scale-[1.04] ${timing === 'ended' ? 'grayscale-[60%]' : ''}`}
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <TypeChip type={type} glass />
          <EventStatus event={event} timing={timing} />
        </div>
        {event.startAt && type !== 'donation' && type !== 'poll' ? (
          <span className="absolute bottom-3 left-3">
            <DateBlock iso={event.startAt} size="sm" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-4">
        <p className="text-[12px] font-medium text-[#8A888C]">{event.authorName || 'Angelpage'}</p>
        <h3 className="mt-1 line-clamp-2 font-primary text-[20px] leading-snug text-[#0B0112] transition group-hover:text-[#611192] sm:text-[18px]">
          <Link href={eventHref(event)} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        {event.excerpt ? <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[#6B686E]">{event.excerpt}</p> : null}
        <div className="mt-auto pt-5">
          <EventMeta event={event} timing={timing} />
        </div>
      </div>
    </article>
  );
}

export function EventTileSkeleton() {
  return (
    <div className="ap-card overflow-hidden" aria-hidden>
      <div className="aspect-[16/10] animate-pulse bg-[#F2E8F8]" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-[#EFEAF2]" />
        <div className="h-5 w-full animate-pulse rounded bg-[#EFEAF2]" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-[#EFEAF2]" />
        <div className="mt-6 h-2 w-full animate-pulse rounded bg-[#EFEAF2]" />
      </div>
    </div>
  );
}

/** Chooses the event to spotlight: live session → open appeal → featured → soonest. */
export function pickSpotlight(events: CommunityEventRecord[]) {
  const now = Date.now();
  const live = events.find(e => getDisplayEventType(e) === 'live' && getEventTiming(e) === 'live');
  if (live) return live;
  const appeal = events.find(e => getDisplayEventType(e) === 'donation' && getEventTiming(e) !== 'ended');
  if (appeal) return appeal;
  const featured = events.find(e => e.featuredOnHomepage && getEventTiming(e) !== 'ended');
  if (featured) return featured;
  return (
    events
      .filter(e => e.startAt && new Date(e.startAt).getTime() > now)
      .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())[0] || events[0]
  );
}

export const sortByStart = (a: CommunityEventRecord, b: CommunityEventRecord) =>
  new Date(a.startAt || 0).getTime() - new Date(b.startAt || 0).getTime();
