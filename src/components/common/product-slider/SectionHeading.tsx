'use client';

import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}

/** Shared section header: eyebrow, Lustria title, short copy and right-side actions. */
const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  actions,
  tone = 'light',
  align = 'left',
  className = '',
}) => {
  const dark = tone === 'dark';
  return (
    <div
      className={`flex items-end justify-between gap-6 max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4 ${
        align === 'center' ? 'flex-col items-center! text-center' : ''
      } ${className}`}
    >
      <div className="max-w-[640px]">
        {eyebrow ? (
          <p className={`ap-eyebrow ${dark ? 'text-white/80!' : ''}`}>{eyebrow}</p>
        ) : null}
        <h2
          className={`ap-display mt-3 text-[40px] max-[1280px]:text-[36px] max-[767px]:text-[28px] ${
            dark ? 'text-white!' : ''
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-3 text-[15px] leading-7 max-[767px]:text-sm max-[767px]:leading-6 ${
              dark ? 'text-white/75!' : 'text-[#5C5560]'
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
};

export default SectionHeading;
