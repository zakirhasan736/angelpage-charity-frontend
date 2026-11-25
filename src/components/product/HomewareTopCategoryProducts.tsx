'use client';
import React from 'react';
import CategoryTileRail from '../common/product-slider/CategoryTileRail';

interface Props {
  secClassName?: string;
}

const homewareCategories = [
  {
    productImageSrc: '/images/products/homeware-cat-img1.png',
    productImageAlt: 'Cutlery',
    productCategory: '/product?category=homeware&subcategory=cutlery',
    productTitle: 'Cutlery',
  },
  {
    productImageSrc: '/images/products/homeware-cat-img2.png',
    productImageAlt: 'Bedding',
    productCategory: '/product?category=homeware&subcategory=bedding',
    productTitle: 'Bedding',
  },
  {
    productImageSrc: '/images/products/homeware-cat-img3.png',
    productImageAlt: 'Crockery',
    productCategory: '/product?category=homeware&subcategory=crockery',
    productTitle: 'Crockery',
  },
  {
    productImageSrc: '/images/products/homeware-cat-img4.png',
    productImageAlt: 'Decor',
    productCategory: '/product?category=homeware&subcategory=decor',
    productTitle: 'Decor',
  },
  {
    productImageSrc: '/images/products/homeware-cat-img5.png',
    productImageAlt: 'Curtains',
    productCategory: '/product?category=homeware&subcategory=curtains',
    productTitle: 'Curtains',
  },
];

const tiles = homewareCategories.map(c => ({ title: c.productTitle, image: c.productImageSrc, href: c.productCategory }));

const HomewareTopCategoryProducts: React.FC<Props> = ({ secClassName }) => (
  <CategoryTileRail
    eyebrow="Homeware"
    title="Homeware favourites"
    description="Brand new, in the original packaging."
    tiles={tiles}
    viewAllHref="/product?category=homeware"
    className={secClassName || 'bg-[#FAF8FB]'}
  />
);

export default HomewareTopCategoryProducts;
