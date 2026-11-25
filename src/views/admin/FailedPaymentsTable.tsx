'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard } from 'lucide-react';
import { RowSkeleton, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import axios from 'axios';

interface FailedOrder {
  _id: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
  isGuestOrder?: boolean;
  buyer?: { email?: string; firstName?: string; lastName?: string; name?: string };
}

const FailedPaymentsTable: React.FC = () => {
  const { data: session } = useSession() || {};
  const [orders, setOrders] = useState<FailedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.token) return;
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/order/admin/failed-payments`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        setOrders(res.data.orders || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.token]);

  return (
    <SectionCard icon={CreditCard} tone={orders.length ? 'danger' : 'default'} title="Failed payments" description="Orders where the card payment didn’t go through.">
      {loading ? (
        <RowSkeleton rows={2} />
      ) : orders.length === 0 ? (
        <p className="rounded-2xl bg-[#FAF8FB] px-4 py-6 text-center text-[13.5px] text-[#6B686E]">No failed payments.</p>
      ) : (
        <ul className="divide-y divide-[#F3EFF5]">
          {orders.map(order => {
            const buyer = order.buyer?.email || order.buyer?.name || `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.trim() || 'Unknown buyer';
            return (
              <li key={order._id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[#0B0112]">{buyer}</p>
                  <p className="text-[12px] text-[#8A888C]">
                    #{order._id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusPill status={order.paymentStatus || 'Failed'} tone="red" />
                <p className="w-24 text-right text-[14px] font-semibold tabular-nums">{formatMoney(order.grandTotal)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};

export default FailedPaymentsTable;
