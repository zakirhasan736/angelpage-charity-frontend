'use client';
import React from 'react';
import CategoryTileRail from '../common/product-slider/CategoryTileRail';

interface Props {
  secClassName?: string;
}

const electronicsCategories = [
  {
    id: '1',
    imageSrc: '/images/products/electronics-cat-img1.png',
    productCategory: '/shop/electronics/phones',
    imageAlt: 'Phone',
    categoryTitle: 'Phone',
  },
  {
    id: '2',
    imageSrc: '/images/products/electronics-cat-img2.png',
    productCategory: '/shop/electronics/laptops',
    imageAlt: 'Laptop',
    categoryTitle: 'Laptop',
  },
  {
    id: '3',
    imageSrc: '/images/products/electronics-cat-img3.png',
    productCategory: '/shop/electronics/headphone',
    imageAlt: 'Headphone',
    categoryTitle: 'Headphone',
  },
  {
    id: '4',
    imageSrc: '/images/products/electronics-cat-img4.png',
    productCategory: '/shop/electronics/light',
    imageAlt: 'Light',
    categoryTitle: 'Light',
  },
  {
    id: '5',
    imageSrc: '/images/products/electronics-cat-img5.png',
    productCategory: '/shop/electronics/monitor',
    imageAlt: 'Monitor',
    categoryTitle: 'Monitor',
  },
];

const tiles = electronicsCategories.map(c => ({
  title: c.categoryTitle,
  image: c.imageSrc,
  href: c.productCategory,
}));

const ElectronicsTopCategoryProducts: React.FC<Props> = ({ secClassName }) => (
  <CategoryTileRail
    eyebrow="Electronics"
    title="Electronics favourites"
    description="Brand new, in the original packaging."
    tiles={tiles}
    viewAllHref="/shop/electronics"
    className={secClassName || 'bg-[#FAF8FB]'}
  />
);

export default ElectronicsTopCategoryProducts;
