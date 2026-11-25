import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/seo/JsonLd';
import { notFound } from 'next/navigation';
import { serverFetchStatus, type CharityRecord } from '@/lib/server-api';
import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import { absoluteImage, absoluteUrl, pageMetadata } from '@/lib/siteSeo';
import { breadcrumbNode, graph, webPageNode } from '@/lib/seoSchema';

/** Direct lookup (scales past any page size); unknown storefronts are a real 404. */
async function loadStore(storefrontId: string) {
  const { data, status } = await serverFetchStatus<{ charity?: CharityRecord }>(`/storefront/${storefrontId}`, {
    revalidate: 300,
    tags: [`storefront-${storefrontId}`],
  });
  if (status === 404) notFound();
  return data?.charity ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storefrontid: string }>;
}): Promise<Metadata> {
  const { storefrontid } = await params;
  const charity = await loadStore(storefrontid);
  const name = charity?.charityName || 'Charity store';

  return pageMetadata({
    title: name,
    description:
      (charity?.description && charity.description.length >= 70 ? charity.description : '') ||
      `Shop the ${name} charity storefront on Angelpage: pre-loved finds where most of every sale goes straight to ${name}.`,
    path: `/charity/store/${storefrontid}`,
    image: charity?.profileImage,
    keywords: [name, `${name} charity shop`, `shop ${name}`, `support ${name}`, ...TOPIC_KEYWORDS.charities.slice(0, 3), 'pre-loved', 'Angelpage'],
  });
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storefrontid: string }>;
}) {
  const { storefrontid } = await params;
  const charity = await loadStore(storefrontid);
  const name = charity?.charityName || 'Charity store';

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            title: name,
            description:
              charity?.description ||
              `Shop the ${name} charity storefront on Angelpage: pre-loved finds where most of every sale goes straight to ${name}.`,
            path: `/charity/store/${storefrontid}`,
            crumbs: [
              { name: 'Home', path: '/' },
              { name: 'Find a charity', path: '/charity/find-a-charity' },
              { name, path: `/charity/store/${storefrontid}` },
            ],
          }),
          breadcrumbNode([
            { name: 'Home', path: '/' },
            { name: 'Find a charity', path: '/charity/find-a-charity' },
            { name, path: `/charity/store/${storefrontid}` },
          ]),
          {
            '@type': ['Store', 'NGO'],
            name,
            identifier: charity?.charityNumber,
            description: charity?.description,
            image: charity?.profileImage ? absoluteImage(charity.profileImage) : undefined,
            url: absoluteUrl(`/charity/store/${storefrontid}`),
          },
        ])}
      />
      {children}
    </>
  );
}
