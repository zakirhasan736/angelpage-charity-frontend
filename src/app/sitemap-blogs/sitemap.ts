import type { MetadataRoute } from 'next';
import {
  blogSitemapCount,
  SITEMAP_CHUNK,
  sitemapEntry,
} from '@/lib/sitemapCatalog';
import { serverFetch } from '@/lib/server-api';

export const revalidate = 3600;

type BlogSitemapRow = { slug?: string; publishedAt?: string };

/** Published blog URLs. /sitemap-blogs/sitemap/0.xml */
export async function generateSitemaps() {
  const count = await blogSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const page = (Number(await props.id) || 0) + 1;
  const data = await serverFetch<{ posts?: BlogSitemapRow[] }>('/blog/sitemap', {
    revalidate: 3600,
    params: { page, limit: SITEMAP_CHUNK },
  });
  const posts = (data?.posts ?? []).filter(post => post.slug);

  if (posts.length === 0 && page === 1) {
    return [sitemapEntry('/blog', 'weekly', 0.6)];
  }

  return posts.map(post =>
    sitemapEntry(
      `/blog/${encodeURIComponent(post.slug!)}`,
      'weekly',
      0.6,
      post.publishedAt
    )
  );
}
