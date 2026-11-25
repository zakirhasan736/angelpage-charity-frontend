'use client';

import React, { useMemo } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import { formatMoney } from '@/lib/money';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import { getDisplayEventType, getDonationProgress, getEventTiming } from '@/components/features/events/eventUtils';
import {
  DateBlock,
  EventStatus,
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
        <span key={k} className="flex w-12 flex-col items-center rounded-xl bg-white/10 py-1.5 ring-1 ring-white/15">
          <span className="font-primary text-[20px] leading-none text-white tabular-nums">{String(v).padStart(2, '0')}</span>
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
              <div className="w-full">
                <div className="h-1.5 max-w-[340px] overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, d.percent)}%` }} />
                </div>
                <p className="mt-2 text-[13px] text-white/70">
                  <strong className="font-semibold text-white">{formatMoney(d.raised).replace(/\.00$/, '')}</strong>
                  {d.goal ? ` raised of ${formatMoney(d.goal).replace(/\.00$/, '')} · ${d.percent}%` : ' raised'}
                </p>
              </div>
              {timing !== 'ended' && event.endAt ? <Countdown to={event.endAt} /> : <span />}
              {timing !== 'ended' ? (
                <button
                  type="button"
                  onClick={() => router.push(buildDonationCheckoutUrl(event, { amount: 50 }))}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition hover:bg-[#F2E8F8]"
                >
                  Give now <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
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
      <Link href={eventHref(event)} className="group flex items-center gap-4 px-2 py-3 transition hover:bg-white/[0.04]">
        {event.startAt ? <DateBlock iso={event.startAt} size="sm" /> : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[12px] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} aria-hidden />
            {m.label}
            {b ? ` · ${b.weekday} ${b.time}` : ''}
          </span>
          <span className="mt-0.5 line-clamp-1 block text-[15px] font-medium text-white">{event.title}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover:text-white" aria-hidden />
      </Link>
    </li>
  );
}

function EventStatusFor({ event }: { event: CommunityEventRecord }) {
  const timing = useTiming(event);
  return <EventStatus event={event} timing={timing} />;
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
            <h2 className="ap-display mt-2 text-[36px] leading-tight text-white! md:text-[30px] sm:text-[26px]">Give beside the shop</h2>
            <p className="mt-2 max-w-[520px] text-[15px] text-white/65 sm:text-[13px]">Support an appeal, shape where funds go next, and join charities live from the ground.</p>
          </div>
          <Link href="/events" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0B0112] transition hover:bg-[#F2E8F8] sm:h-10 sm:px-4">
            All events <ArrowRight className="h-4 w-4" aria-hidden />
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
                  <div className="rounded-[24px] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <TypeChip type="poll" />
                      <EventStatusFor event={poll} />
                    </div>
                    <div className="mt-3">
                      <InlinePoll event={poll} />
                    </div>
                    <Link href={eventHref(poll)} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#611192]">
                      See details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                ) : null}
                {upcoming.length ? (
                  <div className="flex-1 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="px-2.5 pt-2 pb-1 text-[12px] font-semibold tracking-[0.16em] text-white/50 uppercase">Up next</p>
                    <ul className="divide-y divide-white/10">
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
