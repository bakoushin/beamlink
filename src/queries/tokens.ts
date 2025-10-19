import { queryOptions } from "@tanstack/react-query";
import type { Token, TopTokensResponse } from "@/types/token";

const JUPITER_API_BASE = "https://lite-api.jup.ag";
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

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

/**
 * Fetches SOL token data with current price
 */
async function fetchSolToken(): Promise<Token> {
  const response = await fetch(
    `${JUPITER_API_BASE}/tokens/v2/search?query=${SOL_MINT_ADDRESS}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch SOL token data: ${response.statusText}`);
  }

  const tokens: Token[] = await response.json();
  const solToken = tokens.find((token) => token.id === SOL_MINT_ADDRESS);

  if (!solToken) {
    throw new Error("SOL token not found in API response");
  }

  return solToken;
}

export const solTokenQueryOptions = queryOptions({
  queryKey: ["tokens", "sol", SOL_MINT_ADDRESS],
  queryFn: fetchSolToken,
  staleTime: 1000 * 60, // Consider data stale after 1 minute
  refetchOnWindowFocus: true, // Refetch when window regains focus to get latest price
  refetchInterval: 1000 * 60, // Refetch every minute
});
