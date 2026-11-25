'use client';

import React, { useEffect, useState } from 'react';
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

  return (
    <div className="charity-storefront-main-page-wrapper">
      <StoreFrontBanner
        charityStore={charityData}
        productCount={productCount}
        actions={
          charityData?._id ? (
            <div className="favorite-btn-item-store flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-[#DCD5E0]">
              <FavoriteButton itemId={charityData._id} type="Charity" />
            </div>
          ) : null
        }
      />
      <div className="charity-storefront-wrapper-area">
        <div className="storefront-tabs-area">
          <div className="storefront-tabs-box border-b border-[#ECE8EE] bg-white">
            <div className="custom-container">
              <div className="storefront-tabs-btn-box flex items-center gap-8 pt-8 max-[767px]:pt-5" role="tablist">
                {tabs.map((tab, idx) => {
                  const active = activeTab === idx;
                  return (
                    <button
                      key={tab.label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(idx)}
                      className={`relative inline-flex items-center gap-2 pb-4 text-[15px] font-medium transition ${
                        active ? 'text-[#611192]' : 'text-[#6B686E] hover:text-[#0B0112]'
                      }`}
                    >
                      {tab.label}
                      {tab.count != null ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            active ? 'bg-[#611192] text-white' : 'bg-[#F2E8F8] text-[#611192]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      ) : null}
                      <span
                        className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#611192] transition-transform duration-300 ${
                          active ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="store-front-tabs-cont-area">
            <ul className="tabs-content-area">
              {activeTab === 0 && (
                <li className="tabs-cont-item">
                  <div className="storefront-shop-tabs-cont bg-[#FAF8FB] max-[767px]:py-0!">
                    <CharityStoreListing storefrontid={storefrontid} />
                  </div>
                </li>
              )}
              {activeTab === 1 && (
                <li className="tabs-cont-item">
                  <AboutInfoComponent charityData={charityData} />
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharityStorefront;
