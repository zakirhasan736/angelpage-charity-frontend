import type { MetadataRoute } from 'next';
import { categoriesData } from '@/libs/categoriesData';
import { absoluteImage, absoluteUrl, SITE_URL } from '@/lib/siteSeo';
import { shopHref } from '@/lib/shopUrls';
import { fetchCharitiesPage, fetchShopCategories, serverFetch, type CommunityEventRecord } from '@/lib/server-api';

/**
 * Sitemap index, batched by topic so Search Console reports coverage per
 * area (pages, categories, charities, events, journal, products by category):
 *
 *   /sitemap.xml                                   index
 *   /sitemap-pages/sitemap/0.xml                   hubs and info pages
 *   /sitemap-categories/sitemap/0.xml              /shop/… category pages
 *   /sitemap-charities/sitemap/<n>.xml             charity storefronts
 *   /sitemap-events/sitemap/0.xml                  appeals, votes, live sessions
 *   /sitemap-blogs/sitemap/<n>.xml                 journal posts
 *   /sitemap-products/sitemap/<category>-<n>.xml   live products, with images
 *
 * Only canonical, indexable URLs are listed: no query strings, no sold or
 * draft items, no private areas.
 */

/** URLs per sitemap file (Google's limit is 50,000 / 50 MB). */
export const SITEMAP_CHUNK = 5000;

/** Indexable hubs. Private, transactional and settings pages are excluded. */
const STATIC_PATHS: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['/', 'daily', 1],
  ['/product', 'daily', 0.9],
  ['/charity/find-a-charity', 'daily', 0.8],
  ['/events', 'daily', 0.8],
  ['/blog', 'weekly', 0.7],
  ['/how-it-works', 'monthly', 0.7],
  ['/about', 'monthly', 0.6],
  ['/faq', 'monthly', 0.6],
  ['/reels', 'weekly', 0.5],
  ['/contact', 'yearly', 0.4],
  ['/privacy-policy', 'yearly', 0.2],
  ['/cookie-policy', 'yearly', 0.2],
  ['/terms-of-service', 'yearly', 0.2],
];

export function sitemapEntry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified?: string,
  images?: string[]
): MetadataRoute.Sitemap[number] {
  const entry: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  };
  if (lastModified && !Number.isNaN(new Date(lastModified).getTime())) entry.lastModified = new Date(lastModified);
  const imgs = (images || []).filter(Boolean).slice(0, 5).map(src => absoluteImage(src));
  if (imgs.length) entry.images = imgs;
  return entry;
}

/* ---------- pages ---------- */
export function staticPageEntries(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map(([path, freq, priority]) => sitemapEntry(path, freq, priority));
}

/* ---------- categories ---------- */
export async function categoryEntries(): Promise<MetadataRoute.Sitemap> {
  const cats = await fetchShopCategories();
  return cats.flatMap(c => [
    sitemapEntry(shopHref(c.id), 'daily', 0.8),
    ...c.subCategories.map(s => sitemapEntry(shopHref(c.id, s.id), 'daily', 0.7)),
  ]);
}

/* ---------- charities ---------- */
type CharityRow = { _id?: string; storefrontId?: string; updatedAt?: string; profileImage?: string };

async function allCharities(): Promise<CharityRow[]> {
  const first = await fetchCharitiesPage(1, 100, '');
  const charities: CharityRow[] = [...((first?.charities as CharityRow[]) ?? [])];
  const pages = Math.max(1, Number(first?.totalPages) || 1);
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchCharitiesPage(page, 100, '');
    charities.push(...((next?.charities as CharityRow[]) ?? []));
  }
  return charities;
}

/** One URL per charity: the storefront when there is one, else the profile. */
export async function charityEntries(): Promise<MetadataRoute.Sitemap> {
  const charities = await allCharities();
  return charities
    .map(c =>
      c.storefrontId
        ? sitemapEntry(`/charity/store/${c.storefrontId}`, 'weekly', 0.7, c.updatedAt, [c.profileImage || ''])
        : c._id
          ? sitemapEntry(`/charity/find-a-charity/${c._id}`, 'weekly', 0.5, c.updatedAt, [c.profileImage || ''])
          : null
    )
    .filter((e): e is MetadataRoute.Sitemap[number] => Boolean(e));
}

