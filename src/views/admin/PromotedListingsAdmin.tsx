'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Megaphone, Share2 } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { Btn, EmptyState, RowSkeleton, Toolbar } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { ToastService } from '@/components/elements/notifications/ToastService';
import AdminSocialPostingPanel from '@/components/product/AdminSocialPostingPanel';
import type { SocialPostingPrefs } from '@/components/product/SocialPostingToggles';

interface LiveProduct {
  _id: string;
  name: string;
  price: number;
  isPromoted?: boolean;
  images?: { url: string }[];
  videos?: { url: string }[];
  socialPosting?: SocialPostingPrefs;
  charity?: { charityName?: string };
}

const PromotedListingsAdmin = () => {
  const { data: session } = useSession() || {};
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSocial, setExpandedSocial] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState('all');

  const fetchLive = useCallback(async () => {
    if (!session?.token) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/all`,
        {
          params: { status: 'LIVE' },
          headers: { Authorization: `Bearer ${session.token}` },
        }
      );
      setProducts(res.data.products || []);
    } catch {
      ToastService.error('Failed to load live listings');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  const togglePromoted = async (productId: string, isPromoted: boolean) => {
    if (!session?.token) return;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/promoted`,
        { isPromoted },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      ToastService.success(
        isPromoted ? 'Listing promoted' : 'Promotion removed'
      );
      fetchLive();
    } catch {
      ToastService.error('Failed to update promoted status');
    }
  };

  if (loading) return <RowSkeleton rows={4} />;
  if (!products.length) return <EmptyState icon={Megaphone} title="No live listings" body="Once listings are approved you can promote them here." />;

  const promotedCount = products.filter(p => p.isPromoted).length;
  const term = q.trim().toLowerCase();
  const visible = products.filter(p => (view === 'all' || (view === 'promoted' ? p.isPromoted : !p.isPromoted)) && (!term || `${p.name} ${p.charity?.charityName || ''}`.toLowerCase().includes(term)));

  return (
    <div>
      <p className="mb-4 text-[13px] text-[#6B686E]">Promoted listings appear in the homepage carousel and marketplace highlights.</p>
      <Toolbar
        search={q}
        onSearch={setQ}
        placeholder="Search listings or charities"
        value={view}
        onFilter={setView}
        filters={[
          { id: 'all', label: 'All', count: products.length },
          { id: 'promoted', label: 'Promoted', count: promotedCount },
          { id: 'not', label: 'Not promoted', count: products.length - promotedCount },
        ]}
      />
      <ul className="space-y-2">
        {visible.map(product => (
          <li key={product._id} className={`rounded-2xl bg-white p-3 ring-1 transition ${product.isPromoted ? 'ring-2 ring-[#611192]/40' : 'ring-[#ECE8EE]'}`}>
            <div className="flex items-center gap-3 sm:flex-wrap">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6]">
                <Image src={product.images?.[0]?.url || ''} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#0B0112]">{product.name}</p>
                <p className="truncate text-[12.5px] text-[#8A888C]">
                  {formatMoney(product.price)} · {product.charity?.charityName || 'Charity'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:w-full sm:justify-end">
                <Btn size="sm" variant="ghost" icon={Share2} onClick={() => setExpandedSocial(expandedSocial === product._id ? null : product._id)}>
                  Social
                </Btn>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(product.isPromoted)}
                  onClick={() => togglePromoted(product._id, !product.isPromoted)}
                  className={`inline-flex h-9 items-center gap-2 rounded-full pr-3 pl-1 text-[13px] font-medium transition ${product.isPromoted ? 'bg-[#611192] text-white' : 'bg-[#F4F1F6] text-[#474648]'}`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${product.isPromoted ? 'bg-white text-[#611192]' : 'bg-white text-[#8A888C]'}`}>
                    <Megaphone className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {product.isPromoted ? 'Promoted' : 'Promote'}
                </button>
              </div>
            </div>
            {expandedSocial === product._id && session?.token ? (
              <div className="mt-3 rounded-2xl bg-[#FAF8FB] px-3 pb-3 [&>div]:mt-0! [&>div]:border-0!">
                <AdminSocialPostingPanel productId={product._id} token={session.token} initialPrefs={product.socialPosting} listingVideoUrl={product.videos?.[0]?.url || ''} />
              </div>
            ) : null}
          </li>
        ))}
        {visible.length === 0 ? <li className="rounded-2xl bg-[#FAF8FB] px-4 py-6 text-center text-[13.5px] text-[#6B686E]">No listings match.</li> : null}
      </ul>
    </div>
  );
};

export default PromotedListingsAdmin;
