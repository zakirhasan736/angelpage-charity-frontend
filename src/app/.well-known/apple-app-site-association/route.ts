/**
 * Universal links for the iOS app. Set APPLE_APP_IDS to "<TEAMID>.<bundle id>"
 * (comma-separated for several builds). Without it the file lists no apps.
 * Served as JSON with no redirect, as Apple requires.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const appIDs = (process.env.APPLE_APP_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const body = {
    applinks: {
      details: appIDs.length
        ? [
            {
              appIDs,
              components: [
                { '/': '/product/*', comment: 'Product pages' },
                { '/': '/shop/*', comment: 'Categories' },
                { '/': '/charity/store/*', comment: 'Storefronts' },
                {
                  '/': '/charity/find-a-charity*',
                  comment: 'Charity directory',
                },
                { '/': '/events/*', comment: 'Events and donations' },
                { '/': '/reels*', comment: 'Reels' },
                { '/': '/blog/*', comment: 'Articles' },
                { '/': '/messaging/*', comment: 'Messages' },
                { '/': '/auth/reset-password*', comment: 'Password reset' },
                { '/': '/auth/verify-email*', comment: 'Email verification' },
                {
                  '/': '/checkout/confirmation/*',
                  comment: 'Order confirmation',
                },
              ],
            },
          ]
        : [],
    },
    webcredentials: { apps: appIDs },
  };
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
