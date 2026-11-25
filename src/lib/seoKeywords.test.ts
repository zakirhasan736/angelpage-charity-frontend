import { describe, expect, it } from 'vitest';
import { categoryCopy, categoryKeywords } from './seoKeywords';
import { shopHref, toSlug } from './shopUrls';
import { hasFacets } from './siteSeo';

describe('shop URLs', () => {
  it('builds clean category paths', () => {
    expect(shopHref('women')).toBe('/shop/women');
    expect(shopHref('women', 'leather-jackets')).toBe('/shop/women/leather-jackets');
    expect(shopHref('Home & Garden')).toBe('/shop/home-and-garden');
    expect(shopHref()).toBe('/product');
    expect(toSlug(' Trench Coats ')).toBe('trench-coats');
  });
});

describe('category copy', () => {
  it('keeps titles and descriptions inside search limits', () => {
    for (const [c, s] of [['women', undefined], ['women', 'leather-jackets'], ['electronics', 'headphone'], ['books', 'children-books']] as const) {
      const copy = categoryCopy(c, s);
      expect(copy.title.length).toBeLessThanOrEqual(60);
      expect(copy.description.length).toBeLessThanOrEqual(160);
      expect(copy.description.length).toBeGreaterThan(70);
    }
  });
  it('produces unique keyword lists', () => {
    const k = categoryKeywords('women', 'dresses');
    expect(new Set(k).size).toBe(k.length);
    expect(k).toContain("pre-loved women's dresses");
  });
});

describe('facets', () => {
  it('flags sort/filter/search params but not pagination', () => {
    expect(hasFacets({ sort: 'price' })).toBe(true);
    expect(hasFacets({ q: 'coat' })).toBe(true);
    expect(hasFacets({ page: '2' })).toBe(false);
    expect(hasFacets({})).toBe(false);
  });
});
