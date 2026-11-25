'use client';

import React from 'react';
import BlogList from '../common/cards/blog/blogCards';
import Link from 'next/link';
import { Button } from '@/components/elements';
import { blogData as staticBlogData } from '@/libs/blogs';
import { mapBlogToCard } from '@/lib/server-api';
import { useGetBlogPostsQuery } from '@/store/api/angelpageApi';
import SectionHeading from '../common/product-slider/SectionHeading';

interface LatestBlogsSectionProps {
  secClassName?: string;
}

const LatestBlogsSection: React.FC<LatestBlogsSectionProps> = ({
  secClassName,
}) => {
  const { data: posts } = useGetBlogPostsQuery({ limit: 3 });

  const cardData =
    posts && posts.length > 0
      ? posts.map(mapBlogToCard)
      : staticBlogData.slice(0, 3);

  return (
    <section
      className={`Latest-blog-section ${secClassName || 'bg-mono-0 ap-section'}`}
    >
      <div className="custom-container">
        <SectionHeading
          eyebrow="Journal"
          title="Stories from the community"
          description="News and stories from Angelpage, our charities and the people who give."
          className="mb-10 max-[767px]:mb-6"
          actions={
            <Link href="/blog">
              <Button variant="secondary">Read all posts</Button>
            </Link>
          }
        />
      </div>
      <div className="custom-container max-[991px]:pr-0!">
        <div className="product-slides-area pr-[16px] pl-[10px] max-[767px]:pr-8 max-[767px]:pl-0 overflow-hidden">
          <BlogList blogData={cardData} />
        </div>
      </div>
    </section>
  );
};

export default LatestBlogsSection;
