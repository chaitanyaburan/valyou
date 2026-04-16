"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type WalletConnectionMode = "demo" | "testnet";

const STORAGE_KEY = "valyou-wallet-mode";

type Ctx = {
  mode: WalletConnectionMode;
  setMode: (m: WalletConnectionMode) => void;
};

const WalletConnectionModeContext = createContext<Ctx | undefined>(undefined);

export function WalletConnectionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WalletConnectionMode>("demo");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw === "testnet" || raw === "demo") setModeState(raw);
    } catch {
      /* private mode */
    }
  }, []);

  const setMode = useCallback((m: WalletConnectionMode) => {
    setModeState(m);
    try {
      sessionStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <WalletConnectionModeContext.Provider value={value}>{children}</WalletConnectionModeContext.Provider>
  );
}

export function useWalletConnectionMode() {
  const ctx = useContext(WalletConnectionModeContext);
  if (!ctx) throw new Error("useWalletConnectionMode must be used inside WalletConnectionModeProvider");
  return ctx;
}
