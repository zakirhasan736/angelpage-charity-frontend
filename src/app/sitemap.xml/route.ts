import { sitemapIndexLocs, sitemapIndexXml } from '@/lib/sitemapCatalog';

/** One sitemap for Search Console. It links pages, products, and blogs. */
export async function GET() {
  const body = sitemapIndexXml(await sitemapIndexLocs());

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
