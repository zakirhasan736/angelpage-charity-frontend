'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3,
  ChevronDown,
  Lock,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  COOKIE_CONSENT_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  acceptAll,
  hasGlobalPrivacyControl,
  readCookieConsent,
  rejectAll,
  writeCookieConsent,
  type CookieChoices,
} from '@/lib/cookieConsent';

import { COOKIE_TABLE } from '@/lib/cookieTable';

type Cat = 'preferences' | 'analytics' | 'marketing';
type Draft = Record<Cat, boolean>;

const CATEGORIES: { key: 'necessary' | Cat; icon: typeof Lock }[] = [
  { key: 'necessary', icon: Lock },
  { key: 'preferences', icon: SlidersHorizontal },
  { key: 'analytics', icon: BarChart3 },
  { key: 'marketing', icon: Megaphone },
];

/* ---------- pieces ---------- */

function CookieGlyph({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a1 1 0 0 1 .95.68 2.4 2.4 0 0 0 3.2 1.55 1 1 0 0 1 1.28.4 2.4 2.4 0 0 0 2.94 1.05 1 1 0 0 1 1.22.95A10 10 0 1 1 12 2Z"
      />
      <circle cx="8.6" cy="11" r="1.25" fill="#fff" />
      <circle cx="12.8" cy="15.4" r="1.25" fill="#fff" />
      <circle cx="15.4" cy="10.4" r="0.95" fill="#fff" />
      <circle cx="8.8" cy="16" r="0.8" fill="#fff" />
    </svg>
  );
}

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#611192]/40 focus-visible:ring-offset-2 focus-visible:outline-none ${
        checked ? 'bg-[#611192]' : 'bg-[#DCD5E0]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

