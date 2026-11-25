/**
 * Canonical shop URLs. Category pages live on clean paths so search engines
 * index one URL per category:
 *   /shop/women            (category)
 *   /shop/women/dresses    (sub-category)
 * Old /product?category=… links are 308-redirected here by src/proxy.ts.
 */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function shopHref(category?: string | null, subcategory?: string | null) {
  if (!category) return '/product';
  const c = toSlug(category);
  if (!c) return '/product';
  const s = subcategory ? toSlug(subcategory) : '';
  return s ? `/shop/${c}/${s}` : `/shop/${c}`;
}
