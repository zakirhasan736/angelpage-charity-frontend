'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  accent?: 'purple' | 'green' | 'blue' | 'amber';
}

// Icon tints only; numbers and labels stay in text inks.
const tint = {
  purple: 'bg-[#F2E8F8] text-[#611192]',
  green: 'bg-[#E9F8EC] text-[#137A22]',
  blue: 'bg-[#EAF2FD] text-[#1D5FB8]',
  amber: 'bg-[#FFF6E5] text-[#8A5A00]',
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  subtitle,
  icon,
  loading,
  accent = 'purple',
}) => {
  if (loading) {
    return (
      <div className="h-full animate-pulse rounded-[18px] border border-[#ECE8EE] bg-white p-5">
        <div className="mb-5 h-9 w-9 rounded-xl bg-[#F1EEF3]" />
        <div className="mb-3 h-7 w-28 rounded bg-[#F1EEF3]" />
        <div className="h-3 w-20 rounded bg-[#F1EEF3]" />
      </div>
    );
  }

  const trend = change == null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down';

  return (
    <div className="group relative h-full rounded-[18px] border border-[#ECE8EE] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#DCD5E0] hover:shadow-[0_14px_32px_rgba(59,5,92,0.08)] max-[767px]:p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint[accent]}`}>
          {icon ?? <span className="h-2 w-2 rounded-full bg-current" aria-hidden />}
        </span>
        {change != null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
              trend === 'up'
                ? 'bg-[#E9F8EC] text-[#137A22]'
                : trend === 'down'
                  ? 'bg-[#FFEEF2] text-[#B0002A]'
                  : 'bg-[#F4F1F6] text-mono-70'
            }`}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'} {Math.abs(Number(change)).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-[13px] text-mono-70">{label}</p>
      <p className="mt-1 font-primary text-[28px] leading-none tabular-nums text-mono-100 max-[767px]:text-[24px]">
        {value}
      </p>
      {subtitle && <p className="mt-2 text-[12px] text-mono-70">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
