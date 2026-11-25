'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/common/SafeImage';
import Link from 'next/link';
import { Checkmark } from '@/icons';
import { Button } from '@/components/elements';
import FavoriteButton from '@/components/elements/button/FavoriteButton';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { useSelector, useDispatch } from 'react-redux';
import { useSession } from 'next-auth/react';
import { addOrUpdateProduct, addGuestProduct } from '@/store/cartSlice';
import { openMiniCart } from '@/components/cart/openMiniCart';
import { useLazyGetProductDetailsQuery } from '@/store/api/angelpageApi';
import { calculateProfitSplit } from '@/lib/profitSplit';
import { useLocale } from '@/i18n/LocaleProvider';

const formatMoney = (amount, locale) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);

const fulfillmentKey = type => {
  if (type === 'personal_delivery') return 'card.personal';
  if (type === 'self_collect') return 'card.collect';
  if (type === 'local_only') return 'card.limited';
  return 'card.ships';
};

const ProductCard = ({
  id,
  slug,
  charityImageSrc = '/images/icons/elisp-profile-default-img.svg',
  charityImageAlt = 'Charity',
  images = [],
  brand = '',
  name = '',
  size = '',
  price = '',
  location = '',
  charityProfit,
  sellerSharePercent = 0,
  fulfillmentType = 'uk_shipping',
  sellAreas = [],
}) => {
  const dispatch = useDispatch();
  const { t, locale } = useLocale();
  const detailSlug = slug || id;
  const { data: session } = useSession() || {};
  const userId = session?.user?.id;
  const token = session?.token;
  const cartItems = useSelector(state => state.cart.items);
  const [fetchProductDetails] = useLazyGetProductDetailsQuery();
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const displayLocation = (location || '').trim();
  const showLocation =
    displayLocation.length > 0 &&
    !/^n\/a$/i.test(displayLocation) &&
    !/not available/i.test(displayLocation);

  useEffect(() => {
    const productInCart = cartItems.some(item => {
      const pid = item.productId?._id || item.productId;
      return String(pid) === String(id);
    });
    setIsAddedToCart(productInCart);
  }, [cartItems, id]);

  const handleAddToCart = async () => {
    if (!token) {
      try {
        const product = await fetchProductDetails(detailSlug).unwrap();
        dispatch(addGuestProduct({ product, quantity: 1 }));
        ToastService.success(t('card.addedToast'));
        setIsAddedToCart(true);
        openMiniCart();
      } catch {
        ToastService.error(t('card.failedToast'));
      }
      return;
    }

    try {
      await dispatch(
        addOrUpdateProduct({
          userId,
          productId: id,
          token,
        }),
      );
      ToastService.success(t('card.addedToast'));
      setIsAddedToCart(true);
      openMiniCart();
    } catch (error) {
      ToastService.error(t('card.failedToast'));
      console.error('Error adding product to cart:', error);
    }
  };

  const validatedImageSrc =
    images[0]?.url &&
    (images[0].url.startsWith('/') || images[0].url.startsWith('http'))
      ? images[0].url
      : '/images/products/card-placeholder-image.webp';

  const charitySrc =
    charityImageSrc &&
    (charityImageSrc.startsWith('/') || charityImageSrc.startsWith('http'))
      ? charityImageSrc
      : '/images/icons/elisp-profile-default-img.svg';

  const priceNum = parseFloat(String(price).replace(/[^\d.]/g, '')) || 0;
  const split =
    charityProfit != null
      ? {
          charityProfit: Number(charityProfit),
          sellerSharePercent,
        }
      : calculateProfitSplit(priceNum, sellerSharePercent);
  const charityAmount =
    charityProfit != null ? Number(charityProfit) : split.charityProfit;

  const areaLabel =
    fulfillmentType === 'local_only' && sellAreas?.length
      ? t('card.local', { areas: sellAreas.slice(0, 2).join(', ') })
      : t(fulfillmentKey(fulfillmentType));

  return (
    <article className="ap-product-card group relative flex h-full w-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#F2E8F8] ring-1 ring-[#ECE8EE]">
        <Link href={`/product/${detailSlug}`} className="absolute inset-0" aria-label={name || 'View product'}>
          <Image
            src={validatedImageSrc}
            alt={images[0]?.altText || name || 'Product'}
            fill
            sizes="(max-width: 768px) 60vw, 300px"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0112]/45 to-transparent opacity-80" />
        </Link>

        <div className="absolute top-3 right-3 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(11,1,18,0.1)] backdrop-blur">
          <FavoriteButton itemId={id} type="Product" />
        </div>

        <span className="ap-chip ap-chip--glass absolute top-3 left-3 h-7! max-w-[calc(100%-64px)] truncate px-2.5! text-[11px]! text-[#3B055C]! max-[767px]:hidden">
          {areaLabel}
        </span>

        <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex items-center gap-2">
          <Image
            src={charitySrc}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-full bg-white object-cover ring-2 ring-white"
          />
          <span className="truncate text-[12px] font-medium text-white! drop-shadow">
            {charityImageAlt}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-[11px] font-semibold tracking-[0.14em] text-[#8A888C] uppercase">
            {brand || '\u00A0'}
          </p>
          {size ? (
            <p className="shrink-0 text-[11px] text-[#8A888C]">{size}</p>
          ) : null}
        </div>
        <Link href={`/product/${detailSlug}`} className="mt-1.5">
          <h3 className="line-clamp-2 min-h-[46px] font-primary text-[17px] leading-[1.35] text-[#0B0112] transition group-hover:text-[#611192]">
            {name}
          </h3>
        </Link>

        {priceNum > 0 && (
          <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FCF2FF] px-2.5 py-1 text-[11.5px] font-medium text-[#611192]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2 0 3.4 1.1 4.2 2.3h2c.8-1.2 2.2-2.3 4.2-2.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
            </svg>
            {t('card.toCharity', {
              amount: formatMoney(charityAmount, locale),
            })}
          </p>
        )}

        <div className="ap-card-foot mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-[20px] leading-none font-semibold text-[#0B0112]">
              {priceNum > 0 ? formatMoney(priceNum, locale) : '—'}
            </p>
            {split.sellerSharePercent > 0 ? (
              <p className="mt-1 whitespace-nowrap text-[11px] text-[#8A888C]">
                {t('card.sellerKeeps', { percent: split.sellerSharePercent })}
              </p>
            ) : showLocation ? (
              <p className="mt-1 line-clamp-1 text-[11px] text-[#8A888C]">{displayLocation}</p>
            ) : null}
          </div>
          {isAddedToCart ? (
            <Button
              variant="accent"
              className="h-10! px-4! text-[13px]! inline-flex items-center gap-1.5"
              disabled
            >
              <Checkmark /> {t('card.added')}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="h-10! px-4! text-[13px]!"
              onClick={handleAddToCart}
            >
              {t('card.add')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
