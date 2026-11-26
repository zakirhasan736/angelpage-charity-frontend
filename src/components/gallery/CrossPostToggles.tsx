'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Share2 } from 'lucide-react';
import { postStoryHref } from '@/lib/community';
import {
  PRODUCT_TARGETS,
  PROVIDER_META,
  REEL_TARGETS,
  type ConnectProvider,
} from '@/lib/socialVideo';
import ProviderIcon from './ProviderIcon';
import { useSocialConnections } from './useSocialConnections';

export type CrossPostPrefs = Partial<Record<ConnectProvider, boolean>>;

/**
 * "Also post to my accounts": one switch per linked platform. Reels go to
 * TikTok / Instagram / YouTube Shorts / Facebook; products to Facebook /
 * Instagram / TikTok / LinkedIn / X. Unlinked platforms show a Connect link.
 */
export default function CrossPostToggles({
  kind,
  value = {},
  onChange,
  note,
}: {
  kind: 'reel' | 'product';
  value?: CrossPostPrefs;
  onChange: (v: CrossPostPrefs) => void;
  note?: string;
}) {
  const { data: session } = useSession() || {};
  const { providers } = useSocialConnections();
  const targets = kind === 'reel' ? REEL_TARGETS : PRODUCT_TARGETS;
  const connectHref = postStoryHref(session);
  const anyConnected = targets.some(
    t => providers?.find(p => p.provider === t)?.connected
  );

  return (
    <fieldset className="rounded-2xl bg-[#FAF8FB] p-4">
      <legend className="sr-only">Auto-post to my social accounts</legend>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#611192] ring-1 ring-[#ECE8EE]">
          <Share2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-[#0B0112]">
            Also post to my accounts
          </p>
          <p className="text-[12.5px] leading-snug text-[#6B686E]">
            {note ||
              (kind === 'reel'
                ? 'When this reel goes live on Angelpage, it is posted to the accounts you switch on.'
                : 'When this listing goes live, a post with the photo and link goes out to the accounts you switch on.')}
          </p>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-1">
        {targets.map(t => {
          const s = providers?.find(p => p.provider === t);
          const m = PROVIDER_META[t];
          const on = Boolean(s?.connected) && value[t] !== false;
          return (
            <li
              key={t}
              className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#ECE8EE]"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: m.bg, color: m.fg }}
              >
                <ProviderIcon provider={t} className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-[#0B0112]">
                  {t === 'youtube' && kind === 'reel'
                    ? 'YouTube Shorts'
                    : m.short}
                </span>
                <span className="block truncate text-[11.5px] text-[#8A888C]">
                  {s?.connected
                    ? s.accountName || 'Connected'
                    : 'Not connected'}
                </span>
              </span>
              {s?.connected ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Post to ${m.label}`}
                  onClick={() => onChange({ ...value, [t]: !on })}
                  className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-[#611192]' : 'bg-[#DCD5E0]'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </button>
              ) : (
                <Link
                  href={connectHref}
                  className="shrink-0 text-[12.5px] font-semibold text-[#611192] hover:underline"
                >
                  Connect
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {providers && !anyConnected ? (
        <p className="mt-2.5 text-[12px] text-[#8A888C]">
          Link your accounts once in the Gallery tab of your dashboard, then
          every new post goes out automatically.
        </p>
      ) : null}
    </fieldset>
  );
}
