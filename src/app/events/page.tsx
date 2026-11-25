import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import type { Metadata } from 'next';
import React from 'react';
import EventsPageClient from '@/components/features/events/EventsPageClient';
import { fetchEvents } from '@/lib/server-api';
import SeoTrail from '@/components/seo/SeoTrail';
import { pageMetadata } from '@/lib/siteSeo';
import HydrateQuery from '@/store/HydrateQuery';

export const metadata: Metadata = pageMetadata({
  title: 'Charity Appeals, Votes and Live Events',
  description:
    'Back a charity appeal, vote on what a charity funds next, or watch the work live. Angelpage events from verified charities in the USA, Canada and UK.',
  path: '/events',
  keywords: [...TOPIC_KEYWORDS.events, 'Angelpage'],
});

export const revalidate = 120;

export default async function EventsPage() {
  const initialEvents = await fetchEvents();
  return (
    <>
      <SeoTrail
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Events', path: '/events' },
        ]}
        title="Events"
        description="Give beside the shop. Angelpage events include charity appeals, community votes, and live moments."
      />
      <HydrateQuery
        entries={[
          {
            endpointName: 'getEvents',
            arg: { limit: 48 },
            data: initialEvents,
          },
        ]}
      />
      <EventsPageClient initialEvents={initialEvents} />
    </>
  );
}
