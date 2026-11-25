'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../elements';

const pieces = [
  '/images/products/jewellery-modal-img1.jpeg',
  '/images/products/jewellery-modal-img2.jpeg',
  '/images/products/jewellery-modal-img3.jpeg',
];

const JewelleryProductCtaSec = () => (
  <section className="jewellery-cta-section bg-white py-6">
    <div className="custom-container">
      <div className="relative grid grid-cols-12 items-center gap-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#F2E8F8] via-[#FCF2FF] to-white px-14 py-12 ring-1 ring-[#ECE8EE] max-[1280px]:px-10 max-[991px]:grid-cols-1 max-[767px]:rounded-[24px] max-[767px]:px-5 max-[767px]:py-8">
        <div className="col-span-5 max-[991px]:col-span-full">
          <p className="ap-eyebrow">Jewellery edit</p>
          <h2 className="ap-display mt-4 text-[40px] max-[1280px]:text-[34px] max-[767px]:text-[26px]">
            Pre-loved luxury pieces, a second chance to shine
          </h2>
          <p className="mt-4 max-w-[400px] text-[15px] leading-7 text-[#5C5560] max-[767px]:text-sm">
            Rings, necklaces and watches donated and listed by verified sellers. Each one supports
            a charity you can see before you buy.
          </p>
          <Link href="/product?category=jewellery" className="mt-7 inline-block">
            <Button variant="primary" className="h-[50px]! px-7!">
              Shop jewellery <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
        <div className="col-span-7 flex items-end justify-end gap-4 max-[991px]:col-span-full max-[991px]:justify-start max-[767px]:gap-2">
          {pieces.map((src, i) => (
            <div
              key={src}
              className={`relative w-[200px] overflow-hidden rounded-t-full rounded-b-[24px] shadow-[0_24px_50px_rgba(59,5,92,0.16)] max-[1280px]:w-[170px] max-[767px]:w-1/3 ${
                i === 1 ? 'h-[360px] max-[1280px]:h-[300px] max-[767px]:h-[190px]' : 'h-[300px] max-[1280px]:h-[250px] max-[767px]:h-[160px]'
              }`}
            >
              <Image src={src} alt="" fill sizes="200px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default JewelleryProductCtaSec;
