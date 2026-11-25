/** Dashboard money formatting (USD, matches product cards). */
export const formatMoney = (amount?: number | string | null, opts: { compact?: boolean } = {}) => {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: opts.compact && Math.abs(n) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : 2,
    minimumFractionDigits: opts.compact ? 0 : 2,
  }).format(n);
};
