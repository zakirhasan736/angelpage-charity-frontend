'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  ArrowLeft,
  BadgeCheck,
  Expand,
  Plus,
  Ruler,
  Sparkles,
  X,
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
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#611192] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73]"
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
      className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition ${
        isAddedToCart
          ? 'bg-[#F2E8F8] text-[#611192]'
          : 'bg-[#611192] text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] hover:bg-[#4C0D73]'
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

  const sellerHref = product.charity?.storefrontId
    ? `/charity/store/${product.charity.storefrontId}`
    : null;
  const description = product.additionalInfo || product.description || '';
  const quickFacts = [
    product.condition ? [Sparkles, 'Condition', product.condition] : null,
    product.size ? [Ruler, 'Size', product.size] : null,
    [
      Truck,
      fulfillmentType === 'self_collect' ? 'Pickup' : 'Delivery',
      fulfillmentType === 'uk_shipping'
        ? '5–7 days'
        : getFulfillmentSpecLabel(fulfillmentType, sellAreas) || 'Local',
    ],
    showLocation ? [MapPin, 'From', location] : null,
  ]
    .filter(Boolean)
    .slice(0, 4);
  const shareProduct = {
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
    description,
    condition: product.condition,
    brand: product.brand,
    material: product.material,
    color: product.color,
    size: product.size,
    category: product.category,
    imageUrl: product.images?.[0]?.url,
  };

  return (
    <section className="product-singlepage-section bg-white pb-20 sm:pb-[150px]">
      {/* top bar (desktop/tablet) */}
      <div className="custom-container flex items-center justify-between gap-4 pt-6 pb-5 sm:hidden">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px] text-[#8A888C]">
            <li className="flex shrink-0 items-center gap-1.5">
              <Link className="hover:text-[#611192]" href="/">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </li>
            <li className="flex shrink-0 items-center gap-1.5">
              <Link className="hover:text-[#611192]" href="/product">
                Shop
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </li>
            {product.category ? (
              <li className="flex shrink-0 items-center gap-1.5">
                <Link
                  className="capitalize hover:text-[#611192]"
                  href={categoryHref}
                >
                  {product.subcategory || product.category}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </li>
            ) : null}
            <li className="truncate text-[#0B0112]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <ShareProductButtons product={shareProduct} />
        </div>
      </div>

      <div className="custom-container sm:px-0!">
        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start gap-14 laptop-m:gap-10 md:grid-cols-1 md:gap-8 sm:gap-0">
          <ProductGallery
            images={gallery}
            name={product.name}
            resolvedProductId={resolvedProductId}
            onBack={() =>
              window.history.length > 1
                ? window.history.back()
                : (window.location.href = categoryHref)
            }
          />

          {/* buy column */}
          <div className="sticky top-6 md:static sm:relative sm:z-10 sm:-mt-7 sm:rounded-t-[28px] sm:bg-white sm:px-5 sm:pt-6">
            {/* eyebrow + title */}
            <div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
              {product.brand ? (
                <span className="text-[#611192]">{product.brand}</span>
              ) : null}
              {product.brand && product.category ? (
                <span aria-hidden>·</span>
              ) : null}
              {product.category ? (
                <Link href={categoryHref} className="hover:text-[#611192]">
                  {product.subcategory || product.category}
                </Link>
              ) : null}
            </div>
            <h1 className="ap-display mt-2 text-[40px] leading-[1.1] laptop-m:text-[34px] sm:text-[28px]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-[32px] leading-none font-semibold tracking-tight text-[#0B0112] sm:text-[28px]">
                {money(priceNum)}
              </p>
              {reviews.reviewCount > 0 ? (
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 text-[14px] text-[#474648] hover:text-[#611192]"
                >
                  <Star
                    className="h-4 w-4 fill-[#F5A524] text-[#F5A524]"
                    aria-hidden
                  />
                  <span className="font-semibold text-[#0B0112]">
                    {reviews.averageRating}
                  </span>
                  <span className="underline decoration-[#D8D1DD] underline-offset-4">
                    {reviews.reviewCount} reviews
                  </span>
                </a>
              ) : null}
            </div>

            {/* quick facts */}
            {quickFacts.length ? (
              <dl className="mt-6 grid grid-cols-4 overflow-hidden rounded-2xl border border-[#EEEAF0] sm:grid-cols-2">
                {quickFacts.map(([Icon, label, value], i) => (
                  <div
                    key={label}
                    className={`px-4 py-3.5 ${i ? 'border-l border-[#EEEAF0]' : ''} sm:border-l-0 sm:[&:nth-child(2n)]:border-l sm:[&:nth-child(n+3)]:border-t`}
                  >
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium text-[#8A888C]">
                      <Icon
                        className="h-3.5 w-3.5 text-[#611192]"
                        aria-hidden
                      />
                      {label}
                    </dt>
                    <dd
                      className="mt-1 truncate text-[14px] font-semibold text-[#0B0112] first-letter:uppercase"
                      title={String(value)}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {/* impact */}
            <div className="mt-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3B055C] to-[#611192] p-5 text-white">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <HeartHandshake className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] leading-tight font-semibold text-white!">
                    {money(split.charityProfit)}{' '}
                    <span className="text-[15px] font-normal text-white/80">
                      goes to charity
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-white/75">
                    {charityName
                      ? `Supporting ${charityName}`
                      : 'Supporting a verified charity'}
                  </p>
                </div>
              </div>
              <div
                className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/15"
                aria-hidden
              >
                <span className="flex-1 bg-white" />
                {split.sellerProfit > 0 ? (
                  <span
                    className="ml-[2px] bg-[#6FE0C3]"
                    style={{ width: `${split.sellerSharePercent}%` }}
                  />
                ) : null}
                <span
                  className="ml-[2px] bg-[#F7C77E]"
                  style={{ width: `${split.platformFeePercent}%` }}
                />
              </div>
              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-white/80">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
                  <dt>Charity {split.charitySharePercent}%</dt>
                </div>
                {split.sellerProfit > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full bg-[#6FE0C3]"
                      aria-hidden
                    />
                    <dt>
                      Seller {split.sellerSharePercent}% ·{' '}
                      {money(split.sellerProfit)}
                    </dt>
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-[#F7C77E]"
                    aria-hidden
                  />
                  <dt>
                    Platform {split.platformFeePercent}% ·{' '}
                    {money(split.platformFee)}
                  </dt>
                </div>
              </dl>
            </div>

            {/* actions */}
            <div className="mt-5 flex items-stretch gap-3 sm:hidden">
              <div className="flex-1">{buyButton}</div>
              <span
                className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full ring-1 ring-[#E2DDE5]"
                title="Save"
              >
                <FavoriteButton
                  itemId={String(resolvedProductId)}
                  type="Product"
                />
              </span>
            </div>

            {/* trust */}
            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#5C5560]">
              {(partner
                ? [
                    [ShieldCheck, `Sold by ${partner.name}`],
                    [Lock, `${partner.name} buyer protection`],
                    [BadgeCheck, 'Commission to charity'],
                  ]
                : [
                    [ShieldCheck, 'Secure checkout'],
                    [Lock, 'Payment held until delivery'],
                    [BadgeCheck, 'Verified charity'],
                  ]
              ).map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-[#00977A]" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            {/* seller */}
            <div className="mt-6 flex items-center gap-3 rounded-[22px] bg-[#F8F5FA] p-4">
              <Image
                src={sellerImage}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[#8A888C]">
                  {isUserSeller ? 'Listed by' : 'Sold by'}
                </p>
                <p className="truncate text-[15px] font-semibold text-[#0B0112]">
                  {sellerName}
                </p>
                {showLocation ? (
                  <p className="truncate text-[12px] text-[#6B686E]">
                    {location}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!!session?.token && !isOwnListing && sellerId ? (
                  <MessageButton
                    sellerId={sellerId}
                    sellerType={product.sellerType || 'USER'}
                    productId={product.id || product._id}
                    productName={product.name}
                  />
                ) : null}
                {sellerHref ? (
                  <Link
                    href={sellerHref}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#611192] ring-1 ring-[#E2DDE5] transition hover:ring-[#611192]"
                  >
                    <Store className="h-4 w-4" aria-hidden /> Shop
                  </Link>
                ) : null}
              </div>
            </div>

            {/* info accordions */}
            <div className="mt-6 border-t border-[#EEEAF0]">
              {description ? (
                <Accordion title="Description" defaultOpen>
                  <p className="text-[15px] leading-relaxed whitespace-pre-line text-[#474648]">
                    {description}
                  </p>
                </Accordion>
              ) : null}
              {specs.length ? (
                <Accordion title="Item details" defaultOpen={!description}>
                  <dl className="divide-y divide-[#F0EBF2]">
                    {specs.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-6 py-2.5 text-[14px]"
                      >
                        <dt className="text-[#8A888C]">{label}</dt>
                        <dd className="text-right font-medium text-[#0B0112] capitalize">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Accordion>
              ) : null}
              <Accordion
                title={partner ? 'Delivery' : 'Delivery and protection'}
              >
                <ul className="space-y-3 text-[14px] text-[#474648]">
                  <li className="flex gap-3">
                    <Truck
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#611192]"
                      aria-hidden
                    />
                    {deliveryLine}
                  </li>
                  {showLocation ? (
                    <li className="flex gap-3">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#611192]"
                        aria-hidden
                      />
                      Ships from {location}
                    </li>
                  ) : null}
                  {partner ? (
                    <li className="flex gap-3">
                      <ExternalLink
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#611192]"
                        aria-hidden
                      />
                      Bought and delivered through {partner.name}. Their returns
                      policy applies.
                    </li>
                  ) : (
                    <li className="flex gap-3">
                      <Lock
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#611192]"
                        aria-hidden
                      />
                      Your payment is held until the item arrives as described.
                    </li>
                  )}
                </ul>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-8">
        <RelatedCategoryProducts
          category={product.category}
          currentProductId={resolvedProductId}
        />
        <div id="reviews" className="custom-container scroll-mt-6 pb-4">
          <div className="rounded-[28px] bg-[#F8F5FA] p-8 sm:p-5">
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
          <p className="text-[19px] leading-none font-semibold text-[#0B0112]">
            {money(priceNum)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#611192]">
            <HeartHandshake className="h-3 w-3" aria-hidden />{' '}
            {money(split.charityProfit)} to charity
          </p>
        </div>
        <div className="min-w-0 flex-1">{buyButton}</div>
      </div>
    </section>
  );
};

function Accordion({ title, defaultOpen = false, children }) {
  return (
    <details className="group border-b border-[#EEEAF0]" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[16px] font-semibold text-[#0B0112] [&::-webkit-details-marker]:hidden">
        {title}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F1F6] transition group-open:rotate-45">
          <Plus className="h-4 w-4" aria-hidden />
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

/** Full-screen photo viewer: arrows, swipe, keyboard, thumbnails. */
function Lightbox({ images, start, name, onClose }) {
  const [i, setI] = useState(start);
  const touch = useRef(null);
  const count = images.length;
  const go = n => setI((n + count) % count);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI(v => (v - 1 + count) % count);
      if (e.key === 'ArrowRight') setI(v => (v + 1) % count);
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', key);
    };
  }, [count, onClose]);
  return createPortal(
    <div
      className="ap-fade-in fixed inset-0 z-[10060] flex flex-col bg-[#0B0112]"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <span className="text-[14px] text-white/80">
          {i + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div
        className="relative min-h-0 flex-1"
        onTouchStart={e => (touch.current = e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
          touch.current = null;
        }}
      >
        <Image
          src={images[i].url}
          alt={images[i].altText || name}
          fill
          sizes="100vw"
          className="object-contain"
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-5 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:hidden"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-5 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:hidden"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="ap-no-scrollbar flex justify-center gap-2 overflow-x-auto px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {images.map((img, n) => (
            <button
              key={`${img.url}-lb${n}`}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Photo ${n + 1}`}
              aria-current={n === i}
              className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-xl transition ${n === i ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-90'}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body
  );
}

/**
 * Desktop: an editorial photo stack (hero + two-up grid) that opens full
 * screen. Phones: a full-bleed swipe gallery with back/save buttons and dots.
 */
function ProductGallery({ images, name, resolvedProductId, onBack }) {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(null);
  const count = images.length;
  const onRailScroll = e => {
    const el = e.currentTarget;
    const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (n !== index) setIndex(n);
  };
  const shown = images.slice(0, 5);
  const extra = count - shown.length;

  return (
    <div>
      {/* desktop / tablet stack */}
      <div
        className={`grid gap-3 sm:hidden ${count > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        {shown.map((img, n) => (
          <button
            key={`${img.url}-${n}`}
            type="button"
            onClick={() => setViewer(n)}
            aria-label={`Open photo ${n + 1} of ${count}`}
            className={`group relative overflow-hidden rounded-[24px] bg-[#F6EEFA] ${n === 0 ? (count > 1 ? 'col-span-2 aspect-[4/5]' : 'aspect-[4/5]') : n === shown.length - 1 && (shown.length - 1) % 2 === 1 ? 'col-span-2 aspect-[4/3]' : 'aspect-[4/5]'}`}
          >
            <Image
              src={img.url}
              alt={img.altText || name}
              fill
              priority={n === 0}
              sizes={
                n === 0
                  ? '(max-width: 991px) 100vw, 56vw'
                  : '(max-width: 991px) 50vw, 28vw'
              }
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            />
            {n === 0 ? (
              <span className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[#0B0112] opacity-0 shadow backdrop-blur transition group-hover:opacity-100">
                <Expand className="h-3.5 w-3.5" aria-hidden /> View{' '}
                {count > 1 ? `all ${count}` : 'full screen'}
              </span>
            ) : null}
            {n === shown.length - 1 && extra > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-[#0B0112]/45 text-[18px] font-semibold text-white">
                +{extra} more
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* phone: swipe rail */}
      <div className="relative hidden sm:block">
        <div
          onScroll={onRailScroll}
          className="ap-no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, n) => (
            <button
              key={`${img.url}-m${n}`}
              type="button"
              onClick={() => setViewer(n)}
              aria-label={`Open photo ${n + 1} of ${count}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-[#F6EEFA]"
            >
              <Image
                src={img.url}
                alt={img.altText || name}
                fill
                priority={n === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#0B0112] shadow-[0_4px_16px_rgba(11,1,18,0.15)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="pointer-events-auto rounded-full bg-white/95 shadow-[0_4px_16px_rgba(11,1,18,0.15)]">
            <FavoriteButton itemId={String(resolvedProductId)} type="Product" />
          </span>
        </div>
        {count > 1 ? (
          <div
            className="absolute inset-x-0 bottom-11 flex items-center justify-center gap-1.5"
            aria-hidden
          >
            {images.map((img, n) => (
              <span
                key={`${img.url}-d${n}`}
                className={`h-1.5 rounded-full transition-all ${n === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {viewer !== null ? (
        <Lightbox
          images={images}
          start={viewer}
          name={name}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </div>
  );
}

export default ProductSinglepage;
