"use client";

import * as React from "react";
import { Search, X, Wallet, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { Modal } from "@/components/Modal";
import {
  topTokensQueryOptions,
  userTokenBalancesQueryOptions,
  type UserTokenBalance,
} from "@/queries";
import type { Token } from "@/types/token";
import { formatPrice, formatTokenBalance } from "@/lib/formatters";

interface TokenSelectorProps {
  tokens?: Token[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTokenSelect?: (token: Token | UserTokenBalance) => void;
  trigger?: React.ReactNode;
}

export function TokenSelector({
  tokens,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onTokenSelect,
  trigger,
}: TokenSelectorProps) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Fetch top tokens (always)
  const { data: fetchedTokens, isLoading: isLoadingTopTokens } = useQuery(
    topTokensQueryOptions
  );

  // Fetch user balances (only when wallet is connected)
  const { data: userBalances, isLoading: isLoadingBalances } = useQuery(
    userTokenBalancesQueryOptions(connection, publicKey, true)
  );

  // Determine which data to use
  const isWalletConnected = !!publicKey;
  const displayUserBalances = isWalletConnected && userBalances;
  const isLoading = isWalletConnected ? isLoadingBalances : isLoadingTopTokens;

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Handle modal open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  // Handle token selection
  const handleTokenSelect = (token: Token | UserTokenBalance) => {
    if (onTokenSelect) {
      onTokenSelect(token);
    }
    handleOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        trigger || (
          <Button variant="outline" disabled={isLoading}>
            {isLoading ? "Loading..." : "Select Token"}
          </Button>
        )
      }
      title={displayUserBalances ? "Your Tokens" : "Select a token"}
      dialogContentClassName="sm:max-w-[425px]"
      drawerContentClassName="h-[80vh]"
      repositionInputs={false}
    >
      {displayUserBalances ? (
        <BalancesList
          balances={userBalances}
          isLoading={isLoading}
          onTokenSelect={handleTokenSelect}
        />
      ) : (
        <TokenList
          tokens={tokens || fetchedTokens || []}
          userBalances={userBalances}
          isLoading={isLoading}
          onTokenSelect={handleTokenSelect}
        />
      )}
    </Modal>
  );
}

function TokenList({
  tokens,
  userBalances,
  isLoading,
  onTokenSelect,
}: {
  tokens: Token[];
  userBalances?: UserTokenBalance[];
  isLoading?: boolean;
  onTokenSelect?: (token: Token | UserTokenBalance) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredTokens = tokens.filter((token) => {
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.id.toLowerCase().includes(query)
    );
  });

  // Helper function to find user balance for a token
  const getUserBalance = (token: Token): UserTokenBalance | null => {
    if (!userBalances) return null;
    return userBalances.find((balance) => balance.address === token.id) || null;
  };

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          id="search"
          placeholder="Search by name or symbol"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
          disabled={isLoading}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        className="overflow-y-auto flex-1"
        style={{ maxHeight: "calc(80vh - 180px)" }}
      >
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading tokens...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <TokenRow
                  key={token.id}
                  token={token}
                  userBalance={getUserBalance(token)}
                  onSelect={onTokenSelect}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No tokens found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TokenRow({
  token,
  userBalance,
  onSelect,
}: {
  token: Token;
  userBalance?: UserTokenBalance | null;
  onSelect?: (item: Token | UserTokenBalance) => void;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const hasBalance = !!userBalance;
  // Always use token data as primary source, userBalance as fallback
  const tokenIcon = token.icon || userBalance?.image || "";
  const tokenName = token.name || userBalance?.name || "";
  const tokenSymbol = token.symbol || userBalance?.symbol || "";
  const tokenAddress = token.id || userBalance?.address || "";

  const handleClick = () => {
    if (onSelect) {
      onSelect(hasBalance ? userBalance : token);
    }
  };

  return (
    <Item size="sm" asChild>
      <Button
        className="w-full text-left hover:bg-accent h-14 px-0"
        onClick={handleClick}
      >
        <ItemMedia variant="image">
          <div className="relative w-10 h-10">
            {/* Show fallback icon until image loads or if there's an error */}
            {(!imageLoaded || imageError || !tokenIcon) && (
              <div className="absolute inset-0 rounded-full bg-muted flex items-center justify-center">
                <Coins className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {/* Load image in background */}
            {tokenIcon && !imageError && (
              <img
                src={tokenIcon}
                alt={tokenName}
                className={`rounded-full w-10 h-10 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-foreground">{tokenSymbol}</ItemTitle>
          <ItemDescription className="font-mono text-xs">
            {tokenAddress.slice(0, 4)}...{tokenAddress.slice(-4)}
          </ItemDescription>
        </ItemContent>
        <ItemContent className="items-end">
          {hasBalance ? (
            <>
              <ItemTitle className="text-foreground">
                {formatTokenBalance(userBalance.balance)}
              </ItemTitle>
              <ItemDescription>
                {userBalance.usdValue !== null
                  ? formatPrice(userBalance.usdValue)
                  : "—"}
              </ItemDescription>
            </>
          ) : (
            <>
              <ItemTitle></ItemTitle>
              <ItemDescription className="text-muted-foreground">
                {formatPrice(token.usdPrice)}
              </ItemDescription>
            </>
          )}
        </ItemContent>
      </Button>
    </Item>
  );
}

// Helper function to convert UserTokenBalance to Token format for TokenRow
function userBalanceToToken(balance: UserTokenBalance): Token {
  return {
    id: balance.address,
    name: balance.name,
    symbol: balance.symbol,
    icon: balance.image || "",
    decimals: balance.decimals,
    usdPrice: balance.usdPrice || 0,
    // Add minimal required fields for Token interface
    circSupply: 0,
    totalSupply: 0,
    tokenProgram: "",
    firstPool: { id: "", createdAt: "" },
    holderCount: 0,
    audit: { topHoldersPercentage: 0 },
    organicScore: 0,
    organicScoreLabel: "",
    tags: [],
    fdv: 0,
    mcap: 0,
    priceBlockId: 0,
    liquidity: 0,
    stats5m: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats1h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats6h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats24h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    updatedAt: "",
  };
}

function BalancesList({
  balances,
  isLoading,
  onTokenSelect,
}: {
  balances: UserTokenBalance[];
  isLoading?: boolean;
  onTokenSelect?: (balance: UserTokenBalance | Token) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredBalances = balances.filter((balance) => {
    const query = searchQuery.toLowerCase();
    return (
      balance.name.toLowerCase().includes(query) ||
      balance.symbol.toLowerCase().includes(query) ||
      balance.address.toLowerCase().includes(query)
    );
  });

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-0 sm:px-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          id="search"
          placeholder="Search by symbol or address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
          disabled={isLoading}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        className="overflow-y-auto flex-1 -mx-4 px-4"
        style={{ maxHeight: "calc(80vh - 180px)" }}
      >
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading your tokens...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBalances.length > 0 ? (
              <>
                {filteredBalances.map((balance) => (
                  <TokenRow
                    key={balance.address}
                    token={userBalanceToToken(balance)}
                    userBalance={balance}
                    onSelect={onTokenSelect}
                  />
                ))}
              </>
            ) : balances.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tokens found in your wallet</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No tokens found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