export async function charitySitemapCount() {
  // with limit=1, totalPages equals the number of charities
  const first = await fetchCharitiesPage(1, 1, '');
  const total = Number(first?.totalPages) || 1;
  return Math.max(1, Math.ceil(total / SITEMAP_CHUNK));
}

/* ---------- events ---------- */
export async function eventEntries(): Promise<MetadataRoute.Sitemap> {
  const limit = 100;
  const first = await serverFetch<{ events?: CommunityEventRecord[]; pages?: number }>('/events', { revalidate: 3600, params: { page: 1, limit } });
  const events = [...(first?.events ?? [])];
  const pages = Math.max(1, Number(first?.pages) || 1);
  for (let page = 2; page <= pages; page += 1) {
    const next = await serverFetch<{ events?: CommunityEventRecord[] }>('/events', { revalidate: 3600, params: { page, limit } });
    events.push(...(next?.events ?? []));
  }
  return events.filter(e => e.slug).map(e => sitemapEntry(`/events/${e.slug}`, 'daily', 0.7, e.startAt, [e.coverImage || '']));
}

/* ---------- blog ---------- */
type CountResponse = { total?: number; category?: string };

async function chunkCount(path: string, params: Record<string, string | number> = {}) {
  const data = await serverFetch<CountResponse>(path, { revalidate: 3600, params: { page: 1, limit: 1, ...params } });
  const total = Number(data?.total) || 0;
  return { chunks: Math.max(1, Math.ceil(total / SITEMAP_CHUNK) || 1), total, data };
}

export async function blogSitemapCount() {
  return (await chunkCount('/blog/sitemap')).chunks;
}

/* ---------- products ---------- */
export const OTHER_BUCKET = 'other';

/**
 * Product sitemap ids: "<category>-<n>" when the API can filter by category
 * (backend feature/product-sitemap-topics), "all-<n>" otherwise.
 */
export async function productSitemapIds(): Promise<string[]> {
  const cats = categoriesData.categories.map(c => c.id);
  const probe = await chunkCount('/products/sitemap', { category: cats[0] });
  if (probe.data?.category !== cats[0]) {
    const { chunks } = await chunkCount('/products/sitemap');
    return Array.from({ length: chunks }, (_, i) => `all-${i}`);
  }
  const ids: string[] = [];
  for (const cat of [...cats, OTHER_BUCKET]) {
    const params: Record<string, string> = cat === OTHER_BUCKET ? { excludeCategories: cats.join(',') } : { category: cat };
    const { chunks, total } = await chunkCount('/products/sitemap', params);
    if (total > 0 || cat === cats[0]) for (let i = 0; i < chunks; i += 1) ids.push(`${cat}-${i}`);
  }
  return ids;
}

export function parseProductSitemapId(id: string) {
  const m = /^([a-z0-9-]+)-(\d+)$/.exec(id);
  return m ? { bucket: m[1], page: Number(m[2]) + 1 } : { bucket: 'all', page: 1 };
}

/* ---------- index ---------- */
export async function sitemapIndexLocs() {
  const [charities, blogs, products] = await Promise.all([charitySitemapCount(), blogSitemapCount(), productSitemapIds()]);
  const files = (base: string, ids: Array<string | number>) => ids.map(id => `${SITE_URL}${base}/${id}.xml`);
  return [
    ...files('/sitemap-pages/sitemap', [0]),
    ...files('/sitemap-categories/sitemap', [0]),
    ...files('/sitemap-charities/sitemap', Array.from({ length: charities }, (_, i) => i)),
    ...files('/sitemap-events/sitemap', [0]),
    ...files('/sitemap-blogs/sitemap', Array.from({ length: blogs }, (_, i) => i)),
    ...files('/sitemap-products/sitemap', products),
  ];
}

export function sitemapIndexXml(locs: string[]) {
  const now = new Date().toISOString();
  const body = locs.map(loc => `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}
