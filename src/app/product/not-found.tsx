import StatusPage from '@/components/common/StatusPage';

/** 404 for /product/… : the item was removed or the link is wrong. */
export default function ProductNotFound() {
  return (
    <StatusPage
      code="404"
      title="This item is no longer listed"
      body="It may have sold or been removed by the seller. Each pre-loved piece is one of a kind, but there are plenty of new finds waiting."
      primary={{ href: '/product', label: 'Browse new finds' }}
    />
  );
}
