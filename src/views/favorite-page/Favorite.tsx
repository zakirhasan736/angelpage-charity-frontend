'use client';

import React, { useState, useEffect } from 'react';
import BannerSection from './Banner';
import FavoriteProductListing from './FavoriteProducts';
import FavoriteCharityListing from './FavoriteCharities';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Product } from '@/types/productTypes';
import ProductSkeletonCard from '@/components/common/cards/product/productskeletonCard';
import { Button } from '@/components/elements';
import Link from 'next/link';
import { Heart, Store } from 'lucide-react';


interface Charity {
  id: string;
  charityName: string;
  storefrontId: string;
  listedProducts?: (string | object)[];
  profileImage: string;
  description?: string;
}

interface FavoriteResponse {
  favoriteProducts: Product[];
  favoriteCharities: Charity[];
}

const FavoritePage = () => {
   const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
   const [favoriteCharities, setFavoriteCharities] = useState<Charity[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession() || {};

const fetchFavorites = async () => {
  if (!session?.token) return;

  setLoading(true);
  try {
    const response = await axios.get<FavoriteResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/favorites/added`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    if (response.data) {
      // Filter out products with status === "REMOVED"
      const filteredProducts = response.data.favoriteProducts?.filter(
        product => product.status !== 'REMOVED'
      );

      setFavoriteProducts(filteredProducts || []);
      setFavoriteCharities(response.data.favoriteCharities || []);
    } else {
      setFavoriteProducts([]);
      setFavoriteCharities([]);
    }
  } catch (error) {
    console.error('Error fetching favourites:', error);
    setFavoriteProducts([]);
    setFavoriteCharities([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchFavorites();
  }, [session]);

  const tabs = [
    { label: 'Items', count: favoriteProducts.length, icon: Heart },
    { label: 'Charities', count: favoriteCharities.length, icon: Store },
  ];

  const Empty = ({ kind }: { kind: 'items' | 'charities' }) => (
    <div className="mx-auto flex max-w-[460px] flex-col items-center rounded-[28px] bg-white px-6 py-16 text-center ring-1 ring-[#ECE8EE] max-[767px]:py-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F2E8F8] text-[#611192]">
        {kind === 'items' ? <Heart className="h-7 w-7" aria-hidden /> : <Store className="h-7 w-7" aria-hidden />}
      </span>
      <p className="mt-5 font-primary text-[24px] text-[#0B0112]">
        {kind === 'items' ? 'No saved items yet' : 'No saved charities yet'}
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[#6B686E]">
        {kind === 'items'
          ? 'Tap the heart on anything you love and it will wait for you here.'
          : 'Save a charity from its storefront to follow what it lists.'}
      </p>
      <Link href={kind === 'items' ? '/product/' : '/charity/find-a-charity'} className="mt-6">
        <Button variant="primary" className="h-12! px-6!">
          {kind === 'items' ? 'Start shopping' : 'Find a charity'}
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="favorite-page-content-wrapper min-h-[70vh] bg-[#FAF8FB] pb-16 max-[767px]:pb-6">
      <BannerSection totalProducts={favoriteProducts.length} totalCharities={favoriteCharities.length} />

      <div className="sticky top-0 z-30 border-b border-[#ECE8EE] bg-[#FAF8FB]/90 backdrop-blur-xl">
        <div className="custom-container py-3">
          <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-[#ECE8EE] max-[767px]:flex max-[767px]:w-full" role="tablist" aria-label="Favourites">
            {tabs.map(({ label, count, icon: Icon }, idx) => {
              const active = activeTab === idx;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(idx)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium transition max-[767px]:flex-1 ${
                    active ? 'bg-[#611192] text-white shadow-[0_6px_16px_rgba(97,17,146,0.24)]' : 'text-[#6B686E]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                  <span className={`rounded-full px-2 text-[11px] ${active ? 'bg-white/20' : 'bg-[#F2E8F8] text-[#611192]'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="custom-container pt-6">
        {loading ? (
          <div className="grid grid-cols-4 gap-5 max-[1170px]:grid-cols-3 max-[767px]:grid-cols-2 max-[767px]:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeletonCard key={i} />
            ))}
          </div>
        ) : activeTab === 0 ? (
          favoriteProducts.length === 0 ? (
            <Empty kind="items" />
          ) : (
            <FavoriteProductListing isLoggedin={!!session?.token} products={favoriteProducts} />
          )
        ) : favoriteCharities.length === 0 ? (
          <Empty kind="charities" />
        ) : (
          <FavoriteCharityListing charities={favoriteCharities} />
        )}
      </div>
    </div>
  );
};

export default FavoritePage;
