import type { MetadataRoute } from 'next';
import { FACET_PARAMS, INDEXABLE, SITE_URL } from '@/lib/siteSeo';

/** Signed-in, checkout and utility areas (also sent X-Robots-Tag: noindex). */
const PRIVATE_PATHS = [
  '/admin',
  '/auth',
  '/checkout',
  '/messaging',
  '/user',
  '/favourite',
  '/internal-home',
  '/product/post-product',
  '/product/bulk-list',
  '/charity/account',
  '/charity/complete-registrations',
  '/events/donation',
  '/events/*/donate',
  '/cookie-settings',
  '/api/',
];

/**
 * Sort / filter / search variants of listing pages. With thousands of
 * products these multiply into millions of thin URLs; blocking them keeps
 * crawl budget on products and category pages. Pagination (?page=) stays open.
 */
// `q` and `w` are left out: next/image uses them (/_next/image?url=…&w=…&q=…).
const FACET_PATTERNS = FACET_PARAMS.filter(p => p !== 'q' && p !== 'w').flatMap(p => [`/*?${p}=`, `/*&${p}=`]);

/** Search engines and AI assistants we want to read and cite Angelpage. */
const FRIENDLY_BOTS = [
  'Googlebot',
  'Googlebot-Image',
  'Bingbot',
  'Applebot',
  'DuckDuckBot',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Meta-ExternalAgent',
  'Amazonbot',
  'DuckAssistBot',
  'MistralAI-User',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const disallow = [...PRIVATE_PATHS, ...FACET_PATTERNS];
  return {
    rules: [
      // '/_next/' is the longer (more specific) match, so assets and images stay crawlable
      { userAgent: '*', allow: ['/', '/_next/'], disallow },
      { userAgent: FRIENDLY_BOTS, allow: ['/', '/_next/', '/llms.txt', '/llms-full.txt'], disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
