import { useMemo, useState, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
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
import { topTokensQueryOptions, solTokenQueryOptions } from "@/queries/tokens";
import { userTokenBalancesQueryOptions } from "@/queries/balances";
import { WalletModalProvider, useWalletModal } from "@/hooks/use-wallet-modal";
import { useDeposit } from "@/hooks/use-deposit";
import { useWithdraw } from "@/hooks/use-withdraw";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Header } from "@/components/Header";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Share,
  AlertCircle,
  Check,
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

  // Fetch SOL token data with price
  const { data: solTokenData } = useQuery(solTokenQueryOptions);

  // Wallet connection state
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Fetch user token balances when wallet is connected
  const { data: userBalances } = useQuery(
    userTokenBalancesQueryOptions(connection, publicKey, true)
  );

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

  // Default SOL token object
  const defaultSolToken: Token = {
    id: "So11111111111111111111111111111111111111112",
    name: "Solana",
    symbol: "SOL",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    decimals: 9,
    circSupply: 0,
    totalSupply: 0,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    firstPool: {
      id: "",
      createdAt: "",
    },
    holderCount: 0,
    audit: {
      topHoldersPercentage: 0,
    },
    organicScore: 0,
    organicScoreLabel: "",
    tags: [],
    fdv: 0,
    mcap: 0,
    usdPrice: 0,
    priceBlockId: 0,
    liquidity: 0,
    stats5m: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats1h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats6h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    stats24h: {
      priceChange: 0,
      buyVolume: 0,
      sellVolume: 0,
      numBuys: 0,
      numSells: 0,
      numTraders: 0,
      numNetBuyers: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  const [selectedToken, setSelectedToken] = useState<
    Token | UserTokenBalance | null
  >(defaultSolToken);
  const [depositResult, setDepositResult] = useState<{
    signature: string;
    depositId: string;
    privateKey: string;
    amount: string;
    tokenSymbol: string;
    tokenIcon: string;
  } | null>(null);
  const [isWaitingForWallet, setIsWaitingForWallet] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Update default SOL token with real price data from API when available
  useEffect(() => {
    if (
      solTokenData &&
      selectedToken &&
      "id" in selectedToken &&
      selectedToken.id === "So11111111111111111111111111111111111111112" &&
      selectedToken.usdPrice === 0
    ) {
      // Update selected token with real token data from API
      setSelectedToken(solTokenData);
    }
  }, [solTokenData, selectedToken]);

  // Update default SOL token with user balance data when wallet is connected
  useEffect(() => {
    if (
      userBalances &&
      selectedToken &&
      "id" in selectedToken &&
      selectedToken.id === "So11111111111111111111111111111111111111112"
    ) {
      // Find SOL in user balances
      const solBalance = userBalances.find(
        (balance) =>
          balance.address === "So11111111111111111111111111111111111111112"
      );
      if (solBalance) {
        // Update selected token with real balance data (which includes price and balance)
        setSelectedToken(solBalance);
      }
    }
  }, [userBalances, selectedToken]);

  const { deposit, isLoading, error, cancelTransaction } = useDeposit();
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

      console.log("Setting deposit result with:", {
        tokenAmount,
        tokenSymbol: selectedToken.symbol,
        selectedToken,
        tokenIcon: (selectedToken as any).icon || (selectedToken as any).image,
        hasIcon: !!(selectedToken as any).icon,
        allTokenKeys: Object.keys(selectedToken),
        possibleIconFields: {
          icon: (selectedToken as any).icon,
          image: (selectedToken as any).image,
          logo: (selectedToken as any).logo,
          logoURI: (selectedToken as any).logoURI,
          imageUrl: (selectedToken as any).imageUrl,
        },
      });

      setDepositResult({
        signature: result.signature,
        depositId: result.depositId,
        privateKey: result.privateKey,
        amount: tokenAmount,
        tokenSymbol: selectedToken.symbol,
        tokenIcon:
          (selectedToken as any).icon || (selectedToken as any).image || null,
      });
      // Reset form after successful deposit
      setTokenAmount("");
      setSelectedToken(defaultSolToken);
    } catch (err) {
      console.error("Deposit failed:", err);
      // Keep form state on error so user can try again
    } finally {
      setIsWaitingForWallet(false);
    }
  };

  const handleCancelTransaction = () => {
    setIsWaitingForWallet(false);
    cancelTransaction(); // Reset the loading state in the deposit hook
    // Keep form state (token and amount) so user can try again
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

  const handleLogoClick = () => {
    setPrivateKey(undefined);
    setDepositResult(null);
    setClaimResult(null);
    setTokenAmount("");
    setSelectedToken(defaultSolToken);
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
    // Get the token amount and symbol from the deposit result
    const amount = depositResult?.amount || "0";
    const tokenSymbol = depositResult?.tokenSymbol || "tokens";

    const shareText = `Grab your ${amount} ${tokenSymbol}! ${link}`;

    console.log("Share text:", shareText);

    // Try to create share data with just text (some platforms ignore text when URL is present)
    const shareDataTextOnly = {
      text: shareText,
    };

    const shareDataWithUrl = {
      text: shareText,
      url: link,
    };

    try {
      // First try with text only (some platforms work better this way)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareDataTextOnly)
      ) {
        await navigator.share(shareDataTextOnly);
        return;
      }

      // If that doesn't work, try with URL
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareDataWithUrl)
      ) {
        await navigator.share(shareDataWithUrl);
        return;
      }

      // Fallback: copy to clipboard
      await copyToClipboard(shareText);
      alert("Share text copied to clipboard!");
    } catch (err) {
      console.error("Failed to share:", err);
      // Fallback: copy to clipboard
      await copyToClipboard(shareText);
      alert("Share text copied to clipboard!");
    }
  };

  // Helper function to check if user has sufficient balance
  const hasInsufficientBalance = (): boolean => {
    if (!selectedToken || !tokenAmount || !userBalances) return false;

    const inputAmount = parseFloat(tokenAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) return false;

    // Find the user's balance for the selected token
    const tokenId =
      "id" in selectedToken ? selectedToken.id : selectedToken.address;
    const userBalance = userBalances.find(
      (balance) => balance.address === tokenId
    );

    if (!userBalance) return true; // No balance found means insufficient

    return inputAmount > userBalance.balance;
  };

  const canDeposit =
    selectedToken &&
    tokenAmount &&
    parseFloat(tokenAmount) > 0 &&
    !hasInsufficientBalance();

  // Check if wallet is connected
  const isWalletConnected = wallet && publicKey;

  // Button text based on wallet connection state
  const getButtonText = () => {
    if (isLoading) return "Creating BeamLink...";
    if (!isWalletConnected) return "Connect wallet";
    if (hasInsufficientBalance() && selectedToken) {
      return `Not enough ${selectedToken.symbol}`;
    }
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
        <div className="min-h-screen flex flex-col">
          <Header onLogoClick={handleLogoClick} />
          <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
              <div className="flex flex-col items-center gap-4 p-8 bg-blue-50 rounded-lg w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Loading Deposit Info
                  </h3>
                  <p className="text-blue-700">
                    Fetching deposit information...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show error state if withdraw info failed to load
    if (withdrawError || (withdrawInfo && withdrawInfo.error)) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header onLogoClick={handleLogoClick} />
          <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
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
        </div>
      );
    }

    // Show claim success state
    if (claimResult) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header onLogoClick={handleLogoClick} />
          <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
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
        </div>
      );
    }

    // Show withdraw interface
    if (withdrawInfo) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header onLogoClick={handleLogoClick} />
          <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
              <div className="w-full">
                <div className="p-8 rounded-lg border relative aspect-square flex flex-col justify-center items-center max-w-full overflow-hidden">
                  {/* Status Badge - Top Right Corner */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
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

                  {/* BeamLink Value Display - Inside Card */}
                  <div className="text-center">
                    <div
                      className="text-5xl font-black text-gray-900 mb-1 px-6 py-4 rounded-xl break-all overflow-hidden"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {withdrawInfo.amount}
                    </div>
                    <div className="text-xl font-semibold text-gray-600 flex items-center justify-center gap-2">
                      {withdrawInfo.token?.icon && (
                        <img
                          src={withdrawInfo.token.icon}
                          alt={withdrawInfo.token?.symbol || "Token"}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span>{withdrawInfo.token?.symbol || "BeamLink"}</span>
                    </div>
                    {withdrawInfo.usdValue && (
                      <div className="text-base text-gray-500 mt-2">
                        ${withdrawInfo.usdValue.toFixed(2)} USD
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {withdrawInfo.isClaimed ? (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-red-700 font-medium">
                        This deposit has already been claimed
                      </p>
                    </div>
                  ) : isWalletConnected ? (
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full"
                    >
                      {isClaiming ? "Claiming..." : "Claim"}
                    </Button>
                  ) : (
                    <Button onClick={() => setVisible(true)} className="w-full">
                      Connect wallet to claim
                    </Button>
                  )}
                </div>

                {withdrawError && (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg w-full">
                    Error: {withdrawError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show success state after deposit is confirmed
  if (depositResult) {
    const depositLink = `${window.location.origin}/#/${depositResult.privateKey}`;

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(depositLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1500);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header onLogoClick={handleLogoClick} />
        <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg border w-full">
              <div className="relative h-20 w-20 mb-4">
                {/* Animated rainbow circle background */}
                <div
                  className="absolute inset-0 h-20 w-20 rounded-full animate-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #00FFA3, #FFE500, #DC1FFF, #00FFA3)",
                    animation:
                      "spin 3s linear infinite, pulse 2s ease-in-out infinite",
                    opacity: 0.5,
                    mask: "radial-gradient(circle, transparent 40%, black 40%)",
                    WebkitMask:
                      "radial-gradient(circle, transparent 40%, black 40%)",
                  }}
                />
                {/* Checkmark icon */}
                <div
                  className="absolute inset-0 h-20 w-20 z-10 flex items-center justify-center"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  BeamLink Created!
                </h3>
                <p className="text-gray-700 mb-4 text-center w-4/5 mx-auto">
                  Make sure to save this link — it will disappear when you close
                  this tab
                </p>
              </div>

              <div className="w-full space-y-3">
                {/* Token information */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-lg text-gray-900 flex items-center gap-2">
                      <span className="font-semibold">
                        {depositResult?.amount}
                      </span>
                      {depositResult?.tokenIcon &&
                        depositResult.tokenIcon !== null && (
                          <img
                            src={depositResult.tokenIcon}
                            alt={depositResult?.tokenSymbol || "Token"}
                            className="w-6 h-6 rounded-full"
                            onLoad={() =>
                              console.log(
                                "Token image loaded:",
                                depositResult.tokenIcon
                              )
                            }
                            onError={() =>
                              console.log(
                                "Token image failed to load:",
                                depositResult.tokenIcon
                              )
                            }
                          />
                        )}
                      {(!depositResult?.tokenIcon ||
                        depositResult?.tokenIcon === null) && (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                      <span className="font-normal">
                        {depositResult?.tokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
                    onClick={copyLink}
                  >
                    <span className="font-mono text-sm text-gray-600 break-all flex-1">
                      {depositLink}
                    </span>
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => shareDepositLink(depositLink)}
                    className="w-full flex items-center gap-2 py-3"
                  >
                    <Share className="h-5 w-5" />
                    Share
                  </Button>
                  <p className="text-sm text-gray-500 text-center w-4/5 mx-auto">
                    Important: This link gives access to funds — only share with
                    trusted recipients
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => window.open(depositLink, "_blank")}
                    className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1 justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default form state
  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogoClick={handleLogoClick} />
      <div className="flex flex-col items-center p-8 mt-8 gap-8 flex-1 w-full">
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleButtonClick();
            }}
            className="w-full flex flex-col gap-4"
          >
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Token Deposit</h2>
              <TokenInput
                value={tokenAmount}
                onValueChange={setTokenAmount}
                selectedToken={selectedToken}
                onTokenSelect={setSelectedToken}
                hasInsufficientBalance={hasInsufficientBalance()}
              />
            </div>

            <Button
              type="submit"
              disabled={!isWalletConnected ? false : !canDeposit || isLoading}
              className="w-full"
            >
              {getButtonText()}
            </Button>
          </form>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg w-full">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      <TransactionDialog
        open={isWaitingForWallet}
        onClose={handleCancelTransaction}
      />
    </div>
  );
}

export default App;
