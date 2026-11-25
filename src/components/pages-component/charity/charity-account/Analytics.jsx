'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import StatCard from '@/components/dashboard/StatCard';
import OverviewHero from '@/components/dashboard/OverviewHero';
import { formatMoney } from '@/lib/money';
import { ArrowUpRight, Banknote, HandHeart, Hourglass, Package, PlusCircle, Users, Wallet, MessageSquare } from 'lucide-react';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import OrderPipelinePanel from '@/components/dashboard/OrderPipelinePanel';
import useDashboardOverview from '@/hooks/useDashboardOverview';

const AnalyticsPage = () => {
  const { data: session } = useSession() || {};
  const [period, setPeriod] = useState('Month');
  const apiPeriod = period === 'Week' ? 'week' : period === 'Year' ? 'year' : 'month';
  const { data, loading, error } = useDashboardOverview(session?.token, apiPeriod);

  const seller = data?.seller;
  const charityFunds = data?.charityFunds;
  const messaging = data?.messaging;

  const chartData = useMemo(() => {
    if (!seller) return [];
    if (period === 'Week') return seller.weeklyData || [];
    if (period === 'Year') return seller.yearlyData || [];
    return seller.monthlyData || [];
  }, [seller, period]);

  const changeKey = period === 'Week' ? 'weekly' : period === 'Year' ? 'yearly' : 'monthly';
  const revenueChange = seller?.changes?.[changeKey]?.revenueChange ?? 0;
  const soldChange = seller?.changes?.[changeKey]?.soldChange ?? 0;

  if (error) {
    return (
      <div className="rounded-[20px] bg-[#FFF1F4] px-6 py-10 text-center">
        <p className="text-[15px] font-medium text-[#B0002A]">We couldn&apos;t load your overview</p>
        <p className="mt-1 text-[13px] text-[#B0002A]/80">{error}</p>
      </div>
    );
  }

  const kpiGrid = 'grid grid-cols-2 gap-4 max-[767px]:gap-3 min-[1100px]:grid-cols-4';
  const splitGrid = 'grid grid-cols-1 gap-5 min-[1280px]:grid-cols-12';

  return (
    <div className="analytics-dashboard space-y-5">
      <OverviewHero
        eyebrow={`This ${apiPeriod}`}
        headline="Funds raised through your storefront"
        figureLabel="Charity profit this period"
        figure={formatMoney(seller?.charityProfit)}
        change={revenueChange}
        secondary={[
          { label: 'Received (all time)', value: formatMoney(charityFunds?.totalEarned) },
          { label: 'Pending payout', value: formatMoney(charityFunds?.totalHeldFunds) },
        ]}
        period={period}
        onPeriodChange={setPeriod}
        unread={messaging?.unreadCount || 0}
        loading={loading}
        actions={[
          { label: 'Add a product', href: '/product/post-product', icon: <PlusCircle className="h-4 w-4" aria-hidden /> },
          { label: 'Listings', href: '?tab=listings', icon: <Package className="h-4 w-4" aria-hidden /> },
          { label: 'Payouts', href: '?tab=payouts', icon: <Wallet className="h-4 w-4" aria-hidden /> },
          { label: 'Community', href: '?tab=community', icon: <Users className="h-4 w-4" aria-hidden /> },
        ]}
      />

      <div className={kpiGrid}>
        <StatCard
          label="Revenue"
          value={formatMoney(seller?.revenue)}
            change={revenueChange}
          subtitle={`this ${apiPeriod}`}
          loading={loading}
          accent="purple"
          icon={<Banknote className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
        />
        <StatCard
          label="Items sold"
          value={seller?.itemsSold || 0}
            change={soldChange}
          subtitle={`this ${apiPeriod}`}
          loading={loading}
          accent="green"
          icon={<Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
        />
        <StatCard
          label="Profit received"
          value={formatMoney(charityFunds?.totalEarned)}
          subtitle={"all time"}
          loading={loading}
          accent="blue"
          icon={<HandHeart className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
        />
        <StatCard
          label="Pending payout"
          value={formatMoney(charityFunds?.totalHeldFunds)}
          subtitle={"awaiting approval"}
          loading={loading}
          accent="amber"
          icon={<Hourglass className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
        />
      </div>

      <div className={splitGrid}>
        <div className="min-[1280px]:col-span-7">
          <PerformanceChart
            showToggle={false}
            title="Sales performance"
            measure="Revenue"
            period={period}
            onPeriodChange={setPeriod}
            data={chartData}
            loading={loading}
            totalRevenue={seller?.revenue}
            changePercent={revenueChange}
            revenueLabel={`this ${apiPeriod}`}
          />
        </div>
        <div className="min-[1280px]:col-span-5">
          <OrderPipelinePanel
            title="Order pipeline"
            summary={seller?.statusSummary}
            activity={seller?.recentActivity}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 max-[767px]:grid-cols-1">
        <Link href="?tab=listings" className="group flex items-center justify-between gap-3 rounded-[18px] border border-[#ECE8EE] bg-white px-5 py-4 transition hover:border-[#DCD5E0] hover:shadow-[0_10px_24px_rgba(59,5,92,0.06)]">
          <div>
            <p className="text-[12px] text-mono-70">Live listings</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-mono-100">{loading ? '—' : data?.listings?.live || 0}</p>
            <p className="text-[11px] text-mono-70">{`${data?.listings?.total || 0} total products`}</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-mono-60 transition group-hover:text-[#611192]" aria-hidden />
        </Link>
        <Link href="?tab=payouts" className="group flex items-center justify-between gap-3 rounded-[18px] border border-[#ECE8EE] bg-white px-5 py-4 transition hover:border-[#DCD5E0] hover:shadow-[0_10px_24px_rgba(59,5,92,0.06)]">
          <div>
            <p className="text-[12px] text-mono-70">Charity profit (period)</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-mono-100">{loading ? '—' : formatMoney(seller?.charityProfit)}</p>
            <p className="text-[11px] text-mono-70">from your sales</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-mono-60 transition group-hover:text-[#611192]" aria-hidden />
        </Link>
        <Link href="?tab=messages" className="group flex items-center justify-between gap-3 rounded-[18px] border border-[#ECE8EE] bg-white px-5 py-4 transition hover:border-[#DCD5E0] hover:shadow-[0_10px_24px_rgba(59,5,92,0.06)]">
          <div>
            <p className="text-[12px] text-mono-70">Buyer messages</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-mono-100">{loading ? '—' : messaging?.unreadCount || 0}</p>
            <p className="text-[11px] text-mono-70">unread inquiries</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-mono-60 transition group-hover:text-[#611192]" aria-hidden />
        </Link>
      </div>
    </div>
  );
};

export default AnalyticsPage;
