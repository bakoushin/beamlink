import { useMemo, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "./App.css";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "./TokenSelector";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { topTokensQueryOptions } from "@/queries/tokens";

function App() {
  const [count, setCount] = useState(0);
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
            <AppContent count={count} setCount={setCount} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

function AppContent({
  count,
  setCount,
}: {
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  // Prefetch top tokens on app mount
  useQuery(topTokensQueryOptions);

  return (
    <>
      <WalletMultiButton />
      <TokenSelector />
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <TokenSelector />
      </div>
    </>
  );
}

export default App;
