'use client';

import React, { useMemo, useState } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  HandHeart,
  Play,
  Radio,
} from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import { formatMoney } from '@/lib/money';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import {
  type DisplayEventType,
  getDisplayEventType,
  getDonationProgress,
  getEventTiming,
} from '@/components/features/events/eventUtils';
import {
  EventMeta,
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

const money = (n: number) => formatMoney(n).replace(/\.00$/, '');

const FILTERS: { id: 'all' | DisplayEventType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'donation', label: 'Appeals' },
  { id: 'live', label: 'Live' },
  { id: 'poll', label: 'Votes' },
  { id: 'general', label: 'Community' },
];

function Countdown({ to, label }: { to?: string; label: string }) {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  const cells = [
    ['days', c.d],
    ['hrs', c.h],
    ['min', c.m],
  ] as const;
  return (
    <div aria-label={label}>
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
        {label}
      </p>
      <div className="flex gap-1.5">
        {cells.map(([k, v]) => (
          <span
            key={k}
            className="flex w-14 flex-col items-center rounded-xl bg-[#F6F1F9] py-2"
          >
            <span className="font-primary text-[22px] leading-none text-[#0B0112] tabular-nums">
              {String(v).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[10px] font-medium text-[#8A888C]">
              {k}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Featured({ event }: { event: CommunityEventRecord }) {
  const router = useRouter();
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const d = getDonationProgress(event);
  const b = formatDateBlock(event.startAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-[#ECE8EE] shadow-[0_24px_60px_rgba(59,5,92,0.08)] sm:rounded-[24px]">
      <Link
        href={eventHref(event)}
        className="relative block aspect-[16/9] overflow-hidden bg-[#F2E8F8]"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={eventImage(event)}
          alt=""
          fill
          sizes="(max-width: 991px) 100vw, 56vw"
          className="object-cover transition duration-1000 group-hover:scale-[1.03]"
        />
        <span className="absolute top-4 left-4 flex gap-2">
          <TypeChip type={type} glass />
          <EventStatus event={event} timing={timing} />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-7 md:p-6 sm:p-5">
        <p className="text-[13px] text-[#8A888C]">
          {event.authorName || 'Angelpage'}
          {b
            ? ` · ${b.weekday} ${b.month.charAt(0)}${b.month.slice(1).toLowerCase()} ${b.day}, ${b.time}`
            : ''}
        </p>
        <h3 className="mt-2 font-primary text-[30px] leading-[1.18] text-balance text-[#0B0112] md:text-[26px] sm:text-[23px]">
          <Link href={eventHref(event)} className="hover:text-[#611192]">
            {event.title}
          </Link>
        </h3>
        {event.excerpt ? (
          <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-[#6B686E] sm:text-[14px]">
            {event.excerpt}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          {type === 'donation' ? (
            <div className="flex flex-wrap items-center justify-between gap-5 rounded-[20px] bg-[#FAF6FC] p-4">
              <div className="flex items-center gap-4">
                <ProgressRing percent={d.percent} size={68} />
                <div>
                  <p className="text-[22px] leading-none font-semibold text-[#0B0112] tabular-nums">
                    {money(d.raised)}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6B686E]">
                    {d.goal
                      ? `raised of ${money(d.goal)} goal`
                      : 'raised so far'}
                  </p>
                </div>
              </div>
              {timing !== 'ended' ? (
                <div className="flex gap-2 sm:w-full">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        buildDonationCheckoutUrl(event, { amount: 50 })
                      )
                    }
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[#611192] px-6 text-[14.5px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73] sm:flex-1 sm:justify-center"
                  >
                    <HandHeart className="h-4 w-4" aria-hidden /> Donate
                  </button>
                  <Link
                    href={eventHref(event)}
                    className="inline-flex h-12 items-center rounded-full bg-white px-5 text-[14px] font-medium text-[#0B0112] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]"
                  >
                    Details
                  </Link>
                </div>
              ) : null}
            </div>
          ) : type === 'live' && timing === 'live' && event.liveStreamUrl ? (
            <a
              href={event.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#E50035] px-6 text-[15px] font-semibold text-white transition hover:bg-[#C4002D]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden /> Watch live
              now
            </a>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-5">
              {timing === 'upcoming' ? (
                <Countdown to={event.startAt} label="Starts in" />
              ) : (
                <span />
              )}
              <Link
                href={eventHref(event)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0B0112] px-6 text-[14.5px] font-semibold text-white transition hover:bg-[#2A1A35]"
              >
                {timing === 'upcoming' ? 'Save the date' : 'View event'}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CompactRow({ event }: { event: CommunityEventRecord }) {
  const type = getDisplayEventType(event);
  return (
    <li>
      <Link
        href={eventHref(event)}
        className="group flex gap-4 rounded-[20px] bg-white p-3 ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(59,5,92,0.08)]"
      >
        <span className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-[#F2E8F8]">
          <Image
            src={eventImage(event)}
            alt=""
            fill
            sizes="92px"
            className="object-cover"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-1">
          <span
            className="flex items-center gap-1.5 text-[11.5px] font-semibold"
            style={{ color: TYPE_META[type].ink }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: TYPE_META[type].dot }}
              aria-hidden
            />
            {TYPE_META[type].label}
          </span>
          <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-[#0B0112] group-hover:text-[#611192]">
            {event.title}
          </span>
          <EventMeta event={event} />
        </span>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 self-center text-[#B9B3BD] transition group-hover:text-[#611192]"
          aria-hidden
        />
      </Link>
    </li>
  );
}

/** Home "Events & fundraising": real totals, a featured cause, what's next and a vote you can cast in place. */
const HomeEventsSection = () => {
  const { data = [], isLoading } = useGetEventsQuery({ limit: 16 });
  const events = data as CommunityEventRecord[];
  const [filter, setFilter] = useState<'all' | DisplayEventType>('all');

  const { open, stats } = useMemo(() => {
    const live = events.filter(e => getEventTiming(e) !== 'ended');
    const appeals = live.filter(e => getDisplayEventType(e) === 'donation');
    return {
      open: live,
      stats: {
        appeals: appeals.length,
        raised: appeals.reduce((s, e) => s + getDonationProgress(e).raised, 0),
        upcoming: live.filter(e => getEventTiming(e) === 'upcoming').length,
      },
    };
  }, [events]);

  const { featured, rest, poll } = useMemo(() => {
    const pool = (
      filter === 'all'
        ? open
        : open.filter(e => getDisplayEventType(e) === filter)
    ).slice();
    const spot = pickSpotlight(
      pool.length ? pool : filter === 'all' ? events : []
    );
    const pollEvent =
      filter === 'all'
        ? open.find(
            e =>
              e._id !== spot?._id &&
              getDisplayEventType(e) === 'poll' &&
              (e.pollOptions?.length || 0) > 0
          )
        : undefined;
    const others = pool
      .filter(e => e._id !== spot?._id && e._id !== pollEvent?._id)
      .sort(sortByStart)
      .slice(0, pollEvent ? 2 : 3);
    return { featured: spot, rest: others, poll: pollEvent };
  }, [open, events, filter]);

  const presentTypes = new Set(open.map(getDisplayEventType));
  const filters = FILTERS.filter(f => f.id === 'all' || presentTypes.has(f.id));

  if (!isLoading && events.length === 0) return null;

  return (
    <section className="ap-section relative isolate overflow-hidden bg-gradient-to-b from-[#FAF6FC] to-white">
      <div className="custom-container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-6">
          <div className="max-w-[600px]">
            <p className="ap-eyebrow">Events &amp; fundraising</p>
            <h2 className="ap-display mt-2 text-[38px] leading-[1.12] md:text-[32px] sm:text-[27px]">
              Join a cause this week
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6B686E] sm:text-[14px]">
              Give to an appeal, vote on where funds go next, or join a charity
              live. Every event is run by a charity on Angelpage.
            </p>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#611192]"
          >
            All events{' '}
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {/* real numbers, only when there is something to count */}
        {!isLoading && (stats.appeals || stats.upcoming) ? (
          <ul className="mb-6 flex flex-wrap gap-2 text-[13px]">
            {stats.appeals ? (
              <li className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-[#ECE8EE]">
                <HandHeart className="h-4 w-4 text-[#611192]" aria-hidden />
                <span>
                  <strong className="font-semibold">{stats.appeals}</strong>{' '}
                  appeal{stats.appeals === 1 ? '' : 's'} open
                  {stats.raised ? (
                    <>
                      {' '}
                      ·{' '}
                      <strong className="font-semibold">
                        {money(stats.raised)}
                      </strong>{' '}
                      raised
                    </>
                  ) : null}
                </span>
              </li>
            ) : null}
            {stats.upcoming ? (
              <li className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-[#ECE8EE]">
                <CalendarDays className="h-4 w-4 text-[#611192]" aria-hidden />
                <span>
                  <strong className="font-semibold">{stats.upcoming}</strong>{' '}
                  coming up
                </span>
              </li>
            ) : null}
            {presentTypes.has('live') ? (
              <li className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-[#ECE8EE]">
                <Radio className="h-4 w-4 text-[#E50035]" aria-hidden /> Live
                sessions
              </li>
            ) : null}
          </ul>
        ) : null}

        {filters.length > 2 ? (
          <div
            role="tablist"
            aria-label="Event type"
            className="ap-no-scrollbar mb-6 flex gap-1.5 overflow-x-auto sm:-mx-4 sm:px-4"
          >
            {filters.map(f => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`h-10 shrink-0 rounded-full px-4 text-[13.5px] font-medium transition ${filter === f.id ? 'bg-[#0B0112] text-white' : 'bg-white text-[#474648] ring-1 ring-[#E2DCE6] hover:ring-[#611192]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}

        {isLoading ? (
          <div
            className="grid grid-cols-[1.25fr_1fr] gap-5 md:grid-cols-1"
            aria-hidden
          >
            <div className="min-h-[520px] animate-pulse rounded-[28px] bg-[#F2E8F8]" />
            <div className="space-y-3 md:hidden">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-[116px] animate-pulse rounded-[20px] bg-[#F2E8F8]"
                />
              ))}
            </div>
          </div>
        ) : !featured ? (
          <p className="rounded-[24px] bg-white px-6 py-10 text-center text-[14.5px] text-[#6B686E] ring-1 ring-[#ECE8EE]">
            Nothing of this kind is open right now. Try another filter.
          </p>
        ) : (
          <div
            className={`grid gap-5 ${rest.length || poll ? 'grid-cols-[1.25fr_1fr] md:grid-cols-1' : 'grid-cols-1'}`}
          >
            <Featured event={featured} />
            {rest.length || poll ? (
              <div className="flex flex-col gap-4">
                {rest.length ? (
                  <div>
                    <p className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                      Up next
                    </p>
                    <ul className="space-y-3">
                      {rest.map(e => (
                        <CompactRow key={e._id} event={e} />
                      ))}
                    </ul>
                  </div>
                ) : null}
                {poll ? (
                  <div className="rounded-[24px] bg-[#0B0112] p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold tracking-[0.14em] text-[#D9B8F0] uppercase">
                        Have your say
                      </p>
                      <Link
                        href={eventHref(poll)}
                        className="text-[12px] font-medium text-white/70 hover:text-white"
                      >
                        Details
                      </Link>
                    </div>
                    <div className="mt-3 rounded-2xl bg-white p-4 text-[#0B0112]">
                      <InlinePoll event={poll} />
                    </div>
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
