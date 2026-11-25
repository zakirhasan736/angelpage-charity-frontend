import type { MetadataRoute } from 'next';
import {
  generalPageEntries,
  pageSitemapCount,
  SITEMAP_CHUNK,
} from '@/lib/sitemapCatalog';

export const revalidate = 3600;

/** General hubs, category parents, events, and charities. /sitemap-pages/sitemap/0.xml */
export async function generateSitemaps() {
  const count = await pageSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id) || 0;
  const pages = await generalPageEntries();
  const start = id * SITEMAP_CHUNK;
  return pages.slice(start, start + SITEMAP_CHUNK);
}
