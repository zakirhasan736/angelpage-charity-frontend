import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import BlogDetailClient from '@/components/features/blog/BlogDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { isMongoObjectId } from '@/lib/slugs';
import { fetchBlogBySlugResult, readingMinutes, type BlogPostRecord } from '@/lib/server-api';
import { blogPosts } from '@/libs/blogs';
import { absoluteImage, absoluteUrl, LOGO_URL, pageMetadata, SITE_NAME, SITE_URL } from '@/lib/siteSeo';
import { TOPIC_KEYWORDS } from '@/lib/seoKeywords';
import { breadcrumbNode, graph, webPageNode, type Crumb } from '@/lib/seoSchema';
import HydrateQuery from '@/store/HydrateQuery';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

/** API post, else the bundled fallback post with the same slug. */
async function loadPost(slug: string): Promise<{ post: BlogPostRecord | null; status: number; fromApi: boolean }> {
  const { post, status } = await fetchBlogBySlugResult(slug);
  if (post) return { post, status, fromApi: true };
  const local = blogPosts.find(p => p.slug === slug) || null;
  return { post: local, status: local ? 200 : status, fromApi: false };
}

export function generateStaticParams() {
  return blogPosts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await loadPost(slug);
  if (!post?.title) return { title: 'Story not found', robots: { index: false, follow: true } };
  return pageMetadata({
    title: post.title,
    description: post.excerpt || 'A story from the Angelpage charity marketplace.',
    path: `/blog/${post.slug || slug}`,
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    keywords: [...(post.tags || []), post.category || 'stories', ...TOPIC_KEYWORDS.blog.slice(0, 3), SITE_NAME],
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { post, status, fromApi } = await loadPost(slug);

  if (!post) {
    if (status === 404 || status === 200) notFound();
    throw new Error(`Blog API unavailable (${status})`);
  }
  if (post.slug && isMongoObjectId(slug) && slug !== post.slug) permanentRedirect(`/blog/${post.slug}`);

  const querySlug = post.slug || slug;
  const path = `/blog/${querySlug}`;
  const crumbs: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path },
  ];
  const article = {
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(path)}#article`,
    headline: post.title.slice(0, 110),
    description: post.excerpt,
    image: [absoluteImage(post.coverImage)],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    wordCount: (post.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length || undefined,
    timeRequired: `PT${readingMinutes(post.content || post.excerpt)}M`,
    articleSection: post.category,
    keywords: post.tags?.join(', '),
    inLanguage: 'en-US',
    author: { '@type': 'Organization', name: post.authorName || `${SITE_NAME} Team`, url: SITE_URL },
    publisher: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: absoluteUrl(LOGO_URL) } },
    mainEntityOfPage: { '@id': `${absoluteUrl(path)}#webpage` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  return (
    <>
      <JsonLd data={graph([webPageNode({ title: post.title, description: post.excerpt, path, crumbs }), breadcrumbNode(crumbs), article])} />
      {fromApi ? <HydrateQuery entries={[{ endpointName: 'getBlogBySlug', arg: querySlug, data: post }]} /> : null}
      <BlogDetailClient slug={querySlug} initialPost={post} />
    </>
  );
}
