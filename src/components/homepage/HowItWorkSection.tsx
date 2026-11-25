'use client';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from '../common/product-slider/SectionHeading';

const cards = [
  {
    step: '01',
    eyebrow: 'For sellers',
    title: 'Where sellers are donors',
    body: 'Upload your pre-loved items straight to your chosen charity storefront, ready for others to buy. You decide how much of the sale goes to the cause.',
    image: '/images/home/how-it-works-modal-img1.jpeg',
    href: '/how-it-works',
    cta: 'How selling works',
  },
  {
    step: '02',
    eyebrow: 'For buyers',
    title: '…and buyers are givers',
    body: 'Angelpage partners with over 1,200 charities. Shop pre-loved, see exactly what reaches the cause, and only cover the shipping.',
    image: '/images/home/how-it-works-modal-img2.jpeg',
    href: '/product',
    cta: 'Start shopping',
  },
];

const HowItWorkSection = () => (
  <section className="how-it-works-section ap-section bg-white">
    <div className="custom-container">
      <SectionHeading
        eyebrow="How it works"
        title="A marketplace where every sale gives"
        description="Two simple sides, one shared outcome: more money for the causes people care about."
        className="mb-10 max-[767px]:mb-6"
      />
      <div className="grid grid-cols-2 gap-6 max-[991px]:grid-cols-1">
        {cards.map(card => (
          <Link
            key={card.step}
            href={card.href}
            className="group grid grid-cols-[1fr_1.1fr] overflow-hidden rounded-[28px] bg-[#0B0112] transition duration-300 hover:shadow-[0_28px_60px_rgba(59,5,92,0.22)] max-[767px]:grid-cols-1 max-[767px]:rounded-[22px]"
          >
            <div className="relative min-h-[380px] max-[767px]:min-h-[200px]">
              <Image
                className="object-cover transition duration-700 group-hover:scale-105"
                src={card.image}
                alt=""
                fill
                sizes="(max-width: 991px) 50vw, 300px"
              />
            </div>
            <div className="flex flex-col p-8 max-[1280px]:p-6">
              <div className="flex items-center justify-between">
                <span className="font-primary text-[40px] leading-none text-white/20!">{card.step}</span>
                <span className="ap-arrow ap-arrow--dark h-10! w-10! transition group-hover:bg-white! group-hover:text-[#611192]!">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="ap-eyebrow mt-auto pt-10 text-[#D9B8EE]!">{card.eyebrow}</p>
              <h3 className="mt-3 font-primary text-[28px] leading-tight text-white! max-[767px]:text-[22px]">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/70!">{card.body}</p>
              <span className="mt-6 text-sm font-medium text-white! underline decoration-white/30 underline-offset-4 group-hover:decoration-white">
                {card.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorkSection;
