import { queryOptions } from "@tanstack/react-query";
import type { Token, TopTokensResponse } from "@/types/token";

const JUPITER_API_BASE = "https://lite-api.jup.ag";

/**
 * Filters tokens to only include those safe for regular users
 * - Requires mint authority to be disabled (prevents unlimited minting)
 * - Requires freeze authority to be disabled (prevents freezing user funds)
 * - Limits top holder concentration to prevent rug pulls
 * - Requires minimum holder count for established tokens
 */
function filterSafeTokens(tokens: Token[]): Token[] {
  return tokens.filter((token) => {
    const { audit, holderCount, isVerified } = token;

    // Prioritize verified tokens
    if (isVerified) return true;

    // Safety checks for unverified tokens
    const hasSafeMintAuthority = audit.mintAuthorityDisabled ?? false;
    const hasSafeFreezeAuthority = audit.freezeAuthorityDisabled ?? false;
    const hasReasonableTopHolderConcentration = audit.topHoldersPercentage < 50;
    const hasMinimumHolders = holderCount >= 100;

    return (
      hasSafeMintAuthority &&
      hasSafeFreezeAuthority &&
      hasReasonableTopHolderConcentration &&
      hasMinimumHolders
    );
  });
}

async function fetchTopTokens(): Promise<TopTokensResponse> {
  const response = await fetch(
    `${JUPITER_API_BASE}/tokens/v2/toporganicscore/24h`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top tokens: ${response.statusText}`);
  }

  const tokens: TopTokensResponse = await response.json();

  // Filter for safe tokens suitable for regular users
  return filterSafeTokens(tokens);
}

export const topTokensQueryOptions = queryOptions({
  queryKey: ["tokens", "top-organic-score", "24h"],
  queryFn: fetchTopTokens,
  staleTime: 1000 * 60 * 60 * 24, // Consider data stale after 24 hours
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
  refetchOnMount: false, // Don't refetch on component remount
  refetchOnReconnect: false, // Don't refetch when network reconnects
  refetchInterval: false, // Don't refetch on an interval
});
