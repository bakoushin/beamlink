import { type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal } from "@/components/Modal";
import { useWalletModal } from "@/hooks/use-wallet-modal";
import { WalletListItem } from "@/components/wallet/WalletListItem";
import { NoWalletsFound } from "@/components/wallet/NoWalletsFound";

export function WalletModal() {
  const { wallets, select } = useWallet();
  const { visible, setVisible } = useWalletModal();

  const handleWalletClick = (walletName: WalletName) => {
    select(walletName);
    setVisible(false);
  };

  return (
    <Modal
      open={visible}
      onOpenChange={setVisible}
      title="Connect a wallet"
      contentClassName="sm:max-w-[425px]"
    >
      <ScrollArea>
        <div className="flex flex-col gap-2 p-1">
          {wallets.map((wallet) => (
            <WalletListItem
              key={wallet.adapter.name}
              wallet={wallet}
              handleClick={() => handleWalletClick(wallet.adapter.name)}
            />
          ))}
        </div>

        {wallets.length === 0 && <NoWalletsFound />}
      </ScrollArea>
    </Modal>
  );
}
