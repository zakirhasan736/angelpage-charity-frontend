import { GA_MEASUREMENT_ID } from '@/lib/siteSeo';

/** Every cookie and storage key, by consent category. Used by the consent dialog and the cookie policy page. */

export type CookieRow = {
  name: string;
  by: string;
  purpose: string;
  lasts: string;
};

const GA_SUFFIX = (GA_MEASUREMENT_ID || 'G-XXXX').replace(/^G-/, '');

export const COOKIE_TABLE: Record<
  'necessary' | 'preferences' | 'analytics' | 'marketing',
  CookieRow[]
> = {
  necessary: [
    {
      name: '__Secure-next-auth.session-token',
      by: 'Angelpage',
      purpose: 'Keeps you signed in',
      lasts: '30 days',
    },
    {
      name: 'next-auth.csrf-token',
      by: 'Angelpage',
      purpose: 'Protects forms from forgery',
      lasts: 'Session',
    },
    {
      name: 'angelpage-locale, angelpage-country, angelpage-market-prefs',
      by: 'Angelpage',
      purpose: 'Language and market',
      lasts: '1 year',
    },
    {
      name: 'angelpage-cookie-consent',
      by: 'Angelpage',
      purpose: 'Remembers this choice (local storage)',
      lasts: 'Until changed',
    },
    {
      name: 'angelpage_guest_cart',
      by: 'Angelpage',
      purpose: 'Basket for guests (local storage)',
      lasts: 'Until cleared',
    },
    {
      name: '__stripe_mid, __stripe_sid',
      by: 'Stripe',
      purpose: 'Fraud prevention at checkout',
      lasts: '1 year / 30 min',
    },
    {
      name: 'cf_clearance',
      by: 'Cloudflare Turnstile',
      purpose: 'Bot check on sign-in and sign-up',
      lasts: 'Up to 1 day',
    },
  ],
  preferences: [
    {
      name: 'ap-reel-likes, ap-categories-v1',
      by: 'Angelpage',
      purpose: 'Reels you liked, faster menus (local storage)',
      lasts: 'Until cleared',
    },
    {
      name: 'Poll votes',
      by: 'Angelpage',
      purpose: 'Remembers community votes you cast (local storage)',
      lasts: 'Until cleared',
    },
  ],
  analytics: [
    {
      name: '_ga',
      by: 'Google Analytics',
      purpose: 'Tells visits apart (pseudonymous ID)',
      lasts: '2 years',
    },
    {
      name: `_ga_${GA_SUFFIX}`,
      by: 'Google Analytics',
      purpose: 'Keeps the session state',
      lasts: '2 years',
    },
  ],
  marketing: [
    {
      name: '_gcl_au, _gcl_aw',
      by: 'Google Ads',
      purpose: 'Measures ad clicks and sign-ups',
      lasts: '90 days',
    },
    {
      name: 'Remarketing tags',
      by: 'Google Tag Manager',
      purpose: 'Shows Angelpage ads on other sites',
      lasts: 'Up to 13 months',
    },
  ],
};
