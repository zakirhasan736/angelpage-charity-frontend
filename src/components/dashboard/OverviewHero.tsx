'use client';

import React from 'react';
import Link from 'next/link';
import PeriodToggle from './PeriodToggle';

type Period = 'Week' | 'Month' | 'Year';

interface Action {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface OverviewHeroProps {
  eyebrow: string;
  headline: React.ReactNode;
  figure: string;
  figureLabel: string;
  change?: number;
  secondary?: { label: string; value: string }[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  unread?: number;
  actions?: Action[];
  loading?: boolean;
}

/** Top-of-dashboard summary: headline figure, period switch, quick actions. */
const OverviewHero: React.FC<OverviewHeroProps> = ({
  eyebrow,
  headline,
  figure,
  figureLabel,
  change = 0,
  secondary = [],
  period,
  onPeriodChange,
  unread = 0,
  actions = [],
  loading,
}) => {
  const up = change >= 0;
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#0B0112] p-7 text-white max-[767px]:rounded-[20px] max-[767px]:p-5">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#611192]/60 blur-[90px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#9B5CCF]/25 blur-[80px]" aria-hidden />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D9B8EE]!">{eyebrow}</p>
          <h3 className="mt-2 font-primary text-[22px] leading-tight text-white! max-[767px]:text-[19px]">{headline}</h3>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Link
              href="/messaging/chat"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[12px] font-medium text-white! ring-1 ring-white/15 transition hover:bg-white/20"
            >
              <span className="ap-live-dot text-[#FF7AA0]" aria-hidden />
              {unread} unread
            </Link>
          )}
          <PeriodToggle period={period} onChange={onPeriodChange} tone="dark" />
        </div>
      </div>

      <div className="relative mt-7 flex flex-wrap items-end justify-between gap-6 max-[767px]:mt-5">
        <div>
          <p className="text-[12px] text-white/60!">{figureLabel}</p>
          {loading ? (
            <div className="mt-2 h-12 w-48 animate-pulse rounded-xl bg-white/10" />
          ) : (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-primary text-[52px] leading-none tabular-nums text-white! max-[767px]:text-[38px]">
                {figure}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ${
                  up ? 'bg-[#1FC430]/20 text-[#7BEA87]!' : 'bg-[#E50035]/20 text-[#FF8FA8]!'
                }`}
              >
                {up ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {secondary.length > 0 && (
          <dl className="flex gap-8 max-[767px]:w-full max-[767px]:justify-between max-[767px]:gap-4">
            {secondary.map(s => (
              <div key={s.label}>
                <dt className="text-[12px] text-white/60!">{s.label}</dt>
                <dd className="mt-1 text-[20px] font-semibold tabular-nums text-white!">{loading ? '—' : s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {actions.length > 0 && (
        <div className="ap-no-scrollbar relative -mx-1 mt-7 flex gap-2 overflow-x-auto px-1 max-[767px]:mt-5">
          {actions.map(a => (
            <Link
              key={a.label}
              href={a.href}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-medium text-white! ring-1 ring-white/15 transition hover:bg-white hover:text-[#611192]! [&:hover_svg]:text-[#611192]"
            >
              {a.icon}
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default OverviewHero;
