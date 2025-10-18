import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Wallet as WalletIcon } from "lucide-react";

interface WalletListItemProps {
  wallet: Wallet;
  handleClick: () => void;
}

export function WalletListItem({ wallet, handleClick }: WalletListItemProps) {
  return (
    <Button
      variant="secondary"
      className="w-full justify-between h-14"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {wallet.adapter.icon ? (
          <img
            src={wallet.adapter.icon}
            alt={`${wallet.adapter.name} icon`}
            className="size-10"
          />
        ) : (
          <WalletIcon className="size-10 text-muted-foreground" />
        )}
        <span className="text-sm">{wallet.adapter.name}</span>
      </div>
      {wallet.readyState === WalletReadyState.Installed && (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          Detected
        </Badge>
      )}
    </Button>
  );
}
