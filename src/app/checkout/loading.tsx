import FullScreenLoader from '@/components/common/loading/FullScreenLoader';

/**
 * Loader for signed-in areas only. Public pages have no loading.tsx so a
 * missing product/post/event returns a real 404 status (a loading boundary
 * starts streaming with 200 before notFound() can run).
 */
export default function Loading() {
  return <FullScreenLoader />;
}
