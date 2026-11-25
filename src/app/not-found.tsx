import type { Metadata } from 'next';
import StatusPage from '@/components/common/StatusPage';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

/** 404: rendered with a real 404 status by notFound() and unknown URLs. */
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We couldn't find that page"
      body="The link may be old, or the item may have sold. Every listing is one of a kind, so take a look at what's new instead."
      primary={{ href: '/product', label: 'See new arrivals' }}
    />
  );
}
