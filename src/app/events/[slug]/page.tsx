import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import EventDetailClient from '@/components/features/events/EventDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { isMongoObjectId } from '@/lib/slugs';
import { fetchEventBySlugResult, type CommunityEventRecord } from '@/lib/server-api';
import { absoluteImage, absoluteUrl, pageMetadata, SITE_NAME, SITE_URL } from '@/lib/siteSeo';
import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import { breadcrumbNode, graph, webPageNode, type Crumb } from '@/lib/seoSchema';
import HydrateQuery from '@/store/HydrateQuery';

export const revalidate = 120;

type PageProps = { params: Promise<{ slug: string }> };

const FALLBACK_IMAGE: Record<string, string> = {
  donation: '/images/events/donation_hands.jpg',
  live_session: '/images/events/charity_event_hero.jpg',
  general: '/images/events/community_poll_bg.jpg',
};

const ended = (e: CommunityEventRecord) => Boolean(e.endAt && new Date(e.endAt).getTime() < Date.now());

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await fetchEventBySlugResult(slug);
  if (!event?.title) return { title: 'Event not found', robots: { index: false, follow: true } };
  return pageMetadata({
    title: event.title,
    description: event.excerpt || 'A charity appeal, vote or live session on Angelpage.',
    path: `/events/${event.slug || slug}`,
    image: event.coverImage || FALLBACK_IMAGE[event.eventType] || undefined,
    keywords: [event.title, event.category || 'charity event', ...TOPIC_KEYWORDS.events.slice(0, 4), SITE_NAME],
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { event, status } = await fetchEventBySlugResult(slug);

  if (!event) {
    if (status === 404 || status === 200) notFound();
    throw new Error(`Events API unavailable (${status})`);
  }
  if (event.slug && isMongoObjectId(slug) && slug !== event.slug) permanentRedirect(`/events/${event.slug}`);

  const querySlug = event.slug || slug;
  const path = `/events/${querySlug}`;
  const url = absoluteUrl(path);
  const crumbs: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: event.title, path },
  ];
  const image = absoluteImage(event.coverImage || FALLBACK_IMAGE[event.eventType]);
  const organizer = { '@type': 'Organization', name: event.authorName || SITE_NAME, url: SITE_URL };

  // Event rich results need a start date. Appeals without one are described
  // as a fundraising page (WebPage + about) instead of an invalid Event.
  const schema = event.startAt
    ? {
        '@type': 'Event',
        '@id': `${url}#event`,
        name: event.title,
        description: event.excerpt || event.description,
        image: [image],
        startDate: event.startAt,
        endDate: event.endAt || event.startAt,
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        url,
        organizer,
        performer: organizer,
        location: { '@type': 'VirtualLocation', url: event.liveStreamUrl || url },
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'USD',
          availability: ended(event) ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          url,
          validFrom: event.startAt,
        },
      }
    : { '@type': 'Thing', '@id': `${url}#appeal`, name: event.title, description: event.excerpt, image, url };

  return (
    <>
      <JsonLd data={graph([webPageNode({ title: event.title, description: event.excerpt || event.title, path, crumbs }), breadcrumbNode(crumbs), schema])} />
      <HydrateQuery entries={[{ endpointName: 'getEventBySlug', arg: querySlug, data: event }]} />
      <EventDetailClient slug={querySlug} initialEvent={event} />
    </>
  );
}
