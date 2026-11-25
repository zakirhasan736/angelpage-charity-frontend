'use client';
import React from 'react';
import FavoriteCharityCard from '@/components/common/cards/charity/favoriteCharityCard';

interface FavoriteCharityListingProps {
  charities: Array<{
    id: string;
    charityName: string;
    storefrontId: string;
    listedProducts?: Array<string | object>;
    profileImage: string;
    description?: string;
  }>;
}

const FavoriteCharityListing: React.FC<FavoriteCharityListingProps> = ({ charities = [] }) => (
  <section className="pb-10">
    <div className="grid grid-cols-3 gap-5 max-[1170px]:grid-cols-2 max-[767px]:grid-cols-1 max-[767px]:gap-3">
      {charities.map(charity => (
        <FavoriteCharityCard key={charity.id} charity={charity} />
      ))}
    </div>
  </section>
);

export default FavoriteCharityListing;
