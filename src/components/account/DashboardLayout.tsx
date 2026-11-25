'use client';

import React, { useEffect, useRef } from 'react';
import {
  BarChart3,
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

  const select = (id: string) => {
    onTabChange(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <div className="custom-container pb-20 pt-6 max-[767px]:pt-4">
      <div className="grid grid-cols-[264px_minmax(0,1fr)] items-start gap-8 max-[1280px]:grid-cols-[232px_minmax(0,1fr)] max-[1280px]:gap-6 max-[991px]:grid-cols-1">
        {/* sidebar (desktop) */}
        <aside className="sticky top-6 max-[991px]:hidden">
          <nav className="ap-card p-3" aria-label={title}>
            <p className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A888C]">
              Menu
            </p>
            {sections.map(section => (
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
                          <span className="truncate">{tab.label}</span>
                          <Badge value={tab.badge} active={active} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {trailing ? (
              <div className="mt-1 border-t border-[#ECE8EE] px-3 pt-3 pb-2 text-sm">{trailing}</div>
            ) : null}
          </nav>
        </aside>

        {/* chip rail (tablet / mobile) */}
        <div className="hidden max-[991px]:block">
          <div
            ref={chipRailRef}
            className="ap-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
            role="tablist"
            aria-label={title}
          >
            {sections.flatMap(s => s.items).map(tab => {
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
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition ${
                    active
                      ? 'bg-[#611192] text-white shadow-[0_6px_16px_rgba(97,17,146,0.24)]'
                      : 'bg-white text-[#474648] ring-1 ring-[#ECE8EE]'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  {tab.label}
                  {tab.badge ? (
                    <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-[#F2E8F8] text-[#611192]'}`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {trailing ? <div className="mt-3 flex justify-end text-sm">{trailing}</div> : null}
        </div>

        {/* main panel */}
        <main className="ap-dash-main min-w-0">
          <div className="mb-6 flex items-center gap-4 max-[767px]:mb-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#611192] max-[767px]:h-10 max-[767px]:w-10">
              <ActiveIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-[#8A888C]">
                {activeSection && activeSection.id !== 'general' ? activeSection.label : 'Overview'}
              </p>
              <h2 className="ap-display truncate text-[28px] max-[767px]:text-[22px]">
                {activeTab?.label || 'Overview'}
              </h2>
              {TAB_DESCRIPTIONS[activeTabId] ? (
                <p className="mt-0.5 text-sm text-[#6B686E] max-[767px]:hidden">
                  {TAB_DESCRIPTIONS[activeTabId]}
                </p>
              ) : null}
            </div>
          </div>
          {notice}
          <div className="ap-card min-h-[420px] p-6 max-[1280px]:p-5 max-[767px]:rounded-[16px] max-[767px]:p-4">
            <ul className="tabs-content-area">{children}</ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
