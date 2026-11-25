'use client';

import React from 'react';

interface AnalyticsShellProps {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const AnalyticsShell: React.FC<AnalyticsShellProps> = ({
  title,
  subtitle,
  badge,
  children,
}) => (
  <div className="analytics-dashboard space-y-6">
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#3B055C] via-[#611192] to-[#7B2CBF] px-7 py-6 text-white max-[767px]:px-5">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h3 className="font-primary text-[22px] leading-tight text-white! max-[767px]:text-[19px]">{title}</h3>
          <p className="mt-1 text-sm text-white/75!">{subtitle}</p>
        </div>
        {badge}
      </div>
    </div>
    {children}
  </div>
);

export default AnalyticsShell;
