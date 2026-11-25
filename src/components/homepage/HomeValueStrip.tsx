'use client';

import React from 'react';

const VALUE_POINTS = [
  {
    id: 'sustainable',
    title: 'Sustainable',
    text: 'Give pre-loved items a second life',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  {
    id: 'charity',
    title: 'Flexible giving',
    text: 'Choose how much of each sale supports charity',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'trusted',
    title: 'Trusted sellers',
    text: 'Verified charities and community members',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
] as const;

export default function HomeValueStrip() {
  return (
    <section className="bg-white pb-2">
      <div className="custom-container">
        <div className="grid grid-cols-3 divide-x divide-[#ECE8EE] rounded-[24px] bg-[#FAF8FB] ring-1 ring-[#ECE8EE] max-[991px]:grid-cols-1 max-[991px]:divide-x-0 max-[991px]:divide-y">
          {VALUE_POINTS.map(point => (
            <div key={point.id} className="flex items-center gap-4 px-7 py-5 max-[767px]:px-5 max-[767px]:py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#611192] shadow-[0_2px_8px_rgba(59,5,92,0.08)] ring-1 ring-[#ECE8EE]">
                {point.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-mono-100">{point.title}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-mono-70">{point.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
