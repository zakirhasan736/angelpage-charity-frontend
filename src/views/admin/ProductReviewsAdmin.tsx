'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Check, Star, X } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { Btn, EmptyState, RowSkeleton, StatusPill } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { timeSince } from '@/lib/timeSince';
import { ToastService } from '@/components/elements/notifications/ToastService';

interface PendingReview {
  _id: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  product?: {
    _id: string;
    name: string;
    price: number;
    images?: { url: string }[];
  };
}

const ProductReviewsAdmin = () => {
  const { data: session } = useSession() || {};
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!session?.token) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/admin/reviews/pending`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      setReviews(res.data.reviews || []);
    } catch {
      ToastService.error('Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const moderate = async (reviewId: string, action: 'approve' | 'reject') => {
    if (!session?.token) return;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/admin/reviews/${reviewId}`,
        { action },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      ToastService.success(
        action === 'approve' ? 'Review published' : 'Review rejected'
      );
      fetchPending();
    } catch {
      ToastService.error('Failed to moderate review');
    }
  };

  if (loading) return <RowSkeleton rows={3} />;

  if (!reviews.length) {
    return <EmptyState icon={Star} title="No reviews waiting" body="Buyer reviews that need a look will appear here." />;
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-[#6B686E]">Publish honest reviews to build trust. Verified purchases are labelled for buyers.</p>
      <ul className="space-y-3">
        {reviews.map(review => {
          const buyerName = review.user ? `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Buyer' : 'Buyer';
          return (
            <li key={review._id} className="rounded-[22px] bg-white p-4 ring-1 ring-[#ECE8EE]">
              <div className="flex gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6]">
                  <Image src={review.product?.images?.[0]?.url || ''} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#0B0112]">{review.product?.name}</p>
                  <p className="text-[12.5px] text-[#8A888C]">{formatMoney(review.product?.price)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#DCD5E0]'}`} aria-hidden />
                      ))}
                    </span>
                    <span className="text-[12.5px] text-[#474648]">{buyerName}</span>
                    {review.verifiedPurchase ? <StatusPill status="Verified purchase" tone="green" /> : null}
                    <span className="text-[12px] text-[#8A888C]">{timeSince(review.createdAt)} ago</span>
                  </div>
                </div>
              </div>
              <blockquote className="mt-3 rounded-2xl bg-[#FAF8FB] px-4 py-3 text-[14px] leading-relaxed text-[#2A2730]">{review.comment || <span className="text-[#8A888C]">No comment, rating only.</span>}</blockquote>
              <div className="mt-3 flex justify-end gap-2 sm:flex-col-reverse">
                <Btn size="sm" variant="secondary" icon={X} onClick={() => moderate(review._id, 'reject')} className="text-[#B0002A]!">
                  Reject
                </Btn>
                <Btn size="sm" icon={Check} onClick={() => moderate(review._id, 'approve')}>
                  Publish
                </Btn>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProductReviewsAdmin;
