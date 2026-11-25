'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import StoreFrontBanner from './banner';
import AboutInfoComponent from './about';
import CharityStoreListing from './listing';
import FavoriteButton from '@/components/elements/button/FavoriteButton';
import Loading from '@/app/loading';

const CharityStorefront = () => {
  const params = useParams();
  const storefrontid = Array.isArray(params?.storefrontid)
    ? params.storefrontid[0]
    : params?.storefrontid;

  const [charityData, setCharityData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const tabsRef = useRef(null);

  useEffect(() => {
    if (!storefrontid) {
      return;
    }

    const fetchCharityData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/storefront/${storefrontid}`
        );
        if (!response.data?.charity) {
          setNotFound(true);
          setCharityData(null);
          return;
        }
        setCharityData(response.data.charity);
        setNotFound(false);
      } catch (error) {
        console.error('Error fetching charity data:', error);
        setNotFound(true);
        setCharityData(null);
      }
    };

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/storefront/${storefrontid}/products`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProductCount(data.charity?.listedProducts?.length || 0);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharityData();
    fetchProducts();
  }, [storefrontid]);

  if (!storefrontid) {
    return (
      <div className="custom-container py-16 text-center">
        <h1 className="h4 text-mono-100 mb-2">Storefront not available</h1>
        <p className="body-regular text-mono-70 mb-6">
          Invalid storefront link.
        </p>
        <button
          type="button"
          className="rounded-full bg-primary-color-100 px-6 py-2 text-mono-0"
          onClick={() => router.push('/')}
        >
          Return home
        </button>
      </div>
    );
  }

  if (loading && !charityData && !notFound) {
    return <Loading />;
  }

  if (notFound || !charityData) {
    return (
      <div className="custom-container py-16 text-center">
        <h1 className="h4 text-mono-100 mb-2">Storefront not available</h1>
        <p className="body-regular text-mono-70 mb-6">
          This charity storefront could not be found.
        </p>
        <button
          type="button"
          className="rounded-full bg-primary-color-100 px-6 py-2 text-mono-0"
          onClick={() => router.push('/')}
        >
          Return home
        </button>
      </div>
    );
  }

  const tabs = [
    { label: 'Shop', count: productCount },
    { label: 'About' },
  ];

  const goToShop = () => {
    setActiveTab(0);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="charity-storefront-main-page-wrapper bg-[#FAF8FB]">
      <StoreFrontBanner
        charityStore={charityData}
        productCount={productCount}
        onShop={goToShop}
        actions={
          charityData?._id ? (
            <span className="favorite-btn-item-store inline-flex h-12 shrink-0 items-center gap-1 rounded-full bg-white/12 pr-4 pl-1.5 text-[14px] font-medium text-white ring-1 ring-white/25 backdrop-blur [&_svg]:text-white max-[767px]:w-12 max-[767px]:justify-center max-[767px]:px-0">
              <FavoriteButton itemId={charityData._id} type="Charity" />
              <span className="max-[767px]:hidden">Save</span>
            </span>
          ) : null
        }
      />

      <div className="charity-storefront-wrapper-area">
        <div
          ref={tabsRef}
          className="storefront-tabs-box sticky top-0 z-30 scroll-mt-0 border-b border-[#ECE8EE] bg-white/90 backdrop-blur-xl"
        >
          <div className="custom-container flex items-center justify-between gap-4 py-3">
            <div className="inline-flex rounded-full bg-[#F4F1F6] p-1" role="tablist" aria-label="Storefront sections">
              {tabs.map((tab, idx) => {
                const active = activeTab === idx;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(idx)}
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-medium transition ${
                      active ? 'bg-white text-[#611192] shadow-[0_2px_10px_rgba(59,5,92,0.12)]' : 'text-[#6B686E] hover:text-[#0B0112]'
                    }`}
                  >
                    {tab.label}
                    {tab.count != null ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? 'bg-[#611192] text-white' : 'bg-white text-[#611192]'}`}>
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 max-[767px]:hidden">
              <img
                src={charityData?.profileImage || '/images/icons/charity-img.png'}
                alt=""
                className="h-8 w-8 rounded-[10px] object-cover ring-1 ring-[#ECE8EE]"
              />
              <span className="max-w-[240px] truncate text-[14px] font-medium capitalize text-[#0B0112]">
                {charityData?.charityName}
              </span>
            </div>
          </div>
        </div>

        <div className="store-front-tabs-cont-area">
          {activeTab === 0 && (
            <div className="storefront-shop-tabs-cont">
              <CharityStoreListing storefrontid={storefrontid} />
            </div>
          )}
          {activeTab === 1 && <AboutInfoComponent charityData={charityData} productCount={productCount} onShop={goToShop} />}
        </div>
      </div>
    </div>
  );
};

export default CharityStorefront;
