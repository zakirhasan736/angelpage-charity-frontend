'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  HandHeart,
  Package,
  PackageCheck,
  Printer,
  Receipt,
  ShoppingBag,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react';
import Image from '@/components/common/SafeImage';
import DisputeButton from '@/components/orders/DisputeButton';
import { Btn, ConfirmDialog, EmptyState, MiniStats, RowSkeleton, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { formatMoney } from '@/lib/money';

type Mode = 'sold' | 'bought';
type Order = {
  orderId: string;
  orderNumber?: string;
  status?: string;
  productName?: string;
  productBrand?: string;
  productPrice?: number;
  productImages?: { url?: string; altText?: string }[];
  quantity?: number;
  charityName?: string;
  charityProfit?: number;
  adminFee?: number;
  storefrontId?: string;
  shipmentCost?: number | null;
  totalAmount?: number | null;
  trackingNumber?: string;
  tracking_url?: string;
  label_download?: string;
  shipStationOrderId?: string;
  carrierCode?: string;
  labelId?: string;
  serviceCode?: string;
  orderDate?: string;
  createdAt?: string;
  paymentConfirmedAt?: string;
  buyerName?: string;
  sellerName?: string;
  shippingAddress?: { name?: string; address?: string; city?: string; country?: string; postcode?: string };
  disputeStatus?: string;
  fulfillmentType?: string;
  products?: { fulfillmentType?: string }[];
  product?: { fulfillmentType?: string };
};

const API = process.env.NEXT_PUBLIC_API_URL;

/* ------------------------------------------------------------------ status model */

const STAGE: Record<string, number> = {
  OrderPlaced: 0,
  OrderConfirmed: 1,
  LabelCreated: 1,
  awaiting_shipment: 1,
  LabelFailed: 1,
  ShipStationOrderFailed: 1,
  ItemShipped: 2,
  PickedUp: 2,
  InTransit: 2,
  OutForDelivery: 2,
  Delivered: 3,
  SalesProceeds: 4,
  OrderCancel: -1,
};

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'grey';
const label = (s: string | undefined, mode: Mode): { text: string; tone: Tone } => {
  switch (s) {
    case 'OrderPlaced':
      return { text: 'Awaiting payment', tone: 'amber' };
    case 'OrderConfirmed':
      return mode === 'sold' ? { text: 'Ready to ship', tone: 'amber' } : { text: 'Paid', tone: 'blue' };
    case 'LabelCreated':
    case 'awaiting_shipment':
      return mode === 'sold' ? { text: 'Label ready', tone: 'amber' } : { text: 'Preparing', tone: 'blue' };
    case 'LabelFailed':
    case 'ShipStationOrderFailed':
      return mode === 'sold' ? { text: 'Label failed', tone: 'red' } : { text: 'Preparing', tone: 'blue' };
    case 'ItemShipped':
    case 'PickedUp':
      return { text: 'Shipped', tone: 'purple' };
    case 'InTransit':
      return { text: 'In transit', tone: 'purple' };
    case 'OutForDelivery':
      return { text: 'Out for delivery', tone: 'purple' };
    case 'Delivered':
      return { text: 'Delivered', tone: 'green' };
    case 'SalesProceeds':
      return { text: mode === 'sold' ? 'Paid out' : 'Completed', tone: 'green' };
    case 'OrderCancel':
      return { text: 'Cancelled', tone: 'red' };
    default:
      return { text: s || 'Unknown', tone: 'grey' };
  }
};

const fulfillment = (o: Order) => o.fulfillmentType || o.products?.[0]?.fulfillmentType || o.product?.fulfillmentType || 'uk_shipping';
const needsLabel = (o: Order) => fulfillment(o) === 'uk_shipping';
const stage = (o: Order) => STAGE[o.status || ''] ?? 0;
const needsAction = (o: Order, mode: Mode) => {
  const st = o.status || '';
  if (mode === 'sold') return ['OrderConfirmed', 'LabelCreated', 'awaiting_shipment', 'LabelFailed', 'ShipStationOrderFailed'].includes(st);
  return ['ItemShipped', 'PickedUp', 'InTransit', 'OutForDelivery'].includes(st);
};

const FILTERS = (mode: Mode) => [
  { id: 'all', label: 'All' },
  { id: 'action', label: mode === 'sold' ? 'To ship' : 'To receive' },
  { id: 'transit', label: 'On the way' },
  { id: 'done', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const inFilter = (o: Order, f: string, mode: Mode) => {
  const s = stage(o);
  if (f === 'action') return needsAction(o, mode);
  if (f === 'transit') return s === 2;
  if (f === 'done') return s >= 3;
  if (f === 'cancelled') return s === -1;
  return true;
};

const when = (d?: string) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const copy = (text: string, what: string) => {
  navigator.clipboard?.writeText(text).then(
    () => ToastService.success(`${what} copied`),
    () => ToastService.error('Couldn’t copy')
  );
};

const printReceipt = (o: Order, mode: Mode) => {
  const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
  const rows: [string, string][] = [
    ['Item', esc(o.productName)],
    ['Price', formatMoney(o.productPrice)],
    ['Quantity', esc(o.quantity || 1)],
    ['Shipping', formatMoney(o.shipmentCost || 0)],
    ['Supports', esc(o.charityName)],
    ['To charity', formatMoney(o.charityProfit)],
    ['Status', esc(label(o.status, mode).text)],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Angelpage receipt ${esc(o.orderNumber || o.orderId)}</title>
<style>body{font-family:Poppins,Arial,sans-serif;padding:32px;color:#0B0112}h1{font-size:20px;margin:0}p{color:#6B686E;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}td{padding:10px 0;border-bottom:1px solid #ECE8EE}td:last-child{text-align:right;font-weight:600}.brand{color:#611192;font-weight:700;letter-spacing:.02em}</style></head>
<body><div class="brand">Angelpage</div><h1>Order receipt</h1><p>Order ${esc(o.orderNumber || o.orderId)} · ${esc(new Date(o.orderDate || o.createdAt || Date.now()).toLocaleString())}</p>
<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
<script>window.onload=function(){window.print()}</script></body></html>`;
  const w = window.open('', '_blank', 'width=760,height=720');
  if (!w) return ToastService.error('Allow pop-ups to print the receipt.');
  w.document.open();
  w.document.write(html);
  w.document.close();
};

/* ------------------------------------------------------------------ main */

export default function OrdersWorkspace({ mode }: { mode: Mode }) {
  const { data: session, status } = useSession() || {};
  const token = session?.token;
  const userId = session?.user?.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const url = mode === 'sold' ? `${API}/order/seller/${userId}/sold` : `${API}/order/buyer/${userId}/orders`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const list: Order[] = (mode === 'sold' ? data?.soldItems : data?.purchaseItems) || [];
      setOrders(list);
      setSelectedId(prev => prev ?? list[0]?.orderId ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, userId, mode]);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  const patch = (orderId: string, changes: Partial<Order>) => setOrders(list => list.map(o => (o.orderId === orderId ? { ...o, ...changes } : o)));

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    FILTERS(mode).forEach(f => (c[f.id] = orders.filter(o => inFilter(o, f.id, mode)).length));
    return c;
  }, [orders, mode]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter(o => inFilter(o, filter, mode) && (!term || `${o.productName} ${o.productBrand} ${o.orderNumber} ${o.orderId} ${o.charityName} ${o.buyerName} ${o.sellerName}`.toLowerCase().includes(term)));
  }, [orders, q, filter, mode]);

  const selected = orders.find(o => o.orderId === selectedId) || null;
  const toCharity = orders.filter(o => stage(o) >= 1).reduce((s, o) => s + Number(o.charityProfit || 0), 0);
  const totalValue = orders.filter(o => stage(o) >= 1).reduce((s, o) => s + Number(o.productPrice || 0) * Number(o.quantity || 1), 0);

  if (error) {
    return <EmptyState icon={Package} title="We couldn’t load your orders" body="Check your connection and try again." action={<Btn onClick={load}>Try again</Btn>} />;
  }

  return (
    <div>
      <MiniStats
        items={
          mode === 'sold'
            ? [
                { label: 'To ship', value: loading ? '—' : counts.action, icon: Package },
                { label: 'On the way', value: loading ? '—' : counts.transit, icon: Truck },
                { label: 'Sales', value: loading ? '—' : formatMoney(totalValue, { compact: true }), icon: Wallet },
                { label: 'Raised for charity', value: loading ? '—' : formatMoney(toCharity, { compact: true }), icon: HandHeart },
              ]
            : [
                { label: 'To receive', value: loading ? '—' : counts.action, icon: Truck },
                { label: 'Completed', value: loading ? '—' : counts.done, icon: PackageCheck },
                { label: 'Spent', value: loading ? '—' : formatMoney(totalValue, { compact: true }), icon: ShoppingBag },
                { label: 'Your giving', value: loading ? '—' : formatMoney(toCharity, { compact: true }), icon: HandHeart },
              ]
        }
      />
      <Toolbar
        search={q}
        onSearch={setQ}
        placeholder={mode === 'sold' ? 'Search by item, buyer or order number' : 'Search by item, seller or order number'}
        filters={FILTERS(mode).map(f => ({ ...f, count: loading ? undefined : counts[f.id] }))}
        value={filter}
        onFilter={setFilter}
      />

      {loading ? (
        <RowSkeleton rows={4} />
      ) : orders.length === 0 ? (
        mode === 'sold' ? (
          <EmptyState icon={Tag} title="No sales yet" body="When someone buys one of your items it appears here, with everything you need to ship it." action={<Link href="/product/post-product" className="inline-flex h-11 items-center rounded-xl bg-[#611192] px-5 text-[14px] font-medium text-white">List an item</Link>} />
        ) : (
          <EmptyState icon={ShoppingBag} title="No orders yet" body="Everything you buy shows up here with live tracking and receipts." action={<Link href="/product" className="inline-flex h-11 items-center rounded-xl bg-[#611192] px-5 text-[14px] font-medium text-white">Start shopping</Link>} />
        )
      ) : (
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-cols-1">
          <ul className="space-y-2" aria-label={mode === 'sold' ? 'Sold orders' : 'Your orders'}>
            {visible.length === 0 ? (
              <li className="rounded-2xl bg-[#FAF8FB] px-4 py-8 text-center text-[13.5px] text-[#6B686E]">No orders match this filter.</li>
            ) : (
              visible.map(o => {
                const l = label(o.status, mode);
                const active = o.orderId === selectedId;
                return (
                  <li key={o.orderId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(o.orderId);
                        setMobileOpen(true);
                      }}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition ${active ? 'ring-2 ring-[#611192] md:ring-1 md:ring-[#ECE8EE]' : 'ring-[#ECE8EE] hover:ring-[#DCD3E1]'}`}
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F1F6]">
                        <Image src={o.productImages?.[0]?.url || '/images/products/card-placeholder-image.webp'} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[#0B0112]">{o.productName}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-[#8A888C]">
                          {when(o.orderDate || o.createdAt)} · {formatMoney(o.productPrice)}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <StatusPill status={l.text} tone={l.tone} />
                          {needsAction(o, mode) ? <span className="h-2 w-2 rounded-full bg-[#E59A1A]" aria-label="Needs action" /> : null}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#B9B3BD]" aria-hidden />
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* detail: sticky column on desktop, full-screen sheet on phones/tablets */}
          <div className="sticky top-6 md:hidden">{selected ? <OrderDetail key={selected.orderId} order={selected} mode={mode} token={token} onPatch={patch} /> : null}</div>
          {mobileOpen && selected ? (
            <div className="fixed inset-0 z-[1000] hidden overflow-y-auto bg-[#FAF8FB] md:block" role="dialog" aria-modal="true" aria-label="Order details">
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#ECE8EE] bg-white/95 px-3 py-2.5 backdrop-blur">
                <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F4F1F6]" aria-label="Back to orders">
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <p className="truncate text-[15px] font-semibold">Order details</p>
              </div>
              <div className="p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
                <OrderDetail key={selected.orderId} order={selected} mode={mode} token={token} onPatch={patch} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ detail */

function OrderDetail({ order: o, mode, token, onPatch }: { order: Order; mode: Mode; token?: string; onPatch: (id: string, c: Partial<Order>) => void }) {
  const [tracking, setTracking] = useState('');
  const [trackingErr, setTrackingErr] = useState('');
  const [busy, setBusy] = useState<'label' | 'ship' | 'deliver' | null>(null);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const l = label(o.status, mode);
  const s = stage(o);
  const headers = { Authorization: `Bearer ${token}` };

  const steps = [
    { title: 'Paid', date: s >= 1 ? when(o.paymentConfirmedAt || o.orderDate) : '' },
    { title: 'Shipped', date: '' },
    { title: 'Delivered', date: '' },
    ...(mode === 'sold' ? [{ title: 'Proceeds sent', date: '' }] : []),
  ];

  const generateLabel = async () => {
    setBusy('label');
    try {
      const { data } = await axios.post(`${API}/order/orders/${o.orderId}/createlabel`, {}, { headers });
      if (data?.success && data.order) {
        const u = data.order;
        onPatch(o.orderId, { status: u.status, label_download: u.label_download, trackingNumber: u.trackingNumber, labelId: u.labelId, carrierCode: u.carrierCode, serviceCode: u.serviceCode, shipmentCost: u.shipmentCost ?? o.shipmentCost });
        ToastService.success('Shipping label created.');
      } else {
        ToastService.error(data?.message || 'Couldn’t create the label.');
      }
    } catch (e) {
      ToastService.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Couldn’t create the label.');
    } finally {
      setBusy(null);
    }
  };

  const confirmShipment = async () => {
    if (!tracking.trim()) {
      setTrackingErr('Enter the tracking number from the carrier.');
      return;
    }
    setBusy('ship');
    try {
      const { data } = await axios.patch(
        `${API}/order/${o.orderId}/shipped`,
        { trackingNumber: tracking.trim(), carrierCode: o.carrierCode || 'hermes', labelId: o.labelId || '', serviceCode: o.serviceCode || '', notifyCustomer: true, notifySalesChannel: true },
        { headers }
      );
      onPatch(o.orderId, { status: data?.order?.status || 'ItemShipped', trackingNumber: data?.order?.trackingNumber || tracking.trim(), carrierCode: data?.order?.carrierCode || o.carrierCode });
      setTracking('');
      setTrackingErr('');
      ToastService.success('Marked as shipped. The buyer has been notified.');
    } catch (e) {
      setTrackingErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Couldn’t confirm shipment.');
    } finally {
      setBusy(null);
    }
  };

  const deliver = async () => {
    setBusy('deliver');
    try {
      await axios.put(`${API}/charity/orders/${o.orderId}/deliver`, {}, { headers });
      onPatch(o.orderId, { status: 'Delivered' });
      ToastService.success('Thanks! Delivery confirmed and the sale has been split.');
    } catch {
      ToastService.error('Couldn’t confirm delivery. Please try again.');
    } finally {
      setBusy(null);
      setConfirmDeliver(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#ECE8EE] sm:p-4">
        <div className="flex items-start gap-4">
          <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F4F1F6]">
            <Image src={o.productImages?.[0]?.url || '/images/products/card-placeholder-image.webp'} alt={o.productImages?.[0]?.altText || ''} fill sizes="80px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#8A888C]">{o.productBrand && o.productBrand !== 'Unknown Product' ? o.productBrand : 'Item'}</p>
            <p className="text-[16px] leading-snug font-semibold text-[#0B0112]">{o.productName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={l.text} tone={l.tone} />
              <span className="text-[12px] text-[#8A888C]">{when(o.orderDate || o.createdAt)}</span>
            </div>
          </div>
          <p className="text-[18px] font-semibold text-[#0B0112] tabular-nums">{formatMoney(o.productPrice)}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EFF5] pt-3 text-[12.5px] text-[#6B686E]">
          <button type="button" onClick={() => copy(o.orderNumber || o.orderId, 'Order number')} className="inline-flex items-center gap-1.5 hover:text-[#611192]">
            Order <span className="font-medium text-[#0B0112]">#{(o.orderNumber || o.orderId).slice(-10)}</span> <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
          <DisputeButton orderId={o.orderId} disputeStatus={o.disputeStatus} />
        </div>
      </div>

      {/* progress */}
      {s === -1 ? (
        <div className="rounded-[22px] bg-[#FFF1F4] p-5 text-[14px] text-[#9F1239] ring-1 ring-[#FBD0DA]">This order was cancelled. Any payment is refunded to the original card.</div>
      ) : (
        <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#ECE8EE] sm:p-4">
          <ol className="flex items-start" aria-label="Order progress">
            {steps.map((st, i) => {
              const done = s >= i + 1;
              const current = s === i;
              return (
                <li key={st.title} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 ? <span className={`absolute top-[13px] right-1/2 h-[2px] w-full ${done || current ? 'bg-[#611192]' : 'bg-[#ECE8EE]'}`} aria-hidden /> : null}
                  <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${done ? 'bg-[#611192] text-white' : current ? 'bg-white text-[#611192] ring-2 ring-[#611192]' : 'bg-[#F1ECF4] text-[#ABA7AE]'}`}>
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span className={`mt-2 text-[12px] font-medium ${done || current ? 'text-[#0B0112]' : 'text-[#8A888C]'}`}>{st.title}</span>
                  {st.date ? <span className="text-[11px] text-[#8A888C]">{st.date}</span> : null}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* next action */}
      {mode === 'sold' ? (
        <SellerAction o={o} busy={busy} tracking={tracking} setTracking={v => { setTracking(v); setTrackingErr(''); }} trackingErr={trackingErr} onLabel={generateLabel} onShip={confirmShipment} />
      ) : (
        <BuyerAction o={o} busy={busy} onDeliver={() => setConfirmDeliver(true)} />
      )}

      {/* money */}
      <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#ECE8EE] sm:p-4">
        <p className="mb-3 text-[13px] font-semibold text-[#0B0112]">{mode === 'sold' ? 'Where the money goes' : 'Your order'}</p>
        <dl className="space-y-2 text-[13.5px]">
          <Row k={`Item${o.quantity && o.quantity > 1 ? ` × ${o.quantity}` : ''}`} v={formatMoney(Number(o.productPrice || 0) * Number(o.quantity || 1))} />
          {o.shipmentCost ? <Row k="Shipping" v={formatMoney(o.shipmentCost)} /> : null}
          <Row k={<span className="inline-flex items-center gap-1.5"><HandHeart className="h-3.5 w-3.5 text-[#611192]" aria-hidden /> To {o.charityName && o.charityName !== 'Unknown Charity' ? o.charityName : 'charity'}</span>} v={formatMoney(o.charityProfit)} strong />
          {mode === 'sold' && o.adminFee ? <Row k="Platform fee" v={formatMoney(o.adminFee)} /> : null}
        </dl>
        {o.storefrontId ? (
          <Link href={`/charity/store/${o.storefrontId}`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#611192] hover:underline">
            Visit the charity’s storefront <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {/* people */}
      <div className="rounded-[22px] bg-white p-5 text-[13.5px] ring-1 ring-[#ECE8EE] sm:p-4">
        <p className="mb-2 text-[13px] font-semibold text-[#0B0112]">{mode === 'sold' ? 'Buyer' : 'Seller & delivery'}</p>
        <p className="text-[#474648]">{mode === 'sold' ? o.buyerName || 'Buyer' : o.sellerName || 'Seller'}</p>
        {mode === 'bought' && o.shippingAddress?.address ? (
          <p className="mt-2 leading-relaxed text-[#6B686E]">
            {o.shippingAddress.name}
            <br />
            {o.shippingAddress.address}, {o.shippingAddress.city} {o.shippingAddress.postcode}
            <br />
            {o.shippingAddress.country}
          </p>
        ) : null}
        <Btn size="sm" variant="secondary" icon={Printer} onClick={() => printReceipt(o, mode)} className="mt-4">
          Print receipt
        </Btn>
      </div>

      <ConfirmDialog open={confirmDeliver} tone="primary" title="Confirm you received it?" body="This releases payment to the seller and the charity. Only confirm once the item has arrived as described." confirmLabel="Yes, I received it" loading={busy === 'deliver'} onConfirm={deliver} onClose={() => setConfirmDeliver(false)} />
    </div>
  );
}

function Row({ k, v, strong }: { k: React.ReactNode; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#6B686E]">{k}</dt>
      <dd className={`tabular-nums ${strong ? 'font-semibold text-[#611192]' : 'text-[#0B0112]'}`}>{v}</dd>
    </div>
  );
}

function ActionCard({ icon: Icon, title, body, children, tone = 'brand' }: { icon: typeof Truck; title: string; body?: React.ReactNode; children?: React.ReactNode; tone?: 'brand' | 'success' | 'warn' }) {
  const t = tone === 'success' ? 'bg-[#E7F8F1] text-[#00754F]' : tone === 'warn' ? 'bg-[#FFF4DE] text-[#8A5A00]' : 'bg-[#F2E8F8] text-[#611192]';
  return (
    <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#ECE8EE] sm:p-4">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[#0B0112]">{title}</p>
          {body ? <div className="mt-0.5 text-[13px] leading-snug text-[#6B686E]">{body}</div> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function TrackingLine({ o }: { o: Order }) {
  if (!o.trackingNumber) return null;
  return (
    <button type="button" onClick={() => copy(o.trackingNumber!, 'Tracking number')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF8FB] px-3 py-2 text-[13px] text-[#474648] hover:text-[#611192]">
      Tracking <span className="font-semibold text-[#0B0112]">{o.trackingNumber}</span> <Copy className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function SellerAction({
  o,
  busy,
  tracking,
  setTracking,
  trackingErr,
  onLabel,
  onShip,
}: {
  o: Order;
  busy: string | null;
  tracking: string;
  setTracking: (v: string) => void;
  trackingErr: string;
  onLabel: () => void;
  onShip: () => void;
}) {
  const st = o.status || '';
  const s = stage(o);
  if (s === -1) return null;
  if (st === 'OrderPlaced') return <ActionCard icon={Wallet} tone="warn" title="Waiting for payment" body="Don’t ship yet. We’ll let you know as soon as the buyer’s payment clears." />;

  if (!needsLabel(o) && s < 2) {
    return (
      <ActionCard icon={Receipt} title="Hand over or send the item" body="This order doesn’t use an Angelpage shipping label. Print the receipt to include with it.">
        <Btn icon={Printer} onClick={() => printReceipt(o, 'sold')}>
          Print receipt
        </Btn>
      </ActionCard>
    );
  }

  if (['OrderConfirmed', 'LabelFailed', 'ShipStationOrderFailed'].includes(st)) {
    return (
      <ActionCard icon={Tag} tone={st === 'OrderConfirmed' ? 'brand' : 'warn'} title={st === 'OrderConfirmed' ? 'Create your shipping label' : 'Label didn’t go through'} body={st === 'OrderConfirmed' ? 'Postage is covered by the buyer. Create the label, print it and drop the parcel off.' : 'Try creating the label again. If it keeps failing, contact support.'}>
        <Btn icon={Tag} loading={busy === 'label'} onClick={onLabel} className="w-full">
          {st === 'OrderConfirmed' ? 'Create shipping label' : 'Try again'}
        </Btn>
      </ActionCard>
    );
  }

  if (['LabelCreated', 'awaiting_shipment'].includes(st)) {
    return (
      <ActionCard icon={Truck} title="Ship it and add tracking" body="Print the label, drop the parcel off, then confirm with the tracking number so the buyer can follow it.">
        <div className="space-y-3">
          {o.label_download ? (
            <a href={o.label_download} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B0112] text-[14px] font-medium text-white hover:bg-[#2A1A35]">
              <Download className="h-4 w-4" aria-hidden /> Download label
            </a>
          ) : null}
          <div className="flex gap-2 sm:flex-col">
            <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking number" aria-label="Tracking number" aria-invalid={trackingErr ? true : undefined} className="min-w-0 flex-1" />
            <Btn loading={busy === 'ship'} onClick={onShip} icon={CheckCircle2}>
              Confirm shipped
            </Btn>
          </div>
          {trackingErr ? <p className="text-[12.5px] text-[#C0143C]">{trackingErr}</p> : null}
        </div>
      </ActionCard>
    );
  }

  if (s === 2) {
    return (
      <ActionCard icon={Truck} title="On its way to the buyer" body="Payment is released once the buyer confirms delivery.">
        <div className="flex flex-wrap gap-2">
          <TrackingLine o={o} />
          {o.label_download ? (
            <a href={o.label_download} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#611192] hover:bg-[#F6EEFA]">
              <Download className="h-4 w-4" aria-hidden /> Label
            </a>
          ) : null}
        </div>
      </ActionCard>
    );
  }

  if (s === 3) return <ActionCard icon={PackageCheck} tone="success" title="Delivered" body="The buyer has the item. Your proceeds and the charity’s share are being processed." />;
  return <ActionCard icon={HandHeart} tone="success" title={`Paid out${o.charityName && o.charityName !== 'Unknown Charity' ? ` · ${formatMoney(o.charityProfit)} to ${o.charityName}` : ''}`} body="This sale is complete. Thank you for giving." />;
}

function BuyerAction({ o, busy, onDeliver }: { o: Order; busy: string | null; onDeliver: () => void }) {
  const s = stage(o);
  if (s === -1) return null;
  if (s === 0) return <ActionCard icon={Wallet} tone="warn" title="Payment pending" body="We’re waiting for your payment to clear. If it failed, you can buy the item again." />;
  if (s === 1) return <ActionCard icon={Package} title="The seller is preparing your order" body="You’ll get tracking details as soon as it ships." />;
  if (s === 2) {
    return (
      <ActionCard icon={Truck} title="Your order is on the way" body="Confirm delivery once it arrives as described. That releases payment to the seller and the charity.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <TrackingLine o={o} />
            {o.tracking_url ? (
              <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#611192] hover:bg-[#F6EEFA]">
                Track parcel <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
          <Btn icon={PackageCheck} loading={busy === 'deliver'} onClick={onDeliver} className="w-full">
            I’ve received it
          </Btn>
        </div>
      </ActionCard>
    );
  }
  return <ActionCard icon={HandHeart} tone="success" title="Delivered" body={`Thanks for shopping for good${o.charityName && o.charityName !== 'Unknown Charity' ? `. ${formatMoney(o.charityProfit)} went to ${o.charityName}` : ''}.`} />;
}
