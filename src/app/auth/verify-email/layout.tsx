import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { pageMetadata } from '@/lib/siteSeo';

export const metadata: Metadata = pageMetadata({
  title: 'Verify your email',
  description: 'Confirm your email address to finish setting up your Angelpage account.',
  path: '/auth/verify-email',
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
