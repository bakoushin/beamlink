"use client";

import * as React from "react";
import { Search, X, BadgeCheck, Wallet, Coins } from "lucide-react";
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
import { formatPrice, formatMarketCap } from "@/lib/formatters";

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
  const [showAllTokens, setShowAllTokens] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Fetch top tokens (always)
  const { data: fetchedTokens, isLoading: isLoadingTopTokens } = useQuery(
    topTokensQueryOptions
  );

  // Fetch user balances (only when wallet is connected)
  const { data: userBalances, isLoading: isLoadingBalances } = useQuery(
    userTokenBalancesQueryOptions(connection, publicKey, showAllTokens)
  );

  // Determine which data to use
  const isWalletConnected = !!publicKey;
  const displayUserBalances = isWalletConnected && userBalances;
  const isLoading = isWalletConnected ? isLoadingBalances : isLoadingTopTokens;

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Reset showAllTokens when closing the modal
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowAllTokens(false);
    }
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
          showAllTokens={showAllTokens}
          onShowAllTokens={() => setShowAllTokens(true)}
          onTokenSelect={handleTokenSelect}
        />
      ) : (
        <TokenList
          tokens={tokens || fetchedTokens || []}
          isLoading={isLoading}
          onTokenSelect={handleTokenSelect}
        />
      )}
    </Modal>
  );
}

function TokenList({
  tokens,
  isLoading,
  onTokenSelect,
}: {
  tokens: Token[];
  isLoading?: boolean;
  onTokenSelect?: (token: Token) => void;
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
        className="overflow-y-auto flex-1 -mx-4 px-4"
        style={{ maxHeight: "calc(80vh - 180px)" }}
      >
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading tokens...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <TokenItem
                  key={token.id}
                  token={token}
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

function TokenItem({
  token,
  onSelect,
}: {
  token: Token;
  onSelect?: (token: Token) => void;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  return (
    <Item size="sm" asChild>
      <button
        className="w-full text-left hover:bg-accent"
        onClick={() => onSelect?.(token)}
      >
        <ItemMedia variant="image">
          <div className="relative w-10 h-10">
            {/* Show fallback icon until image loads or if there's an error */}
            {(!imageLoaded || imageError || !token.icon) && (
              <div className="absolute inset-0 rounded-full bg-muted flex items-center justify-center">
                <Coins className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {/* Load image in background */}
            {token.icon && !imageError && (
              <img
                src={token.icon}
                alt={token.name}
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
          <div className="flex items-center gap-1">
            <ItemTitle>{token.name}</ItemTitle>
            {token.isVerified && (
              <BadgeCheck
                className="h-4 w-4 text-blue-500 flex-shrink-0"
                aria-label="Verified token"
              />
            )}
          </div>
          <ItemDescription>{token.symbol}</ItemDescription>
        </ItemContent>
        <ItemContent className="items-end">
          <ItemTitle>{formatPrice(token.usdPrice)}</ItemTitle>
          <ItemDescription>{formatMarketCap(token.mcap)}</ItemDescription>
        </ItemContent>
      </button>
    </Item>
  );
}

function BalancesList({
  balances,
  isLoading,
  showAllTokens,
  onShowAllTokens,
  onTokenSelect,
}: {
  balances: UserTokenBalance[];
  isLoading?: boolean;
  showAllTokens: boolean;
  onShowAllTokens: () => void;
  onTokenSelect?: (balance: UserTokenBalance) => void;
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
    <div className="px-4 flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          id="search"
          placeholder="Search your tokens"
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
          <div className="flex flex-col gap-2">
            {filteredBalances.length > 0 ? (
              <>
                {filteredBalances.map((balance) => (
                  <BalanceItem
                    key={balance.address}
                    balance={balance}
                    onSelect={onTokenSelect}
                  />
                ))}
                {!showAllTokens && (
                  <div className="flex justify-center pt-2 pb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowAllTokens}
                      className="text-sm"
                    >
                      Show all tokens
                    </Button>
                  </div>
                )}
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

function BalanceItem({
  balance,
  onSelect,
}: {
  balance: UserTokenBalance;
  onSelect?: (balance: UserTokenBalance) => void;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  return (
    <Item size="sm" asChild>
      <button
        className="w-full text-left hover:bg-accent"
        onClick={() => onSelect?.(balance)}
      >
        <ItemMedia variant="image">
          <div className="relative w-10 h-10">
            {/* Show fallback icon until image loads or if there's an error */}
            {(!imageLoaded || imageError || !balance.image) && (
              <div className="absolute inset-0 rounded-full bg-muted flex items-center justify-center">
                <Coins className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {/* Load image in background */}
            {balance.image && !imageError && (
              <img
                src={balance.image}
                alt={balance.name}
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
          <ItemTitle>{balance.symbol}</ItemTitle>
          <ItemDescription>
            {balance.balance.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}
          </ItemDescription>
        </ItemContent>
        <ItemContent className="items-end">
          <ItemTitle>
            {balance.usdValue !== null ? formatPrice(balance.usdValue) : "—"}
          </ItemTitle>
          <ItemDescription>
            {balance.usdPrice !== null
              ? formatPrice(balance.usdPrice)
              : "No price"}
          </ItemDescription>
        </ItemContent>
      </button>
    </Item>
  );
}
