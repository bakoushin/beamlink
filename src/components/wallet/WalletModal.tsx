import { type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal } from "@/components/Modal";
import { WalletListItem } from "@/components/wallet/WalletListItem";
import { NoWalletsFound } from "@/components/wallet/NoWalletsFound";

interface WalletModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export function WalletModal({ visible, setVisible }: WalletModalProps) {
  const { wallets, select } = useWallet();

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
      <ScrollArea className="max-h-[60vh]">
        <div className="flex flex-col gap-2 p-3 pt-0 sm:pt-1 sm:p-0">
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
