/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  acceptAll,
  readCookieConsent,
  rejectAll,
  writeCookieConsent,
} from '@/lib/cookieConsent';

const consentCalls = () =>
  (window.dataLayer || [])
    .map(e => Array.from(e as unknown as ArrayLike<unknown>))
    .filter(a => a[0] === 'consent' && a[1] === 'update')
    .map(a => a[2] as Record<string, string>);

describe('cookie consent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    delete window.gtag;
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: undefined,
      configurable: true,
    });
  });

  it('starts with no saved choice', () => {
    expect(readCookieConsent()).toBeNull();
  });

  it('saves each category separately from necessary cookies', () => {
    writeCookieConsent({
      preferences: false,
      analytics: true,
      marketing: false,
    });
    expect(readCookieConsent()).toMatchObject({
      necessary: true,
      preferences: false,
      analytics: true,
      marketing: false,
      version: COOKIE_CONSENT_VERSION,
    });
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toContain(
      '"analytics":true'
    );
  });

  it('updates Google Consent Mode v2 and tells GTM', () => {
    acceptAll();
    expect(consentCalls().at(-1)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      personalization_storage: 'granted',
    });
    rejectAll();
    expect(consentCalls().at(-1)).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
    });
    const evt = (window.dataLayer || []).filter(
      e => (e as Record<string, unknown>).event === 'cookie_consent_update'
    );
    expect(evt.at(-1)).toMatchObject({
      consent_analytics: false,
      consent_marketing: false,
    });
  });

  it('keeps marketing off when the browser sends Global Privacy Control', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    });
    acceptAll();
    expect(readCookieConsent()?.marketing).toBe(false);
    expect(consentCalls().at(-1)?.ad_storage).toBe('denied');
  });

  it('reads an older save without a version and keeps preferences on', () => {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: true,
        updatedAt: '2026-01-01',
      })
    );
    expect(readCookieConsent()).toMatchObject({
      version: 1,
      preferences: true,
      marketing: true,
    });
  });
});
