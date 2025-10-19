"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { ArrowRightLeft, LogOut, Copy, Check } from "lucide-react";
import { useWalletModal } from "@/hooks/use-wallet-modal";
import { useQuery } from "@tanstack/react-query";
import { userTokenBalancesQueryOptions } from "@/queries/balances";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface WalletMultiButtonProps {
  labels?: {
    "copy-address": string;
    copied: string;
    "change-wallet": string;
    disconnect: string;
    connecting: string;
    connected: string;
    "has-wallet": string;
    "no-wallet": string;
  };
}

export function WalletMultiButton({
  labels = {
    "copy-address": "Copy address",
    copied: "Copied",
    "change-wallet": "Change wallet",
    disconnect: "Disconnect",
    connecting: "Connecting...",
    connected: "Connected",
    "has-wallet": "Connect",
    "no-wallet": "Connect Wallet",
  },
}: WalletMultiButtonProps) {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fetch SOL balance
  const { data: balances } = useQuery(
    userTokenBalancesQueryOptions(connection, publicKey, false)
  );
  const solBalance =
    balances?.find((balance) => balance.symbol === "SOL")?.balance || 0;

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const content = useMemo(() => {
    if (connecting) return labels["connecting"];
    if (wallet && publicKey)
      return base58
        ? `${base58.slice(0, 4)}...${base58.slice(-4)}`
        : labels["connected"];
    return labels["no-wallet"];
  }, [connecting, wallet, publicKey, base58, labels]);

  const copyAddress = async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const openModal = () => {
    setVisible(true);
    setDialogOpen(false);
  };

  const disconnectWallet = () => {
    disconnect();
    setDialogOpen(false);
  };

  if (!wallet || !publicKey) {
    return <Button onClick={openModal}>{content}</Button>;
  }

  return (
    <>
      <Button
        variant="secondary"
        className="gap-4"
        onClick={() => setDialogOpen(true)}
      >
        {wallet.adapter.icon && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-6 h-6 -mx-2.5"
          />
        )}
        {content}
      </Button>

      <Modal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isDesktop ? "Wallet" : undefined}
        contentClassName="sm:max-w-[425px]"
      >
        <div className="flex flex-col items-center space-y-3 p-3 pt-0 sm:pt-1 sm:p-0">
          {/* Wallet Icon */}
          <div className="flex flex-col items-center space-y-2 mt-4">
            {wallet.adapter.icon && (
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className="w-16 h-16"
              />
            )}
            <div className="text-sm text-gray-500 dark:text-gray-500">
              {wallet.adapter.name}
            </div>
          </div>

          {/* Address with Copy */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
              onClick={copyAddress}
            >
              <span className="font-mono text-base text-gray-600 dark:text-gray-400">
                {base58 ? `${base58.slice(0, 10)}...${base58.slice(-10)}` : ""}
              </span>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* SOL Balance */}
          <div className="text-center">
            <div className="text-md text-gray-500 dark:text-gray-500">
              {solBalance.toFixed(4)}{" "}
              <span className="text-gray-500 dark:text-gray-500">SOL</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 w-full mt-4">
            <Button
              variant="secondary"
              onClick={openModal}
              className="w-full justify-start h-12"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              {labels["change-wallet"]}
            </Button>

            <Button
              variant="secondary"
              onClick={disconnectWallet}
              className="w-full justify-start h-12"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {labels["disconnect"]}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
