'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, CalendarPlus, Megaphone, Play, Search, X } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import { formatMoney } from '@/lib/money';
import { getAccountPathForRole } from '@/utils/navigationPaths';
import { type DisplayEventType, getDisplayEventType, getDonationProgress, getEventTiming } from './eventUtils';
import {
  DateBlock,
  EventStatus,
  EventTile,
  EventTileSkeleton,
  ProgressRing,
  TYPE_META,
  TypeChip,
  eventHref,
  eventImage,
  formatDateBlock,
  pickSpotlight,
  sortByStart,
  useCountdown,
  useTiming,
} from './eventUi';

type When = 'now' | 'upcoming' | 'past';
const TYPES: DisplayEventType[] = ['donation', 'poll', 'live', 'general'];

function SpotlightHero({ event }: { event: CommunityEventRecord }) {
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const d = getDonationProgress(event);
  const c = useCountdown(timing === 'upcoming' ? event.startAt : undefined);
  return (
    <Link
      href={eventHref(event)}
      className="group relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[28px] md:min-h-[340px] sm:min-h-[300px] sm:rounded-[24px]"
    >
      <Image src={eventImage(event)} alt="" fill priority sizes="(max-width: 991px) 100vw, 50vw" className="-z-10 object-cover transition duration-1000 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B0112]/95 via-[#0B0112]/40 to-transparent" />
      <span className="absolute top-4 left-4 flex gap-2">
        <span className="inline-flex h-7 items-center rounded-full bg-[#0B0112]/70 px-2.5 text-[12px] font-semibold text-white backdrop-blur">Spotlight</span>
        <TypeChip type={type} glass />
        <EventStatus event={event} timing={timing} dark />
      </span>
      <span className="block p-6 sm:p-5">
        <span className="block text-[13px] text-white/65">{event.authorName || 'Angelpage'}</span>
        <span className="mt-1 block font-primary text-[28px] leading-tight text-white sm:text-[22px]">{event.title}</span>
        <span className="mt-4 flex items-center justify-between gap-4">
          {type === 'donation' ? (
            <span className="flex items-center gap-3">
              <ProgressRing percent={d.percent} size={58} dark />
              <span className="text-[13px] text-white/70">
                <strong className="block text-[18px] font-semibold text-white">{formatMoney(d.raised, { compact: true })}</strong>
                {d.goal ? `of ${formatMoney(d.goal, { compact: true })}` : 'raised'}
              </span>
            </span>
          ) : c && !c.done ? (
            <span className="text-[13px] text-white/70">
              Starts in{' '}
              <strong className="font-semibold text-white tabular-nums">
                {c.d > 0 ? `${c.d}d ` : ''}
                {String(c.h).padStart(2, '0')}h {String(c.m).padStart(2, '0')}m {String(c.s).padStart(2, '0')}s
              </strong>
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-medium text-[#611192]">
            {type === 'live' && timing === 'live' ? (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden /> Watch
              </>
            ) : (
              <>
                {TYPE_META[type].verb} <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function EventsPageClient({ initialEvents = [] }: { initialEvents?: CommunityEventRecord[] }) {
  const { data: session } = useSession();
  const { data, isLoading } = useGetEventsQuery({ limit: 48 });
  const events = ((data as CommunityEventRecord[] | undefined)?.length ? (data as CommunityEventRecord[]) : initialEvents) || [];

  const [type, setType] = useState<DisplayEventType | 'all'>('all');
  const [when, setWhen] = useState<When>('now');
  const [query, setQuery] = useState('');

  const enriched = useMemo(() => events.map(e => ({ e, type: getDisplayEventType(e), timing: getEventTiming(e) })), [events]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    enriched.forEach(x => {
      if (x.timing === 'ended') return;
      c.all += 1;
      c[x.type] = (c[x.type] || 0) + 1;
    });
    return c;
  }, [enriched]);
  const liveNow = enriched.filter(x => x.type === 'live' && x.timing === 'live').map(x => x.e);
  const spotlight = useMemo(() => pickSpotlight(enriched.filter(x => x.timing !== 'ended').map(x => x.e)), [enriched]);
  const raisedOpen = enriched.filter(x => x.type === 'donation' && x.timing !== 'ended').reduce((s, x) => s + (Number(x.e.donationRaised) || 0), 0);

  const q = query.trim().toLowerCase();
  const filtered = enriched
    .filter(x => (type === 'all' ? true : x.type === type))
    .filter(x => (when === 'now' ? x.timing === 'open' || x.timing === 'live' : when === 'upcoming' ? x.timing === 'upcoming' : x.timing === 'ended'))
    .filter(x => !q || [x.e.title, x.e.excerpt, x.e.authorName, x.e.category].join(' ').toLowerCase().includes(q))
    .map(x => x.e)
    .sort((a, b) => (when === 'past' ? sortByStart(b, a) : sortByStart(a, b)));

  const agenda = enriched
    .filter(x => x.timing === 'upcoming' && x.e.startAt)
    .map(x => x.e)
    .sort(sortByStart)
    .slice(0, 6);

  const role = session?.user?.role;
  const isCharity = role === 'CHARITY' || role === 'CHARITY_STAFF';
  const runHref = isCharity ? `${getAccountPathForRole(role, session?.user?.id, session?.user?.charityId)}?tab=community` : '/contact';

  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative isolate overflow-hidden bg-[#0B0112]">
        <div className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[420px] w-[420px] rounded-full bg-[#611192] opacity-50 blur-[110px]" />
        <div className="custom-container grid grid-cols-[1fr_1.1fr] items-center gap-12 py-14 md:grid-cols-1 md:gap-8 sm:py-8">
          <div>
            <p className="ap-eyebrow text-[#D9B8F0]!">Events</p>
            <h1 className="ap-display mt-3 text-[52px] leading-[1.08] text-white! laptop-m:text-[44px] sm:text-[32px]">Give beside the shop</h1>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-white/70 sm:text-[14px]">
              Back an appeal, vote on what a charity funds next, or watch the work happen live.
            </p>
            <dl className="mt-8 grid max-w-[480px] grid-cols-3 gap-3 sm:mt-6">
              {(['donation', 'poll', 'live'] as const).map(t => {
                const m = TYPE_META[t];
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setWhen('now');
                      document.getElementById('events-browse')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-2xl bg-white/[0.06] p-4 text-left transition hover:bg-white/[0.12] sm:p-3"
                  >
                    <Icon className="h-4 w-4" style={{ color: m.dot === '#1B264F' ? '#fff' : m.dot }} aria-hidden />
                    <dd className="mt-2 text-[24px] font-semibold text-white sm:text-[20px]">{counts[t] || 0}</dd>
                    <dt className="text-[12px] text-white/60">{m.plural}</dt>
                  </button>
                );
              })}
            </dl>
            {raisedOpen > 0 ? (
              <p className="mt-4 text-[13px] text-white/55">
                <strong className="font-semibold text-white">{formatMoney(raisedOpen, { compact: true })}</strong> raised across open appeals
              </p>
            ) : null}
          </div>
          {spotlight ? <SpotlightHero event={spotlight} /> : isLoading ? <div className="min-h-[380px] animate-pulse rounded-[28px] bg-white/[0.06]" /> : null}
        </div>
      </section>

      {/* live strip */}
      {liveNow.length ? (
        <div className="border-b border-[#F7D6DE] bg-[#FFF5F7]">
          <div className="custom-container ap-no-scrollbar flex items-center gap-4 overflow-x-auto py-3">
            <span className="inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold text-[#B80030]">
              <span className="ap-live-dot" aria-hidden /> Live now
            </span>
            {liveNow.map(e => (
              <Link key={e._id} href={eventHref(e)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] text-[#0B0112] ring-1 ring-[#F7D6DE] hover:ring-[#E50035]">
                {e.title}
                <ArrowRight className="h-3.5 w-3.5 text-[#B80030]" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* filters */}
      <div id="events-browse" className="sticky top-0 z-30 scroll-mt-0 border-b border-[#F0EBF2] bg-white/95 backdrop-blur-md">
        <div className="custom-container flex items-center gap-4 py-3 md:flex-wrap sm:gap-2.5">
          <div className="ap-no-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 md:order-2 md:basis-full" role="tablist" aria-label="Event type">
            {(['all', ...TYPES] as const).map(t => {
              const active = type === t;
              const label = t === 'all' ? 'All' : TYPE_META[t].plural;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setType(t)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition ${
                    active ? 'bg-[#611192] text-white' : 'bg-[#F6F3F7] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'
                  }`}
                >
                  {t !== 'all' ? <span className="h-2 w-2 rounded-full" style={{ background: active ? '#fff' : TYPE_META[t].dot }} aria-hidden /> : null}
                  {label}
                  <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-white text-[#8A888C]'}`}>{counts[t] || 0}</span>
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 rounded-full bg-[#F6F3F7] p-1 md:order-1" role="radiogroup" aria-label="When">
            {(
              [
                ['now', 'Open now'],
                ['upcoming', 'Upcoming'],
                ['past', 'Past'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={when === k}
                onClick={() => setWhen(k)}
                className={`h-8 rounded-full px-3.5 text-[13px] font-medium transition ${when === k ? 'bg-white text-[#611192] shadow-sm' : 'text-[#6B686E]'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="relative w-[220px] shrink-0 md:order-1 md:ml-auto sm:w-full sm:basis-full">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events"
              className="h-10 w-full rounded-full bg-[#F6F3F7] pr-9 pl-10 text-[14px] outline-none placeholder:text-[#8A888C] focus:bg-white focus:ring-2 focus:ring-[#611192]/30"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8A888C]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </label>
        </div>
      </div>

      <div className="custom-container py-10 sm:py-6">
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-10 lg:grid-cols-1">
          <div>
            {isLoading && !events.length ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <EventTileSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-1 sm:gap-4">
                {filtered.map((e, i) => (
                  <EventTile key={e._id} event={e} priority={i < 2} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-[#FCF7FE] px-6 py-14 text-center">
                <p className="font-primary text-[24px] text-[#0B0112]">Nothing here right now</p>
                <p className="mt-2 text-[14px] text-[#6B686E]">
                  {when === 'now' ? 'No events are open for this filter. Try Upcoming.' : 'Try another filter or search.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setType('all');
                    setQuery('');
                    setWhen(when === 'now' ? 'upcoming' : 'now');
                  }}
                  className="mt-5 inline-flex h-10 items-center rounded-full bg-[#611192] px-5 text-[14px] font-medium text-white"
                >
                  {when === 'now' ? 'Show upcoming' : 'Show open events'}
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 sm:grid-cols-1">
            {agenda.length ? (
              <div className="rounded-[24px] border border-[#ECE8EE] p-5">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-[#8A888C] uppercase">Coming up</p>
                <ol className="mt-4 space-y-1">
                  {agenda.map(e => {
                    const t = getDisplayEventType(e);
                    const b = formatDateBlock(e.startAt);
                    return (
                      <li key={e._id}>
                        <Link href={eventHref(e)} className="group -mx-2 flex items-center gap-3 rounded-2xl p-2 transition hover:bg-[#FCF7FE]">
                          <DateBlock iso={e.startAt} size="sm" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-[12px] text-[#8A888C]">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_META[t].dot }} aria-hidden />
                              {TYPE_META[t].label} · {b?.time}
                            </span>
                            <span className="line-clamp-2 block text-[14px] font-medium leading-snug text-[#0B0112] group-hover:text-[#611192]">{e.title}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
            <div className="relative overflow-hidden rounded-[24px] bg-[#F6EEFA] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#611192]">
                {isCharity ? <CalendarPlus className="h-5 w-5" aria-hidden /> : <Megaphone className="h-5 w-5" aria-hidden />}
              </span>
              <p className="mt-4 font-primary text-[22px] leading-snug text-[#0B0112]">Run your own event</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
                {isCharity
                  ? 'Create an appeal, a poll or a live session from the Community tab in your dashboard.'
                  : 'Charities on Angelpage can run appeals, polls and live sessions. Get in touch to bring yours on board.'}
              </p>
              <Link href={runHref} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#611192] px-4 text-[13px] font-medium text-white transition hover:bg-[#4C0D73]">
                {isCharity ? 'Create an event' : 'Get in touch'} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
