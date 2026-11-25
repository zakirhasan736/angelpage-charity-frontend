'use client';

import React, { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PeriodToggle from './PeriodToggle';
import { formatMoney } from '@/lib/money';

export interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface PerformanceChartProps {
  title?: string;
  period: 'Week' | 'Month' | 'Year';
  onPeriodChange: (p: 'Week' | 'Month' | 'Year') => void;
  data: ChartPoint[];
  loading?: boolean;
  totalRevenue?: number;
  changePercent?: number;
  revenueLabel?: string;
  className?: string;
  /** Name of the money measure, e.g. "Revenue" or "Spend". */
  measure?: string;
  /** Hide the Week/Month/Year switch when the page already has one. */
  showToggle?: boolean;
}

const INK = '#0B0112';
const INK_2 = '#6B686E';
const GRID = '#EFECF1';
const SERIES = '#611192';

const ChartTooltip = ({
  active,
  payload,
  label,
  kind,
  measure,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  kind: 'money' | 'count';
  measure: string;
}) => {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value || 0);
  return (
    <div className="rounded-xl border border-[#ECE8EE] bg-white px-3.5 py-2.5 shadow-[0_12px_28px_rgba(11,1,18,0.12)]">
      <p className="text-[11px] text-mono-70">{label}</p>
      <p className="mt-0.5 flex items-center gap-2 text-[13px] font-semibold text-mono-100">
        <span className="h-2 w-2 rounded-full" style={{ background: SERIES }} aria-hidden />
        {kind === 'money' ? formatMoney(v) : `${v} ${v === 1 ? 'order' : 'orders'}`}
        <span className="font-normal text-mono-70">{kind === 'money' ? measure : ''}</span>
      </p>
    </div>
  );
};

const axisTick = { fontSize: 11, fill: INK_2 };

/**
 * Revenue over time (area, one axis) with a separate small orders bar chart below.
 * Two measures, two charts: no dual y-axis.
 */
const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title = 'Performance',
  period,
  onPeriodChange,
  data,
  loading,
  totalRevenue,
  changePercent = 0,
  revenueLabel = 'Total',
  className = '',
  measure = 'Revenue',
  showToggle = true,
}) => {
  const gid = useId().replace(/:/g, '');
  const computedTotal = totalRevenue ?? data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalOrders = data.reduce((sum, d) => sum + (d.orders || 0), 0);
  const up = changePercent >= 0;
  const [showTable, setShowTable] = React.useState(false);

  return (
    <section
      className={`flex h-full flex-col rounded-[20px] border border-[#ECE8EE] bg-white p-6 max-[767px]:p-4 ${className}`}
      aria-label={title}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-mono-100">{title}</h3>
          {loading ? (
            <div className="mt-3 h-9 w-40 animate-pulse rounded-lg bg-[#F1EEF3]" />
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-primary text-[32px] leading-none text-mono-100 max-[767px]:text-[26px]">
                {formatMoney(computedTotal)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  up ? 'bg-[#E9F8EC] text-[#137A22]' : 'bg-[#FFEEF2] text-[#B0002A]'
                }`}
              >
                {up ? '▲' : '▼'} {Math.abs(changePercent).toFixed(1)}%
              </span>
              <span className="text-[12px] text-mono-70">{revenueLabel}</span>
            </div>
          )}
        </div>
        {showToggle ? <PeriodToggle period={period} onChange={onPeriodChange} /> : null}
      </header>

      <div className="mt-6 h-[230px] max-[767px]:h-[190px]">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-[#F6F3F8]" />
        ) : data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`rev-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} dy={8} minTickGap={16} />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={v => formatMoney(v, { compact: true }).replace('.00', '')}
              />
              <Tooltip
                cursor={{ stroke: '#C9C8CA', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<ChartTooltip kind="money" measure={measure} />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={SERIES}
                strokeWidth={2}
                fill={`url(#rev-${gid})`}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: SERIES }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && data.length > 0 ? (
        <div className="mt-5 border-t border-[#F1EEF3] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-medium text-mono-100">
              Orders <span className="font-normal text-mono-70">· {totalOrders} total</span>
            </p>
            <button
              type="button"
              onClick={() => setShowTable(s => !s)}
              className="text-[12px] font-medium text-[#611192] hover:underline"
            >
              {showTable ? 'Hide table' : 'View as table'}
            </button>
          </div>
          {showTable ? (
            <div className="max-h-[220px] overflow-auto rounded-xl border border-[#ECE8EE]">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2 text-right">{measure}</th>
                    <th className="px-3 py-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.label} className="border-t border-[#F1EEF3]">
                      <td className="px-3 py-2 text-mono-100">{d.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(d.revenue)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.orders || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[72px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 2, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#F6F1FA' }}
                    content={<ChartTooltip kind="count" measure="" />}
                  />
                  <Bar dataKey="orders" fill="#A86FD6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
};

const EmptyChart = () => (
  <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-xl bg-[#FAF8FB] text-center">
    <svg viewBox="0 0 300 80" className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-60" preserveAspectRatio="none" aria-hidden>
      <path d="M0 70 C 50 60, 80 40, 120 48 S 200 20, 240 30 S 290 12, 300 10" fill="none" stroke="#E4D0F0" strokeWidth="2" strokeDasharray="4 6" />
    </svg>
    <p className="relative text-[13px] font-medium" style={{ color: INK }}>No sales in this period yet</p>
    <p className="relative mt-1 text-[12px]" style={{ color: INK_2 }}>Your chart will fill in as orders arrive.</p>
  </div>
);

export default PerformanceChart;
