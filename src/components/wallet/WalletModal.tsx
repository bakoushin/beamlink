import { useState, useMemo } from "react";
import { type WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal } from "@/components/Modal";
import { useWalletModal } from "@/hooks/use-wallet-modal";
import { WalletListItem } from "@/components/wallet/WalletListItem";
import { MoreWalletsButton } from "@/components/wallet/MoreWalletsButton";
import { NoWalletsFound } from "@/components/wallet/NoWalletsFound";
import { Wallet } from "lucide-react";

export function WalletModal() {
  const { wallets, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);

  const [listedWallets, collapsedWallets] = useMemo(() => {
    const installed = wallets.filter(
      (wallet) => wallet.readyState === WalletReadyState.Installed
    );
    const notInstalled = wallets.filter(
      (wallet) => wallet.readyState !== WalletReadyState.Installed
    );
    return installed.length ? [installed, notInstalled] : [notInstalled, []];
  }, [wallets]);

  const handleWalletClick = (walletName: WalletName) => {
    select(walletName);
    setVisible(false);
  };

  const handleExpandClick = () => setExpanded(!expanded);

  return (
    <Modal
      open={visible}
      onOpenChange={setVisible}
      title={
        <div className="space-y-4">
          <div className="bg-primary/80 text-primary-foreground p-4 rounded-full w-fit mx-auto">
            <Wallet className="size-10" />
          </div>
          <div className="text-3xl font-bold text-center text-balance">
            Connect a wallet on Solana to continue
          </div>
        </div>
      }
      contentClassName="sm:max-w-[425px]"
    >
      <ScrollArea className="max-h-[300px]">
        <div className="flex flex-col gap-2 p-1">
          {listedWallets.map((wallet) => (
            <WalletListItem
              key={wallet.adapter.name}
              wallet={wallet}
              handleClick={() => handleWalletClick(wallet.adapter.name)}
            />
          ))}
        </div>
        {collapsedWallets.length > 0 && (
          <>
            <MoreWalletsButton
              expanded={expanded}
              onClick={handleExpandClick}
            />
            {expanded &&
              collapsedWallets.map((wallet) => (
                <WalletListItem
                  key={wallet.adapter.name}
                  wallet={wallet}
                  handleClick={() => handleWalletClick(wallet.adapter.name)}
                />
              ))}
          </>
        )}
        {wallets.length === 0 && <NoWalletsFound />}
      </ScrollArea>
    </Modal>
  );
}
