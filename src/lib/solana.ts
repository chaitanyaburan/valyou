import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const DEVNET_CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");
export const LAMPORTS = LAMPORTS_PER_SOL;
export const SOL_TO_INR = 8000;

export const DEMO_RECEIVER_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_DEMO_RECEIVER_WALLET ?? "H3A8MfGWPwiqDVCfYfYQGC8KzmY7yeTQHfXew4m4BiPE",
);

export function toSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
