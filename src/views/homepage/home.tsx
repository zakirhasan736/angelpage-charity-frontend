'use client';
import React from 'react';
import HomeLanding from './home-landing/HomeLanding';
import StorefrontHomeContent from '@/components/homepage/StorefrontHomeContent';
import { useSession } from 'next-auth/react';

/**
 * Guest landing or member home. While the session loads we render the
 * version the server picked from the session cookie, so the server HTML is
 * never empty (crawlers, link previews) and members do not see a flash of
 * the guest page.
 */
const HomePage = ({ likelySignedIn = false }: { likelySignedIn?: boolean }) => {
  const { status } = useSession() || {};
  const signedIn = status === 'authenticated' || (status === 'loading' && likelySignedIn);
  return signedIn ? <StorefrontHomeContent /> : <HomeLanding />;
};

export default HomePage;
