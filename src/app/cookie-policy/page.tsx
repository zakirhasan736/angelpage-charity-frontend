import type { Metadata } from 'next';
import Link from 'next/link';
import { COOKIE_TABLE } from '@/lib/cookieTable';
import { GA_MEASUREMENT_ID, GTM_ID, pageMetadata } from '@/lib/siteSeo';

const CATEGORY_ORDER = [
  'necessary',
  'preferences',
  'analytics',
  'marketing',
] as const;
const CATEGORY_LABEL = {
  necessary: 'Strictly necessary',
  preferences: 'Preferences',
  analytics: 'Analytics',
  marketing: 'Marketing',
};

export const metadata: Metadata = pageMetadata({
  title: 'Cookie policy',
  description:
    'How Angelpage uses necessary, analytics, and marketing cookies, and how to change your choice.',
  path: '/cookie-policy',
  keywords: ['Angelpage cookies', 'cookie policy', 'Google Analytics'],
});

export const revalidate = 86_400;

export default function CookiePolicyPage() {
  return (
    <div className="term-page-main-wrapper">
      <div className="custom-container">
        <div className="term-page-main-content">
          <div className="terms-page-banner pt-20 pb-[72px] sm:py-14">
            <h1 className="font-primary text-center text-[40px] font-normal text-[#0B0112] sm:text-[32px]">
              Cookie policy
            </h1>
            <p className="font-secondary mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-[#3B055C]">
              Angelpage uses cookies to run the charity marketplace.
              Preferences, analytics and marketing cookies stay off until you
              allow them.
            </p>
          </div>
          <div className="terms-page-content-area pb-[66px]">
            <section className="term-info-item">
              <h2 className="font-primary text-[28px] text-[#0B0112]">
                What a cookie is
              </h2>
              <p className="font-secondary mt-3 text-base leading-7 text-[#3B055C]">
                A cookie is a small file stored in your browser. Angelpage also
                uses similar storage, such as local storage, for the same kinds
                of choices. This policy covers the website at angelpage.shop.
              </p>
            </section>

            <section className="term-info-item mt-10">
              <h2 className="font-primary text-[28px] text-[#0B0112]">
                The cookies we use
              </h2>
              <div className="mt-4 overflow-x-auto rounded-3xl border border-[#E4D0F0]">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead className="bg-[#FCF2FF]">
                    <tr>
                      {['Name', 'Category', 'Set by', 'Purpose', 'Lasts'].map(
                        h => (
                          <th
                            key={h}
                            className="font-secondary px-4 py-3 text-sm text-[#0B0112]"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="font-secondary text-sm text-[#3B055C]">
                    {CATEGORY_ORDER.flatMap(cat =>
                      COOKIE_TABLE[cat].map(r => (
                        <tr
                          key={`${cat}-${r.name}`}
                          className="border-t border-[#F2E8F8]"
                        >
                          <td className="px-4 py-3 font-mono text-[13px] text-[#0B0112]">
                            {r.name}
                          </td>
                          <td className="px-4 py-3">{CATEGORY_LABEL[cat]}</td>
                          <td className="px-4 py-3">{r.by}</td>
                          <td className="px-4 py-3">{r.purpose}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.lasts}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="font-secondary mt-4 text-sm leading-6 text-[#3B055C]">
                Google tags (Tag Manager container {GTM_ID}, Analytics{' '}
                {GA_MEASUREMENT_ID}) use Google Consent Mode v2: until you allow
                analytics or marketing they run without cookies and send no
                identifiers.
              </p>
            </section>

            <section className="term-info-item mt-10">
              <h2 className="font-primary text-[28px] text-[#0B0112]">
                Your choice
              </h2>
              <p className="font-secondary mt-3 text-base leading-7 text-[#3B055C]">
                Strictly necessary cookies are always on because the shop cannot
                run without them. Preferences, analytics and marketing start off
                until you choose. Accept all and Reject all are given equal
                weight on the banner, and Manage choices lets you pick each
                kind. Reopen your choices any time from the cookie button at the
                bottom left of every page, or on the cookie settings page.
              </p>
              <p className="font-secondary mt-3 text-base leading-7 text-[#3B055C]">
                If your browser sends a Global Privacy Control signal, we treat
                it as a refusal of marketing cookies and keep them off.
              </p>
              <h3 className="font-primary mt-8 text-[22px] text-[#0B0112]">
                Partner links (eBay, Amazon)
              </h3>
              <p className="font-secondary mt-3 text-base leading-7 text-[#3B055C]">
                Some items open on a partner site. When you tap one, Angelpage
                counts the click on its own server without a cookie, then sends
                you to the partner. The partner may set its own cookies on its
                site to credit the referral; those follow the partner&apos;s
                cookie policy. Partner links work whether or not you allow
                marketing cookies.
              </p>
              <p className="font-secondary mt-4 flex flex-wrap gap-4 text-base">
                <Link
                  href="/cookie-settings"
                  className="text-[#611192] underline"
                >
                  Cookie settings
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-[#611192] underline"
                >
                  Privacy policy
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
