import type { Metadata } from 'next';
import ProductsPage from '@/components/product/ProductsPage';
import SeoTrail from '@/components/seo/SeoTrail';
import { shopCrumbs } from '@/lib/seoSchema';
import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import { hasFacets, pageMetadata } from '@/lib/siteSeo';

type ShopParams = Record<string, string | string[] | undefined>;

const TITLE = 'Shop Pre-loved Fashion, Homeware and More';
const DESCRIPTION =
  'Thrift pre-loved clothes, shoes, bags, homeware and electronics on Angelpage. Up to 90% of every sale goes to a verified charity in the USA, Canada or UK.';

/**
 * /product is the all-products hub. Category views live on /shop/… (the proxy
 * redirects old ?category= links). Any sort/filter/search variant is noindex,
 * follow and canonicalises here, so Search Console never sees thin duplicates.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<ShopParams> }): Promise<Metadata> {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const facet = hasFacets(params);
  return pageMetadata({
    title: page > 1 ? `${TITLE} (page ${page})` : TITLE,
    description: DESCRIPTION,
    path: page > 1 && !facet ? `/product?page=${page}` : '/product',
    keywords: [...TOPIC_KEYWORDS.shop],
    noindex: facet,
    follow: true,
  });
}

export default function ProductsLists() {
  return (
    <>
      <SeoTrail crumbs={shopCrumbs()} title={TITLE} description={DESCRIPTION} hideNav />
      <div className="products-page-main-wrapper">
        <ProductsPage />
      </div>
    </>
  );
}
