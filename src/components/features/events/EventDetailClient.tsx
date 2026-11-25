'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  Clock,
  HeartHandshake,
  Link as LinkIcon,
  MapPin,
  PartyPopper,
  Play,
  Share2,
  UserRound,
  X,
} from 'lucide-react';
import FullScreenLoader from '@/components/common/loading/FullScreenLoader';
import { Button } from '@/components/elements';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatMoney } from '@/lib/money';
import type { CommunityEventRecord } from '@/lib/server-api';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import { useGetEventBySlugQuery, useGetEventsQuery } from '@/store/api/angelpageApi';
import EventAttendanceTicket from './EventAttendanceTicket';
import EventConfetti from './EventConfetti';
import EventShareModal, { type EventSharePayload } from './EventShareModal';
import InlinePoll from './InlinePoll';
import {
  formatEventDate,
  getAppleCalendarUrl,
  getDisplayEventType,
  getDonationProgress,
  getGoogleCalendarUrl,
  resolveEventFunds,
  toIcsDate,
} from './eventUtils';
import { DateBlock, EventStatus, EventTile, ProgressBar, TYPE_META, TypeChip, eventImage, formatDateBlock, pollTotal, useCountdown, useTiming } from './eventUi';

type EventDetailClientProps = {
  slug: string;
  initialEvent?: CommunityEventRecord | null;
};

const AMOUNTS = [10, 25, 50, 100];
const FUND_COLORS = ['#8A3FC7', '#00977A', '#C2771A', '#1B6FC2'];

export default function EventDetailClient({ slug, initialEvent }: EventDetailClientProps) {
  const { data: fetchedEvent, isLoading } = useGetEventBySlugQuery(slug, { skip: !slug });
  const event = (fetchedEvent as CommunityEventRecord | undefined) ?? initialEvent ?? null;

  if (isLoading && !event) return <FullScreenLoader label="Loading event" />;
  if (!event) {
    return (
      <section className="custom-container py-24 text-center">
        <h1 className="font-primary text-[36px] text-[#0B0112]">Event not found</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-[#6B686E]">It may have ended or been removed.</p>
        <Link href="/events" className="mt-6 inline-block">
          <Button variant="primary">Browse events</Button>
        </Link>
      </section>
    );
  }
  return <EventView event={event} slug={slug} />;
}

function CountdownCells({ to }: { to?: string }) {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Starts in">
      {(
        [
          ['days', c.d],
          ['hrs', c.h],
          ['min', c.m],
          ['sec', c.s],
        ] as const
      ).map(([k, v]) => (
        <span key={k} className="flex flex-col items-center rounded-xl bg-[#F6F3F7] py-2.5">
          <span className="text-[22px] font-semibold text-[#0B0112] tabular-nums">{String(v).padStart(2, '0')}</span>
          <span className="text-[10px] tracking-[0.14em] text-[#8A888C] uppercase">{k}</span>
        </span>
      ))}
    </div>
  );
}

