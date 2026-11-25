import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SeoTrail from '@/components/seo/SeoTrail';
import { pageMetadata } from '@/lib/siteSeo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Angelpage: Help for Buyers, Sellers and Charities',
  description:
    'Questions about an order, selling for charity or bringing your charity onto Angelpage? Get in touch with the Angelpage team.',
  path: '/contact',
  keywords: [...TOPIC_KEYWORDS.about, 'Angelpage'],
});

const description =
  'Contact Angelpage about the charity marketplace, a listing, an event, or your account.';

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SeoTrail
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
        title="Contact"
        description={description}
      />
      {children}
    </>
  );
}
