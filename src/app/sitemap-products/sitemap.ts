import type { MetadataRoute } from 'next';
import { OTHER_BUCKET, parseProductSitemapId, productSitemapIds, SITEMAP_CHUNK, sitemapEntry } from '@/lib/sitemapCatalog';
import { categoriesData } from '@/libs/categoriesData';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 3600;

type ProductSitemapRow = { slug?: string; updatedAt?: string; images?: string[]; image?: string };

/** Live, in-stock products with their photos, batched by category. /sitemap-products/sitemap/women-0.xml */
export async function generateSitemaps() {
  const ids = await productSitemapIds();
  return ids.map(id => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const { bucket, page } = parseProductSitemapId(await props.id);
  const params: Record<string, string | number> = { page, limit: SITEMAP_CHUNK };
  if (bucket === OTHER_BUCKET) params.excludeCategories = categoriesData.categories.map(c => c.id).join(',');
  else if (bucket !== 'all') params.category = bucket;

  const data = await serverFetch<{ products?: ProductSitemapRow[] }>('/products/sitemap', { revalidate: 3600, params });
  const products = (data?.products ?? []).filter(p => p.slug);
  if (products.length === 0 && page === 1 && (bucket === 'all' || bucket === categoriesData.categories[0].id)) {
    return [sitemapEntry('/product', 'daily', 0.8)];
  }
  return products.map(p => sitemapEntry(`/product/${encodeURIComponent(p.slug!)}`, 'daily', 0.8, p.updatedAt, p.images || (p.image ? [p.image] : [])));
}
