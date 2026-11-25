'use client';
import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Gift,
  HandHeart,
  Heart,
  Megaphone,
  Play,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/elements';
import SectionHeading from '@/components/common/product-slider/SectionHeading';
import { calculateProfitSplit } from '@/lib/profitSplit';
import { formatMoney } from '@/lib/money';

const sellerSteps = [
  { icon: UserPlus, title: 'Create an account', body: 'Sign up in a minute with the details we need to keep every transaction secure and transparent.' },
  { icon: Camera, title: 'List your items', body: 'Add photos, a description, condition and size. Pick the charity you want to support.' },
  { icon: SlidersHorizontal, title: 'Choose your split', body: 'Give 100% to the cause, or keep a share for yourself. You decide on every listing.' },
  { icon: Megaphone, title: 'Get discovered', body: 'Your items appear in buyers’ feeds and on your chosen charity’s storefront.' },
];

const buyerSteps = [
  { icon: Search, title: 'Explore the marketplace', body: 'Search or browse categories like Women, Men, Children and Homeware.' },
  { icon: SlidersHorizontal, title: 'Filter and discover', body: 'Narrow by price, condition, size and more to find exactly what you want.' },
  { icon: ShoppingBag, title: 'Buy or make an offer', body: 'Pay the listed price or make an offer. Sellers can accept, decline or counter.' },
  { icon: HandHeart, title: 'See your impact', body: 'Every product shows how much of your purchase reaches the charity.' },
];

const features = [
  { icon: Heart, title: 'Charity-centric', body: 'Built only for charitable sales, so a meaningful share of every sale funds a cause.', wide: true },
  { icon: Recycle, title: 'Circular economy', body: 'Pre-loved goods get a second life, reducing waste and overconsumption.' },
  { icon: Store, title: 'Small charities first', body: 'Visibility and funding for small and micro charities that are easy to overlook.' },
  { icon: Megaphone, title: 'Ethical advertising', body: 'We partner only with advertisers whose values match our mission.' },
  { icon: Gift, title: 'Free listings', body: 'No hidden fees to list. Share your items and start making an impact today.' },
];

// Validated categorical palette (fee | seller | charity), see dataviz checks.
const SPLIT = { fee: '#C2771A', seller: '#00977A', charity: '#8A3FC7' };

