import type { Metadata } from 'next';
import { BRAND_KEYWORDS, TOPIC_KEYWORDS } from '@/lib/seoKeywords';

export const SITE_NAME = 'Angelpage';
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.angelpage.shop'
).replace(/\/$/, '');
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-WP5JZ5K5';
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-Z789BPWQED';
export const GA_STREAM_ID = '16410278106';
export const GA_STREAM_NAME = 'E-commerce Charity Website';

export const INDEXABLE = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false';

export const DEFAULT_TITLE = 'Angelpage | Shop Pre-loved, Give to Charity';
export const DEFAULT_DESCRIPTION =
  'Angelpage is the charity marketplace for pre-loved fashion, homeware and more. Buy or sell secondhand and up to 90% of each sale goes to a verified charity.';

export const DEFAULT_KEYWORDS = [...BRAND_KEYWORDS.slice(0, 1), ...TOPIC_KEYWORDS.home];

/** 1200x630 raster share image (social platforms do not render SVG). */
export const DEFAULT_OG_IMAGE = '/og/angelpage-og.png';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
/** Raster logo for Organization structured data (Google needs PNG/JPG, ≥112px). */
export const LOGO_URL = '/icons/angelpage-logo.png';

/** Query keys that create duplicate or thin pages (sorting, filters, search, tracking). */
export const FACET_PARAMS = ['sort', 'order', 'q', 'search', 'query', 'minPrice', 'maxPrice', 'price', 'condition', 'brand', 'size', 'color', 'colour', 'view', 'filter'];
/** True when a URL carries a facet; such pages get noindex,follow. */
export function hasFacets(params: Record<string, string | string[] | undefined> = {}) {
  return Object.keys(params).some(k => FACET_PARAMS.includes(k) && params[k] !== undefined && params[k] !== '');
}

/** Official profiles (fill in as they go live; empty entries are dropped). */
export const SOCIAL_PROFILES = [
  process.env.NEXT_PUBLIC_FACEBOOK_URL,
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_X_URL,
  process.env.NEXT_PUBLIC_LINKEDIN_URL,
  process.env.NEXT_PUBLIC_TIKTOK_URL,
].filter((u): u is string => Boolean(u));

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return `${SITE_URL}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Absolute URL for images: leaves http(s) URLs alone, prefixes site paths. */
export function absoluteImage(src?: string | null, fallback = DEFAULT_OG_IMAGE) {
  const value = src || fallback;
  return /^https?:\/\//.test(value) ? value : absoluteUrl(value);
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
  /** noindex but keep following links (faceted / sold / paginated duplicates). */
  follow?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
};

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const word = cut.replace(/\s+\S*$/, '');
  return `${word || cut}…`;
}

export function pageMetadata({
  title,
  description,
  path,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  follow = false,
  type = 'website',
  publishedTime,
  modifiedTime,
}: PageMetaInput): Metadata {
  const index = INDEXABLE && !noindex;
  const withBrand = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  // Google shows ~60 chars: keep the brand suffix only when it fits.
  const fullTitle = withBrand.length <= 60 ? withBrand : clip(title, 60);
  const url = absoluteUrl(path);
  const shareDescription = clip(description, 200);
  description = clip(description, 160);

  return {
    title: { absolute: fullTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow, nocache: !follow },
    openGraph: {
      title: fullTitle,
      description: shareDescription,
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_US',
      alternateLocale: ['en_GB', 'en_CA'],
      images: [image === DEFAULT_OG_IMAGE ? { url: image, alt: fullTitle, ...OG_IMAGE_SIZE } : { url: image, alt: fullTitle }],
      ...(type === 'article' && publishedTime ? { publishedTime, modifiedTime: modifiedTime || publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: shareDescription,
      images: [image],
    },
  };
}

export function organizationGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: absoluteUrl(LOGO_URL), width: 600, height: 187 },
        image: absoluteUrl(DEFAULT_OG_IMAGE),
        sameAs: SOCIAL_PROFILES,
        description: DEFAULT_DESCRIPTION,
        areaServed: ['United States', 'Canada', 'United Kingdom'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: 'en',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#store`,
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        currenciesAccepted: 'USD, CAD, GBP',
        areaServed: ['United States', 'Canada', 'United Kingdom'],
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
