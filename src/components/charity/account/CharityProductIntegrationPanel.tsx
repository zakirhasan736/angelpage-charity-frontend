'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Globe, KeyRound, Lock, PlugZap, RefreshCw, ScanSearch, Upload } from 'lucide-react';
import { AuthField } from '@/components/auth/AuthKit';
import { Btn, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

type IntegrationState = {
  productSource: string;
  storeUrl: string;
  shopifyDomain: string;
  autoSync: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string;
  lastImportedCount: number;
  lastUpdatedCount: number;
  totalSyncedProducts: number;
};

type Detection = {
  platform: string;
  storeUrl: string;
  message: string;
  canUsePublicApi: boolean;
  canScrape: boolean;
  requiredFields: string[];
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual listing only',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  wordpress: 'WordPress',
  scrape: 'Website scrape',
  api_key: 'API key',
};

const CharityProductIntegrationPanel = () => {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [integration, setIntegration] = useState<IntegrationState | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [productSource, setProductSource] = useState('manual');
  const [detection, setDetection] = useState<Detection | null>(null);

  const authHeaders = session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : undefined;

  const loadIntegration = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/integration`,
        { headers: authHeaders }
      );
      const data = res.data.integration as IntegrationState;
      setIntegration(data);
      setStoreUrl(data.storeUrl || '');
      setProductSource(data.productSource || 'manual');
    } catch {
      ToastService.error('Could not load product sync settings.');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const handleDetect = async () => {
    if (!storeUrl.trim()) {
      ToastService.error('Enter your charity shop or website URL first.');
      return;
    }
    setDetecting(true);
    setDetection(null);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/integration/detect`,
        { storeUrl: storeUrl.trim() },
        { headers: authHeaders }
      );
      const d = res.data.detection as Detection;
      setDetection(d);
      setStoreUrl(d.storeUrl);
      setProductSource(d.platform === 'unknown' ? 'scrape' : d.platform);
      ToastService.success(d.message);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Could not detect store platform.';
      ToastService.error(msg);
    } finally {
      setDetecting(false);
    }
  };

  const saveSettings = async (syncNow = false) => {
    if (!session?.token) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/integration`,
        {
          productSource,
          storeUrl: storeUrl.trim(),
          apiKey: apiKey || undefined,
          apiSecret: apiSecret || undefined,
          autoSync: true,
          syncNow,
        },
        { headers: authHeaders }
      );
      setIntegration(res.data.integration);
      setApiKey('');
      setApiSecret('');
      if (res.data.syncResult) {
        ToastService.success(res.data.syncResult.message);
      } else {
        ToastService.success(res.data.message || 'Settings saved.');
      }
      await loadIntegration();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save settings.';
      ToastService.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await saveSettings(false);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/integration/test`,
        {},
        { headers: authHeaders }
      );
      ToastService.success(
        `Connection OK — found ${res.data.sampleCount ?? 0} product(s) in sample.`
      );
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Connection test failed.';
      ToastService.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await saveSettings(false);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/charity/integration/sync`,
        {},
        { headers: authHeaders }
      );
      ToastService.success(res.data.message || 'Products synced.');
      await loadIntegration();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Sync failed.';
      ToastService.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <p className="body-small text-mono-70">Loading product sync…</p>;
  }

  const showApiKey =
    productSource === 'shopify' ||
    productSource === 'api_key' ||
    productSource === 'woocommerce' ||
    productSource === 'wordpress' ||
    detection?.requiredFields?.includes('apiKey');
  const showApiSecret =
    productSource === 'woocommerce' ||
    productSource === 'wordpress' ||
    detection?.requiredFields?.includes('apiSecret');

  const syncTone = integration?.lastSyncStatus === 'success' ? 'green' : integration?.lastSyncStatus === 'failed' ? 'red' : 'amber';
  const manual = productSource === 'manual';

  return (
    <div className="charity-product-integration space-y-5">
      <SectionCard
        icon={RefreshCw}
        title="Connect your shop"
        description={`Import products from Shopify, WooCommerce or your website. They appear on your storefront and sell through Angelpage checkout with a ${CHARITY_SHARE_PERCENT}/10 split. You fulfil orders when we notify you.`}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#2A2730]" htmlFor="store-url">
              Shop or website address
            </label>
            <div className="flex gap-2 sm:flex-col">
              <div className="relative min-w-0 flex-1">
                <Globe className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#9C98A0]" aria-hidden />
                <input id="store-url" type="url" inputMode="url" className="w-full" style={{ paddingLeft: 38 }} placeholder="https://your-charity-shop.com" value={storeUrl} onChange={e => setStoreUrl(e.target.value)} />
              </div>
              <Btn variant="secondary" icon={ScanSearch} onClick={handleDetect} loading={detecting}>
                Detect platform
              </Btn>
            </div>
            {detection ? <p className="mt-2 text-[12.5px] text-[#611192]">{detection.message}</p> : null}
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">How should we connect?</p>
            <div role="radiogroup" className="grid grid-cols-3 gap-2 md:grid-cols-2 sm:grid-cols-1">
              {[
                { v: 'manual', l: 'Manual only', d: 'List items yourself' },
                { v: 'shopify', l: 'Shopify', d: 'Public catalogue' },
                { v: 'woocommerce', l: 'WooCommerce', d: 'Store API' },
                { v: 'api_key', l: 'API key', d: 'Shopify or WooCommerce' },
                { v: 'scrape', l: 'Website import', d: 'We read your product pages' },
              ].map(o => {
                const on = productSource === o.v;
                return (
                  <button key={o.v} type="button" role="radio" aria-checked={on} onClick={() => setProductSource(o.v)} className={`rounded-xl px-3.5 py-3 text-left ring-1 transition ${on ? 'bg-[#F6EEFA] ring-2 ring-[#611192]' : 'bg-white ring-[#ECE8EE] hover:ring-[#DCD3E1]'}`}>
                    <span className="block text-[13.5px] font-semibold text-[#0B0112]">{o.l}</span>
                    <span className="block text-[12px] text-[#8A888C]">{o.d}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-[#8A888C]">Current: {SOURCE_LABELS[productSource] || productSource}</p>
          </div>

          {showApiKey || showApiSecret ? (
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF8FB] p-4 sm:grid-cols-1">
              {showApiKey ? (
                <AuthField id="api-key" label={`Access token / consumer key${integration?.hasApiKey ? ' (saved)' : ''}`} icon={KeyRound} type="password" autoComplete="off" placeholder={integration?.hasApiKey ? 'Enter a new key to replace' : 'shpat_… or ck_…'} value={apiKey} onChange={e => setApiKey(e.target.value)} />
              ) : null}
              {showApiSecret ? (
                <AuthField id="api-secret" label={`API secret${integration?.hasApiSecret ? ' (saved)' : ''}`} icon={KeyRound} type="password" autoComplete="off" value={apiSecret} onChange={e => setApiSecret(e.target.value)} />
              ) : null}
              <p className="col-span-2 flex items-center gap-1.5 text-[12px] text-[#8A888C] sm:col-span-1">
                <Lock className="h-3.5 w-3.5" aria-hidden /> Keys are encrypted and never shown again.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-[#F3EFF5] pt-4 sm:flex-col">
            <Btn icon={RefreshCw} onClick={() => saveSettings(true)} loading={saving} disabled={manual}>
              Save &amp; sync now
            </Btn>
            <Btn variant="secondary" icon={PlugZap} onClick={handleTest} loading={testing} disabled={manual}>
              Test connection
            </Btn>
            <Btn variant="secondary" onClick={handleSync} loading={syncing} disabled={manual}>
              Sync products
            </Btn>
          </div>
        </div>
      </SectionCard>

      {integration && integration.lastSyncStatus !== 'idle' ? (
        <SectionCard title="Last sync" action={<StatusPill status={integration.lastSyncStatus} tone={syncTone} />}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {[
              { k: 'New', v: integration.lastImportedCount ?? 0 },
              { k: 'Updated', v: integration.lastUpdatedCount ?? 0 },
              { k: 'Live on Angelpage', v: integration.totalSyncedProducts ?? 0 },
            ].map(x => (
              <div key={x.k} className="rounded-2xl bg-[#FAF8FB] px-4 py-3">
                <p className="text-[11.5px] text-[#8A888C]">{x.k}</p>
                <p className="mt-0.5 text-[20px] font-semibold text-[#0B0112] tabular-nums">{x.v}</p>
              </div>
            ))}
          </div>
          {integration.lastSyncAt ? <p className="mt-3 text-[12px] text-[#8A888C]">{new Date(integration.lastSyncAt).toLocaleString()}</p> : null}
          {integration.lastSyncError ? <p className="mt-2 rounded-xl bg-[#FFF1F4] px-3 py-2 text-[12.5px] text-[#9F1239]">{integration.lastSyncError}</p> : null}
        </SectionCard>
      ) : null}

      <SectionCard icon={Upload} title="Prefer to list by hand?" description="Manual listings use the same checkout and order notifications.">
        <div className="flex flex-wrap gap-2 sm:flex-col">
          <Link href="/product/post-product" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium ring-1 ring-[#E2DCE6] hover:ring-[#611192]">
            List one item
          </Link>
          <Link href="/product/bulk-list" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium ring-1 ring-[#E2DCE6] hover:ring-[#611192]">
            Bulk upload a spreadsheet
          </Link>
        </div>
      </SectionCard>
    </div>
  );
};

export default CharityProductIntegrationPanel;
