import { Button } from "@/components/ui/button";
import type { Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

interface WalletListItemProps {
  wallet: Wallet;
  handleClick: () => void;
}

export function WalletListItem({ wallet, handleClick }: WalletListItemProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between gap-4 px-4 py-2 first:mt-2 last:mb-2"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <img
          src={wallet.adapter.icon || "/placeholder.svg"}
          alt={`${wallet.adapter.name} icon`}
          className="w-6 h-6"
        />
        <span className="text-lg font-semibold">{wallet.adapter.name}</span>
      </div>
      {wallet.readyState === WalletReadyState.Installed && (
        <span className="text-sm text-muted-foreground">Detected</span>
      )}
    </Button>
  );
}
