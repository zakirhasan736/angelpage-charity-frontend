'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  Radio,
  Share2,
  TrendingUp,
  User,
} from 'lucide-react';
import EventShareModal, {
  type EventSharePayload,
} from '@/components/features/events/EventShareModal';
import { EventCardSkeleton, SkeletonLine } from '@/components/common/loading/Skeleton';
import dynamic from 'next/dynamic';

const EventDonationModal = dynamic(
  () => import('@/components/features/events/EventDonationModal'),
  { ssr: false },
);
import { getDonationProgress } from '@/components/features/events/eventUtils';
import { buildDonationCheckoutUrl } from '@/lib/eventDonationFlow';
import type { CommunityEventRecord } from '@/lib/server-api';
import { useGetEventsQuery } from '@/store/api/angelpageApi';
import SectionHeading from '@/components/common/product-slider/SectionHeading';

const FALLBACK_IMAGES = {
  donation: '/images/events/charity_event_hero.jpg',
  poll: '/images/events/community_poll_bg.jpg',
  live: '/images/events/donation_hands.jpg',
};

type BentoEvent = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  targetDate: Date;
  eventType: string;
  donationUrl?: string;
  liveStreamUrl?: string;
  authorName?: string;
  category?: string;
  pollOptions: { id: number; text: string; votes: number }[];
};

const calculateTimeLeft = (targetDate: Date) => {
  const difference = +targetDate - +new Date();
  let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const CompactCountdown = ({ targetDate }: { targetDate: Date }) => {
  const timeLeft = useCountdown(targetDate);

  return (
    <div className="flex w-fit items-center gap-1.5 rounded-full border border-[#E6E3E7] bg-white px-2.5 py-1">
      <Clock className="h-3 w-3 text-[#611192]" aria-hidden />
      <div className="flex items-center gap-1 text-[10px] tracking-wider text-[#3B055C]">
        <span>{String(timeLeft.days).padStart(2, '0')}d</span>
        <span className="text-[#6B686E]">:</span>
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="text-[#6B686E]">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      </div>
    </div>
  );
};

const voteStorageKey = (eventId: string) => `angelpage-home-poll-${eventId}`;

function toBentoEvent(
  event: CommunityEventRecord,
  fallbackImage: string,
  fallbackOptions?: { id: number; text: string; votes: number }[],
): BentoEvent {
  const end = event.endAt || event.startAt;
  const targetDate = end ? new Date(end) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    _id: event._id,
    slug: event.slug || event._id,
    title: event.title,
    description:
      event.excerpt ||
      event.description ||
      'Help deliver crucial support directly to families in need.',
    image: event.coverImage || fallbackImage,
    targetDate,
    eventType: event.eventType,
    donationUrl: event.donationUrl,
    liveStreamUrl: event.liveStreamUrl,
    authorName: event.authorName,
    category: event.category,
    pollOptions:
      event.pollOptions?.map((opt, idx) => ({
        id: idx + 1,
        text: opt.text,
        votes: opt.votes || 0,
      })) ||
      fallbackOptions ||
      [],
  };
}

function buildDemoEvents(): {
  donation: BentoEvent;
  poll: BentoEvent;
  live: BentoEvent;
} {
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 12);
  futureDate1.setHours(futureDate1.getHours() + 5);

  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 2);
  futureDate2.setHours(futureDate2.getHours() + 10);

  return {
    donation: {
      _id: 'demo-donation',
      slug: 'events',
      title: 'Global Food Relief Drive',
      description:
        'Help deliver crucial grains, flour, baby milk formula, and clean water directly to families surviving devastating flash floods.',
      image: FALLBACK_IMAGES.donation,
      targetDate: futureDate1,
      eventType: 'donation',
      pollOptions: [],
    },
    poll: {
      _id: 'demo-poll',
      slug: 'events',
      title: 'Next Resource Allocation Poll',
      description:
        'Directly shape upcoming logistics. Choose where East Africa emergency grant funds route next week.',
      image: FALLBACK_IMAGES.poll,
      targetDate: futureDate2,
      eventType: 'poll',
      pollOptions: [
        { id: 1, text: 'Disaster Food Relief packs', votes: 142 },
        { id: 2, text: 'Emergency Water wells', votes: 98 },
        { id: 3, text: 'Maternal Care tent supply', votes: 76 },
      ],
    },
    live: {
      _id: 'demo-live',
      slug: 'events',
      title: 'Ground Impact Live Stream',
      description:
        'Stream directly from East Africa. Speak with medical coordinators on the ground, and see equipment funded by your contributions.',
      image: FALLBACK_IMAGES.live,
      targetDate: futureDate2,
      eventType: 'live_session',
      authorName: 'Dr. Sarah Jenkins',
      category: 'East Africa Depot',
      pollOptions: [],
    },
  };
}

