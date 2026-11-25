'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import CharityApproval from './CharityApproval';
import { Banknote, Download, HandHeart, Package } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { Btn } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { CHARITY_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from '@/constants/brand';

const FinancePanel: React.FC = () => {
  const { data: session } = useSession() || {};
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [soldItemsCount, setSoldItemsCount] = useState(0);
  const [salesChange, setSalesChange] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/order/admin/sales-total`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setTotalRevenue(data.totalRevenue || 0);
          setSoldItemsCount(data.soldItemsCount || 0);
          setSalesChange(data.salesChange || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.token]);

  const exportFinance = async () => {
    if (!session?.token) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/operations/export/orders`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-orders-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="finance-panel space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[#6B686E]">Revenue across all orders. Export for bookkeeping.</p>
        <Btn variant="secondary" icon={Download} onClick={exportFinance}>
          Export orders (CSV)
        </Btn>
      </div>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
        <StatCard label="Platform revenue" value={loading ? '—' : formatMoney(totalRevenue)} change={salesChange} subtitle="vs prior period" loading={loading} accent="purple" icon={<Banknote className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <StatCard label="Items sold" value={loading ? '—' : soldItemsCount} loading={loading} accent="green" icon={<Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />} />
        <div className="rounded-[20px] bg-gradient-to-br from-[#3B055C] to-[#14021F] p-5 text-white">
          <HandHeart className="h-5 w-5 text-[#D9B8F0]" aria-hidden />
          <p className="mt-3 text-[13px] text-white/70">Split policy</p>
          <p className="mt-1 text-[15px] leading-snug">Up to {CHARITY_SHARE_PERCENT}% of each sale goes to charity. Platform fee is {PLATFORM_FEE_PERCENT}%.</p>
        </div>
      </div>
      <CharityApproval />
    </div>
  );
};

export default FinancePanel;
