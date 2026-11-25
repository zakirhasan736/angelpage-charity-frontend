import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false';

/** Signed-in, transactional and utility areas: never indexed, even if linked. */
const PRIVATE_SOURCES = [
  '/admin/:path*',
  '/auth/:path*',
  '/checkout/:path*',
  '/messaging/:path*',
  '/user/:path*',
  '/favourite/:path*',
  '/internal-home/:path*',
  '/charity/account/:path*',
  '/charity/complete-registrations/:path*',
  '/product/post-product/:path*',
  '/product/bulk-list/:path*',
  '/events/donation/:path*',
  '/events/:slug/donate/:path*',
  '/cookie-settings',
];

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()' },
];

const nextConfig = {
  experimental: {
    // enables app/forbidden.tsx (403) and forbidden()
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      // eBay affiliate / synced listings
      { protocol: 'https', hostname: 'i.ebayimg.com', pathname: '/**' },
    ],
  },
  async redirects() {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.angelpage.shop');
    if (site.origin !== 'https://www.angelpage.shop') return [];
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'angelpage\\.shop' }],
        destination: site.origin + '/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const global = [...SECURITY_HEADERS];
    if (process.env.NODE_ENV === 'production') global.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
    if (!allowIndexing) {
      return [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, ...global] }];
    }
    return [
      { source: '/(.*)', headers: global },
      ...PRIVATE_SOURCES.map(source => ({ source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
      { source: '/:file(llms|llms-full|llm|ai|humans)\\.txt', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] },
    ];
  },
};

const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

const { withSentryConfig } = sentryEnabled
  ? require('@sentry/nextjs/config')
  : { withSentryConfig: config => config };

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
