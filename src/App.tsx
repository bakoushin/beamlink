import { useMemo, useState, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
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
import { WalletModalProvider, useWalletModal } from "@/hooks/use-wallet-modal";
import { WalletMultiButton } from "@/components/wallet/WalletMultiButton";
import { useDeposit } from "@/hooks/use-deposit";
import { useWithdraw } from "@/hooks/use-withdraw";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Share,
  AlertCircle,
  DollarSign,
} from "lucide-react";
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

  // Wallet connection state
  const { publicKey, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  // Parse URL hash for withdraw flow
  const [privateKey, setPrivateKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#/") && hash.length > 2) {
      const extractedKey = hash.substring(2); // Remove '#/' prefix
      setPrivateKey(extractedKey);
    }
  }, []);

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
  const [claimResult, setClaimResult] = useState<string | null>(null);

  const { deposit, isLoading, error } = useDeposit();
  const {
    withdrawInfo,
    isLoading: isWithdrawLoading,
    error: withdrawError,
    claim,
    isClaiming,
  } = useWithdraw(privateKey);

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

  const handleClaim = async () => {
    try {
      const signature = await claim();
      setClaimResult(signature);
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  const handleNewWithdraw = () => {
    setPrivateKey(undefined);
    setClaimResult(null);
    // Clear the hash from URL
    window.history.replaceState(null, "", window.location.pathname);
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

  // Check if wallet is connected
  const isWalletConnected = wallet && publicKey;

  // Button text based on wallet connection state
  const getButtonText = () => {
    if (isLoading) return "Processing Deposit...";
    if (!isWalletConnected) return "Connect wallet";
    return "Create BeamLink";
  };

  // Handle button click
  const handleButtonClick = () => {
    if (!isWalletConnected) {
      setVisible(true);
      return;
    }
    handleDeposit();
  };

  // Show withdraw interface if private key is present in URL
  if (privateKey) {
    // Show loading state while fetching withdraw info
    if (isWithdrawLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center p-8 gap-8">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <WalletMultiButton />

            <div className="flex flex-col items-center gap-4 p-8 bg-blue-50 rounded-lg w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-900">
                  Loading Deposit Info
                </h3>
                <p className="text-blue-700">Fetching deposit information...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show error state if withdraw info failed to load
    if (withdrawError || (withdrawInfo && withdrawInfo.error)) {
      return (
        <div className="min-h-screen flex flex-col items-center p-8 gap-8">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <WalletMultiButton />

            <div className="flex flex-col items-center gap-4 p-8 bg-red-50 rounded-lg w-full">
              <AlertCircle className="h-16 w-16 text-red-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Invalid Deposit Link
                </h3>
                <p className="text-red-700 mb-4">
                  {withdrawError ||
                    withdrawInfo?.error ||
                    "This deposit link is invalid or has expired."}
                </p>
              </div>
              <Button onClick={handleNewWithdraw} variant="outline">
                Create New Deposit
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show claim success state
    if (claimResult) {
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
                  Successfully Claimed!
                </h3>
                <p className="text-green-700 mb-4">
                  Your deposit has been claimed to your wallet
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="bg-white p-3 rounded-lg border">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Transaction Signature:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={claimResult}
                      readOnly
                      className="flex-1 text-xs bg-gray-50 p-2 rounded border"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(claimResult)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <Button onClick={handleNewWithdraw} className="w-full">
                  Create New Deposit
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show withdraw interface
    if (withdrawInfo) {
      return (
        <div className="min-h-screen flex flex-col items-center p-8 gap-8">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <WalletMultiButton />

            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Claim Deposit</h2>

              <div className="bg-white p-6 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Amount:
                  </span>
                  <span className="text-lg font-semibold">
                    {withdrawInfo.amount} {withdrawInfo.token?.symbol}
                  </span>
                </div>

                {withdrawInfo.usdValue && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      USD Value:
                    </span>
                    <span className="text-lg font-semibold">
                      ${withdrawInfo.usdValue.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Status:
                  </span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      withdrawInfo.isClaimed
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {withdrawInfo.isClaimed
                      ? "Already Claimed"
                      : "Available to Claim"}
                  </span>
                </div>

                {withdrawInfo.token && (
                  <div className="flex items-center gap-2 pt-2">
                    <img
                      src={withdrawInfo.token.icon}
                      alt={withdrawInfo.token.symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {withdrawInfo.token.name} ({withdrawInfo.token.symbol})
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {withdrawInfo.isClaimed ? (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">
                      This deposit has already been claimed
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full"
                  >
                    {isClaiming ? "Claiming..." : "Claim Deposit"}
                  </Button>
                )}

                <Button
                  onClick={handleNewWithdraw}
                  variant="outline"
                  className="w-full"
                >
                  Create New Deposit
                </Button>
              </div>

              {withdrawError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg w-full">
                  Error: {withdrawError}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

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
          onClick={handleButtonClick}
          disabled={!isWalletConnected ? false : (!canDeposit || isLoading)}
          className="w-full"
        >
          {getButtonText()}
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
