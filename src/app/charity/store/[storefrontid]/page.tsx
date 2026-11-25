import CharityStorefront from '@/components/pages-component/charity/charity-storefront/CharityStorefront';
import { serverFetch, type CharityRecord } from '@/lib/server-api';

type Props = { params: Promise<{ storefrontid: string }> };

/** Server-loads the charity so the storefront header (H1, story) is in the HTML. */
export default async function StorefrontPage({ params }: Props) {
  const { storefrontid } = await params;
  const data = await serverFetch<{ charity?: CharityRecord }>(`/storefront/${storefrontid}`, { revalidate: 300, tags: [`storefront-${storefrontid}`] });
  const Storefront = CharityStorefront as unknown as React.FC<{ initialCharity?: CharityRecord | null }>;
  return (
    <div className="charity-storefront-page-main">
      <Storefront initialCharity={data?.charity ?? null} />
    </div>
  );
}
