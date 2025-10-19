import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";

interface FaucetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaucetModal({ open, onOpenChange }: FaucetModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Get Devnet Tokens"
      contentClassName="max-w-md"
      drawerContentClassName="h-[60vh] max-h-[500px]"
    >
      <div className="flex flex-col gap-4 px-6 py-4 sm:px-4 sm:py-0 h-full">
        <div className="text-sm text-muted-foreground">
          BeamLinks are deployed on Solana Devnet for testing purposes. You'll
          need some devnet SOL and might want to get some other devnet tokens to
          test the functionality.
        </div>

        <div className="overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="Solana"
                className="h-5 w-5 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">Devnet SOL</div>
                <div className="text-sm text-muted-foreground">
                  Get free SOL for transaction fees
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://faucet.solana.com", "_blank")
                }
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Get SOL
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                alt="USDC"
                className="h-5 w-5 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">Devnet USDC</div>
                <div className="text-sm text-muted-foreground">
                  Get free USDC for testing transfers
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://faucet.circle.com", "_blank")
                }
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Get USDC
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Note:</strong> These are testnet tokens with no real
              value. Make sure your wallet is connected to Solana Devnet.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
