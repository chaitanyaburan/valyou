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
import { DEVNET_CONNECTION, LAMPORTS, toSol } from "@/lib/solana";

type WalletContextValue = {
  walletAddress: string | null;
  balanceSol: number;
  connecting: boolean;
  airdropLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestAirdrop: (amountSol?: number) => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

async function getAddress(): Promise<string | null> {
  if (typeof window === "undefined" || !window.solana) {
    return null;
  }
  return window.solana.publicKey?.toBase58() ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balanceSol, setBalanceSol] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    const address = await getAddress();
    if (!address) {
      setBalanceSol(0);
      return;
    }
    const balance = await DEVNET_CONNECTION.getBalance(window.solana!.publicKey!);
    setBalanceSol(toSol(balance));
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.solana?.isPhantom) {
      throw new Error("Phantom wallet not found. Install Phantom extension.");
    }

    setConnecting(true);
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toBase58();
      setWalletAddress(address);
      await refreshBalance();
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnectWallet = useCallback(async () => {
    if (!window.solana) return;
    await window.solana.disconnect();
    setWalletAddress(null);
    setBalanceSol(0);
  }, []);

  const requestAirdrop = useCallback(async (amountSol = 1) => {
    const address = await getAddress();
    if (!address || !window.solana?.publicKey) {
      throw new Error("Please connect wallet first.");
    }

    setAirdropLoading(true);
    try {
      const lamports = Math.max(0.1, amountSol) * LAMPORTS;
      const sig = await DEVNET_CONNECTION.requestAirdrop(window.solana.publicKey, lamports);
      await DEVNET_CONNECTION.confirmTransaction(sig, "confirmed");
      await refreshBalance();
    } finally {
      setAirdropLoading(false);
    }
  }, [refreshBalance]);

  useEffect(() => {
    void (async () => {
      const address = await getAddress();
      if (!address) return;
      setWalletAddress(address);
      await refreshBalance();
    })();
  }, [refreshBalance]);

  const value = useMemo<WalletContextValue>(
    () => ({
      walletAddress,
      balanceSol,
      connecting,
      airdropLoading,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      requestAirdrop,
    }),
    [
      walletAddress,
      balanceSol,
      connecting,
      airdropLoading,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      requestAirdrop,
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
