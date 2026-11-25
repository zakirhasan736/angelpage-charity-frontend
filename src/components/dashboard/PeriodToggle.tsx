'use client';

import React from 'react';

type Period = 'Week' | 'Month' | 'Year';

interface PeriodToggleProps {
  period: Period;
  onChange: (period: Period) => void;
  tone?: 'light' | 'dark';
}

const PeriodToggle: React.FC<PeriodToggleProps> = ({ period, onChange, tone = 'light' }) => {
  const dark = tone === 'dark';
  return (
    <div
      role="tablist"
      aria-label="Time period"
      className={`inline-flex items-center gap-0.5 rounded-full p-1 ${
        dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-[#F4F1F6] ring-1 ring-[#ECE8EE]'
      }`}
    >
      {(['Week', 'Month', 'Year'] as Period[]).map(p => {
        const active = period === p;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={`h-8 rounded-full px-3.5 text-[12px] font-semibold transition-all duration-200 ${
              active
                ? dark
                  ? 'bg-white text-[#3B055C] shadow-sm'
                  : 'bg-white text-[#611192] shadow-[0_2px_8px_rgba(59,5,92,0.12)]'
                : dark
                  ? 'text-white/70 hover:text-white'
                  : 'text-mono-70 hover:text-[#611192]'
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
};

export default PeriodToggle;
