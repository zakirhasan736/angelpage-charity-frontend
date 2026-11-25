'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Package } from 'lucide-react';
import FavoriteButton from '@/components/elements/button/FavoriteButton';

interface FavoriteCharityCardProps {
  charity: {
    id: string;
    _id?: string;
    charityName: string;
    storefrontId: string;
    listedProducts?: Array<string | object>;
    profileImage: string;
    description?: string;
  };
}

const FavoriteCharityCard: React.FC<FavoriteCharityCardProps> = ({ charity }) => {
  const href = `/charity/store/${charity.storefrontId}`;
  const count = charity.listedProducts?.length || 0;
  const id = charity._id || charity.id;
  return (
    <article className="group relative flex items-center gap-4 rounded-[22px] bg-white p-4 ring-1 ring-[#ECE8EE] transition hover:shadow-[0_14px_32px_rgba(59,5,92,0.08)] hover:ring-[#DCD5E0]">
      <Link href={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#F2E8F8]" aria-label={charity.charityName}>
        <Image
          src={charity.profileImage || '/images/icons/charity-img.png'}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href}>
          <h3 className="truncate font-primary text-[19px] capitalize text-[#0B0112] transition group-hover:text-[#611192]">
            {charity.charityName}
          </h3>
        </Link>
        {charity.description ? (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-[#6B686E]">{charity.description}</p>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          <span className="ap-chip h-7! text-[11.5px]!">
            <Package className="h-3.5 w-3.5" aria-hidden /> {count} items
          </span>
          <Link href={href} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#611192]">
            Visit store <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
      {id ? (
        <div className="absolute top-3 right-3">
          <FavoriteButton itemId={id} type="Charity" />
        </div>
      ) : null}
    </article>
  );
};

export default FavoriteCharityCard;
