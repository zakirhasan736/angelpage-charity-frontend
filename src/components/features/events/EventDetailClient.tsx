'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  Copy,
  Loader2,
  MapPin,
  Play,
  Share2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';
import { Button } from '@/components/elements';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatMoney } from '@/lib/money';
import type { CommunityEventRecord } from '@/lib/server-api';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import {
  useGetEventBySlugQuery,
  useGetEventsQuery,
} from '@/store/api/angelpageApi';
import EventConfetti from './EventConfetti';
import EventShareModal, { type EventSharePayload } from './EventShareModal';
import { voteStorageKey } from './InlinePoll';
import { CountdownCells } from './EventsPageClient';
import {
  getAppleCalendarUrl,
  getDisplayEventType,
  getDonationProgress,
  getGoogleCalendarUrl,
  resolveEventFunds,
  toIcsDate,
} from './eventUtils';
import {
  EventStatus,
  EventTile,
  ProgressBar,
  TYPE_META,
  TypeChip,
  eventImage,
  formatDateBlock,
  useTiming,
} from './eventUi';

type EventDetailClientProps = {
  slug: string;
  initialEvent?: CommunityEventRecord | null;
};

type Option = { text: string; votes?: number };

const AMOUNTS = [20, 50, 100, 250];
const FUND_COLORS = ['#8A3FC7', '#00977A', '#C2771A', '#1B6FC2'];
const money0 = (n: number) => formatMoney(n).replace(/\.00$/, '');
const titleMonth = (m: string) => `${m.charAt(0)}${m.slice(1).toLowerCase()}`;