const DonationColumnCard = ({
  event,
  raisedAmount,
  onNavigate,
  onShare,
  onDonate,
}: {
  event: BentoEvent;
  raisedAmount: number;
  onNavigate: (slug: string) => void;
  onShare: (event: BentoEvent) => void;
  onDonate: (event: BentoEvent, amount: number) => void;
}) => {
  const [amount, setAmount] = useState<number | null>(50);
  const donation = getDonationProgress(event as unknown as CommunityEventRecord);
  const target = donation.goal || 10000;
  const [isDonating, setIsDonating] = useState(false);

  const percentProgress = target
    ? Math.min(100, Math.round((raisedAmount / target) * 100))
    : 0;

  const handleDonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!amount) return;
    if (event._id.startsWith('demo-')) {
      onNavigate(event.slug || 'events');
      return;
    }
    setIsDonating(true);
    onDonate(event, amount);
    setIsDonating(false);
  };

  return (
    <article
      onClick={() => onNavigate(event.slug)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-[#ECE8EE] transition duration-300 hover:shadow-[0_24px_50px_rgba(59,5,92,0.12)]"
    >
      <div className="relative h-[360px] w-full overflow-hidden max-[767px]:h-56">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 767px) 100vw, 60vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B0112] via-[#0B0112]/35 to-transparent" />
        <div className="absolute left-5 top-5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#611192] px-3 py-1 text-[11px] font-medium text-white!">
            <Heart className="h-3 w-3" aria-hidden />
            Appeal
          </span>
          <CompactCountdown targetDate={event.targetDate} />
        </div>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onShare(event);
          }}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#611192]"
          aria-label="Share this appeal"
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="font-primary max-w-lg text-4xl leading-none text-white! max-[767px]:text-3xl">
            {event.title}
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 bg-white p-6" onClick={e => e.stopPropagation()}>
        <p className="text-sm leading-6 text-[#5C5560]">{event.description}</p>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#0B0112]">
              ${raisedAmount.toLocaleString()} raised
            </span>
            <span className="font-medium text-[#611192]">{percentProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F2E8F8]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#611192] to-[#9B4DCA] transition-all duration-700" style={{ width: `${percentProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#8A7E90]">Goal ${target.toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[20, 50, 100, 250].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                amount === val
                  ? 'border-[#611192] bg-[#611192] text-white! shadow-[0_6px_16px_rgba(97,17,146,0.24)]'
                  : 'border-[#ECE8EE] bg-white text-[#611192]! hover:border-[#611192]/50'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleDonate}
          disabled={isDonating || !amount}
          className="mt-auto inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-[#611192] text-sm font-medium text-white! shadow-[0_10px_24px_rgba(97,17,146,0.24)] transition hover:bg-[#3B055C] disabled:opacity-50"
        >
          {isDonating ? 'Opening checkout' : `Give $${amount}`}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
};

