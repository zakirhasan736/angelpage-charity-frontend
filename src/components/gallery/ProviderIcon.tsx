import React from 'react';
import type { SocialProvider } from '@/lib/socialVideo';

/** Simple brand marks (single-path glyphs) for the connect buttons and badges. */
export default function ProviderIcon({
  provider,
  className = 'h-5 w-5',
}: {
  provider: SocialProvider;
  className?: string;
}) {
  if (provider === 'youtube') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden
        fill="currentColor"
      >
        <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z" />
      </svg>
    );
  }
  if (provider === 'tiktok') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden
        fill="currentColor"
      >
        <path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.6 1.5V6.7a4.6 4.6 0 0 1-4.6-4.7Z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
