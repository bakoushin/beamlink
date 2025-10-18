/**
 * Format a price value with appropriate precision
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toExponential(2)}`;
  }
}

/**
 * Format a market cap value with K/M/B suffixes
 */
export function formatMarketCap(mcap: number): string {
  if (mcap >= 1e9) {
    return `$${(mcap / 1e9).toFixed(2)}B`;
  } else if (mcap >= 1e6) {
    return `$${(mcap / 1e6).toFixed(2)}M`;
  } else if (mcap >= 1e3) {
    return `$${(mcap / 1e3).toFixed(2)}K`;
  }
  return `$${mcap.toFixed(2)}`;
}

/**
 * Format a large number with K/M/B/T suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Format a percentage change with sign
 */
export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}
