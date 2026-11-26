'use client';

import React, { useEffect, useRef, useState } from 'react';
import { shopHref } from '@/lib/shopUrls';
import { useParams } from 'next/navigation';
import { Checkmark } from '@/icons';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import RelatedCategoryProducts from './RelatedProductCategory';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { useSelector, useDispatch } from 'react-redux';
import { addOrUpdateProduct, addGuestProduct } from '@/store/cartSlice';
import { openMiniCart } from '@/components/cart/openMiniCart';
import { hydrateAffiliateCart } from '@/store/affiliateCartSlice';
import { useSession } from 'next-auth/react';
import { useGetProductDetailsQuery } from '@/store/api/angelpageApi';

import PreLoader from '../common/pre-loader/PreLoader';
import FavoriteButton from '../elements/button/FavoriteButton';
import ShareProductButtons from './ShareProductButtons';
import ProductReviewsSection from './ProductReviewsSection';
import ProductFulfillmentBadge from '@/components/product/ProductFulfillmentBadge';
import {
  calculateProfitSplit,
  getFulfillmentSpecLabel,
} from '@/lib/profitSplit';
import { formatProductLocation } from '@/lib/productLocation';
import { formatMarketMoney } from '@/lib/marketPreference';
import { useLocale } from '@/i18n/LocaleProvider';
import MessageButton from '@/app/messaging/chat/startChat';
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HeartHandshake,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { affiliatePartner, affiliateLinkProps } from '@/lib/affiliate';

