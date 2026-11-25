'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Archive, Clock, ExternalLink, FileEdit, Layers, Package, Pencil, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import SocialPostingPanel from '@/components/product/SocialPostingPanel';
import type { SocialPostingPrefs } from '@/components/product/SocialPostingToggles';
import { Btn, ConfirmDialog, EmptyState, MiniStats, RowSkeleton, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { formatMoney } from '@/lib/money';

type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'LIVE' | 'REMOVED' | string;
type Listing = {
  id: string;
  slug?: string;
  name?: string;
  brand?: string;
  size?: string;
  category?: string;
  price?: number;
  quantity?: number;
  status: ListingStatus;
  createdAt?: string;
  selectedCharityName?: string;
  images?: { url?: string; altText?: string }[];
  videos?: { url?: string }[];
  socialPosting?: SocialPostingPrefs;
};

const API = process.env.NEXT_PUBLIC_API_URL;

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'LIVE', label: 'Live', match: s => s === 'LIVE' },
  { id: 'PENDING_REVIEW', label: 'In review', match: s => s === 'PENDING_REVIEW' },
  { id: 'DRAFT', label: 'Drafts', match: s => s === 'DRAFT' },
  { id: 'REMOVED', label: 'Removed', match: s => s === 'REMOVED' },
];

const STATUS_LABEL: Record<string, { label: string; tone: 'green' | 'amber' | 'grey' | 'red' }> = {
  LIVE: { label: 'Live', tone: 'green' },
  PENDING_REVIEW: { label: 'In review', tone: 'amber' },
  DRAFT: { label: 'Draft', tone: 'grey' },
  REMOVED: { label: 'Removed', tone: 'red' },
};

type Pending = { id: string; kind: 'delete' | 'remove' } | null;

