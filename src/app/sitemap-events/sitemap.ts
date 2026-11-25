import type { MetadataRoute } from 'next';
import { eventEntries } from '@/lib/sitemapCatalog';

export const revalidate = 3600;

/** Appeals, community votes and live sessions. /sitemap-events/sitemap/0.xml */
export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return eventEntries();
}
