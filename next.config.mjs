import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    const site = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.angelpage.shop'
    );
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
    const headers = [];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000',
      });
    }
    if (!allowIndexing) {
      headers.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    }
    return headers.length ? [{ source: '/(.*)', headers }] : [];
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
