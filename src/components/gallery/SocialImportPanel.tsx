'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Check,
  Heart,
  Link2,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { Btn, SectionCard } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import {
  ALL_PROVIDERS,
  PROVIDER_META,
  type ConnectProvider,
  type SocialProvider,
} from '@/lib/socialVideo';
import ProviderIcon from './ProviderIcon';
import { useSocialConnections } from './useSocialConnections';

type RemoteVideo = {
  id: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
  publishedAt?: string;
};
export type Listing = {
  _id: string;
  name: string;
  price?: number;
  image?: string;
  status?: string;
};
export type Purpose = 'product' | 'story';

const errMsg = (e: unknown, fallback: string) =>
  axios.isAxiosError(e) && e.response?.data?.message
    ? String(e.response.data.message)
    : fallback;

const CAP_LABELS: {
  key: 'importReels' | 'postReels' | 'postProducts';
  label: string;
}[] = [
  { key: 'importReels', label: 'Import reels' },
  { key: 'postReels', label: 'Auto-post reels' },
  { key: 'postProducts', label: 'Auto-post products' },
];

/**
 * Connected accounts for creators (sellers, charity storefronts, admins):
 * TikTok, Instagram, YouTube, Facebook, LinkedIn, X. Linked accounts are used
 * to import past reels (as product showcases or charity stories) and to
 * auto-post new reels and listings.
 */
