import ProductSingleSec from '@/components/product/ProductSingleSec';
import { isMongoObjectId } from '@/lib/slugs';
import { fetchProductDetailsResult, productIndexState, type ProductRecord } from '@/lib/server-api';
import HydrateQuery from '@/store/HydrateQuery';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const ProductView = ProductSingleSec as React.FC<{
  productSlug?: string;
  initialProduct?: ProductRecord | null;
}>;

export default async function ProductSinglePage({ params }: PageProps) {
  const { slug } = await params;
  const { product: initialProduct, status } = await fetchProductDetailsResult(slug);

  // Real 404 (not a "not found" message on a 200 page) when the API says so,
  // or when the listing was removed. An API outage (status 0/5xx) is thrown
  // so the error boundary answers 500 and caches keep the last good page.
  if (status === 404 || productIndexState(initialProduct) === 'removed') notFound();
  if (!initialProduct && status !== 200) throw new Error(`Product API unavailable (${status})`);

  if (
    initialProduct?.slug &&
    isMongoObjectId(slug) &&
    slug !== initialProduct.slug
  ) {
    permanentRedirect(`/product/${initialProduct.slug}`);
  }

  const querySlug = initialProduct?.slug || slug;

  return (
    <div className="product-singlepage-wrapper">
      {initialProduct ? (
        <HydrateQuery
          entries={[
            {
              endpointName: 'getProductDetails',
              arg: querySlug,
              data: initialProduct,
            },
          ]}
        />
      ) : null}
      <ProductView productSlug={querySlug} initialProduct={initialProduct} />
    </div>
  );
}
