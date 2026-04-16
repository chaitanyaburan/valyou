"use client";

import type { ReactNode } from "react";
import { PeraTestnetProvider } from "@/components/providers/PeraTestnetProvider";
import { WalletConnectionModeProvider } from "@/components/providers/WalletConnectionModeProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";

export function AppWalletProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <PeraTestnetProvider>
        <WalletConnectionModeProvider>{children}</WalletConnectionModeProvider>
      </PeraTestnetProvider>
    </WalletProvider>
  );
}
