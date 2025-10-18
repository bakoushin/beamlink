/**
 * Format a price value with appropriate precision
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return `$${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (price >= 0.000001) {
    // Remove trailing zeros by parsing the fixed decimal back to number
    const formatted = price.toFixed(6);
    const trimmed = parseFloat(formatted).toString();
    return `$${trimmed}`;
  } else {
    return "less $0.000001";
  }
}

/**
 * Format a market cap value with K/M/B suffixes
 */
export function formatMarketCap(mcap: number): string {
  if (mcap >= 1e9) {
    return `$${(mcap / 1e9).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}B`;
  } else if (mcap >= 1e6) {
    return `$${(mcap / 1e6).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  } else if (mcap >= 1e3) {
    return `$${(mcap / 1e3).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}K`;
  }
  return `$${mcap.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

/**
 * Format a token balance with appropriate precision
 */
export function formatTokenBalance(balance: number): string {
  if (balance === 0) return "0";
  if (balance < 0.000001) return "< 0.000001";
  if (balance < 1) return balance.toFixed(6);
  if (balance < 1000) return balance.toFixed(4);
  return balance.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}
