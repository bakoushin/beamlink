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
import type { Token } from "@/types/token";
import type { UserTokenBalance } from "@/queries";

function App() {
  const queryClient = new QueryClient();

  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    if (alchemyApiKey) {
      return `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    }
    // Fallback to public RPC if no API key is provided
    return "https://api.mainnet-beta.solana.com";
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

  return (
    <div className="min-h-screen flex flex-col items-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <WalletMultiButton />

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Token Input Demo</h2>
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
      </div>
    </div>
  );
}

export default App;
