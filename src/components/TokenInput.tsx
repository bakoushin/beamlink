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
  hasInsufficientBalance?: boolean;
}

export function TokenInput({
  value,
  onValueChange,
  selectedToken,
  onTokenSelect,
  onTokenDeselect,
  disabled = false,
  className = "",
  placeholder = "0",
  hasInsufficientBalance = false,
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

  // Clear value when token changes
  React.useEffect(() => {
    if (selectedToken) {
      onValueChange("");
    }
  }, [selectedToken, onValueChange]);

  // Get token icon - handle both Token and UserTokenBalance types
  const tokenIcon = selectedToken
    ? "icon" in selectedToken
      ? selectedToken.icon
      : selectedToken.image
    : null;

  const tokenSymbol = selectedToken?.symbol ?? null;
  const tokenDecimals = selectedToken?.decimals ?? 9;

  // Cleanup function for input values
  const cleanInputValue = (value: string): string => {
    return value
      .replace(/[^\d,.]/g, "") // keep only digits, commas, and dots
      .replace(/^0+(\d)/, "$1") // remove leading zeros
      .replace(/[,.](?=.*[,.])/g, "") // remove grouping separators (comma/dot with another comma/dot after)
      .replace(",", ".") // convert remaining comma to a dot
      .replace(/^\./, "0."); // if the input starts with decimal separator then turn it into "0."
  };

  // Handle key down events for input validation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const key = e.key;
    const cursorPos = target.selectionStart || 0;

    // Allow Ctrl/Cmd combinations (copy, paste, select all, etc.)
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow navigation and editing keys
    const allowedNavigationKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Tab",
      "Enter",
      "Escape",
    ];

    // Check if key is digit, comma, dot, or allowed navigation key
    const isDigit = /^[\d,.]$/.test(key);
    const isAllowedKey = allowedNavigationKeys.includes(key);

    if (!isDigit && !isAllowedKey) {
      e.preventDefault();
      return;
    }

    const newValue = value.slice(0, cursorPos) + key + value.slice(cursorPos);

    // Prevent adding a separator when there's already one
    if (value.includes(".") && (key === "." || key === ",")) {
      const prevSeparatorCount = (value.match(/[,.]/g) || []).length;
      const newSeparatorCount = (newValue.match(/[,.]/g) || []).length;

      // If an additional separator would be added
      if (newSeparatorCount === prevSeparatorCount + 1) {
        // Remove all separators and compare the rest
        const prevWithoutSeparators = value.replace(/[,.]/g, "");
        const newWithoutSeparators = newValue.replace(/[,.]/g, "");
        if (prevWithoutSeparators === newWithoutSeparators) {
          e.preventDefault();
          return;
        }
      }
    }

    // Check if the new character would exceed decimal limits
    const cleanValue = cleanInputValue(newValue);

    const maxDecimals = tokenDecimals;
    const decimalRegex = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`);
    const isValid = decimalRegex.test(cleanValue);

    if (!isValid) {
      e.preventDefault();
      return;
    }
  };

  // Get USD price - handle both Token and UserTokenBalance types
  const usdPrice = selectedToken
    ? "usdPrice" in selectedToken && selectedToken.usdPrice !== null
      ? selectedToken.usdPrice
      : null
    : null;

  // Calculate USD value
  const usdValue = React.useMemo(() => {
    if (!usdPrice) return "no-price"; // Special value to indicate no price available
    if (!value || value === "0" || value === "0.") return "zero"; // Special value for empty input with price
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "zero";
    return numValue * usdPrice;
  }, [value, usdPrice]);

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    // If no token is selected, don't allow input
    if (!selectedToken) {
      return;
    }

    const inputValue = e.target.value;
    const cleanedValue = cleanInputValue(inputValue);

    // Apply decimal limit based on token decimals
    const maxDecimals = tokenDecimals;
    const parts = cleanedValue.split(".");
    let finalValue = cleanedValue;

    if (parts.length === 2 && parts[1].length > maxDecimals) {
      finalValue = parts[0] + "." + parts[1].slice(0, maxDecimals);
    }

    onValueChange(finalValue);
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
          flex items-center gap-2 p-4 
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
        <div className="flex-1 flex flex-col gap-1 min-w-0 relative">
          {/* Send label - absolutely positioned */}
          <div className="absolute -top-2 left-0 text-sm text-muted-foreground/70 text-left">
            Send
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || !selectedToken}
            className={`
              text-3xl font-semibold bg-transparent border-none outline-none 
              w-full placeholder:text-muted-foreground/40
              disabled:cursor-not-allowed py-6
              ${hasInsufficientBalance ? "text-red-600" : ""}
              ${!selectedToken ? "cursor-pointer" : ""}
            `}
            onFocus={(e) => {
              if (!selectedToken) {
                e.target.blur();
                setIsTokenSelectorOpen(true);
              }
            }}
          />
          {/* USD value - absolutely positioned */}
          <div className="absolute -bottom-2 left-0 text-sm text-muted-foreground/70 text-left">
            {usdValue === "no-price" ? (
              <span>—</span>
            ) : usdValue === "zero" ? (
              <span>$0</span>
            ) : (
              <span>{formatPrice(usdValue)}</span>
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
