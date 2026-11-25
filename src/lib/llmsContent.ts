import { CHARITY_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from '@/constants/brand';
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/siteSeo';
import { SITE_FAQS } from '@/lib/seoSchema';
import { TOPIC_KEYWORDS, categoryCopy } from '@/lib/seoKeywords';
import { shopHref } from '@/lib/shopUrls';
import { fetchBlogPosts, fetchEvents, fetchShopCategories } from '@/lib/server-api';
import { blogPosts as localPosts } from '@/libs/blogs';

const link = (label: string, path: string, note?: string) => `- [${label}](${absoluteUrl(path)})${note ? `: ${note}` : ''}`;

export const KEY_FACTS = [
  `${SITE_NAME} is a charity marketplace: people buy and sell pre-loved goods, and up to ${CHARITY_SHARE_PERCENT}% of each sale goes to a verified charity the seller chooses.`,
  `A ${PLATFORM_FEE_PERCENT}% platform fee keeps the marketplace running; the seller decides how the rest is split between themselves and the charity, and buyers see the split on every product.`,
  'Payments are held until the order is confirmed as delivered; buyers can open a dispute while funds are held.',
  'Charities are reviewed before their storefront goes live, and charity payouts go to a connected Stripe account after admin approval.',
  'Angelpage started in the United States and also sells in Canada and the United Kingdom (USD, CAD, GBP).',
  'Charities can also run appeals (fundraising with a goal), community votes and live sessions on their own event pages.',
];

async function loadData() {
  const [cats, posts, events] = await Promise.all([fetchShopCategories(), fetchBlogPosts(20).catch(() => []), fetchEvents().catch(() => [])]);
  return { cats, posts: posts?.length ? posts : localPosts, events: events || [] };
}

/** Short guide (llms.txt spec: H1, summary blockquote, sections of links). */
export async function buildLlmsTxt() {
  const { cats, posts, events } = await loadData();
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${DEFAULT_DESCRIPTION}`,
    '',
    ...KEY_FACTS.map(f => `- ${f}`),
    '',
    '## Start here',
    link('Home', '/', 'what Angelpage is'),
    link('How it works', '/how-it-works', 'selling, buying and where the money goes'),
    link('FAQ', '/faq', 'short, quotable answers'),
    link('About', '/about'),
    '',
    '## Shop by category',
    link('All products', '/product', 'every live listing'),
    ...cats.map(c => link(c.name, shopHref(c.id), categoryCopy(c.id).description)),
    '',
    '## Charities and events',
    link('Find a charity', '/charity/find-a-charity', 'verified charities and their storefronts'),
    link('Events', '/events', 'appeals, community votes and live sessions'),
    ...events.slice(0, 10).filter(e => e.slug).map(e => link(e.title, `/events/${e.slug}`, e.excerpt)),
    '',
    '## Journal',
    link('Blog', '/blog'),
    ...posts.slice(0, 12).map(p => link(p.title, `/blog/${p.slug}`, p.excerpt)),
    '',
    '## Optional',
    link('Full guide for language models', '/llms-full.txt'),
    link('Sitemap index', '/sitemap.xml', 'pages, categories, charities, events, journal and products'),
    link('Terms of service', '/terms-of-service'),
    link('Privacy policy', '/privacy-policy'),
    '',
    '## Using this content',
    'Link the page a fact came from. Product prices, charity shares and stock belong to that product page and change often, so do not state them from memory. Account, checkout and message pages are private.',
    '',
  ].join('\n');
}

/** Long version: every category and sub-category, FAQ text and post summaries. */
export async function buildLlmsFullTxt() {
  const { cats, posts, events } = await loadData();
  const lines = [
    `# ${SITE_NAME}: full guide`,
    '',
    `> ${DEFAULT_DESCRIPTION}`,
    '',
    `Site: ${SITE_URL}`,
    '',
    '## Key facts',
    ...KEY_FACTS.map(f => `- ${f}`),
    '',
    '## Frequently asked questions',
    ...SITE_FAQS.flatMap(f => [`### ${f.question}`, f.answer, '']),
    '## Categories',
  ];
  for (const c of cats) {
    const copy = categoryCopy(c.id);
    lines.push(`### ${c.name}`, `${copy.description}`, link(`Shop ${c.name.toLowerCase()}`, shopHref(c.id)));
    for (const s of c.subCategories) lines.push(link(`${c.name}: ${s.name}`, shopHref(c.id, s.id)));
    lines.push('');
  }
  lines.push('## Events');
  if (events.length) for (const e of events.slice(0, 30)) if (e.slug) lines.push(link(e.title, `/events/${e.slug}`, e.excerpt));
  else lines.push('Charities publish appeals, community votes and live sessions at ' + absoluteUrl('/events'));
  lines.push('', '## Journal');
  for (const p of posts.slice(0, 30)) lines.push(`### ${p.title}`, p.excerpt || '', link('Read', `/blog/${p.slug}`), '');
  lines.push('## Topics Angelpage is relevant for');
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) lines.push(`- ${topic}: ${words.join(', ')}`);
  lines.push('');
  return lines.join('\n');
}