export function CategoryCard({
  cat,
  checked,
  onChange,
  t,
}: {
  cat: 'necessary' | Cat;
  checked: boolean;
  onChange?: (v: boolean) => void;
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORIES.find(c => c.key === cat)!;
  const Icon = meta.icon;
  const locked = cat === 'necessary';
  const gpcLocked = cat === 'marketing' && hasGlobalPrivacyControl();
  const rows = COOKIE_TABLE[cat];
  return (
    <div
      className={`rounded-2xl ring-1 transition ${checked ? 'bg-[#FBF7FD] ring-[#E4D0F0]' : 'bg-white ring-[#ECE8EE]'}`}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-[#611192] text-white' : 'bg-[#F4F1F6] text-[#6B686E]'}`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-[#0B0112]">
              {t(`cookies.${cat}`)}
            </p>
            {locked ? (
              <span className="rounded-full bg-[#E5F4E4] px-2 py-0.5 text-[11px] font-semibold text-[#1E6B2E]">
                {t('cookies.alwaysOn')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B686E]">
            {t(`cookies.${cat}Body`)}
          </p>
          {gpcLocked ? (
            <p className="mt-1.5 text-[12px] font-medium text-[#8A4B00]">
              {t('cookies.gpc')}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#611192] hover:underline"
          >
            {t('cookies.used')}{' '}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </div>
        <Switch
          checked={checked}
          disabled={locked || gpcLocked}
          label={t(`cookies.${cat}`)}
          onChange={onChange}
        />
      </div>
      {open ? (
        <ul className="mx-4 mb-4 divide-y divide-[#EFEAF2] overflow-hidden rounded-xl bg-white ring-1 ring-[#EFEAF2]">
          {rows.map(r => (
            <li
              key={r.name}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 px-3 py-2.5 text-[12px]"
            >
              <span
                className="truncate font-mono text-[11.5px] text-[#0B0112]"
                title={r.name}
              >
                {r.name}
              </span>
              <span className="text-right text-[#8A888C]">{r.lasts}</span>
              <span className="col-span-2 text-[#6B686E]">
                {r.by} · {r.purpose}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------- main ---------- */

/**
 * Cookie consent: a bottom-right card on first visit, a floating cookie button
 * bottom-left afterwards, and a centred settings dialog. Choices drive Google
 * Consent Mode v2 (see lib/cookieConsent.ts).
 *
 * hideLauncher: no floating button (full-screen pages like /reels); the banner
 * still appears until a choice is made.
 */
export default function CookieConsent({
  hideLauncher = false,
}: { hideLauncher?: boolean } = {}) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState<CookieChoices | null>(null);
  const [bannerIn, setBannerIn] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    preferences: true,
    analytics: false,
    marketing: false,
  });
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gpc = mounted && hasGlobalPrivacyControl();

  useEffect(() => {
    setMounted(true);
    const s = readCookieConsent();
    setSaved(s);
    if (s)
      setDraft({
        preferences: s.preferences,
        analytics: s.analytics,
        marketing: s.marketing,
      });
    else requestAnimationFrame(() => setBannerIn(true));

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
    const onOpen = () => setDialog(true);
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    };
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // dialog: lock scroll, focus, Esc, focus trap
  useEffect(() => {
    if (!dialog) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const f = node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [dialog, closeDialog]);

  const finish = (fn: () => CookieChoices) => {
    fn();
    setBannerIn(false);
    setDialog(false);
  };

  if (!mounted) return null;
  const showBanner = !saved && !dialog;

  return (
    <>
      {/* floating launcher, bottom-left, once a choice exists */}
      {saved && !hideLauncher ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setDialog(true)}
          aria-label={t('cookies.open')}
          aria-haspopup="dialog"
          className="group fixed bottom-6 left-6 z-[10030] flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#611192] shadow-[0_8px_24px_rgba(59,5,92,0.18)] ring-1 ring-[#ECE8EE] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(59,5,92,0.24)] focus-visible:ring-2 focus-visible:ring-[#611192] focus-visible:outline-none sm:bottom-[calc(84px+env(safe-area-inset-bottom))] sm:left-3 sm:h-11 sm:w-11"
        >
          <CookieGlyph className="h-6 w-6" />
          <span className="pointer-events-none absolute left-[calc(100%+10px)] rounded-lg bg-[#0B0112] px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100 sm:hidden">
            {t('cookies.open')}
          </span>
        </button>
      ) : null}

      {/* first-visit banner, bottom-right */}
      {showBanner ? (
        <section
          role="region"
          aria-label={t('cookies.title')}
          className={`fixed right-6 bottom-6 z-[10040] w-[420px] max-w-[calc(100vw-48px)] transition-all duration-500 ease-out sm:right-3 sm:bottom-[calc(104px+env(safe-area-inset-bottom))] sm:left-3 sm:w-auto sm:max-w-none ${
            bannerIn ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_24px_64px_rgba(11,1,18,0.18)] ring-1 ring-[#ECE8EE] sm:p-5">
            <span
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#F2E8F8] blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#611192] to-[#3B055C] text-white shadow-[0_8px_18px_rgba(97,17,146,0.3)]">
                <CookieGlyph className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-primary text-[21px] leading-tight text-[#0B0112]">
                  {t('cookies.title')}
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#474648]">
                  {t('cookies.body')}{' '}
                  <Link
                    href="/cookie-policy"
                    className="font-medium text-[#611192] underline underline-offset-2"
                  >
                    {t('cookies.policy')}
                  </Link>
                </p>
                {gpc ? (
                  <p className="mt-2 flex items-start gap-1.5 text-[12px] text-[#6B686E]">
                    <ShieldCheck
                      className="mt-px h-3.5 w-3.5 shrink-0 text-[#1E6B2E]"
                      aria-hidden
                    />{' '}
                    {t('cookies.gpc')}
                  </p>
                ) : null}
              </div>
            </div>
            {/* equal weight for accept and reject */}
            <div className="relative mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => finish(rejectAll)}
                className="h-11 rounded-full bg-white text-[14px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] transition hover:ring-[#611192] focus-visible:ring-2 focus-visible:ring-[#611192] focus-visible:outline-none"
              >
                {t('cookies.reject')}
              </button>
              <button
                type="button"
                onClick={() => finish(acceptAll)}
                className="h-11 rounded-full bg-[#611192] text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73] focus-visible:ring-2 focus-visible:ring-[#611192]/40 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {t('cookies.accept')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDialog(true)}
              className="relative mt-2.5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-semibold text-[#611192] transition hover:bg-[#F6EEFA]"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />{' '}
              {t('cookies.customize')}
            </button>
          </div>
        </section>
      ) : null}

      {/* settings dialog, centred */}
      {dialog
        ? createPortal(
            <div className="fixed inset-0 z-[10065] flex items-center justify-center p-4 sm:items-end sm:p-0">
              <div
                aria-hidden
                onClick={closeDialog}
                className="absolute inset-0 bg-[#0B0112]/55 backdrop-blur-[3px]"
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cookie-dialog-title"
                aria-describedby="cookie-dialog-body"
                className="relative flex max-h-[min(760px,92vh)] w-full max-w-[580px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_40px_100px_rgba(11,1,18,0.35)] sm:max-h-[92vh] sm:rounded-b-none"
              >
                <header className="flex items-start gap-3.5 border-b border-[#F0EBF2] px-6 pt-6 pb-5 sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#611192] to-[#3B055C] text-white">
                    <CookieGlyph className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="cookie-dialog-title"
                      className="font-primary text-[24px] leading-tight text-[#0B0112] sm:text-[21px]"
                    >
                      {t('cookies.dialogTitle')}
                    </h2>
                    <p
                      id="cookie-dialog-body"
                      className="mt-1 text-[13.5px] leading-relaxed text-[#6B686E]"
                    >
                      {t('cookies.dialogBody')}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-autofocus
                    onClick={closeDialog}
                    aria-label={t('cookies.close')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B686E] transition hover:bg-[#F4F1F6] focus-visible:ring-2 focus-visible:ring-[#611192] focus-visible:outline-none"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 sm:px-5">
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
                  <p className="pt-1 text-[12px] text-[#8A888C]">
                    {saved
                      ? `${t('cookies.lastUpdated')} ${new Date(saved.updatedAt).toLocaleDateString()} · `
                      : ''}
                    <Link
                      href="/cookie-policy"
                      className="text-[#611192] underline underline-offset-2"
                      onClick={closeDialog}
                    >
                      {t('cookies.policy')}
                    </Link>
                  </p>
                </div>

                <footer className="grid grid-cols-[1fr_1fr_1.3fr] gap-2.5 border-t border-[#F0EBF2] bg-[#FCFAFD] px-6 py-4 sm:grid-cols-2 sm:px-5 sm:pb-[calc(16px+env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={() => finish(rejectAll)}
                    className="h-11 rounded-full bg-white text-[13.5px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] transition hover:ring-[#611192]"
                  >
                    {t('cookies.reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => finish(acceptAll)}
                    className="h-11 rounded-full bg-white text-[13.5px] font-semibold text-[#0B0112] ring-1 ring-[#D9D2DD] transition hover:ring-[#611192]"
                  >
                    {t('cookies.accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      finish(() =>
                        writeCookieConsent({ ...draft, method: 'custom' })
                      )
                    }
                    className="h-11 rounded-full bg-[#611192] text-[13.5px] font-semibold text-white shadow-[0_8px_18px_rgba(97,17,146,0.25)] transition hover:bg-[#4C0D73] sm:col-span-2"
                  >
                    {t('cookies.save')}
                  </button>
                </footer>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
