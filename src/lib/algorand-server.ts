import algosdk from "algosdk";
import { DEMO_PAYMENT_MICRO_MAX, DEMO_PAYMENT_MICRO_MIN } from "@/lib/algorand-constants";

/** Public TestNet node (no token). Override with ALGORAND_ALGOD_* env in production. */
export function createAlgodClient(): algosdk.Algodv2 {
  const token = process.env.ALGORAND_ALGOD_TOKEN ?? "";
  const server = process.env.ALGORAND_ALGOD_SERVER ?? "https://testnet-api.algonode.cloud";
  const port = process.env.ALGORAND_ALGOD_PORT ?? "";
  return new algosdk.Algodv2(token, server, port);
}

export function getDemoReceiverAddress(): string | null {
  const v =
    process.env.ALGORAND_DEMO_RECEIVER?.trim() ||
    process.env.NEXT_PUBLIC_ALGORAND_DEMO_RECEIVER?.trim() ||
    "";
  return v.length > 0 ? v : null;
}

export function assertValidAmountMicro(amount: number): void {
  if (!Number.isFinite(amount) || amount < DEMO_PAYMENT_MICRO_MIN || amount > DEMO_PAYMENT_MICRO_MAX) {
    throw new Error(
      `amountMicroAlgos must be between ${DEMO_PAYMENT_MICRO_MIN} and ${DEMO_PAYMENT_MICRO_MAX} microAlgos`,
    );
  }
}