function EventView({ event, slug }: { event: CommunityEventRecord; slug: string }) {
  const router = useRouter();
  const { data: list = [] } = useGetEventsQuery({ limit: 12 });
  const type = getDisplayEventType(event);
  const timing = useTiming(event);
  const meta = TYPE_META[type];
  const d = getDonationProgress(event);
  const funds = resolveEventFunds(event);
  const ended = timing === 'ended';

  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState('');
  const [fund, setFund] = useState<string>('');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [url, setUrl] = useState(`/events/${slug}`);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/events/${event.slug || slug}`);
    setTicketId(`AP-${event._id.slice(-6).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
  }, [event._id, event.slug, slug]);

  useEffect(() => {
    if (!calOpen) return;
    const close = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [calOpen]);

  const celebrate = () => {
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 4500);
  };

  const give = () => {
    const value = Number(custom) || amount;
    if (!value || value <= 0) {
      ToastService.error('Choose an amount to give.');
      return;
    }
    router.push(buildDonationCheckoutUrl(event, { amount: value, fund: fund || undefined }));
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

  const cal = {
    title: event.title,
    desc: event.excerpt || '',
    start: toIcsDate(event.startAt),
    end: toIcsDate(event.endAt || event.startAt),
    location: event.liveStreamUrl || event.category || 'Angelpage',
  };

  const shareEvent: EventSharePayload = { id: event.slug || slug, title: event.title, description: event.excerpt, tag: meta.label, url };
  const html = useMemo(() => sanitizeHtml(event.description || ''), [event.description]);
  const startBlock = formatDateBlock(event.startAt);
  const endLabel = formatEventDate(event.endAt);
  const related = useMemo(() => {
    const others = (list as CommunityEventRecord[]).filter(e => e._id !== event._id);
    const same = others.filter(e => getDisplayEventType(e) === type);
    return [...same, ...others.filter(e => getDisplayEventType(e) !== type)].slice(0, 3);
  }, [list, event._id, type]);

  const facts = [
    startBlock ? { icon: Clock, label: 'When', value: `${startBlock.weekday} ${startBlock.day} ${startBlock.month.toLowerCase()}, ${startBlock.time}` } : null,
    endLabel ? { icon: CalendarPlus, label: ended ? 'Ended' : 'Closes', value: endLabel } : null,
    { icon: UserRound, label: 'Hosted by', value: event.authorName || 'Angelpage' },
    event.category ? { icon: MapPin, label: type === 'live' ? 'Where' : 'Cause', value: event.category } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  /* ---------- action card (sticky on desktop, first on phones) ---------- */
  const calendarMenu = (
    <div ref={calRef} className="relative">
      <button
        type="button"
        onClick={() => setCalOpen(o => !o)}
        aria-expanded={calOpen}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#E2DCE6] text-[14px] font-medium text-[#0B0112] transition hover:border-[#611192] hover:text-[#611192]"
      >
        <CalendarPlus className="h-4 w-4" aria-hidden /> Add to calendar
      </button>
      {calOpen ? (
        <div className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_rgba(11,1,18,0.16)] ring-1 ring-[#ECE8EE]">
          <a href={getGoogleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer" className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#FCF7FE]">
            Google Calendar
          </a>
          <a href={getAppleCalendarUrl(cal)} download={`${event.slug || 'event'}.ics`} className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#FCF7FE]">
            Apple / Outlook (.ics)
          </a>
        </div>
      ) : null}
    </div>
  );

  let action: React.ReactNode;
  if (type === 'donation') {
    action = (
      <>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[28px] leading-none font-semibold text-[#0B0112]">{formatMoney(d.raised)}</p>
            <p className="mt-1.5 text-[13px] text-[#6B686E]">{d.goal ? `raised of ${formatMoney(d.goal)} goal` : 'raised so far'}</p>
          </div>
          {d.goal ? <span className="text-[15px] font-semibold text-[#611192]">{d.percent}%</span> : null}
        </div>
        <div className="mt-4">
          <ProgressBar percent={d.percent} />
        </div>
        {!ended ? (
          <>
            <p className="mt-6 text-[13px] font-medium text-[#0B0112]">Choose an amount</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a);
                    setCustom('');
                  }}
                  aria-pressed={!custom && amount === a}
                  className={`h-11 rounded-xl text-[14px] font-semibold transition ${
                    !custom && amount === a ? 'bg-[#611192] text-white' : 'bg-[#F6F3F7] text-[#0B0112] hover:bg-[#F2E8F8]'
                  }`}
                >
                  {formatMoney(a).replace(/\.00$/, '')}
                </button>
              ))}
            </div>
            <label className="mt-2 flex h-11 items-center rounded-xl bg-[#F6F3F7] px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#611192]/30">
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
            {funds.length > 1 ? (
              <label className="mt-2 block">
                <span className="sr-only">Direct my gift to</span>
                <select
                  value={fund}
                  onChange={e => setFund(e.target.value)}
                  className="h-11 w-full rounded-xl bg-[#F6F3F7] px-3 text-[14px] text-[#0B0112] outline-none focus:ring-2 focus:ring-[#611192]/30"
                >
                  <option value="">Where it&apos;s needed most</option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={give}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#611192] text-[15px] font-medium text-white transition hover:bg-[#4C0D73]"
            >
              <HeartHandshake className="h-4 w-4" aria-hidden /> Give {formatMoney(Number(custom) || amount).replace(/\.00$/, '')}
            </button>
            <p className="mt-3 text-center text-[12px] text-[#8A888C]">Secure checkout · receipt by email</p>
          </>
        ) : (
          <p className="mt-5 rounded-xl bg-[#F6F3F7] px-4 py-3 text-[14px] text-[#474648]">This appeal has closed. Thank you to everyone who gave.</p>
        )}
      </>
    );
  } else if (type === 'poll') {
    action = (
      <>
        <p className="text-[13px] text-[#6B686E]">
          <strong className="font-semibold text-[#0B0112]">{pollTotal(event).toLocaleString()}</strong> votes so far
        </p>
        <div className="mt-3">
          <InlinePoll event={event} disabled={ended} onVoted={celebrate} />
        </div>
      </>
    );
  } else {
    const liveNow = type === 'live' && timing === 'live';
    action = (
      <>
        {timing === 'upcoming' ? (
          <>
            <p className="mb-3 text-[13px] font-medium text-[#0B0112]">Starts in</p>
            <CountdownCells to={event.startAt} />
          </>
        ) : liveNow ? (
          <p className="flex items-center gap-2 text-[15px] font-medium text-[#B80030]">
            <span className="ap-live-dot" aria-hidden /> Streaming now
          </p>
        ) : ended ? (
          <p className="rounded-xl bg-[#F6F3F7] px-4 py-3 text-[14px] text-[#474648]">This event has ended.</p>
        ) : (
          <p className="text-[14px] text-[#474648]">Open to everyone.</p>
        )}
        <div className="mt-5 space-y-2">
          {liveNow && event.liveStreamUrl ? (
            <a
              href={event.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E50035] text-[15px] font-medium text-white transition hover:bg-[#C4002D]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden /> Watch live
            </a>
          ) : null}
          {!ended && !liveNow ? (
            <button
              type="button"
              onClick={() => {
                setTicketOpen(true);
                celebrate();
              }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#611192] text-[15px] font-medium text-white transition hover:bg-[#4C0D73]"
            >
              <PartyPopper className="h-4 w-4" aria-hidden /> I&apos;m going
            </button>
          ) : null}
          {!ended && event.startAt ? calendarMenu : null}
        </div>
      </>
    );
  }

  const phonePrimary =
    type === 'donation' && !ended
      ? { label: `Give ${formatMoney(Number(custom) || amount).replace(/\.00$/, '')}`, onClick: give }
      : type === 'live' && timing === 'live' && event.liveStreamUrl
        ? { label: 'Watch live', onClick: () => window.open(event.liveStreamUrl, '_blank', 'noopener,noreferrer') }
        : type === 'poll' && !ended
          ? { label: 'Vote', onClick: () => document.getElementById('event-action')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
          : !ended && type !== 'poll'
            ? { label: "I'm going", onClick: () => {
                setTicketOpen(true);
                celebrate();
              },
            }
            : null;

  return (
    <div className="bg-white pb-20 sm:pb-[150px]">
      <EventConfetti active={confetti} />

      {/* hero */}
      <header className="relative isolate overflow-hidden bg-[#0B0112]">
        <Image src={eventImage(event)} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B0112] via-[#0B0112]/70 to-[#0B0112]/30" />
        <div className="custom-container pt-8 pb-14 sm:pt-4 sm:pb-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/events" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/10 pr-4 pl-3 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Events
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={copyLink} aria-label={copied ? 'Link copied' : 'Copy link'} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <LinkIcon className="h-4 w-4" aria-hidden />}
              </button>
              <button type="button" onClick={() => setShareOpen(true)} aria-label="Share event" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
                <Share2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="mt-16 max-w-[760px] md:mt-12 sm:mt-10">
            <div className="flex flex-wrap gap-2">
              <TypeChip type={type} glass />
              <EventStatus event={event} timing={timing} dark />
            </div>
            <h1 className="ap-display mt-4 text-[52px] leading-[1.08] text-white! laptop-m:text-[44px] sm:text-[30px]">{event.title}</h1>
            {event.excerpt ? <p className="mt-4 max-w-[620px] text-[17px] leading-relaxed text-white/75 sm:text-[15px]">{event.excerpt}</p> : null}
          </div>
        </div>
      </header>

      <div className="custom-container -mt-6 sm:mt-0">
        <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] md:grid-cols-1 md:gap-6">
          {/* action card */}
          <aside id="event-action" className="order-2 md:order-first md:-mt-0 sm:-mx-4">
            <div className="sticky top-6 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(59,5,92,0.14)] ring-1 ring-[#ECE8EE] sm:rounded-none sm:shadow-none sm:ring-0 sm:px-4 sm:pt-5 sm:pb-6">
              <div className="mb-5 flex items-center gap-3 border-b border-[#F0EBF2] pb-5">
                {event.startAt ? <DateBlock iso={event.startAt} /> : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: meta.tint, color: meta.ink }}>
                    <meta.icon className="h-6 w-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold tracking-[0.12em] uppercase" style={{ color: meta.ink }}>
                    {meta.label}
                  </p>
                  <p className="truncate text-[14px] text-[#474648]">{startBlock ? `${startBlock.weekday}, ${startBlock.time}` : event.authorName || 'Angelpage'}</p>
                </div>
              </div>
              {action}
            </div>
          </aside>

          {/* main column */}
          <div className="order-1 min-w-0 pt-14 md:pt-0">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-0 sm:divide-y sm:divide-[#F0EBF2] sm:rounded-2xl sm:bg-[#FAF8FB] sm:px-4">
              {facts.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-3 rounded-2xl bg-[#FAF8FB] p-4 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#611192]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[12px] text-[#8A888C]">{f.label}</dt>
                      <dd className="mt-0.5 text-[14px] font-medium text-[#0B0112]">{f.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>

            {html ? (
              <section className="mt-12 sm:mt-8">
                <h2 className="ap-display text-[28px] sm:text-[22px]">About this {meta.label.toLowerCase()}</h2>
                <div className="ap-prose ap-prose--compact mt-5" dangerouslySetInnerHTML={{ __html: html }} />
              </section>
            ) : null}

            {type === 'donation' && funds.length ? (
              <section className="mt-12 sm:mt-8">
                <h2 className="ap-display text-[28px] sm:text-[22px]">Where your gift goes</h2>
                <div className="mt-5 flex h-3 overflow-hidden rounded-full" aria-hidden>
                  {funds.map((f, i) => (
                    <span key={f.id} className={i ? 'ml-[2px]' : ''} style={{ width: `${f.percent || 100 / funds.length}%`, background: FUND_COLORS[i % FUND_COLORS.length] }} />
                  ))}
                </div>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-1">
                  {funds.map((f, i) => (
                    <li key={f.id} className="flex gap-3 rounded-2xl border border-[#ECE8EE] p-4">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: FUND_COLORS[i % FUND_COLORS.length] }} aria-hidden />
                      <div>
                        <p className="flex items-baseline gap-2 text-[15px] font-medium text-[#0B0112]">
                          {f.label}
                          {f.percent != null ? <span className="text-[13px] font-semibold text-[#611192]">{f.percent}%</span> : null}
                        </p>
                        {f.description ? <p className="mt-1 text-[13px] leading-relaxed text-[#6B686E]">{f.description}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {type === 'live' && event.liveStreamUrl && !ended ? (
              <section className="mt-12 flex items-center gap-5 rounded-[24px] bg-[#FFF5F7] p-6 sm:mt-8 sm:flex-col sm:items-start sm:p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#E50035]">
                  <Play className="h-6 w-6 fill-current" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-primary text-[20px] text-[#0B0112]">{timing === 'live' ? 'The stream is on' : 'The stream opens at the start time'}</p>
                  <p className="mt-1 text-[14px] text-[#6B686E]">It plays on the host&apos;s streaming page in a new tab.</p>
                </div>
                <a href={event.liveStreamUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0B0112] px-5 text-[14px] font-medium text-white">
                  Open stream <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </section>
            ) : null}

            <section className="mt-12 flex items-center justify-between gap-4 rounded-[24px] border border-[#ECE8EE] p-5 sm:mt-8 sm:flex-col sm:items-start">
              <div>
                <p className="font-primary text-[19px] text-[#0B0112]">Spread the word</p>
                <p className="mt-1 text-[13px] text-[#6B686E]">One share can bring a new supporter.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={copyLink} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F6F3F7] px-4 text-[13px] font-medium text-[#0B0112] hover:bg-[#F2E8F8]">
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <LinkIcon className="h-4 w-4" aria-hidden />} {copied ? 'Copied' : 'Copy link'}
                </button>
                <button type="button" onClick={() => setShareOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#611192] px-4 text-[13px] font-medium text-white">
                  <Share2 className="h-4 w-4" aria-hidden /> Share
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="custom-container mt-20 sm:mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="ap-display text-[30px] sm:text-[24px]">More events</h2>
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#611192]">
              All events <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-5 md:grid-cols-2 ap-no-scrollbar sm:-mx-4 sm:flex sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:px-4">
            {related.map(e => (
              <div key={e._id} className="sm:w-[82%] sm:shrink-0 sm:snap-start">
                <EventTile event={e} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* phone action bar (sits above the bottom tab bar) */}
      {phonePrimary ? (
        <div className="fixed inset-x-0 z-[60] hidden border-t border-[#ECE8EE] bg-white/95 px-4 py-3 backdrop-blur-md sm:flex sm:items-center sm:gap-3" style={{ bottom: 'calc(66px + env(safe-area-inset-bottom))' }}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#0B0112]">{event.title}</p>
            <p className="text-[12px] text-[#8A888C]">{type === 'donation' ? `${d.percent}% of goal` : meta.label}</p>
          </div>
          <button type="button" onClick={phonePrimary.onClick} className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#611192] px-5 text-[14px] font-medium text-white">
            {phonePrimary.label}
          </button>
        </div>
      ) : null}

      <EventShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} event={shareEvent} />

      {ticketOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#0B0112]/60 p-4 backdrop-blur-sm sm:p-0" role="dialog" aria-modal="true" aria-label="You're going">
          <div className="w-full max-w-[520px] animate-[ap-sheet-in_300ms_ease] rounded-[28px] bg-white p-6 sm:rounded-b-none sm:pb-[calc(24px+env(safe-area-inset-bottom))] md:self-center">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-primary text-[24px] text-[#0B0112]">You&apos;re going</p>
                <p className="mt-1 text-[14px] text-[#6B686E]">Save your pass and add the event to your calendar.</p>
              </div>
              <button type="button" onClick={() => setTicketOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F3F7]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-5">
              <EventAttendanceTicket eventTitle={event.title} eventDate={formatEventDate(event.startAt) || 'Date to be announced'} eventLocation={event.category || 'Angelpage'} ticketId={ticketId} />
            </div>
            {event.startAt ? <div className="mt-4">{calendarMenu}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
