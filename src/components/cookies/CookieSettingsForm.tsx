'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  COOKIE_CONSENT_EVENT,
  acceptAll,
  hasGlobalPrivacyControl,
  readCookieConsent,
  rejectAll,
  writeCookieConsent,
  type CookieChoices,
} from '@/lib/cookieConsent';
import { CategoryCard } from './CookieConsent';

/** The /cookie-settings page: same categories and cookie list as the dialog. */
export default function CookieSettingsForm() {
  const { t } = useLocale();
  const [draft, setDraft] = useState({
    preferences: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState<CookieChoices | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    setGpc(hasGlobalPrivacyControl());
    const s = readCookieConsent();
    if (s) {
      setSaved(s);
      setDraft({
        preferences: s.preferences,
        analytics: s.analytics,
        marketing: s.marketing,
      });
    }
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<CookieChoices>).detail;
      if (!d) return;
      setSaved(d);
      setDraft({
        preferences: d.preferences,
        analytics: d.analytics,
        marketing: d.marketing,
      });
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  const done = (fn: () => CookieChoices) => {
    fn();
    setJustSaved(true);
  };

  return (
    <form
      className="mx-auto max-w-3xl space-y-3 rounded-[28px] bg-white p-6 ring-1 ring-[#ECE8EE] sm:p-4"
      onSubmit={e => {
        e.preventDefault();
        done(() => writeCookieConsent({ ...draft, method: 'custom' }));
      }}
    >
      <CategoryCard cat="necessary" checked t={t} />
      <CategoryCard
        cat="preferences"
        checked={draft.preferences}
        onChange={v => setDraft(d => ({ ...d, preferences: v }))}
        t={t}
      />
      <CategoryCard
        cat="analytics"
        checked={draft.analytics}
        onChange={v => setDraft(d => ({ ...d, analytics: v }))}
        t={t}
      />
      <CategoryCard
        cat="marketing"
        checked={draft.marketing && !gpc}
        onChange={v => setDraft(d => ({ ...d, marketing: v }))}
        t={t}
      />

      <div className="flex flex-wrap gap-2.5 pt-3">
        <button
          type="submit"
          className="h-11 rounded-full bg-[#611192] px-6 text-[14px] font-semibold text-white transition hover:bg-[#4C0D73]"
        >
          {t('cookies.save')}
        </button>
        <button
          type="button"
          onClick={() => done(acceptAll)}
          className="h-11 rounded-full bg-white px-6 text-[14px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] hover:ring-[#611192]"
        >
          {t('cookies.accept')}
        </button>
        <button
          type="button"
          onClick={() => done(rejectAll)}
          className="h-11 rounded-full bg-white px-6 text-[14px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] hover:ring-[#611192]"
        >
          {t('cookies.reject')}
        </button>
      </div>
      {justSaved ? (
        <p
          role="status"
          className="flex items-center gap-1.5 text-[14px] text-[#1E6B2E]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('cookies.saved')}
        </p>
      ) : saved ? (
        <p className="text-[13px] text-[#8A888C]">
          {t('cookies.lastUpdated')}{' '}
          {new Date(saved.updatedAt).toLocaleString()}
        </p>
      ) : null}
    </form>
  );
}
