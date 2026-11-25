import type { MetadataRoute } from 'next';
import { charityEntries, charitySitemapCount, SITEMAP_CHUNK } from '@/lib/sitemapCatalog';

export const revalidate = 3600;

/** One URL per charity (storefront first). /sitemap-charities/sitemap/<n>.xml */
export async function generateSitemaps() {
  const count = await charitySitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id) || 0;
  const all = await charityEntries();
  return all.slice(id * SITEMAP_CHUNK, (id + 1) * SITEMAP_CHUNK);
}
