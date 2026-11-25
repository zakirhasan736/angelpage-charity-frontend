'use client';

import React from 'react';
import { formatMoney } from '@/lib/money';
import StatusBadge from './StatusBadge';

interface StatusSummary {
  total?: number;
  pending?: number;
  confirmed?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
  paymentPending?: number;
  paymentPaid?: number;
  paymentFailed?: number;
}

interface ActivityItem {
  id: string;
  status: string;
  paymentStatus?: string;
  productName?: string;
  totalAmount?: number;
  createdAt: string;
}

interface OrderPipelinePanelProps {
  title?: string;
  summary?: StatusSummary;
  activity?: ActivityItem[];
  loading?: boolean;
}

// Ordinal stages -> one hue, light to dark (later stage = darker). Labels + counts always visible.
const PIPELINE_COLORS = ['#C9A3E6', '#9B5CCF', '#7424AE', '#4A0A73'];

const statusDefs = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

const OrderPipelinePanel: React.FC<OrderPipelinePanelProps> = ({
  title = 'Order pipeline',
  summary = {},
  activity = [],
  loading,
}) => {
  const counts = statusDefs.map(s => Number(summary[s.key as keyof StatusSummary] || 0));
  const stageTotal = counts.reduce((a, b) => a + b, 0);
  const total = summary.total || stageTotal;

  if (loading) {
    return (
      <div className="h-full min-h-[360px] animate-pulse rounded-[20px] border border-[#ECE8EE] bg-white p-6">
        <div className="mb-6 h-4 w-40 rounded bg-[#F1EEF3]" />
        <div className="mb-6 h-3 w-full rounded-full bg-[#F1EEF3]" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 rounded-xl bg-[#F6F3F8]" />
          ))}
        </div>
      </div>
    );
  }

  const payments = [
    { label: 'Paid', value: summary.paymentPaid || 0, icon: '✓', cls: 'bg-[#E9F8EC] text-[#137A22]' },
    { label: 'Pending', value: summary.paymentPending || 0, icon: '◷', cls: 'bg-[#FFF6E5] text-[#8A5A00]' },
    { label: 'Failed', value: summary.paymentFailed || 0, icon: '!', cls: 'bg-[#FFEEF2] text-[#B0002A]' },
  ];

  return (
    <section className="flex h-full flex-col rounded-[20px] border border-[#ECE8EE] bg-white p-6 max-[767px]:p-4" aria-label={title}>
      <header className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-mono-100">{title}</h3>
        <span className="rounded-full bg-[#F4F1F6] px-2.5 py-1 text-[12px] font-medium text-mono-90">
          {total} {total === 1 ? 'order' : 'orders'}
        </span>
      </header>

      {/* segmented stage bar */}
      <div className="mt-5 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[#F4F1F6]" role="img" aria-label={statusDefs.map((s, i) => `${s.label} ${counts[i]}`).join(', ')}>
        {stageTotal > 0 &&
          statusDefs.map((s, i) =>
            counts[i] > 0 ? (
              <span
                key={s.key}
                title={`${s.label}: ${counts[i]}`}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-700"
                style={{ width: `${(counts[i] / stageTotal) * 100}%`, background: PIPELINE_COLORS[i] }}
              />
            ) : null,
          )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {statusDefs.map((s, i) => {
          const pct = stageTotal > 0 ? Math.round((counts[i] / stageTotal) * 100) : 0;
          return (
            <li key={s.key} className="rounded-xl bg-[#FAF8FB] px-3 py-2.5">
              <p className="flex items-center gap-2 text-[12px] text-mono-70">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PIPELINE_COLORS[i] }} aria-hidden />
                {s.label}
              </p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums text-mono-100">
                {counts[i]}
                <span className="ml-1 text-[12px] font-normal text-mono-70">{pct}%</span>
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {payments.map(p => (
          <span key={p.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${p.cls}`}>
            <span aria-hidden>{p.icon}</span>
            {p.label} <strong className="font-semibold tabular-nums">{p.value}</strong>
          </span>
        ))}
      </div>

      <div className="mt-5 flex-1 border-t border-[#F1EEF3] pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-mono-70">Recent activity</p>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-mono-70">No orders yet. New orders will appear here.</p>
        ) : (
          <ul className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
            {activity.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#FAF8FB]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[12px] font-semibold text-[#611192]">
                    {(item.productName || 'O').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-mono-100">{item.productName || 'Order'}</p>
                    <p className="text-[11px] text-mono-70">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.totalAmount != null && (
                    <span className="text-[13px] font-semibold tabular-nums text-mono-100">{formatMoney(item.totalAmount)}</span>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default OrderPipelinePanel;
