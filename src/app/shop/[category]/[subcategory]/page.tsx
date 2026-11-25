import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopLanding from '@/components/product/ShopLanding';
import { fetchShopCategories } from '@/lib/server-api';
import { categoryCopy, categoryKeywords } from '@/lib/seoKeywords';
import { pageMetadata } from '@/lib/siteSeo';
import { shopCrumbs } from '@/lib/seoSchema';
import { shopHref } from '@/lib/shopUrls';
import { categoriesData } from '@/libs/categoriesData';

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string; subcategory: string }> };

export function generateStaticParams() {
  return categoriesData.categories.flatMap(c => c.subCategories.map(s => ({ category: c.id, subcategory: s.id })));
}

async function resolve(params: Props['params']) {
  const { category, subcategory } = await params;
  const cats = await fetchShopCategories();
  const cat = cats.find(c => c.id === category);
  const sub = cat?.subCategories.find(s => s.id === subcategory);
  return cat && sub ? { cat, sub } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return { title: 'Not found', robots: { index: false, follow: true } };
  const copy = categoryCopy(found.cat.id, found.sub.id);
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    path: shopHref(found.cat.id, found.sub.id),
    keywords: categoryKeywords(found.cat.id, found.sub.id),
  });
}

export default async function ShopSubcategoryPage({ params }: Props) {
  const found = await resolve(params);
  if (!found) notFound();
  return <ShopLanding category={found.cat} subcategory={found.sub} crumbs={shopCrumbs(found.cat.id, found.sub.id, found.cat.name, found.sub.name)} />;
}
