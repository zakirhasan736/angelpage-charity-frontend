'use client';

import React, { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';

/** Hosts configured in next.config images.remotePatterns (optimised by Next). */
const OPTIMISED_HOSTS = ['res.cloudinary.com', 'i.ebayimg.com'];
export const IMAGE_PLACEHOLDER = '/images/products/card-placeholder-image.webp';

function isUsable(src: unknown): src is string {
  return typeof src === 'string' && (src.startsWith('/') || /^https?:\/\//.test(src));
}

function needsUnoptimised(src: string) {
  if (!/^https?:\/\//.test(src)) return false;
  try {
    return !OPTIMISED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return true;
  }
}

/**
 * Drop-in for next/image that never breaks a page:
 *  - empty or malformed src → placeholder
 *  - remote host not in remotePatterns (charity imports, partner feeds) →
 *    served unoptimised instead of throwing "hostname not configured"
 *  - load error (404, deleted upload) → swaps to the placeholder once
 */
export default function SafeImage({ src, fallback = IMAGE_PLACEHOLDER, alt, unoptimized, onError, ...rest }: ImageProps & { fallback?: string }) {
  const initial = typeof src === 'string' ? (isUsable(src) ? src : fallback) : src;
  const [current, setCurrent] = useState(initial);
  useEffect(() => setCurrent(initial), [initial]);

  const str = typeof current === 'string' ? current : '';
  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      unoptimized={unoptimized || (str ? needsUnoptimised(str) : false)}
      onError={e => {
        if (current !== fallback) setCurrent(fallback);
        onError?.(e);
      }}
    />
  );
}
