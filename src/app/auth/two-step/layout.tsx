import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/siteSeo';

export const metadata: Metadata = pageMetadata({
  title: 'Two-step verification',
  description: 'Confirm it’s you to finish signing in to Angelpage.',
  path: '/auth/two-step',
  noindex: true,
});

export default function TwoStepLayout({ children }: { children: ReactNode }) {
  return children;
}
