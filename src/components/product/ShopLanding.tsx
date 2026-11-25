import Link from 'next/link';
import ProductsPage from '@/components/product/ProductsPage';
import { ShopFilterProvider } from '@/components/product/ShopFilterContext';
import SeoTrail from '@/components/seo/SeoTrail';
import { categoryCopy } from '@/lib/seoKeywords';
import { shopHref } from '@/lib/shopUrls';
import type { Crumb } from '@/lib/seoSchema';

type Cat = { id: string; name: string; subCategories: { id: string; name: string }[] };

/**
 * Server-rendered category landing: unique H1, intro copy, breadcrumbs and
 * internal links to every child page, then the live product listing.
 */
export default function ShopLanding({ category, subcategory, crumbs }: { category: Cat; subcategory?: { id: string; name: string }; crumbs: Crumb[] }) {
  const copy = categoryCopy(category.id, subcategory?.id);
  const h1 = copy.h1.replace(/(^|\s)\S/, m => m.toUpperCase());
  const siblings = category.subCategories;
  return (
    <>
      <SeoTrail crumbs={crumbs} title={copy.title} description={copy.description} />
      <section className="custom-container pt-4 pb-2">
        <h1 className="ap-display text-[36px] leading-tight md:text-[30px] sm:text-[26px]">{h1}</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-[#6B686E] sm:text-[14px]">{copy.intro}</p>
        {siblings.length ? (
          <nav aria-label={`${category.name} sections`} className="ap-no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
            <Link
              href={shopHref(category.id)}
              aria-current={!subcategory ? 'page' : undefined}
              className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-medium ${!subcategory ? 'bg-[#0B0112] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'}`}
            >
              All {category.name.toLowerCase()}
            </Link>
            {siblings.map(s => {
              const on = subcategory?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={shopHref(category.id, s.id)}
                  aria-current={on ? 'page' : undefined}
                  className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-medium ${on ? 'bg-[#0B0112] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#F2E8F8] hover:text-[#611192]'}`}
                >
                  {s.name}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </section>
      <ShopFilterProvider category={category.id} subcategory={subcategory?.id}>
        <div className="products-page-main-wrapper">
          <ProductsPage hideBanner />
        </div>
      </ShopFilterProvider>
    </>
  );
}
