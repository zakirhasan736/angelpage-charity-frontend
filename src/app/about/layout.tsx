import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SeoTrail from '@/components/seo/SeoTrail';
import { pageMetadata } from '@/lib/siteSeo';

export const metadata: Metadata = pageMetadata({
  title: 'About Angelpage, the Charity Marketplace',
  description:
    'Angelpage turns everyday buying and selling into giving: sellers are donors, buyers are givers, and verified charities receive most of every sale.',
  path: '/about',
  keywords: [...TOPIC_KEYWORDS.about, 'Angelpage'],
});

const description =
  'Angelpage is where sellers are donors and buyers are givers. Every sale of pre-loved goods sends most of the money to a charity.';

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SeoTrail
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
        title="About"
        description={description}
      />
      {children}
    </>
  );
}
