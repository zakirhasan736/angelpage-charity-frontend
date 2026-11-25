import type { MetadataRoute } from 'next';
import { categoriesData } from '@/libs/categoriesData';
import { absoluteUrl, SITE_URL } from '@/lib/siteSeo';
import {
  fetchCharitiesPage,
  serverFetch,
  type CommunityEventRecord,
} from '@/lib/server-api';

/** URLs per sitemap file. Google's limit is 50,000. */
export const SITEMAP_CHUNK = 5000;

const STATIC_PATHS = [
  '/',
  '/about',
  '/faq',
  '/how-it-works',
  '/contact',
  '/product',
  '/blog',
  '/events',
  '/reels',
  '/charity/find-a-charity',
  '/privacy-policy',
  '/cookie-policy',
  '/cookie-settings',
  '/terms-of-service',
];

export function sitemapEntry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified?: string
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
  };
}

type CountResponse = { total?: number; pages?: number };

async function chunkCount(path: string) {
  const data = await serverFetch<CountResponse>(path, {
    revalidate: 3600,
    params: { page: 1, limit: 1 },
  });
  const total = Number(data?.total) || 0;
  return Math.max(1, Math.ceil(total / SITEMAP_CHUNK) || 1);
}

export function productSitemapCount() {
  return chunkCount('/products/sitemap');
}

export function blogSitemapCount() {
  return chunkCount('/blog/sitemap');
}

/** Hubs, category parents, events, and charity pages. */
export async function generalPageEntries(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = STATIC_PATHS.map(path =>
    sitemapEntry(path, path === '/' ? 'daily' : 'weekly', path === '/' ? 1 : 0.7)
  );

  for (const category of categoriesData.categories) {
    pages.push(
      sitemapEntry(
        `/product?category=${encodeURIComponent(category.id)}`,
        'daily',
        0.6
      )
    );
    for (const sub of category.subCategories ?? []) {
      pages.push(
        sitemapEntry(
          `/product?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(sub.id)}`,
          'weekly',
          0.5
        )
      );
    }
  }

  const events = await allEvents();
  for (const event of events) {
    if (!event.slug) continue;
    pages.push(
      sitemapEntry(`/events/${event.slug}`, 'daily', 0.7, event.startAt)
    );
  }

  const charities = await allCharities();
  for (const charity of charities) {
    if (charity._id) {
      pages.push(
        sitemapEntry(`/charity/find-a-charity/${charity._id}`, 'weekly', 0.5)
      );
    }
    if (charity.storefrontId) {
      pages.push(
        sitemapEntry(`/charity/store/${charity.storefrontId}`, 'weekly', 0.6)
      );
    }
  }

  return pages;
}

async function allEvents() {
  const limit = 100;
  const first = await serverFetch<{
    events?: CommunityEventRecord[];
    pages?: number;
  }>('/events', { revalidate: 3600, params: { page: 1, limit } });
  const events = [...(first?.events ?? [])];
  const pages = Math.max(1, Number(first?.pages) || 1);
  for (let page = 2; page <= pages; page += 1) {
    const next = await serverFetch<{ events?: CommunityEventRecord[] }>(
      '/events',
      { revalidate: 3600, params: { page, limit } }
    );
    events.push(...(next?.events ?? []));
  }
  return events;
}

async function allCharities() {
  const first = await fetchCharitiesPage(1, 100, '');
  const charities = [...(first?.charities ?? [])];
  const pages = Math.max(1, Number(first?.totalPages) || 1);
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchCharitiesPage(page, 100, '');
    charities.push(...(next?.charities ?? []));
  }
  return charities;
}

export async function pageSitemapCount() {
  const pages = await generalPageEntries();
  return Math.max(1, Math.ceil(pages.length / SITEMAP_CHUNK));
}

export async function sitemapIndexLocs() {
  const [pages, products, blogs] = await Promise.all([
    pageSitemapCount(),
    productSitemapCount(),
    blogSitemapCount(),
  ]);
  const urls = (base: string, count: number) =>
    Array.from(
      { length: count },
      (_, id) => `${SITE_URL}${base}/${id}.xml`
    );

  return [
    ...urls('/sitemap-pages/sitemap', pages),
    ...urls('/sitemap-products/sitemap', products),
    ...urls('/sitemap-blogs/sitemap', blogs),
  ];
}

export function sitemapIndexXml(locs: string[]) {
  const body = locs
    .map(loc => `  <sitemap>\n    <loc>${loc}</loc>\n  </sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}
