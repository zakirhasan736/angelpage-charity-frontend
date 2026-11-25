import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge rules that keep URLs clean for search engines:
 *  1. Maintenance mode: MAINTENANCE_MODE=true answers every page with a
 *     branded 503 + Retry-After, so crawlers retry instead of dropping pages.
 *  2. /product?category=x[&subcategory=y] → 308 → /shop/x[/y] (one indexable
 *     URL per category; other query params such as utm_* are kept).
 *  3. Mixed-case /shop, /blog, /events and /product paths → 308 → lowercase.
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const toSlug = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const MAINTENANCE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Back soon | Angelpage</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#14021F;color:#fff;font-family:Poppins,system-ui,sans-serif;text-align:center;padding:24px}h1{font-family:Lustria,Georgia,serif;font-weight:400;font-size:40px;margin:16px 0 8px}p{color:rgba(255,255,255,.7);max-width:440px;line-height:1.6;margin:0 auto}a{color:#D9B8F0}</style></head><body><main><img src="/icons/icon-96.png" width="64" height="64" alt="Angelpage" style="border-radius:16px"><h1>We'll be right back</h1><p>Angelpage is getting a quick update. Your basket and account are safe. Please try again in a few minutes.</p></main></body></html>`;

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, searchParams } = nextUrl;

  if (process.env.MAINTENANCE_MODE === 'true' && !pathname.startsWith('/icons/')) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '1800', 'Cache-Control': 'no-store' },
    });
  }

  if (pathname === '/product' && searchParams.has('category')) {
    const category = toSlug(searchParams.get('category') || '');
    const sub = toSlug(searchParams.get('subcategory') || '');
    if (category && SLUG.test(category)) {
      const url = nextUrl.clone();
      url.pathname = sub ? `/shop/${category}/${sub}` : `/shop/${category}`;
      url.searchParams.delete('category');
      url.searchParams.delete('subcategory');
      return NextResponse.redirect(url, 308);
    }
  }

  if (/^\/(shop|blog|events|product)(\/|$)/i.test(pathname) && pathname !== pathname.toLowerCase()) {
    const url = nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Pages only: skip Next internals, API routes and files with an extension.
  matcher: ['/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)'],
};
