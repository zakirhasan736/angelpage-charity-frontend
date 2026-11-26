import React from 'react';
import type { ConnectProvider } from '@/lib/socialVideo';

/** Simple brand marks (single-path glyphs) for the connect buttons and badges. */
export default function ProviderIcon({
  provider,
  className = 'h-5 w-5',
}: {
  provider: ConnectProvider;
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
  if (provider === 'facebook') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden
        fill="currentColor"
      >
        <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4Z" />
      </svg>
    );
  }
  if (provider === 'linkedin') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden
        fill="currentColor"
      >
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75ZM9.5 9.75h3.8v1.54h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.01c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65V21h-4V9.75Z" />
      </svg>
    );
  }
  if (provider === 'twitter') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden
        fill="currentColor"
      >
        <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.84-6.32L5.46 21H2.38l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.57l11.1 14.43Z" />
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
