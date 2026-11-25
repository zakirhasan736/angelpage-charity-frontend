'use client';

import React, { useEffect, useState } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, CalendarClock, HandHeart, type LucideIcon, Radio, Users } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';
import { type DisplayEventType, type EventTiming, getDisplayEventType, getDonationProgress, getEventTiming } from './eventUtils';

export const EVENT_FALLBACK_IMAGES: Record<DisplayEventType, string> = {
  donation: '/images/events/donation_hands.jpg',
  poll: '/images/events/community_poll_bg.jpg',
  live: '/images/events/charity_event_hero.jpg',
  general: '/images/events/charity_event_hero.jpg',
};

export const TYPE_META: Record<
  DisplayEventType,
  { label: string; filter: string; counter: string; verb: string; icon: LucideIcon; tint: string; ink: string; dot: string }
> = {
  donation: { label: 'Appeal', filter: 'Appeals', counter: 'Appeals open', verb: 'Give', icon: HandHeart, tint: '#F2E8F8', ink: '#611192', dot: '#8A3FC7' },
  poll: { label: 'Community vote', filter: 'Votes', counter: 'Votes open', verb: 'Vote', icon: BarChart3, tint: '#E6F6F2', ink: '#00775F', dot: '#00977A' },
  live: { label: 'Live session', filter: 'Live', counter: 'Live open', verb: 'Join', icon: Radio, tint: '#FDECEF', ink: '#B80030', dot: '#E50035' },
  general: { label: 'Community', filter: 'Community', counter: 'Community', verb: 'View', icon: Users, tint: '#EEF1F8', ink: '#1B264F', dot: '#1B264F' },
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
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-[#0B0112] ${glass ? 'bg-white shadow-sm' : ''}`}
      style={glass ? undefined : { background: m.tint, color: m.ink }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color: m.dot }} aria-hidden />
      {m.label}
    </span>
  );
}

/** "Live now" only for live sessions; other running events read "Open". */
export function EventStatus({ event, timing, dark = false }: { event: CommunityEventRecord; timing: EventTiming; dark?: boolean }) {
  const type = getDisplayEventType(event);
  if (timing === 'live' && type === 'live') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#E50035] px-2.5 text-[11px] font-semibold tracking-[0.04em] text-white uppercase">
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
export function DateBlock({ iso, size = 'md', weekday = false }: { iso?: string; size?: 'sm' | 'md'; weekday?: boolean }) {
  const b = formatDateBlock(iso);
  if (!b) return null;
  const sm = size === 'sm';
  return (
    <span className={`flex shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center shadow-[0_4px_14px_rgba(11,1,18,0.12)] ring-1 ring-[#ECE8EE] ${sm ? 'h-11 w-11' : 'h-12 w-12'}`}>
      <span className="text-[9px] leading-none font-semibold tracking-[0.1em] text-[#611192] uppercase">{weekday ? b.weekday : b.month}</span>
      <span className={`mt-0.5 font-primary leading-none text-[#0B0112] ${sm ? 'text-[18px]' : 'text-[21px]'}`}>{b.day}</span>
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

/** Short "starts in" label, e.g. "Starts in 6d 1h". */
export function startsInLabel(iso?: string) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return d > 0 ? `Starts in ${d}d ${h}h` : h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`;
}

/** Card body context: progress, votes, host and time. */
export function EventMeta({ event, dark = false }: { event: CommunityEventRecord; timing?: EventTiming; dark?: boolean }) {
  const type = getDisplayEventType(event);
  const muted = dark ? 'text-white/65' : 'text-[#6B686E]';
  const strong = dark ? 'text-white' : 'text-[#0B0112]';
  if (type === 'donation') {
    const d = getDonationProgress(event);
    return (
      <div>
        <ProgressBar percent={d.percent} dark={dark} />
        <p className={`mt-2 flex justify-between text-[12px] ${muted}`}>
          <span>
            <strong className={`font-semibold ${strong}`}>{formatMoney(d.raised).replace(/\.00$/, '')}</strong>
            {d.goal ? ` of ${formatMoney(d.goal).replace(/\.00$/, '')}` : ' raised'}
          </span>
          {d.goal ? <strong className="font-semibold text-[#611192]">{d.percent}%</strong> : null}
        </p>
      </div>
    );
  }
  if (type === 'poll') {
    const total = pollTotal(event);
    return (
      <p className={`text-[12px] ${muted}`}>
        <strong className={`font-semibold ${strong}`}>{(event.pollOptions || []).length}</strong> options · <strong className={`font-semibold ${strong}`}>{total.toLocaleString()}</strong> votes so far
      </p>
    );
  }
  const b = formatDateBlock(event.startAt);
  return (
    <p className={`text-[12px] ${muted}`}>
      Hosted by <strong className={`font-semibold ${strong}`}>{event.authorName || 'Angelpage'}</strong>
      {b ? ` · ${b.weekday} ${b.time}` : ''}
    </p>
  );
}

/** Standard event card (list, detail "More events"). */
export function EventTile({ event, priority = false, onShare }: { event: CommunityEventRecord; priority?: boolean; onShare?: (e: CommunityEventRecord) => void }) {
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const [startsIn, setStartsIn] = useState<string | null>(null);
  useEffect(() => setStartsIn(startsInLabel(event.startAt)), [event.startAt]);
  const m = TYPE_META[type];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,5,92,0.10)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F2E8F8]">
        <Image
          src={eventImage(event)}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 767px) 92vw, (max-width: 1170px) 45vw, 380px"
          className={`object-cover transition duration-700 group-hover:scale-[1.04] ${timing === 'ended' ? 'grayscale-[60%]' : ''}`}
        />
        <span className="absolute top-3 left-3">
          <TypeChip type={type} glass />
        </span>
        <span className="absolute bottom-3 left-3">
          {timing === 'upcoming' && startsIn ? (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#0B0112]/55 px-2.5 text-[11px] font-medium text-white backdrop-blur">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {startsIn}
            </span>
          ) : (
            <EventStatus event={event} timing={timing} />
          )}
        </span>
        {event.startAt ? (
          <span className="absolute right-3 bottom-3">
            <DateBlock iso={event.startAt} size="sm" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-4">
        <h3 className="line-clamp-2 font-primary text-[19px] leading-snug text-[#0B0112] transition group-hover:text-[#611192]">
          <Link href={eventHref(event)} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        {event.excerpt ? <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#6B686E]">{event.excerpt}</p> : null}
        <div className="mt-auto pt-4">
          <EventMeta event={event} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#F0EBF2] pt-3.5">
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#611192]">
            {timing === 'ended' ? 'View' : m.verb} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
          {onShare ? (
            <button type="button" onClick={() => onShare(event)} className="relative z-10 text-[12px] font-medium text-[#8A888C] hover:text-[#611192]">
              Share
            </button>
          ) : null}
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
