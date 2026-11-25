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

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return categoriesData.categories.map(c => ({ category: c.id }));
}

async function resolve(params: Props['params']) {
  const { category } = await params;
  const cats = await fetchShopCategories();
  return cats.find(c => c.id === category) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await resolve(params);
  if (!cat) return { title: 'Not found', robots: { index: false, follow: true } };
  const copy = categoryCopy(cat.id);
  return pageMetadata({ title: copy.title, description: copy.description, path: shopHref(cat.id), keywords: categoryKeywords(cat.id) });
}

export default async function ShopCategoryPage({ params }: Props) {
  const cat = await resolve(params);
  if (!cat) notFound();
  return <ShopLanding category={cat} crumbs={shopCrumbs(cat.id, undefined, cat.name)} />;
}
