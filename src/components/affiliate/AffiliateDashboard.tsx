'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Download, Link2, Package, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import Image from '@/components/common/SafeImage';
import { AuthField, AuthTextarea } from '@/components/auth/AuthKit';
import { Btn, EmptyState, SectionCard, StatusPill } from '@/components/dashboard/DashKit';
import { formatMoney } from '@/lib/money';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { CHARITY_SHARE_PERCENT } from '@/constants/brand';

type Connection = {
  _id: string;
  label: string;
  apiUrl: string;
  provider: string;
  affiliateId?: string;
  itemsPath?: string;
  lastSyncStatus?: string;
  lastImportedCount?: number;
  hasApiKey?: boolean;
};

type AffiliateProduct = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  additionalInfo?: string;
  affiliateUrl?: string;
  ebayAffiliateUrl?: string;
  checkoutMode?: string;
  images?: { url: string }[];
};

const DEFAULT_MAPPING = {
  title: 'title',
  price: 'price',
  image: 'image',
  description: 'description',
  url: 'url',
  id: 'id',
};

interface AffiliateDashboardProps {
  allowEbayImport?: boolean;
}

const AffiliateDashboard = ({ allowEbayImport = false }: AffiliateDashboardProps) => {
  const { data: session } = useSession() || {};
  const [connections, setConnections] = useState<Connection[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    label: 'My affiliate API',
    apiUrl: '',
    apiKey: '',
    affiliateId: '',
    provider: 'generic',
    itemsPath: 'products',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', additionalInfo: '' });

  const headers = session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : undefined;

  const load = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const [connRes, prodRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/connections`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/products`, { headers }),
      ]);
      setConnections(connRes.data.connections || []);
      setProducts(prodRes.data.products || []);
    } catch {
      ToastService.error('Could not load affiliate data.');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const createConnection = async (syncNow = false) => {
    if (!form.apiUrl.trim()) {
      ToastService.error('API URL is required.');
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/connections`,
        { ...form, fieldMapping: DEFAULT_MAPPING, syncNow },
        { headers },
      );
      ToastService.success(syncNow ? 'Connection saved — import started.' : 'Connection saved.');
      setForm((f) => ({ ...f, apiKey: '' }));
      await load();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save connection.';
      ToastService.error(msg);
    }
  };

  const syncConnection = async (id: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/connections/${id}/sync`,
        {},
        { headers },
      );
      ToastService.success('Sync started — refresh in a moment.');
      setTimeout(load, 3000);
    } catch {
      ToastService.error('Sync failed.');
    }
  };

  const removeConnection = async (id: string) => {
    if (!confirm('Remove this API connection?')) return;
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/affiliate/connections/${id}`,
      { headers },
    );
    await load();
  };

  const saveProductEdit = async (productId: string) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/products/${productId}`,
        {
          name: editForm.name,
          price: parseFloat(editForm.price),
          additionalInfo: editForm.additionalInfo,
        },
        { headers },
      );
      setEditingId(null);
      await load();
      ToastService.success('Product updated.');
    } catch {
      ToastService.error('Update failed.');
    }
  };

  const removeProduct = async (productId: string) => {
    if (!confirm('Remove this affiliate product from Angelpage?')) return;
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/affiliate/products/${productId}`,
      { headers },
    );
    await load();
  };

  const importEbayFeed = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/ebay/import`,
        {},
        { headers },
      );
      ToastService.success(
        `Imported ${res.data.importedCount || 0} eBay affiliate products.`,
      );
      await load();
    } catch {
      ToastService.error('eBay import failed.');
    }
  };

  if (loading) return <p className="body-small text-mono-70">Loading affiliate dashboard…</p>;

  const PROVIDERS = [
    { v: 'generic', l: 'Generic JSON' },
    { v: 'ebay', l: 'eBay Partner' },
    { v: 'amazon', l: 'Amazon' },
    { v: 'custom', l: 'Custom' },
  ];

  return (
    <div className="affiliate-dashboard space-y-5">
      {allowEbayImport ? (
        <SectionCard icon={Download} title="eBay Partner feed" description="Admin only: import the curated eBay feed.">
          <Btn variant="secondary" icon={Download} onClick={importEbayFeed}>
            Import eBay feed
          </Btn>
        </SectionCard>
      ) : null}

      <SectionCard icon={Link2} title="Add an affiliate connection" description={`Products from partner APIs show on Angelpage and check out on the partner site. ${CHARITY_SHARE_PERCENT}% of the commission goes to charity.`}>
        <form
          onSubmit={e => {
            e.preventDefault();
            createConnection(true);
          }}
          className="space-y-4"
        >
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[#2A2730]">Provider</p>
            <div role="radiogroup" className="grid grid-cols-4 gap-1 rounded-xl bg-[#F4F1F6] p-1 sm:grid-cols-2">
              {PROVIDERS.map(o => (
                <button key={o.v} type="button" role="radio" aria-checked={form.provider === o.v} onClick={() => setForm({ ...form, provider: o.v })} className={`h-10 rounded-lg text-[13px] font-medium ${form.provider === o.v ? 'bg-white text-[#611192] shadow-sm' : 'text-[#6B686E]'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <AuthField label="Name" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Outdoor gear feed" />
            <AuthField label="Tracking / affiliate ID" value={form.affiliateId} onChange={e => setForm({ ...form, affiliateId: e.target.value })} />
            <AuthField label="API URL" type="url" inputMode="url" value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://" className="col-span-2 sm:col-span-1" />
            <AuthField label="API key (optional)" type="password" autoComplete="off" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} className="col-span-2 sm:col-span-1" />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#F3EFF5] pt-4 sm:flex-col-reverse">
            <Btn variant="secondary" onClick={() => createConnection(false)}>
              Save only
            </Btn>
            <Btn type="submit" icon={RefreshCw}>
              Save &amp; sync
            </Btn>
          </div>
        </form>
      </SectionCard>

      {connections.length > 0 ? (
        <SectionCard title={`Connections (${connections.length})`}>
          <ul className="space-y-2">
            {connections.map(c => (
              <li key={c._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-3.5 ring-1 ring-[#ECE8EE]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E8F8] text-[#611192]">
                  <Link2 className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#0B0112]">{c.label}</p>
                  <p className="truncate text-[12px] text-[#8A888C]">
                    {c.provider} · {c.apiUrl}
                    {c.lastImportedCount ? ` · ${c.lastImportedCount} imported` : ''}
                  </p>
                </div>
                <StatusPill status={c.lastSyncStatus || 'idle'} tone={c.lastSyncStatus === 'success' ? 'green' : c.lastSyncStatus === 'failed' ? 'red' : 'grey'} />
                <div className="flex gap-1">
                  <Btn size="sm" variant="ghost" icon={RefreshCw} onClick={() => syncConnection(c._id)}>
                    Sync
                  </Btn>
                  <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => removeConnection(c._id)} className="text-[#B0002A]! hover:bg-[#FFF1F4]!">
                    Remove
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title={`Imported products (${products.length})`}>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="No affiliate products yet" body="Add a connection above and sync to import products." />
        ) : (
          <ul className="space-y-2">
            {products.map(p => (
              <li key={p._id} className="rounded-2xl p-3 ring-1 ring-[#ECE8EE]">
                <div className="flex gap-3">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6]">
                    {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" fill sizes="64px" className="object-cover" /> : null}
                  </span>
                  {editingId === p._id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        saveProductEdit(p._id);
                      }}
                      className="min-w-0 flex-1 space-y-3"
                    >
                      <div className="grid grid-cols-[1fr_140px] gap-3 sm:grid-cols-1">
                        <AuthField label="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        <AuthField label="Price" inputMode="decimal" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                      </div>
                      <AuthTextarea label="Description" rows={2} value={editForm.additionalInfo} onChange={e => setEditForm({ ...editForm, additionalInfo: e.target.value })} />
                      <div className="flex justify-end gap-2">
                        <Btn size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Btn>
                        <Btn size="sm" type="submit">
                          Save
                        </Btn>
                      </div>
                    </form>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-[14px] font-semibold text-[#0B0112]">{p.name}</p>
                        <p className="text-[14px] font-semibold tabular-nums">{formatMoney(p.price)}</p>
                      </div>
                      <a href={p.affiliateUrl || p.ebayAffiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="block truncate text-[12px] text-[#611192] hover:underline">
                        {p.affiliateUrl || p.ebayAffiliateUrl}
                      </a>
                      <div className="mt-2 flex gap-1">
                        <Btn
                          size="sm"
                          variant="ghost"
                          icon={Pencil}
                          onClick={() => {
                            setEditingId(p._id);
                            setEditForm({ name: p.name, price: String(p.price), additionalInfo: p.additionalInfo || '' });
                          }}
                        >
                          Edit
                        </Btn>
                        <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => removeProduct(p._id)} className="text-[#B0002A]! hover:bg-[#FFF1F4]!">
                          Remove
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default AffiliateDashboard;
