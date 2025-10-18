import { queryOptions } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Token } from "@/types/token";

const JUPITER_API_BASE = "https://lite-api.jup.ag";
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const SOL_DECIMALS = 9;

export interface UserTokenBalance {
  address: string; // Token mint address
  symbol: string;
  name: string;
  image: string | null;
  balance: number; // Balance in token units (not lamports)
  decimals: number;
  usdPrice: number | null;
  usdValue: number | null; // balance * usdPrice
}

interface ParsedTokenAccount {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
          };
        };
      };
    };
  };
}

/**
 * Filters tokens to only include those safe for regular users
 * - Requires mint authority to be disabled (prevents unlimited minting)
 * - Requires freeze authority to be disabled (prevents freezing user funds)
 * - Limits top holder concentration to prevent rug pulls
 * - Requires minimum holder count for established tokens
 */
function isSafeToken(token: Token): boolean {
  const { audit, holderCount, isVerified, id } = token;

  // Always allow SOL
  if (id === SOL_MINT_ADDRESS) return true;

  // Prioritize verified tokens
  if (isVerified) return true;

  // Safety checks for unverified tokens
  const hasSafeMintAuthority = audit?.mintAuthorityDisabled ?? false;
  const hasSafeFreezeAuthority = audit?.freezeAuthorityDisabled ?? false;
  const hasReasonableTopHolderConcentration =
    (audit?.topHoldersPercentage ?? 100) < 50;
  const hasMinimumHolders = (holderCount ?? 0) >= 100;

  return (
    hasSafeMintAuthority &&
    hasSafeFreezeAuthority &&
    hasReasonableTopHolderConcentration &&
    hasMinimumHolders
  );
}

/**
 * Fetches token metadata from Jupiter API for multiple mint addresses
 */
async function fetchTokenMetadata(mintAddresses: string[]): Promise<Token[]> {
  if (mintAddresses.length === 0) return [];

  // Jupiter API supports comma-separated mint addresses (max 100)
  const query = mintAddresses.slice(0, 100).join(",");
  const response = await fetch(
    `${JUPITER_API_BASE}/tokens/v2/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetches user's token balances with metadata from Jupiter
 */
async function fetchUserTokenBalances(
  connection: Connection,
  walletPublicKey: PublicKey,
  includeUnsafe: boolean = false
): Promise<UserTokenBalance[]> {
  // Fetch native SOL balance
  const solBalanceLamports = await connection.getBalance(walletPublicKey);
  const solBalance = solBalanceLamports / Math.pow(10, SOL_DECIMALS);

  // Fetch all token accounts owned by the user
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletPublicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  // Extract mint addresses and balances
  const accountsData = tokenAccounts.value
    .map((account) => {
      const parsed = account.account as ParsedTokenAccount["account"];
      const tokenInfo = parsed.data.parsed.info;
      return {
        mint: tokenInfo.mint,
        balance: tokenInfo.tokenAmount.uiAmount || 0,
        decimals: tokenInfo.tokenAmount.decimals,
      };
    })
    // Filter out accounts with zero balance
    .filter((account) => account.balance > 0);

  // Fetch metadata for all tokens including SOL
  const mintAddresses = [
    SOL_MINT_ADDRESS,
    ...accountsData.map((account) => account.mint),
  ];
  const tokensMetadata = await fetchTokenMetadata(mintAddresses);

  // Create a map for quick lookup
  const metadataMap = new Map(tokensMetadata.map((token) => [token.id, token]));

  // Create SOL balance entry
  const solMetadata = metadataMap.get(SOL_MINT_ADDRESS);
  const solUsdPrice = solMetadata?.usdPrice ?? null;
  const solUsdValue = solUsdPrice !== null ? solBalance * solUsdPrice : null;

  const solBalanceEntry: UserTokenBalance = {
    address: SOL_MINT_ADDRESS,
    symbol: solMetadata?.symbol ?? "SOL",
    name: solMetadata?.name ?? "Solana",
    image: solMetadata?.icon ?? null,
    balance: solBalance,
    decimals: SOL_DECIMALS,
    usdPrice: solUsdPrice,
    usdValue: solUsdValue,
  };

  // Combine balance data with metadata for SPL tokens
  const splTokenBalances: UserTokenBalance[] = accountsData
    .map((account) => {
      const metadata = metadataMap.get(account.mint);

      const usdPrice = metadata?.usdPrice ?? null;
      const usdValue =
        usdPrice !== null && account.balance !== null
          ? account.balance * usdPrice
          : null;

      return {
        address: account.mint,
        symbol: metadata?.symbol ?? "UNKNOWN",
        name: metadata?.name ?? "Unknown Token",
        image: metadata?.icon ?? null,
        balance: account.balance,
        decimals: account.decimals,
        usdPrice,
        usdValue,
        metadata, // Keep metadata for filtering
      };
    })
    // Filter out unsafe tokens unless includeUnsafe is true
    .filter((balance) => {
      if (includeUnsafe) return true; // Show all tokens
      if (!balance.metadata) return false; // No metadata = unsafe
      return isSafeToken(balance.metadata);
    })
    .map(({ metadata, ...balance }) => balance); // Remove metadata from final result

  // Sort SPL tokens by USD value (highest first), but keep SOL at the top
  return [
    solBalanceEntry,
    ...splTokenBalances.sort((a, b) => {
      if (a.usdValue !== null && b.usdValue !== null) {
        return b.usdValue - a.usdValue;
      }
      if (a.usdValue !== null) return -1;
      if (b.usdValue !== null) return 1;
      return b.balance - a.balance;
    }),
  ];
}

/**
 * Query options for fetching user token balances
 */
export function userTokenBalancesQueryOptions(
  connection: Connection,
  walletPublicKey: PublicKey | null,
  includeUnsafe: boolean = false
) {
  return queryOptions({
    queryKey: [
      "balances",
      "user-tokens",
      walletPublicKey?.toBase58() ?? "",
      includeUnsafe ? "all" : "safe",
    ],
    queryFn: () => {
      if (!walletPublicKey) {
        throw new Error("Wallet public key is required");
      }
      return fetchUserTokenBalances(connection, walletPublicKey, includeUnsafe);
    },
    enabled: !!walletPublicKey,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}
