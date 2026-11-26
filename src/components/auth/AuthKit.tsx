'use client';

import React, { useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HandHeart,
  Loader2,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

/* ------------------------------------------------------------------ shell */

type AsidePoint = { icon: LucideIcon; text: string };

const DEFAULT_POINTS: AsidePoint[] = [
  {
    icon: HandHeart,
    text: `Up to ${CHARITY_SHARE_PERCENT}% of every sale can go to a charity you choose`,
  },
  {
    icon: ShieldCheck,
    text: 'Verified charities in the USA, Canada and the UK',
  },
  { icon: Truck, text: 'Payment is held until the order arrives' },
];

interface AuthShellProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Small step / context label above the title. */
  eyebrow?: string;
  /** Left panel heading (desktop) — short brand message. */
  asideTitle?: string;
  asidePoints?: AsidePoint[];
  /** Back link shown above the form on every screen size. */
  back?: { href: string; label: string };
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Wider form column (register / onboarding). */
  wide?: boolean;
}

/**
 * Split layout for every sign-in screen. Desktop: brand panel left, form right.
 * Phones: a compact brand header and the form in a sheet that rises over it,
 * so it reads like a native app screen.
 */
export function AuthShell({
  title,
  subtitle,
  eyebrow,
  asideTitle = 'Shop pre-loved. Fund the causes you care about.',
  asidePoints = DEFAULT_POINTS,
  back,
  children,
  footer,
  wide,
}: AuthShellProps) {
  return (
    <div className="ap-auth bg-[#FAF8FB]">
      <div className="custom-container grid min-h-[calc(100vh-120px)] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 py-8 laptop-m:gap-8 md:min-h-0 md:grid-cols-1 md:gap-0 md:px-0! md:py-0">
        {/* brand panel */}
        <aside className="relative isolate flex flex-col justify-between overflow-hidden rounded-[32px] bg-[#14021F] p-10 text-white laptop-m:p-8 md:rounded-none md:rounded-b-[32px] md:px-8 md:pt-8 md:pb-16 sm:px-5 sm:pt-6 sm:pb-14">
          <Image
            src="/images/auth/hero.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 991px) 100vw, 50vw"
            className="-z-20 object-cover opacity-45"
          />
          <span
            className="absolute inset-0 -z-10 bg-gradient-to-br from-[#3B055C]/95 via-[#14021F]/80 to-[#0B0112]/95"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -right-24 -bottom-24 -z-10 h-80 w-80 rounded-full bg-[#611192] opacity-60 blur-[90px]"
            aria-hidden
          />
          <Link
            href="/"
            className="inline-flex w-fit md:hidden"
            aria-label="Angelpage home"
          >
            <Image
              src="/images/auth/logo.svg"
              alt="Angelpage"
              width={184}
              height={50}
              className="h-auto w-[184px] md:w-[132px]"
            />
          </Link>
          <div className="mt-16 max-w-[440px] md:hidden">
            <p className="ap-display text-[40px] leading-[1.1] text-white! laptop-m:text-[34px]">
              {asideTitle}
            </p>
            <ul className="mt-8 space-y-4">
              {asidePoints.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-[15px] leading-snug text-white/80"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#D9B8F0] ring-1 ring-white/10">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="pt-1.5">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-[12px] text-white/50 md:hidden">
            © {new Date().getFullYear()} Angelpage · Marketplace for good
          </p>
          {/* phone/tablet: title lives in the header */}
          <div className="hidden md:block">
            {eyebrow ? (
              <p className="text-[12px] font-medium tracking-[0.14em] text-[#D9B8F0] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <p
              aria-hidden="true"
              className="ap-display mt-1.5 text-[30px] leading-tight text-white! sm:text-[27px]"
            >
              {title}
            </p>
          </div>
        </aside>

        {/* form */}
        <section className="flex items-center justify-center md:relative md:z-10 md:-mt-8 md:block">
          <div
            className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[440px]'} md:mx-auto md:max-w-none md:rounded-t-[28px] md:bg-white md:px-8 md:pt-7 md:pb-10 md:shadow-[0_-12px_40px_rgba(11,1,18,0.08)] sm:px-5 sm:pt-6 sm:pb-[calc(32px+env(safe-area-inset-bottom))]`}
          >
            <div
              className={`md:mx-auto ${wide ? 'md:max-w-[520px]' : 'md:max-w-[440px]'}`}
            >
              {back ? (
                <Link
                  href={back.href}
                  className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#611192] md:mb-4"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden /> {back.label}
                </Link>
              ) : null}
              {eyebrow ? (
                <p className="ap-eyebrow md:hidden">{eyebrow}</p>
              ) : null}
              <h1 className="ap-display mt-2 text-[36px] leading-tight laptop-m:text-[32px] md:sr-only">
                {title}
              </h1>
              {subtitle ? (
                <div className="mt-2 text-[14.5px] leading-relaxed text-[#6B686E] md:mt-0">
                  {subtitle}
                </div>
              ) : null}
              <div className="mt-7 md:mt-6">{children}</div>
              {footer ? (
                <div className="mt-8 border-t border-[#F0EBF2] pt-6 text-center text-[14px] text-[#6B686E]">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

interface AuthFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label: string;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  error?: string;
  /** Right-aligned element in the label row (e.g. "Forgot password?"). */
  labelAction?: React.ReactNode;
}

export function AuthField({
  label,
  icon: Icon,
  hint,
  error,
  labelAction,
  type = 'text',
  className = '',
  id,
  ...rest
}: AuthFieldProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error
    ? `${inputId}-err`
    : hint
      ? `${inputId}-hint`
      : undefined;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-[#2A2730]"
        >
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-[#9C98A0]"
            aria-hidden
          />
        ) : null}
        <input
          id={inputId}
          type={isPassword && show ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-[52px] w-full rounded-2xl bg-white text-[15px] text-[#0B0112] ring-1 outline-none transition placeholder:text-[#ABA7AE] focus:ring-2 ${
            error
              ? 'ring-[#D9264A] focus:ring-[#D9264A]'
              : 'ring-[#E2DCE6] hover:ring-[#CFC6D5] focus:ring-[#611192]'
          } ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-12' : 'pr-4'}`}
          style={{ paddingLeft: Icon ? 44 : 16 }}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8A888C] hover:bg-[#F4F1F6] hover:text-[#0B0112]"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${inputId}-err`}
          className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#C0143C]"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p
          id={`${inputId}-hint`}
          className="mt-1.5 text-[12.5px] text-[#8A888C]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthTextarea({
  label,
  hint,
  id,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-[13px] font-medium text-[#2A2730]"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        className="w-full rounded-2xl bg-white px-4 py-3 text-[15px] text-[#0B0112] ring-1 ring-[#E2DCE6] outline-none transition placeholder:text-[#ABA7AE] hover:ring-[#CFC6D5] focus:ring-2 focus:ring-[#611192]"
        {...rest}
      />
      {hint ? (
        <p className="mt-1.5 text-[12.5px] text-[#8A888C]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ controls */

export function AuthSubmit({
  loading,
  children,
  loadingText,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || rest.disabled}
      className={`inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#611192] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(97,17,146,0.28)] transition hover:bg-[#4C0D73] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
      ) : null}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

export function AuthGhostButton({
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[14.5px] font-medium text-[#0B0112] ring-1 ring-[#E2DCE6] transition hover:ring-[#611192] disabled:opacity-60 ${className}`}
      {...rest}
    />
  );
}

type RoleOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

export function RoleSwitch<T extends string>({
  value,
  onChange,
  options,
  label = 'Account type',
}: {
  value: T;
  onChange: (v: T) => void;
  options: RoleOption<T>[];
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-2xl bg-[#F1ECF4] p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map(({ value: v, label: l, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[14px] font-medium transition ${
              active
                ? 'bg-white text-[#611192] shadow-[0_4px_14px_rgba(59,5,92,0.12)]'
                : 'text-[#6B686E] hover:text-[#0B0112]'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function AuthAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const styles = {
    error: 'bg-[#FFF1F4] text-[#9F1239] ring-[#FBD0DA]',
    success: 'bg-[#ECFDF5] text-[#065F46] ring-[#BBF0D9]',
    info: 'bg-[#F6EEFA] text-[#3B055C] ring-[#E6D4F2]',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13.5px] leading-snug ring-1 ${styles}`}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function AuthDivider({
  children = 'or',
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="my-6 flex items-center gap-3 text-[12.5px] text-[#8A888C]">
      <span className="h-px flex-1 bg-[#ECE8EE]" />
      {children}
      <span className="h-px flex-1 bg-[#ECE8EE]" />
    </div>
  );
}

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"
    />
  </svg>
);
const FacebookMark = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
    <path
      fill="#1877F2"
      d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
    />
  </svg>
);

export function OAuthButtons({
  onSelect,
  verb = 'Continue',
}: {
  onSelect: (p: 'google' | 'facebook') => void;
  verb?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
      <AuthGhostButton onClick={() => onSelect('google')}>
        <GoogleMark /> {verb} with Google
      </AuthGhostButton>
      <AuthGhostButton onClick={() => onSelect('facebook')}>
        <FacebookMark /> {verb} with Facebook
      </AuthGhostButton>
    </div>
  );
}

/* ------------------------------------------------------------------ password strength */

const RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  {
    test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p),
    label: 'Upper & lower case',
  },
  { test: (p: string) => /\d/.test(p), label: 'A number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'A symbol' },
];

export const passwordScore = (p: string) => RULES.filter(r => r.test(p)).length;

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const tone =
    score <= 1
      ? 'bg-[#D9264A]'
      : score === 2
        ? 'bg-[#E59A1A]'
        : score === 3
          ? 'bg-[#7C3AED]'
          : 'bg-[#00875F]';
  const word = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-1.5">
        {RULES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${i < score ? tone : 'bg-[#ECE8EE]'}`}
          />
        ))}
        <span className="ml-2 w-[62px] text-right text-[12px] font-medium text-[#6B686E]">
          {word}
        </span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map(r => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={`flex items-center gap-1.5 text-[12px] ${ok ? 'text-[#00775F]' : 'text-[#8A888C]'}`}
            >
              <Check
                className={`h-3.5 w-3.5 ${ok ? '' : 'opacity-30'}`}
                aria-hidden
              />{' '}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ one-time code */

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, length));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      className="flex justify-between gap-2.5 sm:gap-2"
      role="group"
      aria-label="Verification code"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onPaste={handlePaste}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
              setAt(i - 1, '');
            }
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < length - 1)
              refs.current[i + 1]?.focus();
          }}
          className={`aspect-square h-auto w-full max-w-[60px] min-w-0 rounded-2xl bg-white text-center font-primary text-[26px] text-[#0B0112] ring-1 outline-none transition focus:ring-2 sm:text-[22px] ${
            invalid
              ? 'ring-[#D9264A]'
              : d
                ? 'ring-[#611192]/60 focus:ring-[#611192]'
                : 'ring-[#E2DCE6] focus:ring-[#611192]'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ status */

export function AuthStatus({
  icon: Icon,
  tone = 'brand',
  title,
  children,
}: {
  icon: LucideIcon;
  tone?: 'brand' | 'success';
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] ${tone === 'success' ? 'bg-[#E7F8F1] text-[#00875F]' : 'bg-[#F2E8F8] text-[#611192]'}`}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-5 font-primary text-[24px] text-[#0B0112]">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-[360px] text-[14.5px] leading-relaxed text-[#6B686E]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
