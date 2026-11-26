/**
 * Affiliate products (eBay, Amazon, partner feeds) don't check out on
 * Angelpage: clicking them goes straight to the partner site.
 */
type AffiliateLike = {
  _id?: string;
  id?: string;
  checkoutMode?: string;
  affiliateUrl?: string | null;
  ebayAffiliateUrl?: string | null;
  outboundUrl?: string | null;
  ebayItemId?: string | null;
  source?: string;
};

export type AffiliatePartner = { url: string; name: string };

const API = process.env.NEXT_PUBLIC_API_URL || '';

const partnerName = (url: string, mode?: string) => {
  if (mode === 'ebay_redirect') return 'eBay';
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (/(^|\.)amazon\.|amzn\.to$/.test(host)) return 'Amazon';
    if (/(^|\.)ebay\.|ebay\.us$/.test(host)) return 'eBay';
    const base = host.split('.').slice(-2, -1)[0] || host;
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'the partner site';
  }
};

/** Partner URL + name, or null for products bought on Angelpage. */
export function affiliatePartner(
  p?: AffiliateLike | null
): AffiliatePartner | null {
  if (!p) return null;
  const isAffiliateMode =
    p.checkoutMode === 'ebay_redirect' ||
    p.checkoutMode === 'affiliate_redirect';
  if (!isAffiliateMode) return null;
  let url = p.outboundUrl || p.affiliateUrl || p.ebayAffiliateUrl || '';
  if (!url && p.ebayItemId) url = `https://www.ebay.com/itm/${p.ebayItemId}`;
  if (!/^https?:\/\//i.test(url)) return null;
  return { url, name: partnerName(url, p.checkoutMode) };
}

/** Fire-and-forget click count; never blocks the navigation. */
export function trackAffiliateClick(productId?: string) {
  if (!productId || !API || typeof window === 'undefined') return;
  const endpoint = `${API}/products/${productId}/affiliate-click`;
  try {
    if (
      navigator.sendBeacon?.(
        endpoint,
        new Blob(['{}'], { type: 'application/json' })
      )
    )
      return;
  } catch {
    /* fall through */
  }
  fetch(endpoint, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => {});
}

/** Attributes for an outbound partner link. */
export const affiliateLinkProps = (
  partner: AffiliatePartner,
  productId?: string
) => ({
  href: partner.url,
  target: '_blank',
  rel: 'sponsored noopener noreferrer',
  onClick: () => trackAffiliateClick(productId),
});
