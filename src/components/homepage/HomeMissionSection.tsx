import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Briefcase, HeartHandshake, Leaf, Users } from 'lucide-react';
import { CHARITY_SHARE_PERCENT, PLATFORM_FEE_PERCENT } from '@/constants/brand';

const POINTS = [
  {
    icon: HeartHandshake,
    title: 'You choose the split',
    body: `After a ${PLATFORM_FEE_PERCENT}% platform fee, sellers decide how much goes to their charity, up to ${CHARITY_SHARE_PERCENT}% of the price.`,
  },
  {
    icon: Users,
    title: 'Who we are',
    body: 'A marketplace built for people and businesses who want everyday buying and selling to support the charities they love.',
  },
  {
    icon: Briefcase,
    title: 'For businesses',
    body: 'Brands can sell new products and excess stock to meet their CSR goals while funding a charity they choose.',
  },
  {
    icon: Leaf,
    title: 'Good for the planet',
    body: 'Every pre-loved sale keeps a useful item in circulation and out of landfill.',
  },
];

/**
 * Guest home: one mission section (replaces the old CTA band, About and
 * Info blocks, which repeated the same pitch three times).
 */
export default function HomeMissionSection() {
  return (
    <section className="ap-section">
      <div className="custom-container">
        <div className="grid grid-cols-[1fr_1.05fr] items-center gap-14 md:grid-cols-1 md:gap-8">
          {/* photo mosaic */}
          <div className="grid grid-cols-[1.2fr_1fr] grid-rows-2 gap-3 sm:gap-2">
            <div className="relative row-span-2 min-h-[420px] overflow-hidden rounded-[28px] sm:min-h-[300px] sm:rounded-[22px]">
              <Image src="/images/home/about-sec-modal-img.jpeg" alt="Volunteers sorting donated clothes" fill sizes="(max-width: 991px) 55vw, 30vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[18px]">
              <Image src="/images/home/info-gallery/gallery-img1.jpeg" alt="Pre-loved items ready for a new home" fill sizes="(max-width: 991px) 40vw, 22vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[24px] bg-[#611192] sm:rounded-[18px]">
              <Image src="/images/home/info-gallery/gallery-img2.jpeg" alt="" fill sizes="(max-width: 991px) 40vw, 22vw" className="object-cover opacity-40 mix-blend-luminosity" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-3.5">
                <p className="font-primary text-[40px] leading-none text-white sm:text-[28px]">{CHARITY_SHARE_PERCENT}%</p>
                <p className="mt-1 text-[13px] leading-snug text-white/85 sm:text-[11px]">of a sale can go to the seller&apos;s chosen charity</p>
              </div>
            </div>
          </div>

          {/* copy */}
          <div>
            <p className="ap-eyebrow">Our mission</p>
            <h2 className="ap-display mt-3 text-[40px] leading-[1.12] md:text-[34px] sm:text-[28px]">Turning clutter into charity, and shopping into support</h2>
            <p className="mt-4 max-w-[540px] text-[15px] leading-relaxed text-[#6B686E]">
              We turn clutter into charity and shopping into support. List what you no longer need, or buy something you love, and most of the money reaches a
              verified charity.
            </p>
            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-1">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-2xl bg-[#FAF8FB] p-4 ring-1 ring-[#F0EBF2]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#611192] shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-[#0B0112]">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6B686E]">{body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/register?intent=sell" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#611192] px-6 text-[15px] font-medium text-white transition hover:bg-[#4C0D73]">
                Start selling for free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/how-it-works" className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-[#611192] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192]">
                How it works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
