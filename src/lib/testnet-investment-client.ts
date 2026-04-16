import { decodeUnsignedTransaction, type Transaction } from "algosdk";
import {
  algoToMicro,
  base64ToUint8,
  clampPaymentMicro,
  uint8ToBase64,
} from "@/lib/algorand-constants";

export async function signAndSubmitTestnetPayment(params: {
  sender: string;
  costAlgo: number;
  note: Record<string, unknown>;
  signTransactionGroup: (txns: Transaction[]) => Promise<Uint8Array[]>;
}): Promise<string> {
  const { sender, costAlgo, note, signTransactionGroup } = params;
  const amountMicro = clampPaymentMicro(algoToMicro(costAlgo));
  const noteStr = JSON.stringify(note);

  const prep = await fetch("/api/algorand/prepare-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender,
      amountMicroAlgos: amountMicro,
      note: noteStr,
    }),
  });
  const prepJson = (await prep.json()) as { txnBase64?: string; error?: string };
  if (!prep.ok) throw new Error(prepJson.error ?? "Could not build transaction");

  const unsignedBytes = base64ToUint8(prepJson.txnBase64!);
  const txn = decodeUnsignedTransaction(unsignedBytes);
  const signed = await signTransactionGroup([txn]);
  const signedTxnBase64 = uint8ToBase64(signed[0]!);

  const sub = await fetch("/api/algorand/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTxnBase64 }),
  });
  const subJson = (await sub.json()) as { txId?: string; error?: string };
  if (!sub.ok) throw new Error(subJson.error ?? "Submit failed");
  if (!subJson.txId) throw new Error("Missing transaction id");
  return subJson.txId;
}
