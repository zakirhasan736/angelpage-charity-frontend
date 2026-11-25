import { cookies } from 'next/headers';
import FaqSection from '@/components/seo/FaqSection';
import JsonLd from '@/components/seo/JsonLd';
import { HOME_FAQS, homeGraph } from '@/lib/seoSchema';
import HomePage from '@/views/homepage/home';
import type { Metadata } from 'next';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from '@/lib/siteSeo';

export const metadata: Metadata = {
  ...pageMetadata({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: '/' }),
  title: { absolute: DEFAULT_TITLE },
};

export default async function Home() {
  const jar = await cookies();
  const likelySignedIn = Boolean(jar.get('__Secure-next-auth.session-token') || jar.get('next-auth.session-token') || jar.get('__Secure-authjs.session-token') || jar.get('authjs.session-token'));
  return (
    <>
      <JsonLd data={homeGraph()} />
      <div className="homepage-main-wrapper">
        <HomePage likelySignedIn={likelySignedIn} />
      </div>
      <FaqSection items={HOME_FAQS} showAllLink />
    </>
  );
}
