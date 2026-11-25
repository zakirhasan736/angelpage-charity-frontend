'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Loader2 } from 'lucide-react';
import type { CommunityEventRecord } from '@/lib/server-api';
import { ToastService } from '@/components/elements/notifications/ToastService';

export const voteStorageKey = (eventId: string) => `angelpage-event-poll-${eventId}`;

type Option = { text: string; votes?: number };

/**
 * Votes straight from the card. One vote per browser (remembered in
 * localStorage, same key as before); results animate in after voting.
 */
export default function InlinePoll({
  event,
  dark = false,
  disabled = false,
  onVoted,
}: {
  event: CommunityEventRecord;
  dark?: boolean;
  disabled?: boolean;
  onVoted?: (options: Option[], index: number) => void;
}) {
  const [options, setOptions] = useState<Option[]>(event.pollOptions || []);
  const [voted, setVoted] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    setOptions(event.pollOptions || []);
    try {
      const stored = localStorage.getItem(voteStorageKey(event._id));
      setVoted(stored != null ? Number(stored) : null);
    } catch {
      /* storage blocked */
    }
  }, [event._id, event.pollOptions]);

  const total = options.reduce((s, o) => s + (o.votes || 0), 0);
  const showResults = voted !== null || disabled;
  const leader = options.reduce((best, o, i) => ((o.votes || 0) > (options[best]?.votes || 0) ? i : best), 0);

  const vote = async (index: number) => {
    if (voted !== null || disabled || busy !== null) return;
    setBusy(index);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events/${event._id}/poll/vote`, { optionIndex: index });
      const next = (res.data?.pollOptions as Option[]) || options.map((o, i) => (i === index ? { ...o, votes: (o.votes || 0) + 1 } : o));
      setOptions(next);
      setVoted(index);
      try {
        localStorage.setItem(voteStorageKey(event._id), String(index));
      } catch {
        /* ignore */
      }
      onVoted?.(next, index);
    } catch {
      ToastService.error('Your vote could not be counted. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {event.pollQuestion ? <p className={`font-primary text-[18px] leading-snug ${dark ? 'text-white' : 'text-[#0B0112]'}`}>{event.pollQuestion}</p> : null}
      <ul className="mt-3 space-y-2">
        {options.map((o, i) => {
          const pct = total ? Math.round(((o.votes || 0) / total) * 100) : 0;
          const mine = voted === i;
          return (
            <li key={`${o.text}-${i}`}>
              <button
                type="button"
                onClick={() => vote(i)}
                disabled={showResults || busy !== null}
                aria-pressed={mine}
                className={`relative flex min-h-11 w-full items-center justify-between gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-left text-[14px] transition ${
                  dark
                    ? `bg-white/[0.07] text-white ${showResults ? '' : 'hover:bg-white/[0.14]'} ${mine ? 'ring-1 ring-[#D9B8F0]' : ''}`
                    : `bg-white text-[#0B0112] ring-1 ${showResults ? 'ring-[#ECE8EE]' : 'ring-[#E2DCE6] hover:ring-[#611192] hover:text-[#611192]'} ${mine ? 'ring-[#611192]!' : ''}`
                }`}
              >
                {showResults ? (
                  <span
                    className={`absolute inset-y-0 left-0 rounded-xl transition-[width] duration-700 ${dark ? (i === leader ? 'bg-[#8A3FC7]/45' : 'bg-white/10') : i === leader ? 'bg-[#E4D0F3]' : 'bg-[#EDE7F1]'}`}
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                ) : null}
                <span className="relative flex items-center gap-2">
                  {mine ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  {o.text}
                </span>
                <span className="relative shrink-0 text-[13px] font-semibold">
                  {busy === i ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : showResults ? `${pct}%` : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={`mt-3 text-[12px] ${dark ? 'text-white/55' : 'text-[#8A888C]'}`} aria-live="polite">
        {voted !== null ? `Thanks for voting · ${total.toLocaleString()} votes` : disabled ? `Voting closed · ${total.toLocaleString()} votes` : `Tap to vote · ${total.toLocaleString()} votes so far`}
      </p>
    </div>
  );
}
