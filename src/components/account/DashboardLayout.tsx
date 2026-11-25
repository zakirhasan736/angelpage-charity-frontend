'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  Search,
  X,
  Banknote,
  Bell,
  CalendarDays,
  ClipboardCheck,
  Download,
  Images,
  Landmark,
  LayoutGrid,
  Link2,
  Megaphone,
  MessageSquare,
  Newspaper,
  Package,
  Receipt,
  RefreshCw,
  ScrollText,
  Send,
  Settings2,
  Share2,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { AccountTab, AccountTabGroup } from './AccountTabNav';

const TAB_ICONS: Record<string, LucideIcon> = {
  analytics: BarChart3,
  account: UserCog,
  listings: Package,
  affiliate: Link2,
  gallery: Images,
  social: Share2,
  sold: Receipt,
  bought: ShoppingBag,
  messages: MessageSquare,
  notifications: Bell,
  earnings: Wallet,
  payouts: Banknote,
  community: Users,
  team: UsersRound,
  'product-sync': RefreshCw,
  review: ClipboardCheck,
  'product-reviews': Star,
  promoted: Megaphone,
  'charity-import': Upload,
  'affiliate-import': Download,
  'social-posting': Send,
  blog: Newspaper,
  events: CalendarDays,
  operations: Settings2,
  finance: Landmark,
  audit: ScrollText,
  delete: Trash2,
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  analytics: 'Sales, revenue and engagement at a glance.',
  account: 'Profile, address and payment details.',
  listings: 'Create, edit and manage the items you sell.',
  affiliate: 'Track affiliate links and imported products.',
  gallery: 'Photos and media shared with the community.',
  social: 'Schedule and review your social posts.',
  sold: 'Orders you have sold and their fulfilment status.',
  bought: 'Everything you have bought, with tracking.',
  messages: 'Conversations with buyers, sellers and charities.',
  notifications: 'Updates about orders, listings and your account.',
  earnings: 'What you have earned and what has gone to charity.',
  payouts: 'Stripe payouts and transfer history.',
  community: 'Posts, appeals and updates for your supporters.',
  team: 'Invite and manage team members and permissions.',
  'product-sync': 'Connect and sync products from your shop.',
  review: 'Approve or reject listings waiting for review.',
  'product-reviews': 'Moderate buyer reviews across the marketplace.',
  promoted: 'Choose which listings appear in promoted slots.',
  'charity-import': 'Bulk import charities from a spreadsheet.',
  'affiliate-import': 'Import affiliate and eBay products.',
  'social-posting': 'Platform-wide social publishing.',
  blog: 'Write and publish journal articles.',
  events: 'Create appeals, polls and live sessions.',
  operations: 'Platform settings and operational controls.',
  finance: 'Revenue, fees, refunds and failed payments.',
  audit: 'A record of administrative actions.',
  delete: 'Permanently close this account.',
};

const SETTINGS_IDS = ['account', 'delete'];

/** Friendlier names in the nav (panel ids stay the same). */
const LABEL_OVERRIDES: Record<string, string> = {
  analytics: 'Overview',
  account: 'Account settings',
  review: 'Review queue',
  'product-reviews': 'Buyer reviews',
  'charity-import': 'Charity import',
  'affiliate-import': 'Affiliate import',
  'social-posting': 'Social posting',
  social: 'Social posts',
  community: 'Blog & events',
  'product-sync': 'Product sync',
  audit: 'Audit log',
};
const labelOf = (tab?: AccountTab) => (tab ? LABEL_OVERRIDES[tab.id] || tab.label : 'Overview');
const JUMP_THRESHOLD = 10;

