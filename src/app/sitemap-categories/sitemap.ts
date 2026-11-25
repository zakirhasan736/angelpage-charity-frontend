import type { MetadataRoute } from 'next';
import { categoryEntries } from '@/lib/sitemapCatalog';

export const revalidate = 3600;

/** Category and sub-category landing pages (/shop/…). /sitemap-categories/sitemap/0.xml */
export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return categoryEntries();
}
