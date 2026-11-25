'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, CalendarDays, Clock3, Search, X } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import { formatMoney } from '@/lib/money';
import { getAccountPathForRole } from '@/utils/navigationPaths';
import EventShareModal, { type EventSharePayload } from './EventShareModal';
import { type DisplayEventType, getDisplayEventType, getDonationProgress, getEventTiming } from './eventUtils';
import {
  DateBlock,
  EventStatus,
  EventTile,
  EventTileSkeleton,
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

type When = 'open' | 'upcoming' | 'past';
const TYPES: DisplayEventType[] = ['donation', 'poll', 'live', 'general'];

export function CountdownCells({ to, dark = false, label }: { to?: string; dark?: boolean; label?: string }) {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  const cells = [
    ['Days', c.d],
    ['Hrs', c.h],
    ['Min', c.m],
    ['Sec', c.s],
  ] as const;
  return (
    <div>
      {label ? <p className={`mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase ${dark ? 'text-white/60' : 'text-[#8A888C]'}`}>{label}</p> : null}
      <div className="flex gap-2">
        {cells.map(([k, v]) => (
          <span
            key={k}
            className={`flex w-[52px] flex-col items-center rounded-xl py-2 ${dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-[#F6F3F7] ring-1 ring-[#ECE8EE]'}`}
          >
            <span className={`font-primary text-[22px] leading-none tabular-nums ${dark ? 'text-white' : 'text-[#0B0112]'}`}>{String(v).padStart(2, '0')}</span>
            <span className={`mt-1 text-[9px] tracking-[0.12em] uppercase ${dark ? 'text-white/55' : 'text-[#8A888C]'}`}>{k}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SpotlightCard({ event }: { event: CommunityEventRecord }) {
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const d = getDonationProgress(event);
  const countTo = timing === 'upcoming' ? event.startAt : event.endAt;
  return (
    <article className="relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[24px] ring-1 ring-white/10">
      <Image src={eventImage(event)} alt="" fill priority sizes="(max-width: 991px) 100vw, 45vw" className="-z-10 object-cover" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#14021F] via-[#14021F]/80 to-[#14021F]/40" />
      <div className="p-6 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-semibold text-[#611192] shadow-sm">✦ Spotlight</span>
          <TypeChip type={type} glass />
        </div>
        <div className="mt-3">
          <EventStatus event={event} timing={timing} dark />
        </div>
        <h2 className="mt-3 font-primary text-[28px] leading-tight text-white sm:text-[24px]">
          <Link href={eventHref(event)} className="hover:underline">
            {event.title}
          </Link>
        </h2>
        {event.excerpt ? <p className="mt-2 line-clamp-2 text-[14px] text-white/70">{event.excerpt}</p> : null}
        {type === 'donation' ? (
          <div className="mt-4 max-w-[340px]">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, d.percent)}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-white/70">
              <strong className="font-semibold text-white">{formatMoney(d.raised).replace(/\.00$/, '')}</strong>
              {d.goal ? ` raised of ${formatMoney(d.goal).replace(/\.00$/, '')}` : ' raised'}
            </p>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          {countTo && timing !== 'ended' ? <CountdownCells to={countTo} dark label={timing === 'upcoming' ? 'Starts in' : 'Closes in'} /> : <span />}
          <Link href={eventHref(event)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition hover:bg-[#F2E8F8]">
            {type === 'donation' ? 'Give now' : type === 'poll' ? 'Vote now' : type === 'live' ? 'Join now' : 'View event'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function EventsPageClient({ initialEvents = [] }: { initialEvents?: CommunityEventRecord[] }) {
  const { data: session } = useSession();
  const { data, isLoading } = useGetEventsQuery({ limit: 48 });
  const events = ((data as CommunityEventRecord[] | undefined)?.length ? (data as CommunityEventRecord[]) : initialEvents) || [];

  const [type, setType] = useState<DisplayEventType | 'all'>('all');
  const [when, setWhen] = useState<When>('open');
  const [query, setQuery] = useState('');
  const [share, setShare] = useState<EventSharePayload | null>(null);

  const enriched = useMemo(() => events.map(e => ({ e, type: getDisplayEventType(e), timing: getEventTiming(e) })), [events]);
  const isOpen = (t: string) => t === 'open' || t === 'live';
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    enriched.forEach(x => {
      if (!isOpen(x.timing)) return;
      c.all += 1;
      c[x.type] = (c[x.type] || 0) + 1;
    });
    return c;
  }, [enriched]);
  const liveNow = enriched.filter(x => x.type === 'live' && x.timing === 'live').map(x => x.e);
  const spotlight = useMemo(() => pickSpotlight(enriched.filter(x => x.timing !== 'ended').map(x => x.e)), [enriched]);

  const q = query.trim().toLowerCase();
  const filtered = enriched
    .filter(x => (type === 'all' ? true : x.type === type))
    .filter(x => (when === 'open' ? isOpen(x.timing) : when === 'upcoming' ? x.timing === 'upcoming' : x.timing === 'ended'))
    .filter(x => !q || [x.e.title, x.e.excerpt, x.e.authorName, x.e.category].join(' ').toLowerCase().includes(q))
    .map(x => x.e)
    .sort((a, b) => (when === 'past' ? sortByStart(b, a) : sortByStart(a, b)));

  const agenda = enriched
    .filter(x => x.timing === 'upcoming' && x.e.startAt)
    .map(x => x.e)
    .sort(sortByStart)
    .slice(0, 6);
  const agendaByMonth = agenda.reduce<{ month: string; items: CommunityEventRecord[] }[]>((acc, e) => {
    const month = new Date(e.startAt!).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const last = acc[acc.length - 1];
    if (last && last.month === month) last.items.push(e);
    else acc.push({ month, items: [e] });
    return acc;
  }, []);

  const role = session?.user?.role;
  const isCharity = role === 'CHARITY' || role === 'CHARITY_STAFF';
  const runHref = isCharity ? `${getAccountPathForRole(role, session?.user?.id, session?.user?.charityId)}?tab=community` : '/blog/appeals-polls-and-live-sessions';

  const openShare = (e: CommunityEventRecord) =>
    setShare({
      id: e.slug || e._id,
      title: e.title,
      description: e.excerpt,
      tag: TYPE_META[getDisplayEventType(e)].label,
      url: typeof window !== 'undefined' ? `${window.location.origin}${eventHref(e)}` : eventHref(e),
    });

  const heading = when === 'open' ? 'Open now' : when === 'upcoming' ? 'Upcoming' : 'Past events';

  return (
    <div className="bg-[#FAF8FB]">
      {/* hero */}
      <section className="custom-container pt-6 sm:px-0! sm:pt-0">
        <div className="relative isolate grid grid-cols-[1fr_1.15fr] items-center gap-8 overflow-hidden rounded-[32px] bg-[#14021F] p-10 md:grid-cols-1 md:p-8 sm:rounded-none sm:rounded-b-[28px] sm:p-5 sm:pb-6">
          <div className="pointer-events-none absolute -top-32 -left-20 -z-10 h-[420px] w-[420px] rounded-full bg-[#611192] opacity-60 blur-[110px]" />
          <div>
            <p className="ap-eyebrow text-[#D9B8F0]!">Events</p>
            <h1 className="ap-display mt-4 text-[48px] leading-[1.08] text-white! laptop-m:text-[42px] sm:text-[32px]">Give, vote and watch it happen.</h1>
            <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-white/70 sm:text-[14px]">
              Charity appeals, community votes and live sessions, all in one place. Pick one and get involved in a tap.
            </p>
            <div className="mt-7 grid max-w-[420px] grid-cols-3 gap-2.5">
              {(['donation', 'poll', 'live'] as const).map(t => {
                const m = TYPE_META[t];
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setWhen('open');
                      document.getElementById('events-browse')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-2xl bg-white/[0.07] p-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/[0.12]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                      <Icon className="h-4 w-4" style={{ color: m.dot }} aria-hidden />
                    </span>
                    <span className="mt-3 block font-primary text-[24px] leading-none text-white">{counts[t] || 0}</span>
                    <span className="mt-1 block text-[12px] text-white/60">{m.counter}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {spotlight ? (
            <SpotlightCard event={spotlight} />
          ) : isLoading ? (
            <div className="min-h-[320px] animate-pulse rounded-[24px] bg-white/[0.06]" />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] bg-white/[0.05] p-8 text-center ring-1 ring-white/10">
              <CalendarDays className="h-8 w-8 text-white/70" aria-hidden />
              <p className="mt-4 font-primary text-[22px] text-white">New events are on the way</p>
              <p className="mt-2 max-w-[300px] text-[14px] text-white/60">Charities add appeals, votes and live sessions regularly. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* filters */}
      <div id="events-browse" className="sticky top-0 z-30 mt-6 border-y border-[#ECE8EE] bg-white/95 backdrop-blur-md sm:mt-4">
        <div className="custom-container flex items-center gap-3 py-3 md:flex-wrap sm:gap-2.5">
          <div className="ap-no-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 md:order-2 md:basis-full" role="tablist" aria-label="Event type">
            {(['all', ...TYPES] as const).map(t => {
              const active = type === t;
              const Icon = t === 'all' ? CalendarDays : TYPE_META[t].icon;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setType(t)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition ${
                    active ? 'bg-[#0B0112] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {t === 'all' ? 'All events' : TYPE_META[t].filter}
                  <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-white text-[#8A888C]'}`}>{counts[t] || 0}</span>
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 rounded-full bg-[#F4F1F6] p-1 md:order-1" role="radiogroup" aria-label="When">
            {(
              [
                ['open', 'Open'],
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
          <label className="relative w-[230px] shrink-0 md:order-1 md:ml-auto md:min-w-0 md:flex-1 md:basis-[160px]">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events"
              className="h-10 w-full rounded-full bg-white pr-9 pl-10 text-[14px] ring-1 ring-[#ECE8EE] outline-none placeholder:text-[#8A888C] focus:ring-2 focus:ring-[#611192]/30"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8A888C]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </label>
        </div>
      </div>

      <div className="custom-container pt-8 pb-16 sm:pt-5 sm:pb-8">
        {/* live strip */}
        {liveNow.length ? (
          <section className="mb-8 sm:mb-6" aria-label="Live now">
            <h2 className="flex items-center gap-2 font-primary text-[18px] text-[#0B0112]">
              <span className="h-2 w-2 rounded-full bg-[#E50035]" aria-hidden /> Live now
            </h2>
            <div className="ap-no-scrollbar mt-3 -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {liveNow.map(e => (
                <Link
                  key={e._id}
                  href={eventHref(e)}
                  className="flex w-[300px] shrink-0 items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-[#ECE8EE] transition hover:ring-[#E50035]/40"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F2E8F8]">
                    <Image src={eventImage(e)} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[#0B0112]">{e.title}</span>
                    <span className="block truncate text-[12px] text-[#8A888C]">{e.authorName || 'Angelpage'}</span>
                  </span>
                  <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#E50035] px-3.5 text-[12px] font-semibold text-white">Join</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="ap-display text-[28px] sm:text-[24px]">{heading}</h2>
          <span className="text-[13px] text-[#8A888C]">
            {filtered.length} event{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoading && !events.length ? (
          <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventTileSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1 sm:gap-4">
            {filtered.map((e, i) => (
              <EventTile key={e._id} event={e} priority={i < 3} onShare={openShare} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-[420px] rounded-[24px] bg-white px-6 py-12 text-center ring-1 ring-[#ECE8EE]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192]">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-5 font-primary text-[22px] text-[#0B0112]">No events match</p>
            <p className="mt-2 text-[14px] text-[#6B686E]">Try another type, or look at upcoming and past events.</p>
            <button
              type="button"
              onClick={() => {
                setType('all');
                setQuery('');
                setWhen('open');
              }}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[#611192] px-6 text-[14px] font-medium text-white"
            >
              Show all open events
            </button>
          </div>
        )}

        {/* coming up + charities */}
        <div className="mt-14 grid grid-cols-[1.1fr_1fr] gap-5 md:grid-cols-1 sm:mt-10">
          <section className="rounded-[24px] bg-white p-6 ring-1 ring-[#ECE8EE] sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-primary text-[22px] text-[#0B0112]">Coming up</h2>
              <Clock3 className="h-5 w-5 text-[#8A888C]" aria-hidden />
            </div>
            {agendaByMonth.length ? (
              agendaByMonth.map(group => (
                <div key={group.month} className="mt-5">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8A888C]">{group.month}</p>
                  <ul className="mt-2 divide-y divide-[#F0EBF2]">
                    {group.items.map(e => {
                      const t = getDisplayEventType(e);
                      const b = formatDateBlock(e.startAt);
                      return (
                        <li key={e._id}>
                          <Link href={eventHref(e)} className="group flex items-center gap-4 py-3">
                            <DateBlock iso={e.startAt} size="sm" weekday />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-semibold text-[#0B0112] group-hover:text-[#611192]">{e.title}</span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8A888C]">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_META[t].dot }} aria-hidden />
                                {TYPE_META[t].label} · {b?.time}
                              </span>
                            </span>
                            <ArrowRight className="h-4 w-4 text-[#C9C4CC] transition group-hover:text-[#611192]" aria-hidden />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            ) : (
              <p className="mt-5 rounded-2xl bg-[#FAF8FB] px-4 py-8 text-center text-[13px] text-[#8A888C]">Nothing scheduled yet. New dates appear here first.</p>
            )}
          </section>

          <section className="rounded-[24px] bg-[#FBF4FE] p-6 sm:p-5">
            <p className="ap-eyebrow">For charities</p>
            <h2 className="mt-3 font-primary text-[26px] text-[#0B0112]">Run your own event</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">
              Launch an appeal with a goal, let supporters vote on what happens next, or go live from the field. Every event gets its own shareable page.
            </p>
            <ul className="mt-5 space-y-2">
              {(['donation', 'poll', 'live'] as const).map(t => {
                const m = TYPE_META[t];
                const Icon = m.icon;
                return (
                  <li key={t} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[14px] text-[#0B0112]">
                    <Icon className="h-4 w-4" style={{ color: m.dot }} aria-hidden />
                    {m.label}
                  </li>
                );
              })}
            </ul>
            <Link href={runHref} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#611192] px-5 text-[14px] font-medium text-white transition hover:bg-[#4C0D73]">
              {isCharity ? 'Create an event' : 'Learn how events work'} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </div>

      <EventShareModal isOpen={Boolean(share)} onClose={() => setShare(null)} event={share} />
    </div>
  );
}