const ProductSinglepage = ({
  productSlug: productSlugProp,
  initialProduct,
} = {}) => {
  const dispatch = useDispatch();
  const { locale } = useLocale();
  const { data: session } = useSession() || {};
  const userId = session?.user?.id;
  const token = session?.token;
  const cartItems = useSelector(state => state.cart.items);
  const affiliateCartItems = useSelector(state => state.affiliateCart.items);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const params = useParams();

  const productSlug = productSlugProp || params?.slug;

  const {
    data: fetchedProduct,
    isLoading: loading,
    isError,
  } = useGetProductDetailsQuery(productSlug, {
    skip: !productSlug,
  });
  const product = fetchedProduct ?? initialProduct;
  const resolvedProductId = product?.id || product?._id;
  const error = isError ? 'Failed to load product details.' : null;

  useEffect(() => {
    dispatch(hydrateAffiliateCart());
  }, [dispatch]);

  useEffect(() => {
    if (!resolvedProductId) return;
    const productInCart = cartItems.some(item => {
      const id = item.productId?._id || item.productId;
      return String(id) === String(resolvedProductId);
    });
    const inAffiliateCart = affiliateCartItems.some(
      item => String(item.productId) === String(resolvedProductId)
    );
    setIsAddedToCart(productInCart || inAffiliateCart);
  }, [cartItems, affiliateCartItems, resolvedProductId]);

  // eBay / Amazon / partner items are bought on the partner site, not here
  const partner = affiliatePartner(product);
  const isAffiliateCheckout = Boolean(partner);

  const handleAddToCart = async () => {
    if (!token) {
      dispatch(addGuestProduct({ product, quantity: 1 }));
      ToastService.success('Product added to cart!');
      setIsAddedToCart(true);
      openMiniCart();
      return;
    }

    try {
      await dispatch(
        addOrUpdateProduct({
          userId,
          productId: resolvedProductId,
          token,
        })
      );
      ToastService.success('Product added to cart!');
      setIsAddedToCart(true);
      openMiniCart();
    } catch (error) {
      ToastService.error('Failed to add product to cart.');
      console.error('Error adding product to cart:', error);
    }
  };

  if (loading && !product) {
    return <PreLoader />;
  }

  if (error && !product) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!product) {
    return <p className="text-gray-500">Product not found.</p>;
  }

  // Safely extract location
  const location = formatProductLocation(product.seller, product.charity);
  const showLocation = location.length > 0;

  const isOwnListing =
    userId &&
    product &&
    [product.seller?.id, product.seller?._id, product.charity?.id]
      .filter(Boolean)
      .some(id => String(id) === String(userId));

  const priceNum = Number(product.price) || 0;
  const sellerSharePct = product.sellerSharePercent ?? 0;
  const split = calculateProfitSplit(priceNum, sellerSharePct);
  const fulfillmentType = product.fulfillmentType || 'uk_shipping';
  const sellAreas = product.sellAreas || [];
  const images = Array.isArray(product.images)
    ? product.images.filter(image => image?.url)
    : [];
  const categoryHref = product.category
    ? shopHref(String(product.category), product.subcategory)
    : '/product';
  const charityName =
    product.charity?.charityName ||
    product.selectedCharityName ||
    product.selectCharityName ||
    '';
  const money = amount => formatMarketMoney(Number(amount) || 0, locale);
  const specs = [
    ['Condition', product.condition],
    ['Brand', product.brand],
    ['Material', product.material],
    ['Colour', product.color],
    ['Size', product.size],
    ['Fulfillment', getFulfillmentSpecLabel(fulfillmentType, sellAreas)],
    ['Height', product.dimensions?.height],
    ['Width', product.dimensions?.width],
    ['Depth', product.dimensions?.depth],
  ].filter(([, value]) => {
    const text = String(value || '').trim();
    return (
      text &&
      text !== 'undefined' &&
      text !== 'null' &&
      !text.startsWith('Local:')
    );
  });

  const sellerId =
    product.seller?._id ||
    product.seller?.id ||
    product.charity?._id ||
    product.charity?.id;
  const isUserSeller = product.sellerType === 'USER';
  const sellerName = isUserSeller
    ? [product.seller?.firstName, product.seller?.lastName]
        .filter(Boolean)
        .join(' ') || 'Angelpage seller'
    : product.seller?.charityName || charityName || 'Charity shop';
  const sellerImage =
    (isUserSeller
      ? product.seller?.profileImage
      : product.seller?.profileImage || product.charity?.profileImage) ||
    '/images/icons/elisp-profile-default-img.svg';
  const gallery = images.length
    ? images
    : [
        {
          url: '/images/products/card-placeholder-image.webp',
          altText: product.name,
        },
      ];
  const reviews = product.reviewSummary || {};
  const deliveryLine =
    fulfillmentType === 'self_collect'
      ? `Collect from ${location || 'the seller'}`
      : fulfillmentType === 'personal_delivery'
        ? `Delivered by the seller${showLocation ? ` around ${location}` : ''}`
        : fulfillmentType === 'local_only'
          ? `Local delivery${sellAreas.length ? `: ${sellAreas.slice(0, 3).join(', ')}` : ''}`
          : 'Tracked shipping, usually 5–7 business days';

  const isSold =
    Boolean(product.isArchived) ||
    (typeof product.stockRemaining === 'number' && product.stockRemaining <= 0);

  const buyButton = isSold ? (
    <div className="rounded-2xl bg-[#F6F3F7] px-4 py-3 text-center">
      <p className="text-[14px] font-semibold text-[#0B0112]">
        This item has sold
      </p>
      <p className="mt-0.5 text-[12px] text-[#6B686E]">
        Thank you for supporting charity. Similar finds are below.
      </p>
    </div>
  ) : isOwnListing ? (
    <div className="rounded-2xl bg-[#F6F3F7] px-4 py-3 text-center">
      <p className="text-[14px] font-medium text-[#0B0112]">
        This is your listing
      </p>
      <p className="mt-0.5 text-[12px] text-[#6B686E]">
        You can&apos;t buy your own item.
      </p>
    </div>
  ) : partner ? (
    <div>
      <a
        {...affiliateLinkProps(partner, resolvedProductId)}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#611192] text-[15px] font-medium text-white transition hover:bg-[#4C0D73]"
      >
        Buy on {partner.name}
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
      <p className="mt-2 text-center text-[12px] text-[#6B686E]">
        Opens {partner.name} in a new tab. Angelpage earns a commission that
        supports charity.
      </p>
    </div>
  ) : (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isAddedToCart}
      className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium transition ${
        isAddedToCart
          ? 'bg-[#F2E8F8] text-[#611192]'
          : 'bg-[#611192] text-white hover:bg-[#4C0D73]'
      }`}
    >
      {isAddedToCart ? (
        <Checkmark />
      ) : (
        <ShoppingBag className="h-5 w-5" aria-hidden />
      )}
      {isAddedToCart ? 'Added to basket' : 'Add to basket'}
    </button>
  );

  return (
    <section className="product-singlepage-section bg-[#FAF6FC] pb-16 sm:bg-white sm:pb-[150px]">
      <div className="custom-container pt-6 sm:px-0! sm:pt-0">
        <nav aria-label="Breadcrumb" className="sm:hidden">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] text-[#8A888C]">
            <li className="flex items-center gap-2">
              <Link className="hover:text-[#611192]" href="/">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </li>
            <li className="flex items-center gap-2">
              <Link
                className="capitalize hover:text-[#611192]"
                href={categoryHref}
              >
                {product.category || 'Shop'}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </li>
            <li className="max-w-[280px] truncate text-[#0B0112]">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-12 laptop-m:gap-8 md:grid-cols-1 sm:mt-0 sm:gap-0">
          {/* gallery */}
          <ProductGallery
            images={gallery}
            name={product.name}
            resolvedProductId={resolvedProductId}
          />

          {/* buy box */}
          <div className="sticky top-6 space-y-4 md:static sm:px-4 sm:pt-4">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_44px_rgba(59,5,92,0.06)] ring-1 ring-[#ECE8EE] sm:p-5">
              {/* seller row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src={sellerImage}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#8A888C]">
                      {isUserSeller ? 'Donated by' : 'Sold by'}
                    </p>
                    <p className="truncate text-[14px] font-semibold text-[#0B0112]">
                      {sellerName}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!!session?.token && !isOwnListing && sellerId ? (
                    <MessageButton
                      sellerId={sellerId}
                      sellerType={product.sellerType || 'USER'}
                      productId={product.id || product._id}
                      productName={product.name}
                    />
                  ) : null}
                  <span className="rounded-full bg-[#F4F1F6]">
                    <FavoriteButton
                      itemId={String(resolvedProductId)}
                      type="Product"
                    />
                  </span>
                  <ShareProductButtons
                    product={{
                      productId: String(resolvedProductId || ''),
                      slug: product.slug || productSlug,
                      name: product.name,
                      price: Number(product.price) || 0,
                      charityProfit: Number(product.charityProfit) || 0,
                      sellerSharePercent: product.sellerSharePercent ?? 0,
                      charityName:
                        product.charity?.charityName ||
                        product.selectCharityName ||
                        product.selectedCharityName,
                      description:
                        product.additionalInfo || product.description || '',
                      condition: product.condition,
                      brand: product.brand,
                      material: product.material,
                      color: product.color,
                      size: product.size,
                      category: product.category,
                      imageUrl: product.images?.[0]?.url,
                    }}
                  />
                </div>
              </div>

              {product.brand ? (
                <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                  {product.brand}
                </p>
              ) : null}
              <h1 className="ap-display mt-1 text-[34px] leading-[1.15] laptop-m:text-[30px] sm:text-[26px]">
                {product.name}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-[30px] leading-none font-semibold text-[#0B0112] sm:text-[26px]">
                  {money(priceNum)}
                </p>
                {product.size ? (
                  <span className="rounded-full bg-[#F4F1F6] px-2.5 py-1 text-[12px] text-[#474648]">
                    Size {product.size}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {product.condition ? (
                  <span className="rounded-full bg-[#F2E8F8] px-3 py-1 text-[12px] font-medium text-[#611192] capitalize">
                    {product.condition}
                  </span>
                ) : null}
                {fulfillmentType === 'uk_shipping' ? (
                  <span className="rounded-full bg-[#F2E8F8] px-3 py-1 text-[12px] font-medium text-[#611192]">
                    Est. 5–7 business days
                  </span>
                ) : null}
                <ProductFulfillmentBadge
                  fulfillmentType={fulfillmentType}
                  sellAreas={sellAreas}
                  className="rounded-full! bg-[#F4F1F6]! px-3! py-1! text-[12px]! text-[#474648]!"
                />
                {reviews.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF6E5] px-3 py-1 text-[12px] font-semibold text-[#8A4B00]">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />{' '}
                    {reviews.averageRating} ({reviews.reviewCount})
                  </span>
                ) : null}
              </div>

              {/* where the money goes */}
              <div className="mt-5 rounded-2xl bg-[#FBF7FD] p-4 ring-1 ring-[#F2E4FA]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#611192] uppercase">
                    Where your money goes
                  </p>
                  {charityName ? (
                    <p className="truncate text-[13px] font-medium text-[#0B0112]">
                      {charityName}
                    </p>
                  ) : null}
                </div>
                <div
                  className="mt-3 flex h-2.5 overflow-hidden rounded-full"
                  aria-hidden
                >
                  <span
                    style={{
                      width: `${split.platformFeePercent}%`,
                      background: '#C2771A',
                    }}
                  />
                  {split.sellerProfit > 0 ? (
                    <span
                      className="ml-[2px]"
                      style={{
                        width: `${split.sellerSharePercent}%`,
                        background: '#00977A',
                      }}
                    />
                  ) : null}
                  <span
                    className="ml-[2px] flex-1"
                    style={{ background: '#8A3FC7' }}
                  />
                </div>
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-[#6B686E]">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px] bg-[#C2771A]"
                        aria-hidden
                      />
                      Platform fee ({split.platformFeePercent}%)
                    </dt>
                    <dd className="text-[#474648]">
                      {money(split.platformFee)}
                    </dd>
                  </div>
                  {split.sellerProfit > 0 ? (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-[#6B686E]">
                        <span
                          className="h-2.5 w-2.5 rounded-[3px] bg-[#00977A]"
                          aria-hidden
                        />
                        Seller ({split.sellerSharePercent}%)
                      </dt>
                      <dd className="text-[#474648]">
                        {money(split.sellerProfit)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between font-semibold text-[#0B0112]">
                    <dt className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px] bg-[#8A3FC7]"
                        aria-hidden
                      />
                      To charity ({split.charitySharePercent}%)
                    </dt>
                    <dd>{money(split.charityProfit)}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 sm:hidden">{buyButton}</div>
              {product.charity?.storefrontId ? (
                <Link
                  href={`/charity/store/${product.charity.storefrontId}`}
                  className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium text-[#611192] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]"
                >
                  <Store className="h-4 w-4" aria-hidden /> Visit the charity
                  storefront
                </Link>
              ) : null}

              {/* trust */}
              <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-[#F0EBF2] pt-5 text-center">
                {(partner
                  ? [
                      [ShieldCheck, `Sold by ${partner.name}`],
                      [Lock, `${partner.name} buyer protection`],
                      [BadgeCheck, 'Commission to charity'],
                    ]
                  : [
                      [ShieldCheck, 'Secure checkout'],
                      [Lock, 'Held until delivery'],
                      [BadgeCheck, 'Verified charity'],
                    ]
                ).map(([Icon, label]) => (
                  <li key={label}>
                    <Icon
                      className="mx-auto h-5 w-5 text-[#611192]"
                      aria-hidden
                    />
                    <span className="mt-1.5 block text-[12px] leading-tight text-[#6B686E]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* item details */}
            <details
              className="group rounded-[24px] bg-white px-6 ring-1 ring-[#ECE8EE] sm:px-5"
              open
            >
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-semibold text-[#0B0112]">
                Item details
                <ChevronDown
                  className="h-4 w-4 transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              {specs.length ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 pb-5">
                  {specs.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-[14px] capitalize text-[#0B0112]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {product.additionalInfo ? (
                <p className="pb-5 text-[14px] leading-relaxed text-[#474648]">
                  {product.additionalInfo}
                </p>
              ) : null}
              <div className="space-y-2 border-t border-[#F0EBF2] py-5 text-[14px] text-[#474648]">
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#611192]" aria-hidden />{' '}
                  {deliveryLine}
                </p>
                {showLocation ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#611192]" aria-hidden />{' '}
                    {location}
                  </p>
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-white sm:mt-6">
        <RelatedCategoryProducts
          category={product.category}
          currentProductId={resolvedProductId}
        />
        <div className="custom-container pb-4">
          <div className="rounded-[24px] p-6 ring-1 ring-[#ECE8EE] sm:p-4">
            <ProductReviewsSection
              productId={String(resolvedProductId || '')}
              initialSummary={product.reviewSummary}
            />
          </div>
        </div>
      </div>

      {/* phone buy bar (above the bottom tab bar) */}
      <div
        className="fixed inset-x-0 z-[60] hidden items-center gap-3 border-t border-[#ECE8EE] bg-white/95 px-4 py-3 backdrop-blur-md sm:flex"
        style={{ bottom: 'calc(66px + env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0 shrink-0">
          <p className="text-[18px] leading-none font-semibold text-[#0B0112]">
            {money(priceNum)}
          </p>
          <p className="mt-1 text-[11px] text-[#611192]">
            {money(split.charityProfit)} to charity
          </p>
        </div>
        <div className="min-w-0 flex-1">{buyButton}</div>
      </div>
    </section>
  );
};

/** Gallery: main image with arrows and thumbnails; swipeable full-bleed on phones. */
function ProductGallery({ images, name, resolvedProductId }) {
  const [index, setIndex] = useState(0);
  const railRef = useRef(null);
  const count = images.length;
  const go = i => {
    const next = (i + count) % count;
    setIndex(next);
    const rail = railRef.current;
    if (rail && rail.offsetParent !== null)
      rail.scrollTo({ left: rail.clientWidth * next, behavior: 'smooth' });
  };
  const onRailScroll = e => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== index) setIndex(i);
  };
  const onKey = e => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  };

  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 md:grid-cols-1 sm:gap-0">
      {/* thumbs (desktop) */}
      <div className="ap-no-scrollbar flex max-h-[640px] flex-col gap-3 overflow-y-auto md:order-2 md:max-h-none md:flex-row md:overflow-x-auto sm:hidden">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => go(i)}
            aria-label={`Image ${i + 1}`}
            aria-current={i === index}
            className={`relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-[#F6EEFA] transition ${i === index ? 'ring-2 ring-[#611192]' : 'opacity-70 hover:opacity-100'}`}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="76px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* main (desktop/tablet) */}
      <div
        className="group relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#F6EEFA] sm:hidden"
        tabIndex={0}
        onKeyDown={onKey}
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
      >
        <Image
          src={images[index].url}
          alt={images[index].altText || name}
          fill
          priority
          sizes="(max-width: 991px) 100vw, 55vw"
          className="object-cover"
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="ap-arrow absolute top-1/2 left-4 -translate-y-1/2 bg-white!"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="ap-arrow absolute top-1/2 right-4 -translate-y-1/2 bg-white!"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-[#0B0112]/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {/* phone: swipe rail */}
      <div className="relative hidden sm:block">
        <div
          ref={railRef}
          onScroll={onRailScroll}
          className="ap-no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <div
              key={`${img.url}-m${i}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-[#F6EEFA]"
            >
              <Image
                src={img.url}
                alt={img.altText || name}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <span className="absolute top-4 right-4 rounded-full bg-white/95 shadow">
          <FavoriteButton itemId={String(resolvedProductId)} type="Product" />
        </span>
        {count > 1 ? (
          <div
            className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5"
            aria-hidden
          >
            {images.map((img, i) => (
              <span
                key={`${img.url}-d${i}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProductSinglepage;
