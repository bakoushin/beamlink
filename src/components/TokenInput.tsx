"use client";

import * as React from "react";
import { Coins, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "@/TokenSelector";
import type { Token } from "@/types/token";
import type { UserTokenBalance } from "@/queries";
import { formatPrice } from "@/lib/formatters";

interface TokenInputProps {
  value: string;
  onValueChange: (value: string) => void;
  selectedToken: Token | UserTokenBalance | null;
  onTokenSelect: (token: Token | UserTokenBalance) => void;
  onTokenDeselect?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TokenInput({
  value,
  onValueChange,
  selectedToken,
  onTokenSelect,
  onTokenDeselect,
  disabled = false,
  className = "",
  placeholder = "0.00",
}: TokenInputProps) {
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset image state when token changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [selectedToken]);

  // Get token icon - handle both Token and UserTokenBalance types
  const tokenIcon = selectedToken
    ? "icon" in selectedToken
      ? selectedToken.icon
      : selectedToken.image
    : null;

  const tokenSymbol = selectedToken?.symbol ?? null;
  const tokenDecimals = selectedToken?.decimals ?? 9;

  // Get USD price - handle both Token and UserTokenBalance types
  const usdPrice = selectedToken
    ? "usdPrice" in selectedToken && selectedToken.usdPrice !== null
      ? selectedToken.usdPrice
      : null
    : null;

  // Calculate USD value
  const usdValue = React.useMemo(() => {
    if (!value || !usdPrice || value === "0" || value === "0.") return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return numValue * usdPrice;
  }, [value, usdPrice]);

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    let inputValue = e.target.value;

    // If no token is selected, don't allow input
    if (!selectedToken) {
      return;
    }

    // Remove any characters that are not numbers, dots, or commas
    inputValue = inputValue.replace(/[^\d.,]/g, "");

    // Replace commas with dots for consistency
    inputValue = inputValue.replace(/,/g, ".");

    // Only allow one decimal point
    const parts = inputValue.split(".");
    if (parts.length > 2) {
      inputValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit decimal places based on token decimals
    if (parts.length === 2 && parts[1].length > tokenDecimals) {
      inputValue = parts[0] + "." + parts[1].slice(0, tokenDecimals);
    }

    // Don't allow multiple leading zeros
    if (
      inputValue.length > 1 &&
      inputValue[0] === "0" &&
      inputValue[1] !== "."
    ) {
      inputValue = inputValue.replace(/^0+/, "0");
    }

    onValueChange(inputValue);
  };

  // Handle container click - open token selector if no token selected
  const handleContainerClick = () => {
    if (!selectedToken && !disabled) {
      setIsTokenSelectorOpen(true);
    } else if (selectedToken && !disabled) {
      inputRef.current?.focus();
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: Token | UserTokenBalance) => {
    onTokenSelect(token);
    setIsTokenSelectorOpen(false);
    // Focus input after token is selected
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main input container */}
      <div
        onClick={handleContainerClick}
        className={`
          flex items-start gap-2 p-4 
          rounded-lg border bg-background
          transition-all duration-200
          ${
            !selectedToken
              ? "cursor-pointer hover:border-primary/50"
              : disabled
              ? "cursor-not-allowed opacity-50"
              : ""
          }
        `}
      >
        {/* Input area */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || !selectedToken}
            className={`
              text-3xl font-semibold bg-transparent border-none outline-none 
              w-full placeholder:text-muted-foreground/40
              disabled:cursor-not-allowed
              ${!selectedToken ? "cursor-pointer" : ""}
            `}
            onFocus={(e) => {
              if (!selectedToken) {
                e.target.blur();
                setIsTokenSelectorOpen(true);
              }
            }}
          />
          {/* USD value */}
          <div className="text-sm text-muted-foreground">
            {usdValue !== null ? (
              <span>{formatPrice(usdValue)}</span>
            ) : (
              <span className="opacity-0">—</span>
            )}
          </div>
        </div>

        {/* Token selector button */}
        <TokenSelector
          open={isTokenSelectorOpen}
          onOpenChange={setIsTokenSelectorOpen}
          onTokenSelect={handleTokenSelect}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={`
                flex items-center gap-2 h-10 px-3
                hover:bg-accent
                ${!selectedToken ? "min-w-[140px]" : ""}
              `}
              onClick={(e) => {
                e.stopPropagation();
                setIsTokenSelectorOpen(true);
              }}
            >
              {selectedToken ? (
                <>
                  <div className="relative w-6 h-6 flex-shrink-0">
                    {/* Fallback icon */}
                    {(!imageLoaded || imageError || !tokenIcon) && (
                      <div className="absolute inset-0 rounded-full bg-muted flex items-center justify-center">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {/* Token icon */}
                    {tokenIcon && !imageError && (
                      <img
                        src={tokenIcon}
                        alt={tokenSymbol || "Token"}
                        className={`rounded-full w-6 h-6 ${
                          imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                      />
                    )}
                  </div>
                  <span className="font-semibold">{tokenSymbol}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              ) : (
                <>
                  <span className="font-semibold">Select token</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </Button>
          }
        />
      </div>
    </div>
  );
}

