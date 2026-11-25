'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Recycle } from 'lucide-react';
import { Button } from '../elements';

const IntHomeCtaSec = () => (
  <section className="inthome-cta-section bg-white py-6">
    <div className="custom-container">
      <div className="relative grid min-h-[400px] grid-cols-12 overflow-hidden rounded-[32px] bg-[#0B0112] max-[991px]:grid-cols-1 max-[767px]:rounded-[24px]">
        <div className="relative z-10 col-span-5 flex flex-col justify-center p-14 max-[1280px]:p-10 max-[991px]:order-2 max-[991px]:col-span-full max-[767px]:p-6">
          <span className="ap-chip w-fit bg-white/10! text-[#E4D0F0]!">
            <Recycle className="h-3.5 w-3.5" aria-hidden /> Declutter for good
          </span>
          <h2 className="ap-display mt-5 text-[40px] text-white! max-[1280px]:text-[34px] max-[767px]:text-[26px]">
            Out with the old, in with the new
          </h2>
          <p className="mt-4 max-w-[380px] text-[15px] leading-7 text-white/70! max-[767px]:text-sm">
            Turn the things you no longer use into funding for a cause. List in minutes, choose your
            split, and we handle the rest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/product/post-product">
              <Button variant="primary" className="h-[50px]! px-7! bg-white! border-white! text-[#611192]! [-webkit-text-fill-color:#611192]! hover:bg-[#F2E8F8]!">
                Sell an item <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/product">
              <Button variant="secondary" className="h-[50px]! px-7! bg-transparent! border-white/35! text-white! [-webkit-text-fill-color:#fff]! hover:bg-white/10!">
                Shop now
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative col-span-7 min-h-[320px] max-[991px]:order-1 max-[991px]:col-span-full max-[767px]:min-h-[220px]">
          <Image
            src="/images/inthome-cta-modal-img.jpeg"
            alt="Rails of pre-loved clothing"
            fill
            sizes="(max-width: 991px) 100vw, 60vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0112] via-[#0B0112]/20 to-transparent max-[991px]:bg-gradient-to-t" />
        </div>
      </div>
    </div>
  </section>
);

export default IntHomeCtaSec;
