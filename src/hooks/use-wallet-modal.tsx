import { WalletModal } from "@/components/wallet/WalletModal";
import { createContext, useContext, useState } from "react";

interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export const WalletModalContext = createContext<WalletModalContextState | null>(
  null
);

export function useWalletModal() {
  const context = useContext(WalletModalContext);

  if (!context) {
    throw new Error("useWalletModal must be used within a WalletModalProvider");
  }
  return context;
}

export function WalletModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}

      {visible && <WalletModal visible={visible} setVisible={setVisible} />}
    </WalletModalContext.Provider>
  );
}
