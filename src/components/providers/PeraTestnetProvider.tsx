"use client";

import type { Transaction } from "algosdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CHAIN_ID = 416002 as const;

type PeraModule = typeof import("@perawallet/connect");
type PeraInstance = InstanceType<PeraModule["PeraWalletConnect"]>;

type PeraTestnetContextValue = {
  accounts: string[];
  activeAccount: string | null;
  connecting: boolean;
  connected: boolean;
  balanceMicro: number | null;
  setActiveAccount: (addr: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signTransactionGroup: (transactions: Transaction[]) => Promise<Uint8Array[]>;
};

const PeraTestnetContext = createContext<PeraTestnetContextValue | undefined>(undefined);

async function loadPeraClient(): Promise<PeraInstance> {
  const { PeraWalletConnect } = await import("@perawallet/connect");
  return new PeraWalletConnect({
    chainId: CHAIN_ID,
    shouldShowSignTxnToast: true,
  });
}

export function PeraTestnetProvider({ children }: { children: ReactNode }) {
  const peraRef = useRef<PeraInstance | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccount, setActiveAccountState] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [balanceMicro, setBalanceMicro] = useState<number | null>(null);

  const ensurePera = useCallback(async () => {
    if (!peraRef.current) peraRef.current = await loadPeraClient();
    return peraRef.current;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!activeAccount) {
      setBalanceMicro(null);
      return;
    }
    try {
      const res = await fetch(`/api/algorand/balance?address=${encodeURIComponent(activeAccount)}`);
      const data = (await res.json()) as { amount?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Balance request failed");
      setBalanceMicro(typeof data.amount === "number" ? data.amount : 0);
    } catch {
      setBalanceMicro(null);
    }
  }, [activeAccount]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pera = await ensurePera();
        const list = await pera.reconnectSession();
        if (cancelled || !list.length) return;
        setAccounts(list);
        setActiveAccountState((prev) => prev ?? list[0] ?? null);
      } catch {
        /* no session */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensurePera]);

  const setActiveAccount = useCallback((addr: string) => {
    setActiveAccountState(addr);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const pera = await ensurePera();
      const list = await pera.connect();
      setAccounts(list);
      setActiveAccountState(list[0] ?? null);
    } finally {
      setConnecting(false);
    }
  }, [ensurePera]);

  const disconnect = useCallback(async () => {
    if (peraRef.current) await peraRef.current.disconnect();
    setAccounts([]);
    setActiveAccountState(null);
    setBalanceMicro(null);
  }, []);

  const signTransactionGroup = useCallback(
    async (transactions: Transaction[]) => {
      if (!activeAccount) throw new Error("Connect Pera Wallet first.");
      const pera = await ensurePera();
      const group = transactions.map((txn) => ({ txn }));
      return pera.signTransaction([group], activeAccount);
    },
    [activeAccount, ensurePera],
  );

  const connected = accounts.length > 0;

  const value = useMemo<PeraTestnetContextValue>(
    () => ({
      accounts,
      activeAccount,
      connecting,
      connected,
      balanceMicro,
      setActiveAccount,
      connect,
      disconnect,
      refreshBalance,
      signTransactionGroup,
    }),
    [
      accounts,
      activeAccount,
      balanceMicro,
      connect,
      connected,
      connecting,
      disconnect,
      refreshBalance,
      setActiveAccount,
      signTransactionGroup,
    ],
  );

  return <PeraTestnetContext.Provider value={value}>{children}</PeraTestnetContext.Provider>;
}

export function usePeraTestnet() {
  const ctx = useContext(PeraTestnetContext);
  if (!ctx) throw new Error("usePeraTestnet must be used inside PeraTestnetProvider");
  return ctx;
}
