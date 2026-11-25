import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/seo/JsonLd';
import { notFound } from 'next/navigation';
import { serverFetchStatus, type CharityRecord } from '@/lib/server-api';
import { absoluteImage, absoluteUrl, pageMetadata } from '@/lib/siteSeo';
import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import { breadcrumbNode, graph, webPageNode } from '@/lib/seoSchema';

async function loadCharity(charityId: string) {
  const { data, status } = await serverFetchStatus<{ charity?: CharityRecord }>(`/charity/charities/${charityId}`, {
    revalidate: 300,
    tags: [`charity-${charityId}`],
  });
  if (status === 404) notFound();
  return data?.charity ?? null;
}

/** The storefront is the richer page; the directory profile defers to it. */
const canonicalPath = (charityId: string, charity: CharityRecord | null) =>
  charity?.storefrontId ? `/charity/store/${charity.storefrontId}` : `/charity/find-a-charity/${charityId}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ charityId: string }>;
}): Promise<Metadata> {
  const { charityId } = await params;
  const charity = await loadCharity(charityId);
  const name = charity?.charityName || 'Charity';

  return pageMetadata({
    title: name,
    description:
      charity?.description && charity.description.length >= 70
        ? charity.description
        : `${name} on Angelpage: shop pre-loved items listed for ${name} and see how much of each sale reaches the charity.`,
    path: canonicalPath(charityId, charity),
    image: charity?.profileImage,
    keywords: [name, `${name} charity shop`, `support ${name}`, ...TOPIC_KEYWORDS.charities.slice(0, 3), 'Angelpage'],
  });
}

export default async function CharityDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ charityId: string }>;
}) {
  const { charityId } = await params;
  const charity = await loadCharity(charityId);
  const name = charity?.charityName || 'Charity';

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({
            title: name,
            description:
              charity?.description ||
              `${name} on Angelpage. Shop pre-loved goods and support this charity.`,
            path: `/charity/find-a-charity/${charityId}`,
            crumbs: [
              { name: 'Home', path: '/' },
              { name: 'Find a charity', path: '/charity/find-a-charity' },
              { name, path: `/charity/find-a-charity/${charityId}` },
            ],
          }),
          breadcrumbNode([
            { name: 'Home', path: '/' },
            { name: 'Find a charity', path: '/charity/find-a-charity' },
            { name, path: `/charity/find-a-charity/${charityId}` },
          ]),
          {
            '@type': 'NGO',
            name,
            description: charity?.description,
            image: charity?.profileImage ? absoluteImage(charity.profileImage) : undefined,
            url: absoluteUrl(canonicalPath(charityId, charity)),
            identifier: charity?.charityNumber,
          },
        ])}
      />
      {children}
    </>
  );
}
