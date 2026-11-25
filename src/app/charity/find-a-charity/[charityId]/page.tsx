import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Globe, HandHeart, Phone } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { serverFetchStatus, type CharityRecord } from '@/lib/server-api';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

type CharityProfile = CharityRecord & {
  charityBannerImage?: string;
  phoneNumber?: string;
  websiteLink?: string;
};

/**
 * Directory profile. A charity with a storefront is sent there (one URL per
 * charity for people and search engines); the rest get a server-rendered profile.
 */
export default async function CharityDetailsPage({ params }: { params: Promise<{ charityId: string }> }) {
  const { charityId } = await params;
  const { data, status } = await serverFetchStatus<{ charity?: CharityProfile }>(`/charity/charities/${charityId}`, {
    revalidate: 300,
    tags: [`charity-${charityId}`],
  });
  if (status === 404) notFound();
  const charity = data?.charity;
  if (charity?.storefrontId) permanentRedirect(`/charity/store/${charity.storefrontId}`);

  const name = charity?.charityName || 'Charity';
  const website = charity?.websiteLink && /^https?:\/\//i.test(charity.websiteLink) ? charity.websiteLink : undefined;

  return (
    <div className="bg-[#FAF8FB] pb-16 sm:pb-8">
      <div className="custom-container pt-6 sm:pt-4">
        <Link href="/charity/find-a-charity" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#611192]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All charities
        </Link>

        <section className="mt-4 overflow-hidden rounded-[28px] bg-white ring-1 ring-[#ECE8EE]">
          <div className="relative aspect-[16/5] bg-[#F2E8F8] md:aspect-[16/7]">
            <Image src={charity?.charityBannerImage || '/images/charity/charity5.png'} alt="" fill priority sizes="(max-width: 1280px) 100vw, 1240px" className="object-cover" />
          </div>
          <div className="grid grid-cols-[1fr_340px] gap-10 p-8 md:grid-cols-1 md:gap-6 sm:p-5">
            <div>
              <span className="-mt-20 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-[0_10px_24px_rgba(11,1,18,0.14)] ring-4 ring-white sm:-mt-14 sm:h-18 sm:w-18">
                {charity?.profileImage ? (
                  <Image src={charity.profileImage} alt="" width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-primary text-[36px] text-[#611192]">{name.charAt(0)}</span>
                )}
              </span>
              <h1 className="ap-display mt-4 text-[38px] leading-tight capitalize sm:text-[28px]">{name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#8A888C]">
                <span className="inline-flex items-center gap-1 text-[#00775F]">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> On Angelpage
                </span>
                {charity?.charityNumber ? <span>Registered charity no. {charity.charityNumber}</span> : null}
              </p>
              <div className="ap-prose mt-5 max-w-[680px] text-[15px] leading-relaxed text-[#4A474D]">
                <p>{charity?.description || `${name} is listed on Angelpage. Its storefront is coming soon.`}</p>
              </div>
              {charity?.phoneNumber || website ? (
                <ul className="mt-6 flex flex-wrap gap-3 text-[14px]">
                  {charity?.phoneNumber ? (
                    <li>
                      <a href={`tel:${charity.phoneNumber.replace(/\s+/g, '')}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F4F1F6] px-4 text-[#0B0112]">
                        <Phone className="h-4 w-4 text-[#611192]" aria-hidden /> {charity.phoneNumber}
                      </a>
                    </li>
                  ) : null}
                  {website ? (
                    <li>
                      <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F4F1F6] px-4 text-[#0B0112]">
                        <Globe className="h-4 w-4 text-[#611192]" aria-hidden /> Visit website
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>

            <aside className="self-start rounded-[22px] bg-[#14021F] p-6 text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#D9B8F0]">
                <HandHeart className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-primary text-[22px] leading-snug">Support {name}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                List your pre-loved items on Angelpage and choose this charity. Up to {CHARITY_SHARE_PERCENT}% of each sale can go to its work.
              </p>
              <Link href="/auth/register?intent=sell" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-[#3B055C]">
                Start selling for this charity
              </Link>
              <Link href="/charity/find-a-charity" className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-medium text-white/80 ring-1 ring-white/20 hover:text-white">
                Browse other charities
              </Link>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
