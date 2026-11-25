import StatusPage from '@/components/common/StatusPage';

/** 403: rendered (with a 403 status and noindex) when a page calls forbidden(). */
export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      title="You don't have access to this page"
      body="This area is for a different account type, or your session has changed. Sign in with the right account, or head back to the shop."
      primary={{ href: '/auth/login', label: 'Sign in' }}
    />
  );
}
