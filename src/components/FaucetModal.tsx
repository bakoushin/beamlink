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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 120 120"
                className="rounded-full"
              >
                <path
                  fill="#0B53BF"
                  d="M60 120c33.137 0 60-26.863 60-60S93.137 0 60 0 0 26.863 0 60s26.863 60 60 60"
                ></path>
                <path
                  fill="#fff"
                  stroke="#0B53BF"
                  strokeMiterlimit="10"
                  strokeWidth="0.035"
                  d="M72.749 74.287c-2.625 1.05-5.475 1.65-8.212 1.65-5.422 0-10.533-2.308-12.976-7.875h11.926l2.324-5.624H50.174A26 26 0 0 1 50.062 60q0-1.275.112-2.438h17.625l2.325-5.625H51.562c2.442-5.566 7.553-7.875 12.975-7.875 2.737 0 5.587.6 8.212 1.65l2.4-5.7c-3.225-1.687-6.862-2.512-10.5-2.512-8.78 0-17.654 4.908-20.867 14.437h-5.758v5.625h4.605a28 28 0 0 0 0 4.876h-4.605v5.624h5.758C46.995 77.592 55.87 82.5 64.65 82.5c3.638 0 7.275-.825 10.5-2.513z"
                ></path>
                <path
                  fill="#fff"
                  stroke="#0B53BF"
                  strokeMiterlimit="10"
                  strokeWidth="0.035"
                  d="M22.499 60c0-16.988 11.287-31.313 26.7-35.963v-7.725c-19.65 4.8-34.2 22.538-34.2 43.688s14.55 38.887 34.2 43.687v-7.725C33.786 91.35 22.499 76.987 22.499 60ZM70.799 16.312v7.725c15.412 4.65 26.7 18.975 26.7 35.963 0 16.987-11.287 31.312-26.7 35.962v7.725c19.65-4.8 34.2-22.537 34.2-43.687s-14.55-38.888-34.2-43.688Z"
                ></path>
              </svg>
              <div className="flex-1">
                <div className="font-medium">Devnet EURC</div>
                <div className="text-sm text-muted-foreground">
                  Get free EURC for testing transfers
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
                Get EURC
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