/** Listings tab for members and charities: filter, search and manage every item. */
export default function ListingsManager({ role }: { role: 'USER' | 'CHARITY' }) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const token = session?.token;
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState<string | null>(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/products/listings`, { params: { role }, headers });
      setItems(data?.products || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, role, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    FILTERS.forEach(f => (c[f.id] = items.filter(i => f.match(i.status)).length));
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const f = FILTERS.find(x => x.id === filter) || FILTERS[0];
    return items.filter(i => f.match(i.status) && (!term || `${i.name} ${i.brand} ${i.category} ${i.status}`.toLowerCase().includes(term)));
  }, [items, q, filter]);

  const liveValue = useMemo(() => items.filter(i => i.status === 'LIVE').reduce((s, i) => s + Number(i.price || 0) * Math.max(1, Number(i.quantity || 1)), 0), [items]);

  const confirm = async () => {
    if (!pending) return;
    setBusy(pending.id);
    try {
      if (pending.kind === 'delete') {
        await axios.delete(`${API}/products/${pending.id}`, { headers });
        ToastService.success('Listing deleted.');
      } else {
        await axios.put(`${API}/products/${pending.id}`, { status: 'REMOVED' }, { headers });
        ToastService.success('Listing removed from the shop.');
      }
      await load();
    } catch {
      ToastService.error('That didn’t work. Please try again.');
    } finally {
      setBusy(null);
      setPending(null);
    }
  };

  const relist = async (id: string) => {
    setBusy(id);
    try {
      await axios.patch(`${API}/products/${id}/relist`, { quantity: 1 }, { headers });
      ToastService.success('Listing is back in the shop.');
      await load();
    } catch {
      ToastService.error('Couldn’t relist this item.');
    } finally {
      setBusy(null);
    }
  };

  const edit = (id: string) => router.push(`/product/post-product?edit=${id}`);

  const newActions = (
    <div className="flex gap-2 sm:w-full">
      {role === 'CHARITY' ? (
        <Btn variant="secondary" icon={Upload} onClick={() => router.push('/product/bulk-list')} className="sm:flex-1">
          Bulk upload
        </Btn>
      ) : null}
      <Btn icon={Plus} onClick={() => router.push('/product/post-product')} className="sm:flex-1">
        List an item
      </Btn>
    </div>
  );

  if (error) {
    return <EmptyState icon={Package} title="We couldn’t load your listings" body="Check your connection and try again." action={<Btn onClick={load}>Try again</Btn>} />;
  }

  return (
    <div>
      <MiniStats
        items={[
          { label: 'Live', value: loading ? '—' : counts.LIVE, icon: Package, hint: loading ? undefined : `${formatMoney(liveValue)} listed` },
          { label: 'In review', value: loading ? '—' : counts.PENDING_REVIEW, icon: Clock },
          { label: 'Drafts', value: loading ? '—' : counts.DRAFT, icon: FileEdit },
          { label: 'Removed', value: loading ? '—' : counts.REMOVED, icon: Archive },
        ]}
      />
      <Toolbar
        search={q}
        onSearch={setQ}
        placeholder="Search by name, brand or category"
        filters={FILTERS.map(f => ({ id: f.id, label: f.label, count: loading ? undefined : counts[f.id] }))}
        value={filter}
        onFilter={setFilter}
        trailing={newActions}
      />

      {loading ? (
        <RowSkeleton rows={5} />
      ) : visible.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nothing listed yet"
            body={role === 'CHARITY' ? 'Add donated or new stock to your storefront. Bulk upload handles big batches.' : 'Snap a few photos, set a price and choose a charity. It takes a couple of minutes.'}
            action={newActions}
          />
        ) : (
          <EmptyState icon={Layers} title="No listings match" body="Try another filter or search term." action={<Btn variant="secondary" onClick={() => { setQ(''); setFilter('all'); }}>Clear filters</Btn>} />
        )
      ) : (
        <ul className="space-y-3">
          {visible.map(item => {
            const s = STATUS_LABEL[item.status] || { label: item.status, tone: 'grey' as const };
            const img = item.images?.[0]?.url || '/images/products/card-placeholder-image.webp';
            const isBusy = busy === item.id;
            return (
              <li key={item.id} className={`rounded-2xl bg-white p-3 ring-1 ring-[#ECE8EE] transition hover:ring-[#DCD3E1] sm:p-3 ${isBusy ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4 sm:items-start sm:gap-3">
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6] sm:h-[84px] sm:w-[72px]">
                    <Image src={img} alt={item.images?.[0]?.altText || ''} fill sizes="84px" className="object-cover" />
                  </div>
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_110px_110px] items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-1 sm:gap-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold text-[#0B0112]">{item.name || 'Untitled listing'}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8A888C]">
                        {[item.brand, item.size, item.category].filter(Boolean).join(' · ') || 'No details yet'}
                      </p>
                      {item.selectedCharityName ? <p className="mt-0.5 truncate text-[12px] text-[#611192]">Supports {item.selectedCharityName}</p> : null}
                    </div>
                    <p className="text-[15px] font-semibold text-[#0B0112] tabular-nums md:hidden sm:block sm:text-[14px]">{formatMoney(item.price)}</p>
                    <div className="flex items-center gap-2 md:flex-col md:items-end sm:flex-row sm:items-center">
                      <StatusPill status={s.label} tone={s.tone} />
                      <span className="hidden text-[13px] font-semibold tabular-nums md:block sm:hidden">{formatMoney(item.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#F3EFF5] pt-3">
                  {item.status === 'LIVE' && item.slug ? (
                    <Link href={`/product/${item.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-[#474648] hover:bg-[#F4F1F6]">
                      <ExternalLink className="h-4 w-4" aria-hidden /> View
                    </Link>
                  ) : null}
                  {item.status !== 'REMOVED' ? (
                    <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => edit(item.id)}>
                      Edit
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" icon={RotateCcw} onClick={() => relist(item.id)} loading={isBusy}>
                      Relist
                    </Btn>
                  )}
                  {item.status !== 'REMOVED' ? (
                    <Btn size="sm" variant="ghost" onClick={() => setShareOpen(shareOpen === item.id ? null : item.id)} aria-expanded={shareOpen === item.id}>
                      {shareOpen === item.id ? 'Hide social' : 'Social posting'}
                    </Btn>
                  ) : null}
                  <span className="ml-auto" />
                  {item.status === 'LIVE' ? (
                    <Btn size="sm" variant="ghost" icon={Archive} onClick={() => setPending({ id: item.id, kind: 'remove' })} className="text-[#6B686E]!">
                      Remove
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => setPending({ id: item.id, kind: 'delete' })} className="text-[#B0002A]! hover:bg-[#FFF1F4]!">
                      Delete
                    </Btn>
                  )}
                </div>

                {shareOpen === item.id && token ? (
                  <div className="mt-2 rounded-xl bg-[#FAF8FB] px-3 pb-3 [&>div]:mt-0! [&>div]:border-0! [&>div]:pt-3!">
                    <SocialPostingPanel productId={item.id} token={token} initialPrefs={item.socialPosting} listingVideoUrl={item.videos?.[0]?.url || ''} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.kind === 'remove' ? 'Remove from the shop?' : 'Delete this listing?'}
        body={pending?.kind === 'remove' ? 'Buyers won’t see it any more. You can relist it later from Removed.' : 'This permanently deletes the listing and its photos.'}
        confirmLabel={pending?.kind === 'remove' ? 'Remove' : 'Delete'}
        loading={Boolean(busy)}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
