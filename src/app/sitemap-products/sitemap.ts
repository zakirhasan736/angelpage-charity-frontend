import type { MetadataRoute } from 'next';
import {
  productSitemapCount,
  SITEMAP_CHUNK,
  sitemapEntry,
} from '@/lib/sitemapCatalog';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 3600;

type ProductSitemapRow = { slug?: string; updatedAt?: string };

/** Live product URLs, 5,000 per file. /sitemap-products/sitemap/0.xml */
export async function generateSitemaps() {
  const count = await productSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const page = (Number(await props.id) || 0) + 1;
  const data = await serverFetch<{ products?: ProductSitemapRow[] }>(
    '/products/sitemap',
    { revalidate: 3600, params: { page, limit: SITEMAP_CHUNK } }
  );
  const products = (data?.products ?? []).filter(product => product.slug);

  if (products.length === 0 && page === 1) {
    return [sitemapEntry('/product', 'daily', 0.8)];
  }

  return products.map(product =>
    sitemapEntry(
      `/product/${encodeURIComponent(product.slug!)}`,
      'daily',
      0.8,
      product.updatedAt
    )
  );
}