const SplitDemo = () => {
  const [price, setPrice] = useState(60);
  const [share, setShare] = useState(0);
  const split = calculateProfitSplit(price, share);
  const parts = [
    { key: 'fee', label: `Platform fee (${split.platformFeePercent}%)`, value: split.platformFee, color: SPLIT.fee },
    { key: 'seller', label: `You keep (${share}%)`, value: split.sellerProfit, color: SPLIT.seller },
    { key: 'charity', label: 'To charity', value: split.charityProfit, color: SPLIT.charity },
  ];

  return (
    <div className="rounded-[28px] bg-white p-8 ring-1 ring-[#ECE8EE] max-[767px]:rounded-[22px] max-[767px]:p-5">
      <div className="grid grid-cols-2 gap-6 max-[767px]:grid-cols-1">
        <label className="block">
          <span className="flex items-center justify-between text-[13px] text-[#6B686E]">
            Sale price <strong className="text-[15px] text-[#0B0112]">{formatMoney(price)}</strong>
          </span>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="ap-range mt-3 w-full"
            aria-label="Sale price"
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-[13px] text-[#6B686E]">
            Your share <strong className="text-[15px] text-[#0B0112]">{share}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={share}
            onChange={e => setShare(Number(e.target.value))}
            className="ap-range mt-3 w-full"
            aria-label="Seller share percent"
          />
        </label>
      </div>

      <div className="mt-8 flex h-12 w-full gap-[2px] overflow-hidden rounded-2xl" role="img" aria-label={parts.map(p => `${p.label} ${formatMoney(p.value)}`).join(', ')}>
        {parts.map(p =>
          p.value > 0 ? (
            <span
              key={p.key}
              className="flex h-full items-center justify-center overflow-hidden text-[12px] font-semibold whitespace-nowrap text-white transition-all duration-500"
              style={{ width: `${(p.value / Math.max(price, 0.01)) * 100}%`, background: p.color }}
            >
              {p.value / price > 0.14 ? formatMoney(p.value) : ''}
            </span>
          ) : null,
        )}
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-3 max-[767px]:grid-cols-1">
        {parts.map(p => (
          <li key={p.key} className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF8FB] px-4 py-3">
            <span className="flex items-center gap-2 text-[13px] text-[#474648]">
              <span className="h-3 w-3 rounded-[4px]" style={{ background: p.color }} aria-hidden />
              {p.label}
            </span>
            <span className="text-[15px] font-semibold tabular-nums text-[#0B0112]">{formatMoney(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const HowItWorksPage = () => {
  const { status } = useSession() || {};
  const [type, setType] = useState<'Seller' | 'Buyer'>('Seller');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const steps = type === 'Seller' ? sellerSteps : buyerSteps;
  const sellHref = status === 'authenticated' ? '/product/post-product' : '/auth/register?intent=sell';

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="how-it-works-main-wrapper bg-white">
      {/* hero */}
      <section className="pt-6 max-[767px]:pt-3">
        <div className="custom-container">
          <div className="relative grid grid-cols-12 items-center gap-10 overflow-hidden rounded-[32px] bg-[#FCF2FF] p-14 max-[1170px]:p-10 max-[991px]:grid-cols-1 max-[767px]:gap-8 max-[767px]:rounded-[24px] max-[767px]:p-6">
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#E4D0F0] blur-3xl" aria-hidden />
            <div className="relative col-span-6 max-[991px]:col-span-full">
              <p className="ap-eyebrow">How it works</p>
              <h1 className="ap-display mt-5 text-[56px] max-[1170px]:text-[46px] max-[767px]:text-[34px]">
                Sell what you don’t need. Fund what you believe in.
              </h1>
              <p className="mt-5 max-w-[480px] text-[16px] leading-7 text-[#5C5560] max-[767px]:text-[15px]">
                Angelpage is a marketplace where every sale supports a verified charity. You choose the charity and how
                much of the sale it receives.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={sellHref}>
                  <Button variant="primary" className="h-[50px]! px-7!">
                    Start selling for free <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/product">
                  <Button variant="secondary" className="h-[50px]! px-7!">
                    Browse items
                  </Button>
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-[#474648]">
                {['Verified charities', 'You choose the split', 'USA · Canada · UK'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[#611192]" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative col-span-6 grid h-[440px] grid-cols-2 gap-4 max-[991px]:col-span-full max-[767px]:h-[300px] max-[767px]:gap-3">
              <div className="relative overflow-hidden rounded-[28px] max-[767px]:rounded-[20px]">
                <Image src="/images/home/how-it-works-modal-img1.jpeg" alt="Boxes of donated items" fill sizes="300px" className="object-cover" />
              </div>
              <div className="grid grid-rows-2 gap-4 max-[767px]:gap-3">
                <div className="relative overflow-hidden rounded-[28px] max-[767px]:rounded-[20px]">
                  <Image src="/images/home/how-it-works-modal-img2.jpeg" alt="Parcel being handed over" fill sizes="300px" className="object-cover" />
                </div>
                <div className="flex flex-col justify-between rounded-[28px] bg-[#0B0112] p-6 text-white max-[767px]:rounded-[20px] max-[767px]:p-4">
                  <Sparkles className="h-6 w-6 text-[#D9B8EE]" aria-hidden />
                  <div>
                    <p className="font-primary text-[34px] leading-none text-white! max-[767px]:text-[24px]">1,200+</p>
                    <p className="mt-1 text-[13px] text-white/70!">partner charities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* steps */}
      <section className="ap-section">
        <div className="custom-container">
          <SectionHeading
            eyebrow="Step by step"
            title={type === 'Seller' ? 'Selling on Angelpage' : 'Buying on Angelpage'}
            description="Simple for sellers and buyers alike."
            actions={
              <div className="inline-flex rounded-full bg-[#F4F1F6] p-1" role="tablist" aria-label="Show steps for">
                {(['Seller', 'Buyer'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={type === t}
                    onClick={() => setType(t)}
                    className={`h-10 rounded-full px-6 text-[14px] font-medium transition ${
                      type === t ? 'bg-white text-[#611192] shadow-[0_2px_10px_rgba(59,5,92,0.12)]' : 'text-[#6B686E]'
                    }`}
                  >
                    I’m a {t.toLowerCase()}
                  </button>
                ))}
              </div>
            }
          />
          <ol className="relative mt-12 grid grid-cols-4 gap-5 max-[991px]:grid-cols-2 max-[767px]:mt-8 max-[767px]:grid-cols-1 max-[767px]:gap-3">
            <span className="pointer-events-none absolute top-[38px] right-[12%] left-[12%] h-px bg-[repeating-linear-gradient(90deg,#DCD5E0_0_6px,transparent_6px_12px)] max-[991px]:hidden" aria-hidden />
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="ap-card--hover relative rounded-[24px] bg-white p-6 ring-1 ring-[#ECE8EE] max-[767px]:flex max-[767px]:gap-4 max-[767px]:p-5"
              >
                <div className="relative flex items-center gap-3">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#611192] text-white shadow-[0_10px_24px_rgba(97,17,146,0.25)]">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="font-primary text-[28px] text-[#DCD5E0] max-[767px]:hidden">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="mt-6 text-[17px] font-semibold text-[#0B0112] max-[767px]:mt-0">
                    <span className="mr-1 hidden text-[#8A888C] max-[767px]:inline">{i + 1}.</span>
                    {title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#6B686E]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* split */}
      <section className="ap-section bg-[#FAF8FB]">
        <div className="custom-container grid grid-cols-12 items-center gap-10 max-[991px]:grid-cols-1 max-[767px]:gap-6">
          <div className="col-span-5 max-[991px]:col-span-full">
            <p className="ap-eyebrow">You choose the split</p>
            <h2 className="ap-display mt-4 text-[40px] max-[767px]:text-[28px]">See exactly where the money goes</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#5C5560]">
              A small platform fee keeps Angelpage running. The rest is shared between you and the charity, in whatever
              proportion you choose. Try it.
            </p>
          </div>
          <div className="col-span-7 max-[991px]:col-span-full">
            <SplitDemo />
          </div>
        </div>
      </section>

      {/* video */}
      <section className="ap-section">
        <div className="custom-container">
          <SectionHeading eyebrow="About Angelpage" title="Watch the story in under two minutes" align="center" className="mb-10" />
          <div className="relative mx-auto aspect-video max-w-[1000px] overflow-hidden rounded-[32px] bg-[#0B0112] shadow-[0_40px_80px_rgba(59,5,92,0.2)] max-[767px]:rounded-[20px]">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src="/images/video/angelpage-new.mp4"
              poster="/images/video/overlyn-image.png"
              playsInline
              onEnded={() => setPlaying(false)}
              onClick={togglePlay}
            />
            {!playing && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-[#0B0112]/30 transition hover:bg-[#0B0112]/20"
                aria-label="Play video"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#611192] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-[767px]:h-16 max-[767px]:w-16">
                  <Play className="ml-1 h-8 w-8 fill-current" aria-hidden />
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* different */}
      <section className="ap-section bg-[#FAF8FB]">
        <div className="custom-container">
          <SectionHeading eyebrow="Why Angelpage" title="What makes us different" className="mb-10 max-[767px]:mb-6" />
          <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[767px]:grid-cols-1 max-[767px]:gap-3">
            {features.map(({ icon: Icon, title, body, wide }, i) => (
              <div
                key={title}
                className={`ap-card--hover rounded-[24px] p-7 max-[767px]:p-5 ${
                  i === 0 ? 'bg-[#0B0112] text-white' : 'bg-white ring-1 ring-[#ECE8EE]'
                } ${wide ? 'col-span-2 max-[991px]:col-span-1' : ''}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    i === 0 ? 'bg-white/10 text-[#D9B8EE]' : 'bg-[#F2E8F8] text-[#611192]'
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className={`mt-8 font-primary text-[24px] leading-tight max-[767px]:mt-5 max-[767px]:text-[20px] ${i === 0 ? 'text-white!' : 'text-[#0B0112]'}`}>
                  {title}
                </h3>
                <p className={`mt-2 max-w-[460px] text-[14px] leading-6 ${i === 0 ? 'text-white/70!' : 'text-[#6B686E]'}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* mission */}
      <section className="ap-section">
        <div className="custom-container grid grid-cols-2 gap-6 max-[991px]:grid-cols-1">
          <div className="rounded-[28px] bg-[#FCF2FF] p-10 max-[767px]:rounded-[22px] max-[767px]:p-6">
            <p className="ap-eyebrow">Our mission</p>
            <p className="mt-6 font-primary text-[30px] leading-[1.35] text-[#0B0112] max-[767px]:text-[22px]">
              A dedicated marketplace for pre-loved goods, where most of every sale goes to the charities people care
              about.
            </p>
          </div>
          <div className="rounded-[28px] bg-white p-10 ring-1 ring-[#ECE8EE] max-[767px]:rounded-[22px] max-[767px]:p-6">
            <h3 className="text-[18px] font-semibold text-[#0B0112]">Who we help, and how</h3>
            <ul className="mt-5 space-y-5">
              {[
                { icon: Store, t: 'Brands', b: 'Sell new products or excess stock to support a favourite charity and meet CSR commitments without relying only on cash donations.' },
                { icon: Users, t: 'Charity shops', b: 'High-street charity shops can sell their stock online, supporting local communities and the circular economy.' },
                { icon: ShieldCheck, t: 'Everyone', b: 'Transparent, secure transactions and clear impact on every listing.' },
              ].map(({ icon: Icon, t, b }) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-[#0B0112]">{t}</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#6B686E]">{b}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* community + CTA */}
      <section className="pb-20 max-[767px]:pb-10">
        <div className="custom-container">
          <div className="relative overflow-hidden rounded-[32px] bg-[#0B0112] p-14 max-[1170px]:p-10 max-[767px]:rounded-[24px] max-[767px]:p-6">
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#611192]/50 blur-[100px]" aria-hidden />
            <div className="relative grid grid-cols-12 items-center gap-10 max-[991px]:grid-cols-1 max-[767px]:gap-6">
              <div className="col-span-6 max-[991px]:col-span-full">
                <p className="ap-eyebrow text-[#D9B8EE]!">Community</p>
                <h2 className="ap-display mt-4 text-[42px] text-white! max-[767px]:text-[28px]">More than a marketplace</h2>
                <p className="mt-4 max-w-[440px] text-[15px] leading-7 text-white/70!">
                  Follow the sellers and charities you support, save what you love, and help keep the shop accountable.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={status === 'authenticated' ? '/product' : '/auth/register'}>
                    <Button variant="primary" className="h-[50px]! px-7! bg-white! border-white! text-[#611192]! [-webkit-text-fill-color:#611192]!">
                      Join the community <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                </div>
              </div>
              <ul className="col-span-6 grid gap-3 max-[991px]:col-span-full">
                {[
                  { icon: Users, t: 'Profiles', b: 'Follow the sellers and charity shops you support.' },
                  { icon: Heart, t: 'Favourites', b: 'Save listings so they are easy to find again.' },
                  { icon: Star, t: 'Reviews', b: 'Buyers and sellers rate each other and keep the shop accountable.' },
                ].map(({ icon: Icon, t, b }) => (
                  <li key={t} className="flex items-center gap-4 rounded-2xl bg-white/8 p-5 ring-1 ring-white/10 max-[767px]:p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#611192]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-white!">{t}</p>
                      <p className="text-[13px] text-white/65!">{b}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