const PollColumnCard = ({
  event,
  onNavigate,
  onShare,
}: {
  event: BentoEvent;
  onNavigate: (slug: string) => void;
  onShare: (event: BentoEvent) => void;
}) => {
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [votes, setVotes] = useState(
    () => event.pollOptions.map(opt => opt.votes) || [142, 98, 76],
  );
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(voteStorageKey(event._id));
      if (stored !== null) setVotedOption(Number(stored));
    } catch {
      // ignore
    }
  }, [event._id]);

  const totalVotes = votes.reduce((acc, curr) => acc + curr, 0) || 1;

  const handleVote = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (votedOption !== null || voting) return;

    setVoting(true);
    try {
      if (!event._id.startsWith('demo-')) {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/events/${event._id}/poll/vote`,
          { optionIndex: idx },
        );
        const updated = res.data.pollOptions as { votes?: number }[];
        if (Array.isArray(updated)) {
          setVotes(updated.map(opt => opt.votes || 0));
        }
      } else {
        setVotes(prev => {
          const next = [...prev];
          next[idx] = (next[idx] || 0) + 1;
          return next;
        });
      }
      setVotedOption(idx);
      localStorage.setItem(voteStorageKey(event._id), String(idx));
    } catch {
      setVotes(prev => {
        const next = [...prev];
        next[idx] = (next[idx] || 0) + 1;
        return next;
      });
      setVotedOption(idx);
    } finally {
      setVoting(false);
    }
  };

  return (
    <article
      onClick={() => onNavigate(event.slug)}
      className="group cursor-pointer overflow-hidden rounded-[28px] bg-white ring-1 ring-[#ECE8EE] transition duration-300 hover:shadow-[0_20px_44px_rgba(59,5,92,0.1)]"
    >
      <div className="flex items-start gap-4 p-5 pb-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          <Image src={event.image} alt="" fill className="object-cover" sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="ap-chip h-6! px-2.5! text-[11px]!">
              <TrendingUp className="h-3 w-3" aria-hidden />
              Community vote
            </span>
            <CompactCountdown targetDate={event.targetDate} />
          </div>
          <h3 className="mt-2 font-primary text-[20px] leading-tight text-[#0B0112]">{event.title}</h3>
        </div>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onShare(event);
          }}
          className="ap-icon-btn h-9! w-9! shrink-0 ring-1 ring-[#ECE8EE]"
          aria-label="Share this vote"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="space-y-2 px-5 pb-5" onClick={e => e.stopPropagation()}>
        {event.pollOptions.map((option, index) => {
          const isVoted = votedOption === index;
          const currentVotes = votes[index] || 0;
          const pct = Math.round((currentVotes / totalVotes) * 100);
          const revealed = votedOption !== null;
          return (
            <button
              key={option.id}
              type="button"
              onClick={e => handleVote(e, index)}
              disabled={revealed || voting}
              className={`relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition ${
                isVoted
                  ? 'border-[#611192] bg-white text-[#0B0112]!'
                  : revealed
                    ? 'border-[#ECE8EE] bg-white text-[#0B0112]!'
                    : 'border-[#ECE8EE] bg-[#FAF8FB] text-[#0B0112]! hover:border-[#611192]/50 hover:bg-[#FCF2FF]'
              }`}
            >
              {revealed && (
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-y-0 left-0 ${isVoted ? 'bg-[#F2E8F8]' : 'bg-[#F6F4F7]'}`}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 pr-3">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isVoted ? 'border-[#611192] bg-[#611192]' : 'border-[#C9C8CA] bg-white'
                  }`}
                >
                  {isVoted && <CheckCircle2 className="h-3 w-3 text-white" aria-hidden />}
                </span>
                {option.text}
              </span>
              <span className="relative z-10 text-xs font-semibold text-[#611192]!">
                {revealed ? `${pct}%` : ''}
              </span>
            </button>
          );
        })}
        <p className="pt-1 text-xs text-[#8A7E90]">
          {votedOption !== null ? `${totalVotes} votes · thanks for voting` : 'Tap an option to cast your vote'}
        </p>
      </div>
    </article>
  );
};

const LiveColumnCard = ({
  event,
  onNavigate,
  onShare,
}: {
  event: BentoEvent;
  onNavigate: (slug: string) => void;
  onShare: (event: BentoEvent) => void;
}) => {
  const [rsvped, setRsvped] = useState(false);

  const handleRsvp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRsvped(prev => !prev);
    if (event.liveStreamUrl) {
      window.open(event.liveStreamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      onClick={() => onNavigate(event.slug)}
      className="group relative flex-1 cursor-pointer overflow-hidden rounded-[28px] bg-[#0B0112] text-white"
    >
      <div className="absolute inset-0">
        <Image
          src={event.image}
          alt=""
          fill
          className="object-cover opacity-55 transition duration-700 group-hover:scale-105"
          sizes="40vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0112] via-[#3B055C]/70 to-[#3B055C]/20" />
      </div>
      <div className="relative flex h-full min-h-[300px] flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="ap-chip ap-chip--live h-7! text-[11px]! font-semibold! tracking-wide">
            <span className="ap-live-dot" aria-hidden />
            LIVE SESSION
          </span>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onShare(event);
            }}
            className="ap-arrow ap-arrow--dark h-9! w-9!"
            aria-label="Share this live event"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <div className="mt-auto pt-10" onClick={e => e.stopPropagation()}>
          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-white!">
            <Radio className="h-3.5 w-3.5" aria-hidden />
            Starts in
            <CompactCountdown targetDate={event.targetDate} />
          </div>
          <h3 className="font-primary text-[26px] leading-tight text-white!">{event.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/75!">{event.description}</p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
            <p className="flex min-w-0 items-center gap-2 text-xs text-white/85!">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                <User className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate text-white!">
                {event.authorName || 'Angelpage host'}
                {event.category ? <span className="block text-white/55!">{event.category}</span> : null}
              </span>
            </p>
            <button
              type="button"
              onClick={handleRsvp}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                rsvped ? 'bg-[#1FC430] text-white!' : 'bg-white text-[#611192]! hover:bg-[#F2E8F8]'
              }`}
            >
              {rsvped ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Reminder set
                </>
              ) : (
                'Remind me'
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function HomeEventsSection() {
  const router = useRouter();
  const { data: apiEvents = [], isLoading } = useGetEventsQuery({ limit: 24 });
  const events = apiEvents as CommunityEventRecord[];

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedShareEvent, setSelectedShareEvent] =
    useState<EventSharePayload | null>(null);

  const bento = useMemo(() => {
    const demo = buildDemoEvents();

    const donationApi = events.find(e => e.eventType === 'donation');
    const pollApi = events.find(
      e => Boolean(e.pollQuestion && (e.pollOptions?.length ?? 0) > 0),
    );
    const liveApi = events.find(e => e.eventType === 'live_session');

    return {
      donation: donationApi
        ? toBentoEvent(donationApi, FALLBACK_IMAGES.donation)
        : demo.donation,
      donationSource: donationApi || null,
      poll: pollApi
        ? toBentoEvent(pollApi, FALLBACK_IMAGES.poll, demo.poll.pollOptions)
        : demo.poll,
      live: liveApi
        ? toBentoEvent(liveApi, FALLBACK_IMAGES.live)
        : demo.live,
    };
  }, [events]);

  const [donationModal, setDonationModal] = useState<{
    event: CommunityEventRecord;
    amount: number;
  } | null>(null);
  const [donationRaisedMap, setDonationRaisedMap] = useState<Record<string, number>>({});

  const donationRaised =
    donationRaisedMap[bento.donation._id] ??
    getDonationProgress(
      (bento.donationSource || (bento.donation as unknown as CommunityEventRecord)) as CommunityEventRecord,
    ).raised;

  const handleOpenDonation = (_bentoEvent: BentoEvent, amount: number) => {
    if (!bento.donationSource?.slug) {
      router.push('/events');
      return;
    }
    router.push(
      buildDonationCheckoutUrl(bento.donationSource, {
        amount,
      }),
    );
  };

  const handleShare = (event: BentoEvent) => {
    setSelectedShareEvent({
      id: event.slug || event._id,
      title: event.title,
      description: event.description,
      tag:
        event.eventType === 'donation'
          ? 'FEATURED GOAL'
          : event.eventType === 'live_session'
            ? 'LIVE STREAM'
            : 'COMMUNITY POLL',
      url:
        typeof window !== 'undefined'
          ? `${window.location.origin}/events/${event.slug}`
          : `/events/${event.slug}`,
    });
    setIsShareOpen(true);
  };

  const handleNavigate = (slug: string) => {
    router.push(`/events/${slug}`);
  };

  if (isLoading) {
    return (
      <section className="border-y border-[#E6E3E7] bg-[#FCF2FF] py-16">
        <div className="custom-container">
          <div className="mb-8 flex flex-col gap-3">
            <SkeletonLine className="h-3 w-40" />
            <SkeletonLine className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-3 gap-6 max-[767px]:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ap-section relative overflow-hidden bg-gradient-to-b from-[#FCF2FF] to-[#FAF8FB]">
      <div className="custom-container">
        <SectionHeading
          eyebrow="Events & live"
          title="Give beside the shop"
          description="Support an appeal, shape where funds go next, and join charities live from the ground."
          className="mb-10 max-[767px]:mb-6"
          actions={
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 rounded-full bg-[#611192] px-5 py-3 text-sm font-medium text-white! shadow-[0_8px_20px_rgba(97,17,146,0.22)] transition hover:bg-[#3B055C]"
            >
              All events
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          }
        />

        <div className="grid grid-cols-12 items-stretch gap-5 max-[991px]:grid-cols-1">
          <div className="col-span-7 max-[991px]:col-span-full">
            <DonationColumnCard
              event={bento.donation}
              raisedAmount={donationRaised}
              onNavigate={handleNavigate}
              onShare={handleShare}
              onDonate={handleOpenDonation}
            />
          </div>
          <div className="col-span-5 flex flex-col gap-5 max-[991px]:col-span-full">
            <PollColumnCard
              event={bento.poll}
              onNavigate={handleNavigate}
              onShare={handleShare}
            />
            <LiveColumnCard
              event={bento.live}
              onNavigate={handleNavigate}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      <EventShareModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setSelectedShareEvent(null);
        }}
        event={selectedShareEvent}
      />

      <EventDonationModal
        open={Boolean(donationModal)}
        event={donationModal?.event || null}
        defaultAmount={donationModal?.amount}
        onClose={() => setDonationModal(null)}
      />
    </section>
  );
}
