import { useMemo, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "./App.css";
import { TokenInput } from "@/components/TokenInput";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { topTokensQueryOptions } from "@/queries/tokens";
import { WalletModalProvider } from "@/hooks/use-wallet-modal";
import { WalletModal } from "@/components/wallet/WalletModal";
import { WalletMultiButton } from "@/components/wallet/WalletMultiButton";
import { useDeposit } from "@/hooks/use-deposit";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ExternalLink, Share } from "lucide-react";
import type { Token } from "@/types/token";
import type { UserTokenBalance } from "@/queries";

function App() {
  const queryClient = new QueryClient();

  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    // const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    // if (alchemyApiKey) {
    //   return `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    // }
    // // Fallback to public RPC if no API key is provided
    // return "https://api.mainnet-beta.solana.com";

    // Use local network for development
    return "http://127.0.0.1:8899";
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new UnsafeBurnerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletModal />
            <AppContent />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  // Prefetch top tokens on app mount
  useQuery(topTokensQueryOptions);

  const [tokenAmount, setTokenAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<
    Token | UserTokenBalance | null
  >(null);
  const [depositResult, setDepositResult] = useState<{
    signature: string;
    depositId: string;
    privateKey: string;
  } | null>(null);
  const [isWaitingForWallet, setIsWaitingForWallet] = useState(false);

  const { deposit, isLoading, error } = useDeposit();

  const handleDeposit = async () => {
    if (!selectedToken || !tokenAmount) {
      return;
    }

    setIsWaitingForWallet(true);
    try {
      const result = await deposit(selectedToken, tokenAmount);
      setDepositResult({
        signature: result.signature,
        depositId: result.depositId,
        privateKey: result.privateKey,
      });
      // Reset form after successful deposit
      setTokenAmount("");
      setSelectedToken(null);
    } catch (err) {
      console.error("Deposit failed:", err);
    } finally {
      setIsWaitingForWallet(false);
    }
  };

  const handleNewDeposit = () => {
    setDepositResult(null);
    setIsWaitingForWallet(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const shareDepositLink = async (link: string) => {
    const shareData = {
      title: "Deposit Link",
      text: "Check out this deposit link",
      url: link,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copyToClipboard(link);
        // You could show a toast notification here
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
      // Fallback: copy to clipboard
      await copyToClipboard(link);
      alert("Link copied to clipboard!");
    }
  };

  const canDeposit =
    selectedToken && tokenAmount && parseFloat(tokenAmount) > 0;

  // Show loading state when waiting for wallet interaction
  if (isWaitingForWallet) {
    return (
      <div className="min-h-screen flex flex-col items-center p-8 gap-8">
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <WalletMultiButton />

          <div className="flex flex-col items-center gap-4 p-8 bg-blue-50 rounded-lg w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900">
                Confirm Deposit
              </h3>
              <p className="text-blue-700">
                Please confirm the deposit in your wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state after deposit is confirmed
  if (depositResult) {
    const depositLink = `${window.location.origin}/#/${depositResult.privateKey}`;

    return (
      <div className="min-h-screen flex flex-col items-center p-8 gap-8">
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <WalletMultiButton />

          <div className="flex flex-col items-center gap-4 p-8 bg-green-50 rounded-lg w-full">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-600 animate-pulse" />
              <div className="absolute inset-0 h-16 w-16 border-4 border-green-200 rounded-full animate-ping"></div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Deposit Created!
              </h3>
              <p className="text-green-700 mb-4">
                Your deposit has been successfully created
              </p>
            </div>

            <div className="w-full space-y-3">
              <div className="bg-white p-3 rounded-lg border">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Deposit Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={depositLink}
                    readOnly
                    className="flex-1 text-xs bg-gray-50 p-2 rounded border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(depositLink)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(depositLink, "_blank")}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Link
                </Button>

                <Button
                  onClick={() => shareDepositLink(depositLink)}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <Button onClick={handleNewDeposit} className="w-full">
                Create New Deposit
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default form state
  return (
    <div className="min-h-screen flex flex-col items-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <WalletMultiButton />

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Token Deposit</h2>
          <TokenInput
            value={tokenAmount}
            onValueChange={setTokenAmount}
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
          />
        </div>

        {selectedToken && tokenAmount && (
          <div className="text-sm text-muted-foreground">
            You entered: {tokenAmount} {selectedToken.symbol}
          </div>
        )}

        <Button
          onClick={handleDeposit}
          disabled={!canDeposit || isLoading}
          className="w-full"
        >
          {isLoading ? "Processing Deposit..." : "Deposit"}
        </Button>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg w-full">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