export default function SocialImportPanel({
  isAdmin = false,
  onImported,
}: {
  isAdmin?: boolean;
  onImported?: () => void;
}) {
  const { providers, reload, api, headers } = useSocialConnections();
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [linkPurpose, setLinkPurpose] = useState<Purpose>('product');
  const [linkProduct, setLinkProduct] = useState<Listing | null>(null);
  const [picker, setPicker] = useState<SocialProvider | null>(null);

  // back from the platform's sign-in page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const connected = q.get('connected') as ConnectProvider | null;
    const error = q.get('connect_error');
    if (!connected && !error) return;
    if (connected && ALL_PROVIDERS.includes(connected)) {
      const importable = [
        'tiktok',
        'instagram',
        'youtube',
        'facebook',
      ].includes(connected);
      ToastService.success(
        importable
          ? `${PROVIDER_META[connected].label} connected. Pick the videos to bring in.`
          : `${PROVIDER_META[connected].label} connected. New listings will be posted there.`
      );
      if (importable) setPicker(connected as SocialProvider);
    } else if (error) ToastService.error(error);
    q.delete('connected');
    q.delete('connect_error');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${q.toString() ? `?${q}` : ''}`
    );
  }, []);

  const connect = async (p: ConnectProvider) => {
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

  const disconnect = async (p: ConnectProvider) => {
    if (
      !confirm(
        `Disconnect ${PROVIDER_META[p].label}? Reels you already imported stay up; nothing new will be posted there.`
      )
    )
      return;
    setBusy(p);
    try {
      await axios.delete(`${api}/social-connect/${p}`, { headers });
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const importLink = async () => {
    if (!link.trim()) return;
    if (linkPurpose === 'product' && !linkProduct) {
      ToastService.error('Pick the product this video shows.');
      return;
    }
    setBusy('link');
    try {
      const r = await axios.post(
        `${api}/gallery/import`,
        {
          url: link.trim(),
          publishNow: isAdmin,
          productId: linkPurpose === 'product' ? linkProduct?._id : undefined,
          tags: linkPurpose === 'product' ? ['product'] : ['impact'],
        },
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
      title="Connected accounts"
      description="Link your socials once. Bring in reels you've already made, and every new reel or listing you post here goes out to them automatically."
    >
      <div className="grid grid-cols-3 gap-3 laptop-m:grid-cols-2 sm:grid-cols-1">
        {ALL_PROVIDERS.map(p => {
          const s = providers?.find(x => x.provider === p);
          const m = PROVIDER_META[p];
          const caps = s?.capabilities;
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
              {caps ? (
                <ul className="mt-3 flex flex-wrap gap-1">
                  {CAP_LABELS.filter(c => caps[c.key]).map(c => (
                    <li
                      key={c.key}
                      className="rounded-full bg-[#F4F1F6] px-2 py-0.5 text-[11px] font-medium text-[#474648]"
                    >
                      {c.label}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex gap-2 pt-4">
                {s?.connected ? (
                  <>
                    {caps?.importReels ? (
                      <Btn
                        size="sm"
                        className="flex-1"
                        onClick={() => setPicker(p as SocialProvider)}
                      >
                        Choose reels
                      </Btn>
                    ) : (
                      <span className="flex flex-1 items-center text-[12.5px] text-[#00775F]">
                        Auto-posting on
                      </span>
                    )}
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

      <div className="mt-4 space-y-3 rounded-2xl bg-[#FAF8FB] p-4">
        <label
          htmlFor="import-link"
          className="text-[13px] font-semibold text-[#0B0112]"
        >
          Or paste a link to one reel
        </label>
        <PurposeSwitch value={linkPurpose} onChange={setLinkPurpose} />
        {linkPurpose === 'product' ? (
          <ProductSelect
            api={api || ''}
            headers={headers}
            value={linkProduct}
            onChange={setLinkProduct}
          />
        ) : null}
        <div className="flex gap-2 sm:flex-col">
          <input
            id="import-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && importLink()}
            placeholder="tiktok.com/@you/video/…  ·  instagram.com/reel/…  ·  facebook.com/reel/…  ·  youtube.com/shorts/…"
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
          <p className="text-[12px] text-[#8A888C]">
            Imported reels are checked by our team before they appear on Reels.
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

export function PurposeSwitch({
  value,
  onChange,
}: {
  value: Purpose;
  onChange: (p: Purpose) => void;
}) {
  const opts: {
    id: Purpose;
    label: string;
    hint: string;
    icon: typeof ShoppingBag;
  }[] = [
    {
      id: 'product',
      label: 'Product showcase',
      hint: 'Shows an item you sell',
      icon: ShoppingBag,
    },
    {
      id: 'story',
      label: 'Charity story',
      hint: 'Impact, thank-yous, events',
      icon: Heart,
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="What is this video?"
      className="grid grid-cols-2 gap-2"
    >
      {opts.map(o => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${value === o.id ? 'bg-white ring-2 ring-[#611192]' : 'bg-white/60 ring-1 ring-[#E2DCE6] hover:ring-[#611192]/40'}`}
        >
          <o.icon
            className={`h-4 w-4 shrink-0 ${value === o.id ? 'text-[#611192]' : 'text-[#8A888C]'}`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-[#0B0112]">
              {o.label}
            </span>
            <span className="block truncate text-[11.5px] text-[#8A888C]">
              {o.hint}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Pick one of your own listings to tag on a reel. */
export function ProductSelect({
  api,
  headers,
  value,
  onChange,
}: {
  api: string;
  headers?: Record<string, string>;
  value: Listing | null;
  onChange: (l: Listing | null) => void;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Listing[] | null>(null);
  const [open, setOpen] = useState(!value);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      axios
        .get(`${api}/social-connect/my-products`, {
          headers,
          params: q ? { q } : {},
        })
        .then(r => setItems(r.data.items || []))
        .catch(() => setItems([]));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, q, open]);

  if (value && !open) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-[#E2DCE6]">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#F4F1F6]">
          {value.image ? (
            <Image
              src={value.image}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-[#0B0112]">
            {value.name}
          </span>
          <span className="block text-[12px] text-[#8A888C]">
            Shoppers can buy it straight from the reel
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[12.5px] font-semibold text-[#611192] hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-2.5 ring-1 ring-[#E2DCE6]">
      <label className="relative block">
        <span className="sr-only">Search your listings</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A888C]"
          aria-hidden
        />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Which product does it show? Search your listings"
          className="h-10 w-full rounded-lg! bg-[#FAF8FB] pr-3 pl-9 text-[13.5px] outline-none"
        />
      </label>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {items === null ? (
          <li className="px-2 py-3 text-[13px] text-[#8A888C]">
            Loading your listings…
          </li>
        ) : items.length === 0 ? (
          <li className="px-2 py-3 text-[13px] text-[#8A888C]">
            {q
              ? 'No listings match.'
              : 'You have no listings yet. List an item first, or choose "Charity story".'}
          </li>
        ) : (
          items.map(l => (
            <li key={l._id}>
              <button
                type="button"
                onClick={() => {
                  onChange(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[#F6EEFA] ${value?._id === l._id ? 'bg-[#F6EEFA]' : ''}`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F4F1F6]">
                  {l.image ? (
                    <Image
                      src={l.image}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0B0112]">
                  {l.name}
                </span>
                {l.price ? (
                  <span className="text-[12.5px] font-medium text-[#6B686E] tabular-nums">
                    ${Number(l.price).toFixed(2).replace(/\.00$/, '')}
                  </span>
                ) : null}
                {l.status && l.status !== 'LIVE' ? (
                  <span className="rounded-full bg-[#FFF4E5] px-1.5 text-[10.5px] font-semibold text-[#8A4B00]">
                    {l.status === 'DRAFT' ? 'Draft' : 'In review'}
                  </span>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
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
  const [purpose, setPurpose] = useState<Purpose>('product');
  const [product, setProduct] = useState<Listing | null>(null);
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
        setError(errMsg(e, `Could not load your ${m.label} reels.`));
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

  const needsProduct = purpose === 'product' && !product;

  const save = async () => {
    if (needsProduct) {
      ToastService.error('Pick the product these reels show.');
      return;
    }
    setSaving(true);
    try {
      const r = await axios.post(
        `${api}/gallery/import`,
        {
          provider,
          videoIds: [...picked],
          publishNow: isAdmin,
          productId: purpose === 'product' ? product?._id : undefined,
          tags: purpose === 'product' ? ['product'] : ['impact'],
        },
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
      className="fixed inset-0 z-[10055] flex items-center justify-center bg-[#0B0112]/60 p-4 backdrop-blur-sm sm:items-end sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-b-none">
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
              Choose {m.short} reels
            </h2>
            <p className="text-[12.5px] text-[#8A888C]">
              Pick up to 20. Tag the product they show so shoppers can buy from
              the reel.
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
          <div className="mb-5 space-y-3 rounded-2xl bg-[#FAF8FB] p-4">
            <p className="text-[13px] font-semibold text-[#0B0112]">
              What do these reels show?
            </p>
            <PurposeSwitch value={purpose} onChange={setPurpose} />
            {purpose === 'product' ? (
              <ProductSelect
                api={api}
                headers={headers}
                value={product}
                onChange={setProduct}
              />
            ) : null}
          </div>

          {error ? (
            <p className="rounded-2xl bg-[#FFF1F4] px-4 py-6 text-center text-[14px] text-[#B0002A]">
              {error}
            </p>
          ) : !loading && videos.length === 0 ? (
            <p className="rounded-2xl bg-[#FAF8FB] px-4 py-10 text-center text-[14px] text-[#6B686E]">
              No reels found on this account
              {provider === 'instagram'
                ? ' (Instagram only shares videos from professional accounts)'
                : provider === 'facebook'
                  ? ' (reels are read from the Facebook Page you connected)'
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
          <p className="min-w-0 truncate text-[13px] text-[#6B686E]">
            {picked.size ? `${picked.size} selected` : 'Nothing selected'}
            {picked.size && purpose === 'product' && product
              ? ` · tagged with ${product.name}`
              : ''}
          </p>
          <Btn
            loading={saving}
            disabled={!picked.size || needsProduct}
            onClick={save}
          >
            {isAdmin ? 'Import & publish' : 'Import for review'}
          </Btn>
        </footer>
      </div>
    </div>,
    document.body
  );
}
