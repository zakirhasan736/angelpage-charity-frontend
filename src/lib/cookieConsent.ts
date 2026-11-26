/**
 * Cookie consent, wired to Google Consent Mode v2.
 *
 * Categories:
 *   necessary   always on (sign-in, basket, checkout, language, market, this choice)
 *   preferences remembers settings such as recently viewed (functionality/personalization storage)
 *   analytics   Google Analytics 4 (analytics_storage)
 *   marketing   ads measurement and remarketing (ad_storage, ad_user_data, ad_personalization)
 *
 * The default ("denied" until a choice) is set before any Google tag loads, in
 * components/seo/GoogleTags.tsx. That inline script reads the same storage key,
 * so a returning visitor's choice applies on the very first hit.
 */
export const COOKIE_CONSENT_KEY = 'angelpage-cookie-consent';
export const COOKIE_CONSENT_EVENT = 'angelpage-cookie-consent';
/** Bump when the categories or cookie list change materially: everyone is asked again. */
export const COOKIE_CONSENT_VERSION = 2;

export type CookieCategory = 'preferences' | 'analytics' | 'marketing';

export type CookieChoices = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: number;
  /** how the choice was made, kept for the consent record */
  method?: 'accept_all' | 'reject_all' | 'custom';
};

export type ConsentUpdate = {
  preferences?: boolean;
  analytics: boolean;
  marketing: boolean;
  method?: CookieChoices['method'];
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

/** Browser-level opt-out (GPC). Treated as a refusal of marketing. */
export function hasGlobalPrivacyControl() {
  return (
    typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true
  );
}

export function readCookieConsent(): CookieChoices | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieChoices>;
    if (typeof parsed.analytics !== 'boolean') return null;
    // v1 saves (no version) had no preferences category; keep them, it was implied on
    const version = typeof parsed.version === 'number' ? parsed.version : 1;
    if (version < 1 || version > COOKIE_CONSENT_VERSION) return null;
    return {
      necessary: true,
      preferences:
        typeof parsed.preferences === 'boolean' ? parsed.preferences : true,
      analytics: parsed.analytics,
      marketing: Boolean(parsed.marketing) && !hasGlobalPrivacyControl(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      version,
      method: parsed.method,
    };
  } catch {
    return null;
  }
}

const state = (on: boolean) => (on ? 'granted' : 'denied');

export function applyGoogleConsent(choices: ConsentUpdate) {
  if (typeof window === 'undefined') return;
  const prefs = choices.preferences !== false;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
    };
  }
  window.gtag('consent', 'update', {
    analytics_storage: state(choices.analytics),
    ad_storage: state(choices.marketing),
    ad_user_data: state(choices.marketing),
    ad_personalization: state(choices.marketing),
    functionality_storage: 'granted',
    personalization_storage: state(prefs),
    security_storage: 'granted',
  });
  window.gtag('set', 'ads_data_redaction', !choices.marketing);
  // A plain dataLayer event so GTM triggers can fire (or hold) tags on the choice.
  window.dataLayer.push({
    event: 'cookie_consent_update',
    consent_preferences: prefs,
    consent_analytics: choices.analytics,
    consent_marketing: choices.marketing,
  });
}

export function writeCookieConsent(choices: ConsentUpdate) {
  const marketing = choices.marketing && !hasGlobalPrivacyControl();
  const value: CookieChoices = {
    necessary: true,
    preferences: choices.preferences !== false,
    analytics: choices.analytics,
    marketing,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
    method: choices.method || 'custom',
  };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* storage blocked: the choice still applies for this page view */
  }
  applyGoogleConsent(value);
  if (!value.analytics) clearCookies(/^_ga/);
  if (!value.marketing) clearCookies(/^(_gcl|_fbp|_fbc|_ttp|_uet)/);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value })
  );
  return value;
}

export const acceptAll = () =>
  writeCookieConsent({
    preferences: true,
    analytics: true,
    marketing: true,
    method: 'accept_all',
  });
export const rejectAll = () =>
  writeCookieConsent({
    preferences: false,
    analytics: false,
    marketing: false,
    method: 'reject_all',
  });

/** Remove first-party cookies left by tags the visitor has now refused. */
function clearCookies(pattern: RegExp) {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = ['', host];
  for (let i = 1; i < parts.length - 1; i += 1)
    domains.push(`.${parts.slice(i).join('.')}`);
  document.cookie.split(';').forEach(c => {
    const name = c.split('=')[0]?.trim();
    if (!name || !pattern.test(name)) return;
    domains.forEach(d => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
}

/** Open the consent settings dialog from anywhere (footer link, settings page). */
export const OPEN_COOKIE_SETTINGS_EVENT = 'angelpage-open-cookie-settings';
export function openCookieSettings() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
