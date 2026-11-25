'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import { formatMoney } from '@/lib/money';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import { getDisplayEventType, getDonationProgress, getEventTiming } from '@/components/features/events/eventUtils';
import {
  DateBlock,
  EventStatus,
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
} from '@/components/features/events/eventUi';
import InlinePoll from '@/components/features/events/InlinePoll';

const QUICK_AMOUNTS = [10, 25, 50];

function Countdown({ to }: { to?: string }) {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  const cells = [
    ['d', c.d],
    ['h', c.h],
    ['m', c.m],
    ['s', c.s],
  ] as const;
  return (
    <div className="flex gap-2" aria-label="Starts in">
      {cells.map(([k, v]) => (
        <span key={k} className="flex w-14 flex-col items-center rounded-xl bg-white/10 py-2 sm:w-12">
          <span className="text-[20px] font-semibold text-white tabular-nums sm:text-[18px]">{String(v).padStart(2, '0')}</span>
          <span className="text-[10px] tracking-[0.14em] text-white/55 uppercase">{k}</span>
        </span>
      ))}
    </div>
  );
}

function Spotlight({ event }: { event: CommunityEventRecord }) {
  const router = useRouter();
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const d = getDonationProgress(event);

  return (
    <article className="group relative isolate flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[28px] md:min-h-[460px] sm:min-h-[440px] sm:rounded-[24px]">
      <Image src={eventImage(event)} alt="" fill sizes="(max-width: 991px) 100vw, 58vw" className="-z-10 object-cover transition duration-1000 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B0112] via-[#0B0112]/60 to-[#0B0112]/5" />
      <div className="absolute top-5 left-5 flex gap-2 sm:top-4 sm:left-4">
        <TypeChip type={type} glass />
        <EventStatus event={event} timing={timing} dark />
      </div>

      <div className="p-8 md:p-7 sm:p-5">
        <p className="text-[13px] text-white/65">{event.authorName || 'Angelpage'}</p>
        <h3 className="mt-2 max-w-[560px] font-primary text-[34px] leading-[1.15] text-white md:text-[30px] sm:text-[24px]">
          <Link href={eventHref(event)} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        {event.excerpt ? <p className="mt-3 line-clamp-2 max-w-[520px] text-[15px] text-white/75 sm:text-[14px]">{event.excerpt}</p> : null}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-5 sm:mt-5">
          {type === 'donation' ? (
            <>
              <div className="flex items-center gap-4">
                <ProgressRing percent={d.percent} dark />
                <div>
                  <p className="text-[24px] font-semibold text-white">{formatMoney(d.raised, { compact: true })}</p>
                  <p className="text-[13px] text-white/60">{d.goal ? `raised of ${formatMoney(d.goal, { compact: true })}` : 'raised so far'}</p>
                </div>
              </div>
              {timing !== 'ended' ? (
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => router.push(buildDonationCheckoutUrl(event, { amount: a }))}
                      className="h-11 rounded-full border border-white/25 px-4 text-[14px] font-medium text-white transition hover:bg-white hover:text-[#611192]"
                    >
                      {formatMoney(a).replace(/\.00$/, '')}
                    </button>
                  ))}
                  <Link href={eventHref(event)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-medium text-[#611192] transition hover:bg-[#F2E8F8]">
                    Give <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </>
          ) : type === 'live' && timing === 'live' && event.liveStreamUrl ? (
            <a
              href={event.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#E50035] px-6 text-[15px] font-medium text-white transition hover:bg-[#C4002D]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden /> Watch live
            </a>
          ) : (
            <>
              {timing === 'upcoming' ? <Countdown to={event.startAt} /> : <span />}
              <Link href={eventHref(event)} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-[#611192] transition hover:bg-[#F2E8F8]">
                {timing === 'upcoming' ? 'Remind me' : 'View event'} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function AgendaRow({ event }: { event: CommunityEventRecord }) {
  const type = getDisplayEventType(event);
  const b = formatDateBlock(event.startAt);
  const m = TYPE_META[type];
  return (
    <li>
      <Link href={eventHref(event)} className="group flex items-center gap-4 rounded-2xl p-2.5 transition hover:bg-white/[0.06]">
        {event.startAt ? <DateBlock iso={event.startAt} size="sm" /> : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[12px] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} aria-hidden />
            {m.label}
            {b ? ` · ${b.weekday} ${b.time}` : ''}
          </span>
          <span className="mt-0.5 line-clamp-1 block text-[15px] font-medium text-white">{event.title}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover:text-white" aria-hidden />
      </Link>
    </li>
  );
}

/** Home "Events for good" band: spotlight, a poll you can vote on in place, and what's next. */
const HomeEventsSection = () => {
  const { data = [], isLoading } = useGetEventsQuery({ limit: 12 });
  const events = data as CommunityEventRecord[];

  const { spotlight, poll, upcoming } = useMemo(() => {
    const active = events.filter(e => getEventTiming(e) !== 'ended');
    const spot = pickSpotlight(active.length ? active : events);
    const pollEvent = active.find(e => e._id !== spot?._id && getDisplayEventType(e) === 'poll' && (e.pollOptions?.length || 0) > 0);
    const next = active
      .filter(e => e._id !== spot?._id && e._id !== pollEvent?._id && e.startAt && getEventTiming(e) === 'upcoming')
      .sort(sortByStart)
      .slice(0, 4);
    return { spotlight: spot, poll: pollEvent, upcoming: next };
  }, [events]);

  if (!isLoading && !spotlight) return null;

  return (
    <section className="ap-section relative isolate overflow-hidden bg-[#0B0112]">
      <div className="pointer-events-none absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] rounded-full bg-[#611192] opacity-40 blur-[120px]" />
      <div className="custom-container">
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-5">
          <div>
            <p className="ap-eyebrow text-[#D9B8F0]!">Events</p>
            <h2 className="ap-display mt-2 text-[34px] leading-tight text-white! md:text-[28px] sm:text-[24px]">Give, vote and tune in</h2>
            <p className="mt-2 max-w-[520px] text-[15px] text-white/65 sm:text-[13px]">Appeals, community polls and live sessions from the charities on Angelpage.</p>
          </div>
          <Link href="/events" className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-white">
            All events <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {isLoading || !spotlight ? (
          <div className="grid grid-cols-[1.4fr_1fr] gap-5 md:grid-cols-1" aria-hidden>
            <div className="min-h-[520px] animate-pulse rounded-[28px] bg-white/[0.06]" />
            <div className="min-h-[520px] animate-pulse rounded-[28px] bg-white/[0.06] md:hidden" />
          </div>
        ) : (
          <div className={`grid gap-5 ${poll || upcoming.length ? 'grid-cols-[1.4fr_1fr] md:grid-cols-1' : 'grid-cols-1'}`}>
            <Spotlight event={spotlight} />
            {poll || upcoming.length ? (
              <div className="flex flex-col gap-5">
                {poll ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:rounded-[24px] sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <TypeChip type="poll" glass />
                      <Link href={eventHref(poll)} className="text-[13px] text-white/60 hover:text-white">
                        Details
                      </Link>
                    </div>
                    <p className="mt-3 text-[12px] text-white/50">{poll.authorName || 'Angelpage'}</p>
                    <div className="mt-1">
                      <InlinePoll event={poll} dark />
                    </div>
                  </div>
                ) : null}
                {upcoming.length ? (
                  <div className="flex-1 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[24px]">
                    <p className="px-2.5 pt-2 pb-1 text-[12px] font-semibold tracking-[0.16em] text-white/50 uppercase">Up next</p>
                    <ul>
                      {upcoming.map(e => (
                        <AgendaRow key={e._id} event={e} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeEventsSection;
