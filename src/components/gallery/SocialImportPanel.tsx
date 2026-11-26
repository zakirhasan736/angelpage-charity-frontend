'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Check, Link2, Loader2, LogOut, RefreshCw, X } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { Btn, SectionCard } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { PROVIDER_META, type SocialProvider } from '@/lib/socialVideo';
import ProviderIcon from './ProviderIcon';

type ProviderStatus = {
  provider: SocialProvider;
  configured: boolean;
  connected: boolean;
  accountName?: string;
  accountAvatar?: string;
};
type RemoteVideo = {
  id: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
  publishedAt?: string;
};

const ORDER: SocialProvider[] = ['tiktok', 'instagram', 'youtube'];

const errMsg = (e: unknown, fallback: string) =>
  axios.isAxiosError(e) && e.response?.data?.message
    ? String(e.response.data.message)
    : fallback;

/**
 * "Import from your socials": link TikTok / Instagram / YouTube, pick past
 * videos, or paste a single link. Imported reels play in the platform's own
 * player on Angelpage. Shown inside every creator dashboard's gallery tab.
 */
export default function SocialImportPanel({
  isAdmin = false,
  onImported,
}: {
  isAdmin?: boolean;
  onImported?: () => void;
}) {
  const { data: session } = useSession() || {};
  const token = session?.token;
  const api = process.env.NEXT_PUBLIC_API_URL;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [status, setStatus] = useState<ProviderStatus[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [picker, setPicker] = useState<SocialProvider | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const r = await axios.get(`${api}/social-connect`, { headers });
      setStatus(r.data.providers || []);
    } catch {
      setStatus(
        ORDER.map(provider => ({
          provider,
          configured: false,
          connected: false,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, token]);

  useEffect(() => {
    load();
  }, [load]);

  // back from the platform's sign-in page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const connected = q.get('connected') as SocialProvider | null;
    const error = q.get('connect_error');
    if (!connected && !error) return;
    if (connected && ORDER.includes(connected)) {
      ToastService.success(
        `${PROVIDER_META[connected].label} connected. Pick the videos to bring in.`
      );
      setPicker(connected);
    } else if (error) ToastService.error(error);
    q.delete('connected');
    q.delete('connect_error');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${q.toString() ? `?${q}` : ''}`
    );
  }, []);

  const connect = async (p: SocialProvider) => {
    setBusy(p);
    try {
      const q = new URLSearchParams(window.location.search);
      q.set('tab', q.get('tab') || 'gallery');
      const r = await axios.get(`${api}/social-connect/${p}/start`, {
        headers,
        params: { returnTo: `${window.location.pathname}?${q}` },
      });
      window.location.assign(r.data.url);
    } catch (e) {
      ToastService.error(errMsg(e, 'Could not start the sign-in.'));
      setBusy(null);
    }
  };

  const disconnect = async (p: SocialProvider) => {
    if (
      !confirm(
        `Disconnect ${PROVIDER_META[p].label}? Reels you already imported stay up.`
      )
    )
      return;
    setBusy(p);
    try {
      await axios.delete(`${api}/social-connect/${p}`, { headers });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const importLink = async () => {
    if (!link.trim()) return;
    setBusy('link');
    try {
      const r = await axios.post(
        `${api}/gallery/import`,
        { url: link.trim(), publishNow: isAdmin },
        { headers }
      );
      ToastService.success(r.data.message || 'Imported.');
      setLink('');
      onImported?.();
    } catch (e) {
      ToastService.error(errMsg(e, 'Could not import that link.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SectionCard
      icon={Link2}
      title="Bring in videos you've already made"
      description="Connect TikTok, Instagram or YouTube and pick the charity videos you posted there. They play on Angelpage with the original player; nothing is re-uploaded."
    >
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {ORDER.map(p => {
          const s = status?.find(x => x.provider === p);
          const m = PROVIDER_META[p];
          return (
            <div
              key={p}
              className="flex flex-col rounded-2xl p-4 ring-1 ring-[#ECE8EE]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg, color: m.fg }}
                >
                  <ProviderIcon provider={p} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#0B0112]">
                    {m.label}
                  </p>
                  <p className="truncate text-[12px] text-[#8A888C]">
                    {!s
                      ? 'Checking…'
                      : s.connected
                        ? s.accountName || 'Connected'
                        : s.configured
                          ? 'Not connected'
                          : 'Not set up yet'}
                  </p>
                </div>
                {s?.connected ? (
                  <Check
                    className="ml-auto h-4 w-4 shrink-0 text-[#00775F]"
                    aria-label="Connected"
                  />
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                {s?.connected ? (
                  <>
                    <Btn
                      size="sm"
                      className="flex-1"
                      onClick={() => setPicker(p)}
                    >
                      Choose videos
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      icon={LogOut}
                      loading={busy === p}
                      onClick={() => disconnect(p)}
                      aria-label={`Disconnect ${m.label}`}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!s?.configured || busy === p}
                    onClick={() => connect(p)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ background: m.bg, color: m.fg }}
                  >
                    {busy === p ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <ProviderIcon provider={p} className="h-4 w-4" />
                    )}
                    Connect {m.short}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-[#FAF8FB] p-4">
        <label
          htmlFor="import-link"
          className="text-[13px] font-semibold text-[#0B0112]"
        >
          Or paste a link to one video
        </label>
        <div className="mt-2 flex gap-2 sm:flex-col">
          <input
            id="import-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && importLink()}
            placeholder="https://www.tiktok.com/@you/video/…  ·  instagram.com/reel/…  ·  youtube.com/shorts/…"
            className="h-11 min-w-0 flex-1 rounded-full! bg-white px-4 text-[14px] ring-1 ring-[#E2DCE6] outline-none focus:ring-2 focus:ring-[#611192]/30"
          />
          <Btn
            loading={busy === 'link'}
            onClick={importLink}
            disabled={!link.trim()}
          >
            {isAdmin ? 'Import & publish' : 'Import'}
          </Btn>
        </div>
        {!isAdmin ? (
          <p className="mt-2 text-[12px] text-[#8A888C]">
            Imported videos are checked by our team before they appear on Reels.
          </p>
        ) : null}
      </div>

      {picker ? (
        <VideoPicker
          provider={picker}
          api={api || ''}
          headers={headers}
          isAdmin={isAdmin}
          onClose={() => setPicker(null)}
          onImported={() => {
            setPicker(null);
            onImported?.();
          }}
        />
      ) : null}
    </SectionCard>
  );
}

function VideoPicker({
  provider,
  api,
  headers,
  isAdmin,
  onClose,
  onImported,
}: {
  provider: SocialProvider;
  api: string;
  headers?: Record<string, string>;
  isAdmin: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [videos, setVideos] = useState<RemoteVideo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const m = PROVIDER_META[provider];

  const fetchPage = useCallback(
    async (c?: string | null) => {
      setLoading(true);
      setError('');
      try {
        const r = await axios.get(`${api}/social-connect/${provider}/videos`, {
          headers,
          params: c ? { cursor: c } : {},
        });
        setVideos(v =>
          c ? [...v, ...(r.data.items || [])] : r.data.items || []
        );
        setCursor(r.data.nextCursor || null);
      } catch (e) {
        setError(errMsg(e, `Could not load your ${m.label} videos.`));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, provider]
  );

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string) =>
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else if (n.size < 20) n.add(id);
      return n;
    });

  const save = async () => {
    setSaving(true);
    try {
      const r = await axios.post(
        `${api}/gallery/import`,
        { provider, videoIds: [...picked], publishNow: isAdmin },
        { headers }
      );
      ToastService.success(r.data.message || 'Imported.');
      onImported();
    } catch (e) {
      ToastService.error(errMsg(e, 'Import failed.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0B0112]/60 p-4 backdrop-blur-sm sm:items-end sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-b-none">
        <header className="flex items-center gap-3 border-b border-[#F0EBF2] px-6 py-4 sm:px-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: m.bg, color: m.fg }}
          >
            <ProviderIcon provider={provider} className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="picker-title"
              className="font-primary text-[20px] text-[#0B0112]"
            >
              Choose {m.label} videos
            </h2>
            <p className="text-[12.5px] text-[#8A888C]">
              Pick the ones about charity work. Up to 20 at a time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchPage()}
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B686E] hover:bg-[#F4F1F6]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B686E] hover:bg-[#F4F1F6]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-4">
          {error ? (
            <p className="rounded-2xl bg-[#FFF1F4] px-4 py-6 text-center text-[14px] text-[#B0002A]">
              {error}
            </p>
          ) : !loading && videos.length === 0 ? (
            <p className="rounded-2xl bg-[#FAF8FB] px-4 py-10 text-center text-[14px] text-[#6B686E]">
              No videos found on this account
              {provider === 'instagram'
                ? ' (Instagram only shares videos from professional accounts)'
                : ''}
              .
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-3 md:grid-cols-3 sm:grid-cols-2">
              {videos.map(v => {
                const on = picked.has(v.id);
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => toggle(v.id)}
                      aria-pressed={on}
                      className={`group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[#1A0B26] text-left ring-2 transition ${on ? 'ring-[#611192]' : 'ring-transparent hover:ring-[#D9B8F0]'}`}
                    >
                      {v.thumbnailUrl ? (
                        <Image
                          src={v.thumbnailUrl}
                          alt=""
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      ) : null}
                      <span
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"
                        aria-hidden
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white transition ${on ? 'bg-[#611192]' : 'bg-black/30'}`}
                      >
                        {on ? (
                          <Check className="h-4 w-4 text-white" aria-hidden />
                        ) : null}
                      </span>
                      <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-[12.5px] leading-snug font-medium text-white">
                        {v.title || 'Untitled'}
                      </span>
                    </button>
                  </li>
                );
              })}
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li
                      key={`s${i}`}
                      className="aspect-[9/16] animate-pulse rounded-2xl bg-[#F2E8F8]"
                      aria-hidden
                    />
                  ))
                : null}
            </ul>
          )}
          {cursor && !loading ? (
            <div className="mt-5 text-center">
              <Btn
                variant="secondary"
                size="sm"
                onClick={() => fetchPage(cursor)}
              >
                Load more
              </Btn>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#F0EBF2] px-6 py-4 sm:px-4">
          <p className="text-[13px] text-[#6B686E]">
            {picked.size ? `${picked.size} selected` : 'Nothing selected'}
          </p>
          <Btn loading={saving} disabled={!picked.size} onClick={save}>
            {isAdmin ? 'Import & publish' : 'Import for review'}
          </Btn>
        </footer>
      </div>
    </div>,
    document.body
  );
}
