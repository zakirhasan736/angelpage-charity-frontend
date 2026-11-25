import type { MetadataRoute } from 'next';
import { staticPageEntries } from '@/lib/sitemapCatalog';

export const revalidate = 86400;

/** Hubs and info pages. /sitemap-pages/sitemap/0.xml */
export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return staticPageEntries();
}