interface DashboardLayoutProps {
  tabs: AccountTab[];
  groups?: AccountTabGroup[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  /** Rendered at the bottom of the sidebar (e.g. logout). */
  trailing?: React.ReactNode;
  /** Small label above the nav, e.g. "Seller dashboard". */
  title?: string;
  /** Optional block shown above the active panel (role notices etc.). */
  notice?: React.ReactNode;
  children: React.ReactNode;
}

type Section = { id: string; label: string; items: AccountTab[] };

const Badge = ({ value, active }: { value?: number; active: boolean }) =>
  value != null && value > 0 ? (
    <span
      className={`ml-auto min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold ${
        active ? 'bg-white/20 text-white' : 'bg-[#F2E8F8] text-[#611192]'
      }`}
    >
      {value > 99 ? '99+' : value}
    </span>
  ) : null;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  tabs,
  groups = [],
  activeTabId,
  onTabChange,
  trailing,
  title = 'Dashboard',
  notice,
  children,
}) => {
  const chipRailRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [jump, setJump] = useState('');
  const byId = (id: string) => tabs.find(t => t.id === id);
  const grouped = new Set(groups.flatMap(g => g.tabIds));

  const general = tabs.filter(t => !grouped.has(t.id) && !SETTINGS_IDS.includes(t.id));
  const settings = tabs.filter(t => !grouped.has(t.id) && SETTINGS_IDS.includes(t.id));

  const sections: Section[] = [
    { id: 'general', label: 'Overview', items: general },
    ...groups.map(g => ({
      id: g.id,
      label: g.label,
      items: g.tabIds.map(byId).filter((t): t is AccountTab => Boolean(t)),
    })),
    { id: 'settings', label: 'Settings', items: settings },
  ].filter(s => s.items.length > 0);

  const showJump = tabs.length > JUMP_THRESHOLD;
  const jq = jump.trim().toLowerCase();
  const visibleSections = jq
    ? sections
        .map(sec => ({ ...sec, items: sec.items.filter(t => `${labelOf(t)} ${sec.label} ${TAB_DESCRIPTIONS[t.id] || ''}`.toLowerCase().includes(jq)) }))
        .filter(sec => sec.items.length > 0)
    : sections;

  const activeTab = byId(activeTabId);
  const activeSection = sections.find(s => s.items.some(i => i.id === activeTabId));
  const ActiveIcon = TAB_ICONS[activeTabId] || LayoutGrid;

  // keep the active chip in view on small screens
  useEffect(() => {
    const rail = chipRailRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-tab="${activeTabId}"]`);
    if (rail && el) {
      rail.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [activeTabId]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const select = (id: string) => {
    onTabChange(id);
    setSheetOpen(false);
    setJump('');
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 991px)').matches) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <div className="custom-container pb-20 pt-6 max-[991px]:pt-2 max-[767px]:pb-6">
      <div className="grid grid-cols-[264px_minmax(0,1fr)] items-start gap-8 max-[1280px]:grid-cols-[232px_minmax(0,1fr)] max-[1280px]:gap-6 max-[991px]:grid-cols-1 max-[991px]:gap-4">
        {/* sidebar (desktop) */}
        <aside className="sticky top-6 max-[991px]:hidden">
          <nav className="ap-card p-3" aria-label={title}>
            <p className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">
              Menu
            </p>
            {showJump ? (
              <label className="relative mx-1 mb-2 block">
                <span className="sr-only">Jump to a section</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
                <input
                  type="search"
                  value={jump}
                  onChange={e => setJump(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && visibleSections[0]?.items[0]) select(visibleSections[0].items[0].id);
                  }}
                  placeholder="Jump to…"
                  className="h-10 w-full rounded-xl bg-[#F6F3F7] pr-3 pl-9 text-[14px] outline-none placeholder:text-[#8A888C] focus:bg-white focus:ring-2 focus:ring-[#611192]/30"
                />
              </label>
            ) : null}
            {visibleSections.map(section => (
              <div key={section.id} className="border-t border-[#ECE8EE] py-2 first-of-type:border-t-0 first-of-type:pt-0">
                {section.id !== 'general' && (
                  <p className="px-3 pt-2 pb-1.5 text-[11px] font-medium text-[#8A888C]">
                    {section.label}
                  </p>
                )}
                <ul className="flex flex-col gap-0.5">
                  {section.items.map(tab => {
                    const Icon = TAB_ICONS[tab.id] || LayoutGrid;
                    const active = tab.id === activeTabId;
                    const danger = tab.id === 'delete';
                    return (
                      <li key={tab.id}>
                        <button
                          type="button"
                          onClick={() => select(tab.id)}
                          aria-current={active ? 'page' : undefined}
                          className={`ap-dash-nav-item ${active ? 'is-active' : ''} ${
                            danger && !active ? 'text-[#B0002A]! hover:bg-[#FFF1F4]!' : ''
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 ${
                              active ? '' : danger ? 'text-[#B0002A]' : 'text-[#8A888C]'
                            }`}
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span className="truncate">{labelOf(tab)}</span>
                          <Badge value={tab.badge} active={active} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {jq && visibleSections.length === 0 ? <p className="px-3 py-3 text-[13px] text-[#8A888C]">No section matches “{jump}”.</p> : null}
            {trailing ? (
              <div className="mt-1 border-t border-[#ECE8EE] px-3 pt-3 pb-2 text-sm">{trailing}</div>
            ) : null}
          </nav>
        </aside>

        {/* app bar + quick chips (tablet / mobile) */}
        <div className="sticky top-0 z-40 -mx-4 hidden bg-white/90 px-4 pt-2 pb-3 backdrop-blur-xl max-[991px]:block">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left ring-1 ring-[#ECE8EE] shadow-[0_6px_18px_rgba(59,5,92,0.06)]"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#611192] text-white">
              <ActiveIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-[#8A888C]">
                {activeSection && activeSection.id !== 'general' ? activeSection.label : title}
              </span>
              <span className="block truncate text-[15px] font-semibold text-[#0B0112]">
                {labelOf(activeTab)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1F6] px-3 py-1.5 text-[12px] font-medium text-[#474648]">
              Menu <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
          <div
            ref={chipRailRef}
            className="ap-no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4"
            role="tablist"
            aria-label={title}
          >
            {sections.flatMap(sec => sec.items).map(tab => {
              const Icon = TAB_ICONS[tab.id] || LayoutGrid;
              const active = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  data-tab={tab.id}
                  aria-selected={active}
                  onClick={() => select(tab.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition ${
                    active
                      ? 'bg-[#0B0112] text-white'
                      : 'bg-[#F4F1F6] text-[#474648]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {labelOf(tab)}
                  {tab.badge ? (
                    <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white text-[#611192]'}`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* bottom sheet with every section */}
        {sheetOpen && (
          <div className="fixed inset-0 z-[1000] hidden max-[991px]:block" role="dialog" aria-modal="true" aria-label={`${title} menu`}>
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-[#0B0112]/40 backdrop-blur-[2px]"
              onClick={() => setSheetOpen(false)}
            />
            <div className="ap-sheet absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] bg-white pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(11,1,18,0.2)]">
              <div className="sticky top-0 z-10 bg-white px-5 pt-3 pb-3">
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#DCD5E0]" aria-hidden />
                <div className="flex items-center justify-between">
                  <p className="font-primary text-[22px] text-[#0B0112]">{title}</p>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1F6]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="px-5">
                {showJump ? (
              <label className="relative mb-4 block">
                <span className="sr-only">Jump to a section</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A888C]" aria-hidden />
                <input
                  type="search"
                  value={jump}
                  onChange={e => setJump(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && visibleSections[0]?.items[0]) select(visibleSections[0].items[0].id);
                  }}
                  placeholder="Jump to…"
                  className="h-10 w-full rounded-xl bg-[#F6F3F7] pr-3 pl-9 text-[14px] outline-none placeholder:text-[#8A888C] focus:bg-white focus:ring-2 focus:ring-[#611192]/30"
                />
              </label>
            ) : null}
            {visibleSections.map(section => (
                  <div key={section.id} className="mb-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A888C]">
                      {section.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-[374px]:grid-cols-2">
                      {section.items.map(tab => {
                        const Icon = TAB_ICONS[tab.id] || LayoutGrid;
                        const active = tab.id === activeTabId;
                        const danger = tab.id === 'delete';
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => select(tab.id)}
                            className={`relative flex flex-col items-start gap-3 rounded-2xl p-3 text-left text-[12.5px] font-medium transition ${
                              active
                                ? 'bg-[#611192] text-white'
                                : danger
                                  ? 'bg-[#FFF1F4] text-[#B0002A]'
                                  : 'bg-[#FAF8FB] text-[#0B0112] ring-1 ring-[#ECE8EE]'
                            }`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                            <span className="leading-tight">{labelOf(tab)}</span>
                            {tab.badge ? (
                              <span className={`absolute top-2.5 right-2.5 rounded-full px-1.5 text-[10px] font-semibold ${active ? 'bg-white/20' : 'bg-[#611192] text-white'}`}>
                                {tab.badge}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {trailing ? <div className="mt-2 border-t border-[#ECE8EE] pt-4">{trailing}</div> : null}
              </div>
            </div>
          </div>
        )}

        {/* main panel */}
        <main className="ap-dash-main min-w-0">
          <div className="mb-6 flex items-center gap-4 max-[991px]:hidden">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192] max-[767px]:h-10 max-[767px]:w-10">
              <ActiveIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-[#8A888C]">
                {activeSection && activeSection.id !== 'general' ? activeSection.label : 'Overview'}
              </p>
              <h2 className="ap-display truncate text-[28px] max-[767px]:text-[22px]">
                {labelOf(activeTab)}
              </h2>
              {TAB_DESCRIPTIONS[activeTabId] ? (
                <p className="mt-0.5 text-sm text-[#6B686E] max-[767px]:hidden">
                  {TAB_DESCRIPTIONS[activeTabId]}
                </p>
              ) : null}
            </div>
          </div>
          {notice}
          <div className="ap-card ap-dash-card min-h-[420px] p-6 max-[1280px]:p-5 max-[767px]:min-h-0 max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:bg-transparent max-[767px]:p-0 max-[767px]:shadow-none">
            <ul className="tabs-content-area">{children}</ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
