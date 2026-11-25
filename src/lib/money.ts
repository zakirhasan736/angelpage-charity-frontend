import { preferredCurrency } from '@/lib/marketPreference';

/**
 * Money for dashboards and redesigned screens: the visitor's market currency
 * (USD / CAD / GBP), the same rule product cards use.
 */
export const formatMoney = (amount?: number | string | null, opts: { compact?: boolean } = {}) => {
  const n = Number(amount || 0);
  const currency = typeof document === 'undefined' ? 'USD' : preferredCurrency();
  const compact = Boolean(opts.compact) && Math.abs(n) >= 10000;
  return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(n);
};