export default function EventDetailClient({
  slug,
  initialEvent,
}: EventDetailClientProps) {
  const { data: fetchedEvent, isLoading } = useGetEventBySlugQuery(slug, {
    skip: !slug,
  });
  const event =
    (fetchedEvent as CommunityEventRecord | undefined) ?? initialEvent ?? null;

  if (isLoading && !event) return <FullScreenLoader label="Loading event" />;
  if (!event) {
    return (
      <section className="custom-container py-24 text-center">
        <h1 className="font-primary text-[36px] text-[#0B0112]">
          Event not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-[#6B686E]">
          It may have ended or been removed.
        </p>
        <Link href="/events" className="mt-6 inline-block">
          <Button variant="primary">Browse events</Button>
        </Link>
      </section>
    );
  }
  return <EventView event={event} slug={slug} />;
}

function ShareCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-[#FBF4FE] p-4 text-left transition hover:bg-[#F6EEFA]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#611192]">
        <Share2 className="h-4 w-4" aria-hidden />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-[#0B0112]">
          Spread the word
        </span>
        <span className="block text-[12px] text-[#8A888C]">
          Share on social or messaging apps
        </span>
      </span>
    </button>
  );
}

function EventView({
  event,
  slug,
}: {
  event: CommunityEventRecord;
  slug: string;
}) {
  const router = useRouter();
  const { data: list = [] } = useGetEventsQuery({ limit: 12 });
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const meta = TYPE_META[type];
  const d = getDonationProgress(event);
  const funds = resolveEventFunds(event);
  const ended = timing === 'ended';
  const liveNow = type === 'live' && timing === 'live';

  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState('');
  const [share, setShare] = useState<EventSharePayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [url, setUrl] = useState(`/events/${slug}`);
  const [options, setOptions] = useState<Option[]>(event.pollOptions || []);
  const [choice, setChoice] = useState<number | null>(null);
  const [voted, setVoted] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/events/${event.slug || slug}`);
    setOptions(event.pollOptions || []);
    try {
      const stored = localStorage.getItem(voteStorageKey(event._id));
      setVoted(stored != null ? Number(stored) : null);
    } catch {
      /* storage blocked */
    }
  }, [event._id, event.slug, event.pollOptions, slug]);

  useEffect(() => {
    if (!calOpen) return;
    const close = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setCalOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [calOpen]);

  const celebrate = () => {
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 4500);
  };

  const giveValue = Number(custom) || amount;
  const give = () => {
    if (!giveValue || giveValue <= 0) {
      ToastService.error('Choose an amount to give.');
      return;
    }
    router.push(buildDonationCheckoutUrl(event, { amount: giveValue }));
  };

  const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0);
  const castVote = async () => {
    if (voted !== null || ended) return;
    if (choice === null) {
      document
        .getElementById('event-poll')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ToastService.info('Pick an option first.');
      return;
    }
    setVoting(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event._id}/poll/vote`,
        { optionIndex: choice }
      );
      const next =
        (res.data?.pollOptions as Option[]) ||
        options.map((o, i) =>
          i === choice ? { ...o, votes: (o.votes || 0) + 1 } : o
        );
      setOptions(next);
      setVoted(choice);
      try {
        localStorage.setItem(voteStorageKey(event._id), String(choice));
      } catch {
        /* ignore */
      }
      celebrate();
    } catch {
      ToastService.error('Your vote could not be counted. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      ToastService.error('Could not copy the link.');
    }
  };
  const openShare = () =>
    setShare({
      id: event.slug || slug,
      title: event.title,
      description: event.excerpt,
      tag: meta.label,
      url,
    });

  const cal = {
    title: event.title,
    desc: event.excerpt || '',
    start: toIcsDate(event.startAt),
    end: toIcsDate(event.endAt || event.startAt),
    location: event.liveStreamUrl || event.category || 'Angelpage',
  };

  const html = useMemo(
    () => sanitizeHtml(event.description || ''),
    [event.description]
  );
  const start = formatDateBlock(event.startAt);
  const end = formatDateBlock(event.endAt);
  const host = event.authorName || 'Angelpage';
  const related = useMemo(() => {
    const others = (list as CommunityEventRecord[]).filter(
      e => e._id !== event._id
    );
    return [
      ...others.filter(e => getDisplayEventType(e) === type),
      ...others.filter(e => getDisplayEventType(e) !== type),
    ].slice(0, 3);
  }, [list, event._id, type]);

  const facts = [
    {
      icon: CalendarDays,
      label: 'Date',
      value: start
        ? `${start.weekday}, ${titleMonth(start.month)} ${start.day}`
        : 'To be announced',
    },
    {
      icon: Clock3,
      label: ended ? 'Ended' : 'Closes',
      value: end
        ? `${titleMonth(end.month)} ${end.day}, ${end.time}`
        : 'Open-ended',
    },
    { icon: UserRound, label: 'Hosted by', value: host },
    { icon: MapPin, label: 'Where', value: event.category || 'Online' },
  ];

  const secondaryActions = (
    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#F0EBF2] pt-5">
      <div ref={calRef} className="relative">
        <button
          type="button"
          onClick={() => setCalOpen(o => !o)}
          aria-expanded={calOpen}
          disabled={!event.startAt}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#F4F1F6] text-[13px] font-medium text-[#0B0112] transition hover:bg-[#F2E8F8] disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden /> Calendar
        </button>
        {calOpen ? (
          <div className="absolute bottom-full left-0 z-20 mb-2 w-[220px] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_rgba(11,1,18,0.16)] ring-1 ring-[#ECE8EE]">
            <a
              href={getGoogleCalendarUrl(cal)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#FCF7FE]"
            >
              Google Calendar
            </a>
            <a
              href={getAppleCalendarUrl(cal)}
              download={`${event.slug || 'event'}.ics`}
              className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#FCF7FE]"
            >
              Apple / Outlook (.ics)
            </a>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#F4F1F6] text-[13px] font-medium text-[#0B0112] transition hover:bg-[#F2E8F8]"
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}{' '}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );

  const primaryBtn =
    'mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#611192] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73]';

  let action: React.ReactNode;
  if (type === 'donation') {
    action = (
      <>
        <p className="text-[13px] text-[#8A888C]">Raised so far</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-primary text-[34px] leading-none text-[#0B0112]">
            {money0(d.raised)}
          </span>
          {d.goal ? (
            <span className="text-[14px] text-[#8A888C]">
              of {money0(d.goal)}
            </span>
          ) : null}
        </p>
        <div className="mt-4">
          <ProgressBar percent={d.percent} />
        </div>
        {d.goal ? (
          <p className="mt-2 text-[12px] font-semibold text-[#611192]">
            {d.percent}% of goal
          </p>
        ) : null}
        {!ended ? (
          <>
            <p className="mt-5 text-[13px] font-medium text-[#0B0112]">
              Choose an amount
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {AMOUNTS.map(a => {
                const on = !custom && amount === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustom('');
                    }}
                    aria-pressed={on}
                    className={`h-11 rounded-xl text-[14px] font-semibold transition ${on ? 'bg-[#611192] text-white' : 'bg-white text-[#611192] ring-1 ring-[#E2DCE6] hover:ring-[#611192]'}`}
                  >
                    {money0(a)}
                  </button>
                );
              })}
            </div>
            <label className="mt-2 flex h-11 items-center gap-2 rounded-xl px-4 ring-1 ring-[#E2DCE6] focus-within:ring-2 focus-within:ring-[#611192]/40">
              <span className="text-[14px] text-[#8A888C]" aria-hidden>
                {money0(0).replace(/[\d.,\s]/g, '')}
              </span>
              <span className="sr-only">Other amount</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Other amount"
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8A888C]"
              />
            </label>
            <button
              type="button"
              onClick={give}
              className={primaryBtn.replace('mt-5', 'mt-4')}
            >
              Give {money0(giveValue)}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#8A888C]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00977A]" aria-hidden />{' '}
              Secure checkout, receipt by email
            </p>
          </>
        ) : (
          <p className="mt-5 rounded-xl bg-[#F6F3F7] px-4 py-3 text-[14px] text-[#474648]">
            This appeal has closed. Thank you to everyone who gave.
          </p>
        )}
        {secondaryActions}
      </>
    );
  } else if (type === 'poll') {
    action = (
      <>
        <p className="text-[13px] text-[#8A888C]">Votes so far</p>
        <p className="mt-1 font-primary text-[34px] leading-none text-[#0B0112]">
          {totalVotes.toLocaleString()}
        </p>
        {!ended && event.endAt ? (
          <div className="mt-5">
            <CountdownCells to={event.endAt} label="Voting closes in" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={castVote}
          disabled={voted !== null || ended || voting}
          className={`${primaryBtn} disabled:bg-[#F2E8F8] disabled:text-[#611192] disabled:shadow-none`}
        >
          {voting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : voted !== null ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : null}
          {voted !== null
            ? 'Thanks for voting'
            : ended
              ? 'Voting closed'
              : 'Cast your vote'}
        </button>
        {secondaryActions}
      </>
    );
  } else {
    action = (
      <>
        <p className="text-[13px] text-[#8A888C]">
          {liveNow
            ? 'Live now'
            : timing === 'upcoming'
              ? 'Starts in'
              : ended
                ? 'Ended'
                : 'Open'}
        </p>
        <div className="mt-3">
          {liveNow ? (
            <EventStatus event={event} timing={timing} />
          ) : timing === 'upcoming' ? (
            <CountdownCells to={event.startAt} />
          ) : (
            <p className="text-[14px] text-[#474648]">
              {ended ? 'This event has ended.' : 'Open to everyone.'}
            </p>
          )}
        </div>
        {liveNow && event.liveStreamUrl ? (
          <a
            href={event.liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryBtn}
          >
            Join the live stream
          </a>
        ) : null}
        {secondaryActions}
      </>
    );
  }

  const phone =
    type === 'donation' && !ended
      ? {
          label: `Give ${money0(giveValue)}`,
          sub: d.goal ? `${d.percent}% of ${money0(d.goal)}` : meta.label,
          onClick: give,
        }
      : type === 'poll' && voted === null && !ended
        ? {
            label: 'Vote',
            sub: `${totalVotes.toLocaleString()} votes`,
            onClick: castVote,
          }
        : liveNow && event.liveStreamUrl
          ? {
              label: 'Watch',
              sub: meta.label,
              onClick: () =>
                window.open(
                  event.liveStreamUrl,
                  '_blank',
                  'noopener,noreferrer'
                ),
            }
          : null;

  return (
    <div className="bg-[#FAF8FB] pb-20 sm:pb-[150px]">
      <EventConfetti active={confetti} />

      {/* hero: copy on a calm surface beside the image, so the title never sits on a busy photo */}
      <section className="bg-gradient-to-b from-[#F4EAFA] to-[#FAF8FB]">
        <div className="custom-container pt-6 pb-8 sm:pt-4 sm:pb-5">
          <div className="flex items-center justify-between">
            <Link
              href="/events"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white pr-4 pl-3 text-[13px] font-medium text-[#0B0112] ring-1 ring-[#ECE8EE] transition hover:ring-[#611192]/40"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> All events
            </Link>
            <button
              type="button"
              onClick={openShare}
              aria-label="Share event"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B0112] ring-1 ring-[#ECE8EE] hover:ring-[#611192]/40"
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <header className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-10 laptop-m:gap-7 md:grid-cols-1 md:gap-6 sm:mt-4">
            <div className="md:order-2">
              <div className="flex flex-wrap gap-2">
                <TypeChip type={type} />
                <EventStatus event={event} timing={timing} />
              </div>
              <h1 className="ap-display mt-4 text-[46px] leading-[1.1] text-balance laptop-m:text-[40px] sm:text-[30px]">
                {event.title}
              </h1>
              {event.excerpt ? (
                <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-pretty text-[#474648] sm:text-[14.5px]">
                  {event.excerpt}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#474648] sm:flex-col sm:items-start">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#611192] text-[11px] font-semibold text-white">
                    {host.charAt(0).toUpperCase()}
                  </span>
                  {host}
                </span>
                {start ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays
                      className="h-4 w-4 text-[#611192]"
                      aria-hidden
                    />{' '}
                    {start.weekday} {start.month} {start.day} · {start.time}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#00775F]" aria-hidden />{' '}
                  Verified on Angelpage
                </span>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#F2E8F8] shadow-[0_30px_70px_rgba(59,5,92,0.14)] md:order-1 md:aspect-[16/9] sm:rounded-[22px]">
              <Image
                src={eventImage(event)}
                alt=""
                fill
                priority
                sizes="(max-width: 991px) 100vw, 52vw"
                className="object-cover"
              />
            </div>
          </header>
        </div>
      </section>

      <div className="custom-container mt-2 sm:mt-1">
        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 md:grid-cols-1">
          <div className="min-w-0 space-y-5">
            <dl className="grid grid-cols-4 gap-3 lg:grid-cols-2">
              {facts.map(f => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE]"
                  >
                    <Icon className="h-4 w-4 text-[#611192]" aria-hidden />
                    <dt className="mt-3 text-[10px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-[14px] font-semibold text-[#0B0112]">
                      {f.value}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <section className="rounded-[24px] bg-white p-7 ring-1 ring-[#ECE8EE] sm:p-5">
              <p className="ap-eyebrow">
                About this {meta.label.toLowerCase()}
              </p>
              {html ? (
                <div
                  className="ap-prose ap-prose--compact mt-4"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <p className="mt-4 text-[15px] leading-relaxed text-[#474648]">
                  {event.excerpt}
                </p>
              )}
            </section>

            {type === 'donation' && funds.length ? (
              <section className="rounded-[24px] bg-white p-7 ring-1 ring-[#ECE8EE] sm:p-5">
                <h2 className="font-primary text-[24px] text-[#0B0112]">
                  Where your gift goes
                </h2>
                <p className="mt-1 text-[13px] text-[#8A888C]">
                  How this charity plans to use the money raised.
                </p>
                <div
                  className="mt-5 flex h-3 overflow-hidden rounded-full"
                  aria-hidden
                >
                  {funds.map((f, i) => (
                    <span
                      key={f.id}
                      className={i ? 'ml-[2px]' : ''}
                      style={{
                        width: `${f.percent || 100 / funds.length}%`,
                        background: FUND_COLORS[i % FUND_COLORS.length],
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-1">
                  {funds.map((f, i) => (
                    <li key={f.id} className="rounded-2xl bg-[#FAF8FB] p-4">
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0112]">
                          <span
                            className="h-2.5 w-2.5 rounded-[3px]"
                            style={{
                              background: FUND_COLORS[i % FUND_COLORS.length],
                            }}
                            aria-hidden
                          />
                          {f.label}
                        </span>
                        {f.percent != null ? (
                          <span className="font-primary text-[18px] text-[#0B0112]">
                            {f.percent}%
                          </span>
                        ) : null}
                      </p>
                      {f.description ? (
                        <p className="mt-2 text-[12px] leading-relaxed text-[#6B686E]">
                          {f.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {type === 'poll' && options.length ? (
              <section
                id="event-poll"
                className="rounded-[24px] bg-white p-7 ring-1 ring-[#ECE8EE] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#00775F] uppercase">
                      Community vote
                    </p>
                    <h2 className="mt-2 font-primary text-[24px] leading-snug text-[#0B0112]">
                      {event.pollQuestion || event.title}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F4F1F6] px-3 py-1 text-[12px] text-[#474648]">
                    {totalVotes.toLocaleString()} votes
                  </span>
                </div>
                <ul
                  className="mt-5 space-y-2"
                  role="radiogroup"
                  aria-label={event.pollQuestion || 'Vote'}
                >
                  {options.map((o, i) => {
                    const showResults = voted !== null || ended;
                    const pct = totalVotes
                      ? Math.round(((o.votes || 0) / totalVotes) * 100)
                      : 0;
                    const selected =
                      voted === i || (voted === null && choice === i);
                    return (
                      <li key={`${o.text}-${i}`}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={showResults}
                          onClick={() => setChoice(i)}
                          className={`relative flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left text-[14px] font-medium text-[#0B0112] ring-1 transition ${
                            selected
                              ? 'bg-[#F6EEFA] ring-[#611192]'
                              : 'bg-[#FAF8FB] ring-[#ECE8EE] hover:ring-[#611192]/50'
                          }`}
                        >
                          {showResults ? (
                            <span
                              className="absolute inset-y-0 left-0 bg-[#EADAF5] transition-[width] duration-700"
                              style={{ width: `${pct}%` }}
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ${selected ? 'ring-[#611192]' : 'ring-[#C9C4CC]'}`}
                          >
                            {selected ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#611192]" />
                            ) : null}
                          </span>
                          <span className="relative flex-1">{o.text}</span>
                          {showResults ? (
                            <span className="relative text-[13px] font-semibold text-[#611192]">
                              {pct}%
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-[12px] text-[#8A888C]">
                  {voted !== null
                    ? 'Thanks for voting. Results update as votes come in.'
                    : 'One vote per person. Results show after you vote.'}
                </p>
              </section>
            ) : null}

            {type === 'live' && !ended ? (
              <section className="overflow-hidden rounded-[24px] bg-[#14021F] p-5 text-white">
                <div className="relative aspect-[16/7] overflow-hidden rounded-2xl sm:aspect-[16/9]">
                  <Image
                    src={eventImage(event)}
                    alt=""
                    fill
                    sizes="(max-width: 991px) 100vw, 60vw"
                    className="object-cover opacity-70"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E50035] shadow-lg">
                      <Play
                        className="ml-0.5 h-6 w-6 fill-current"
                        aria-hidden
                      />
                    </span>
                  </span>
                </div>
                <div className="mt-5">
                  {liveNow ? (
                    <EventStatus event={event} timing={timing} />
                  ) : null}
                  <p className="mt-3 font-primary text-[24px] text-white">
                    {liveNow
                      ? 'Happening right now'
                      : 'The stream opens at the start time'}
                  </p>
                  <p className="mt-1 text-[14px] text-white/65">
                    The stream opens in a new tab.
                  </p>
                  {event.liveStreamUrl ? (
                    <a
                      href={event.liveStreamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[#E50035] px-6 text-[15px] font-semibold text-white hover:bg-[#C4002D]"
                    >
                      <Play className="h-4 w-4 fill-current" aria-hidden />{' '}
                      Watch live
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* tablet / phone: action card after the content */}
            <div className="hidden space-y-3 md:block">
              <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_44px_rgba(59,5,92,0.10)] ring-1 ring-[#ECE8EE] sm:p-5">
                {action}
              </div>
              <ShareCard onClick={openShare} />
            </div>
          </div>

          <aside className="md:hidden">
            <div className="sticky top-6 space-y-3">
              <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_44px_rgba(59,5,92,0.10)] ring-1 ring-[#ECE8EE]">
                {action}
              </div>
              <ShareCard onClick={openShare} />
            </div>
          </aside>
        </div>

        {related.length ? (
          <section className="mt-14 sm:mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="ap-display text-[28px] sm:text-[24px]">
                More events
              </h2>
              <Link
                href="/events"
                className="text-[13px] font-semibold text-[#611192]"
              >
                See all
              </Link>
            </div>
            <div className="ap-no-scrollbar grid grid-cols-3 gap-5 md:grid-cols-2 sm:-mx-4 sm:flex sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:px-4">
              {related.map(e => (
                <div
                  key={e._id}
                  className="sm:w-[82%] sm:shrink-0 sm:snap-start"
                >
                  <EventTile event={e} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {phone ? (
        <div
          className="fixed inset-x-0 z-[60] hidden items-center gap-3 border-t border-[#ECE8EE] bg-white/95 px-4 py-3 backdrop-blur-md sm:flex"
          style={{ bottom: 'calc(66px + env(safe-area-inset-bottom))' }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#0B0112]">
              {event.title}
            </p>
            <p className="text-[12px] text-[#8A888C]">{phone.sub}</p>
          </div>
          <button
            type="button"
            onClick={phone.onClick}
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#611192] px-5 text-[14px] font-semibold text-white"
          >
            {phone.label}
          </button>
        </div>
      ) : null}

      <EventShareModal
        isOpen={Boolean(share)}
        onClose={() => setShare(null)}
        event={share}
      />
    </div>
  );
}
