"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY_BAL = "valyou-algo-balance";
const STORAGE_KEY_ADDR = "valyou-algo-address";

type WalletContextValue = {
  walletAddress: string | null;
  balanceAlgo: number;
  connecting: boolean;
  airdropLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestAirdrop: (amountAlgo?: number) => Promise<void>;
  /** Spend ALGO from mock balance (returns false if insufficient). */
  trySpendAlgo: (amount: number) => boolean;
  /** Credit ALGO to mock balance. */
  creditAlgo: (amount: number) => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function randomAddress(): string {
  const hex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `ALGO${hex}`.slice(0, 20);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balanceAlgo, setBalanceAlgo] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);

  const readBalance = useCallback((address: string): number => {
    if (typeof window === "undefined") return 0;
    const raw = localStorage.getItem(`${STORAGE_KEY_BAL}-${address}`);
    if (raw != null) return Number(raw);
    return 50;
  }, []);

  const writeBalance = useCallback((address: string, value: number) => {
    localStorage.setItem(`${STORAGE_KEY_BAL}-${address}`, String(Math.max(0, value)));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (typeof window === "undefined") return;
    const addr = localStorage.getItem(STORAGE_KEY_ADDR);
    if (!addr) {
      setBalanceAlgo(0);
      return;
    }
    setBalanceAlgo(readBalance(addr));
  }, [readBalance]);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      let addr = localStorage.getItem(STORAGE_KEY_ADDR);
      if (!addr) {
        addr = randomAddress();
        localStorage.setItem(STORAGE_KEY_ADDR, addr);
        writeBalance(addr, 50);
      }
      setWalletAddress(addr);
      setBalanceAlgo(readBalance(addr));
    } finally {
      setConnecting(false);
    }
  }, [readBalance, writeBalance]);

  const disconnectWallet = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY_ADDR);
    setWalletAddress(null);
    setBalanceAlgo(0);
  }, []);

  const requestAirdrop = useCallback(
    async (amountAlgo = 10) => {
      const addr = walletAddress ?? localStorage.getItem(STORAGE_KEY_ADDR);
      if (!addr) throw new Error("Connect wallet first.");
      setAirdropLoading(true);
      try {
        const next = readBalance(addr) + Math.max(0.1, amountAlgo);
        writeBalance(addr, next);
        await refreshBalance();
      } finally {
        setAirdropLoading(false);
      }
    },
    [readBalance, refreshBalance, walletAddress, writeBalance],
  );

  const trySpendAlgo = useCallback(
    (amount: number): boolean => {
      const addr = walletAddress ?? localStorage.getItem(STORAGE_KEY_ADDR);
      if (!addr || amount <= 0) return false;
      const bal = readBalance(addr);
      if (bal < amount) return false;
      writeBalance(addr, bal - amount);
      setBalanceAlgo(bal - amount);
      return true;
    },
    [readBalance, walletAddress, writeBalance],
  );

  const creditAlgo = useCallback(
    (amount: number) => {
      const addr = walletAddress ?? localStorage.getItem(STORAGE_KEY_ADDR);
      if (!addr || amount <= 0) return;
      const next = readBalance(addr) + amount;
      writeBalance(addr, next);
      setBalanceAlgo(next);
    },
    [readBalance, walletAddress, writeBalance],
  );

  useEffect(() => {
    const addr = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ADDR) : null;
    if (addr) {
      setWalletAddress(addr);
      setBalanceAlgo(readBalance(addr));
    }
  }, [readBalance]);

  const value = useMemo<WalletContextValue>(
    () => ({
      walletAddress,
      balanceAlgo,
      connecting,
      airdropLoading,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      requestAirdrop,
      trySpendAlgo,
      creditAlgo,
    }),
    [
      walletAddress,
      balanceAlgo,
      connecting,
      airdropLoading,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      requestAirdrop,
      trySpendAlgo,
      creditAlgo,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
