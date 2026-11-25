'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Check, ClipboardCheck, Clock, Hourglass, Share2, X } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { Btn, EmptyState, MiniStats, RowSkeleton, StatusPill } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { timeSince } from '@/lib/timeSince';
import { ToastService } from '@/components/elements/notifications/ToastService';
import AdminSocialPostingPanel from '@/components/product/AdminSocialPostingPanel';
import {
  defaultSocialPostingPrefs,
  type SocialPostingPrefs,
} from '@/components/product/SocialPostingToggles';

interface PendingProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  images?: { url: string }[];
  videos?: { url: string }[];
  socialPosting?: SocialPostingPrefs;
  seller?: { firstName?: string; lastName?: string; email?: string };
  charity?: { charityName?: string; email?: string };
  createdAt: string;
}

const PendingListings = () => {
  const { data: session } = useSession() || {};
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [openSocial, setOpenSocial] = useState<string | null>(null);
  const [socialByProduct, setSocialByProduct] = useState<
    Record<string, SocialPostingPrefs>
  >({});

  const fetchPending = useCallback(async () => {
    if (!session?.token) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/admin/pending-review`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      const list: PendingProduct[] = res.data.products || [];
      setProducts(list);
      const socialMap: Record<string, SocialPostingPrefs> = {};
      list.forEach(p => {
        socialMap[p._id] = p.socialPosting || defaultSocialPostingPrefs();
      });
      setSocialByProduct(socialMap);
    } catch {
      ToastService.error('Failed to load pending listings');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const review = async (productId: string, action: 'approve' | 'reject', reason = '') => {
    if (!session?.token) return;
    setBusyId(productId);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/review`,
        {
          action,
          reason,
          ...(action === 'approve' && {
            socialPosting: socialByProduct[productId] || defaultSocialPostingPrefs(),
          }),
        },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      ToastService.success(
        action === 'approve'
          ? 'Listing approved — social channels will post if configured'
          : 'Listing rejected'
      );
      setRejecting(null);
      setReason('');
      fetchPending();
    } catch {
      ToastService.error('Review action failed');
    } finally {
      setBusyId(null);
    }
  };

  const QUICK_REASONS = ['Photos are unclear', 'Prohibited item', 'Price looks wrong', 'Missing details', 'Possible duplicate'];

  if (loading) return <RowSkeleton rows={4} />;

  if (!products.length) {
    return <EmptyState icon={ClipboardCheck} title="All caught up" body="No listings are waiting for review. New submissions will appear here." />;
  }

  return (
    <div>
      <MiniStats items={[{ label: 'Waiting', value: products.length, icon: Clock }, { label: 'Oldest', value: timeSince(products.reduce((min, p) => (new Date(p.createdAt) < new Date(min) ? p.createdAt : min), products[0]?.createdAt)), icon: Hourglass }]} />
      <p className="mb-4 text-[13px] text-[#6B686E]">Check photos, price and category, choose social channels, then approve. Buyer reviews are moderated under Buyer reviews.</p>
      <ul className="space-y-3">
        {products.map(product => {
          const sellerLabel = product.seller ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() : product.charity?.charityName || 'Unknown seller';
          const isCharity = !product.seller && Boolean(product.charity);
          const videoUrl = product.videos?.[0]?.url || '';
          const busy = busyId === product._id;
          return (
            <li key={product._id} className={`rounded-[22px] bg-white p-4 ring-1 ring-[#ECE8EE] ${busy ? 'opacity-60' : ''}`}>
              <div className="flex gap-4 sm:flex-col">
                <div className="flex gap-2">
                  {(product.images?.length ? product.images.slice(0, 3) : [{ url: '' }]).map((img, i) => (
                    <span key={i} className={`relative overflow-hidden rounded-xl bg-[#F4F1F6] ${i === 0 ? 'h-24 w-24' : 'h-24 w-16 sm:w-20'}`}>
                      <Image src={img.url} alt={i === 0 ? product.name : ''} fill sizes="96px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-semibold text-[#0B0112]">{product.name}</p>
                    <p className="text-[16px] font-semibold tabular-nums">{formatMoney(product.price)}</p>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#8A888C] capitalize">{product.category}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-[#474648]">
                    <StatusPill status={isCharity ? 'Charity' : 'Member'} tone={isCharity ? 'purple' : 'blue'} />
                    {sellerLabel}
                    <span className="text-[#8A888C]">· {timeSince(product.createdAt)} ago</span>
                  </p>
                </div>
              </div>

              {rejecting === product._id ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-[#FFF7F8] p-4 ring-1 ring-[#FBD0DA]">
                  <p className="text-[13.5px] font-semibold text-[#9F1239]">Why are you rejecting it?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map(r => (
                      <button key={r} type="button" onClick={() => setReason(r)} className={`h-8 rounded-full px-3 text-[12.5px] ${reason === r ? 'bg-[#9F1239] text-white' : 'bg-white text-[#474648] ring-1 ring-[#F2D3DA]'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Message to the seller (optional)" className="w-full" />
                  <div className="flex justify-end gap-2 sm:flex-col-reverse">
                    <Btn variant="secondary" onClick={() => { setRejecting(null); setReason(''); }}>
                      Cancel
                    </Btn>
                    <Btn variant="danger" loading={busy} onClick={() => review(product._id, 'reject', reason)}>
                      Reject listing
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F3EFF5] pt-3 sm:flex-col sm:items-stretch">
                  <Btn size="sm" variant="ghost" icon={Share2} onClick={() => setOpenSocial(openSocial === product._id ? null : product._id)} aria-expanded={openSocial === product._id}>
                    Social channels
                  </Btn>
                  <span className="ml-auto sm:hidden" />
                  <Btn size="sm" variant="secondary" icon={X} onClick={() => setRejecting(product._id)} className="text-[#B0002A]!">
                    Reject
                  </Btn>
                  <Btn size="sm" icon={Check} loading={busy} onClick={() => review(product._id, 'approve')}>
                    Approve
                  </Btn>
                </div>
              )}

              {openSocial === product._id && session?.token ? (
                <div className="mt-3 rounded-2xl bg-[#FAF8FB] px-3 pb-3 [&>div]:mt-0! [&>div]:border-0!">
                  <AdminSocialPostingPanel
                    productId={product._id}
                    token={session.token}
                    initialPrefs={socialByProduct[product._id]}
                    listingVideoUrl={videoUrl}
                    deferSave
                    onChange={prefs => setSocialByProduct(prev => ({ ...prev, [product._id]: prefs }))}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PendingListings;
