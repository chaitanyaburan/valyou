import type { PublicKey } from "@solana/web3.js";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: import("@solana/web3.js").Transaction) => Promise<import("@solana/web3.js").Transaction>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export {};
