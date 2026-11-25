'use client';

import React, { useEffect } from 'react';
import { Loader2, Search, X, type LucideIcon } from 'lucide-react';

/** Card that groups one topic inside a dashboard tab. */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = '',
  tone = 'default',
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <section className={`rounded-[22px] bg-white p-6 ring-1 laptop-m:p-5 sm:rounded-[20px] sm:p-4 ${tone === 'danger' ? 'ring-[#F7C9D3]' : 'ring-[#ECE8EE]'} ${className}`}>
      {title || action ? (
        <header className="mb-5 flex items-start justify-between gap-4 sm:mb-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === 'danger' ? 'bg-[#FFF1F4] text-[#B0002A]' : 'bg-[#F2E8F8] text-[#611192]'}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              {title ? <h3 className="text-[16px] font-semibold text-[#0B0112]">{title}</h3> : null}
              {description ? <p className="mt-0.5 text-[13px] leading-snug text-[#6B686E]">{description}</p> : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-[#611192] text-white hover:bg-[#4C0D73] shadow-[0_8px_18px_rgba(97,17,146,0.22)]',
  dark: 'bg-[#0B0112] text-white hover:bg-[#2A1A35]',
  secondary: 'bg-white text-[#0B0112] ring-1 ring-[#E2DCE6] hover:ring-[#611192]',
  ghost: 'text-[#611192] hover:bg-[#F6EEFA]',
  danger: 'bg-[#C0143C] text-white hover:bg-[#9F1239]',
};

export function Btn({
  variant = 'primary',
  size = 'md',
  loading,
  icon: Icon,
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; loading?: boolean; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium whitespace-nowrap transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
        size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-11 px-5 text-[14px]'
      } ${BTN[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Read-only label/value rows (switches to a form when editing). */
export function InfoList({ items }: { items: { label: string; value?: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-1 sm:gap-y-3">
      {items.map(it => (
        <div key={it.label} className="min-w-0 rounded-2xl bg-[#FAF8FB] px-4 py-3">
          <dt className="text-[11.5px] font-medium tracking-wide text-[#8A888C] uppercase">{it.label}</dt>
          <dd className="mt-0.5 truncate text-[14.5px] text-[#0B0112]">{it.value || <span className="text-[#ABA7AE]">Not set</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:items-end sm:p-0" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-[#0B0112]/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div className="ap-sheet relative w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(11,1,18,0.25)] sm:max-w-none sm:rounded-b-none sm:pb-[calc(24px+env(safe-area-inset-bottom))]">
        <p className="font-primary text-[22px] text-[#0B0112]">{title}</p>
        {body ? <div className="mt-2 text-[14px] leading-relaxed text-[#6B686E]">{body}</div> : null}
        <div className="mt-6 flex justify-end gap-2 sm:flex-col-reverse">
          <Btn variant="secondary" onClick={onClose} className="sm:w-full">
            Cancel
          </Btn>
          <Btn variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm} className="sm:w-full">
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_50%_0%,rgba(97,17,146,0.08),transparent_60%)] bg-[#FAF8FB] px-6 py-14 text-center ring-1 ring-[#F0EBF2] sm:py-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-[#611192] shadow-[0_8px_20px_rgba(59,5,92,0.1)]">
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-4 font-primary text-[21px] text-[#0B0112]">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-[380px] text-[14px] leading-relaxed text-[#6B686E]">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Search + filter chips row above a list. */
export function Toolbar({
  search,
  onSearch,
  placeholder = 'Search',
  filters,
  value,
  onFilter,
  trailing,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  filters?: { id: string; label: string; count?: number }[];
  value?: string;
  onFilter?: (id: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-4">
      {onSearch ? (
        <label className="relative min-w-[220px] flex-1 sm:min-w-full">
          <span className="sr-only">{placeholder}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl bg-[#F6F3F7] pr-9 text-[14px] outline-none placeholder:text-[#8A888C] focus:bg-white focus:ring-2 focus:ring-[#611192]/30"
            style={{ paddingLeft: 38 }}
          />
          {search ? (
            <button type="button" onClick={() => onSearch('')} className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#8A888C] hover:bg-white" aria-label="Clear search">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
      ) : null}
      {filters?.length ? (
        <div className="ap-no-scrollbar flex gap-1.5 overflow-x-auto sm:-mx-4 sm:w-[calc(100%+32px)] sm:px-4" role="tablist">
          {filters.map(f => {
            const active = f.id === value;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilter?.(f.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition ${active ? 'bg-[#0B0112] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#ECE6EF]'}`}
              >
                {f.label}
                {f.count != null ? <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-white/20' : 'bg-white text-[#611192]'}`}>{f.count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {trailing ? <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:w-full">{trailing}</div> : null}
    </div>
  );
}

const PILL: Record<string, string> = {
  green: 'bg-[#E7F8F1] text-[#00754F]',
  amber: 'bg-[#FFF4DE] text-[#8A5A00]',
  red: 'bg-[#FFF1F4] text-[#B0002A]',
  blue: 'bg-[#EAF2FD] text-[#1D5FB8]',
  purple: 'bg-[#F2E8F8] text-[#611192]',
  grey: 'bg-[#F1EFF2] text-[#5E5B61]',
};

const STATUS_TONE: Record<string, keyof typeof PILL> = {
  orderplaced: 'amber',
  pending: 'amber',
  processing: 'amber',
  orderconfirmed: 'blue',
  confirmed: 'blue',
  shipped: 'purple',
  intransit: 'purple',
  delivered: 'green',
  completed: 'green',
  paid: 'green',
  live: 'green',
  active: 'green',
  approved: 'green',
  cancelled: 'red',
  canceled: 'red',
  failed: 'red',
  rejected: 'red',
  refunded: 'grey',
  draft: 'grey',
  sold: 'blue',
  archived: 'grey',
};

export const humanizeStatus = (s?: string) => (s ? s.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown');

export function StatusPill({ status, tone }: { status?: string; tone?: keyof typeof PILL }) {
  const key = (status || '').replace(/[\s_-]+/g, '').toLowerCase();
  const t = tone || STATUS_TONE[key] || 'grey';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap ${PILL[t]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {humanizeStatus(status)}
    </span>
  );
}

export function RowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-[#F0EBF2]">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-[#F1ECF4]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#F1ECF4]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[#F1ECF4]" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#F1ECF4]" />
        </div>
      ))}
    </div>
  );
}

const COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3 sm:grid-cols-3', 4: 'grid-cols-4 md:grid-cols-2' };

/** Small summary tiles at the top of a tab. */
export function MiniStats({ items }: { items: { label: string; value: React.ReactNode; icon?: LucideIcon; hint?: string }[] }) {
  return (
    <div className={`mb-5 grid gap-3 sm:mb-4 sm:gap-2.5 ${COLS[Math.min(items.length, 4)] || COLS[4]}`}>
      {items.map(({ label, value, icon: Icon, hint }) => (
        <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-[#ECE8EE] sm:p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-[#8A888C]">{label}</span>
            {Icon ? <Icon className="h-4 w-4 text-[#611192]" strokeWidth={1.85} aria-hidden /> : null}
          </div>
          <p className="mt-1.5 text-[22px] leading-none font-semibold text-[#0B0112] tabular-nums sm:text-[20px]">{value}</p>
          {hint ? <p className="mt-1 text-[11.5px] text-[#8A888C]">{hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
