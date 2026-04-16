import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import {
  assertValidAmountMicro,
  createAlgodClient,
  getDemoReceiverAddress,
} from "@/lib/algorand-server";

type Body = {
  sender: string;
  amountMicroAlgos: number;
  note?: string;
};

export async function POST(request: NextRequest) {
  const receiver = getDemoReceiverAddress();
  if (!receiver || !algosdk.isValidAddress(receiver)) {
    return NextResponse.json(
      { error: "ALGORAND_DEMO_RECEIVER (or NEXT_PUBLIC_ALGORAND_DEMO_RECEIVER) is not set or invalid" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sender, amountMicroAlgos, note } = body;
  if (!sender || !algosdk.isValidAddress(sender)) {
    return NextResponse.json({ error: "Invalid sender address" }, { status: 400 });
  }

  try {
    assertValidAmountMicro(Number(amountMicroAlgos));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid amount" }, { status: 400 });
  }

  const algod = createAlgodClient();
  const suggestedParams = await algod.getTransactionParams().do();

  const noteBytes =
    note && note.length > 0
      ? new Uint8Array(Buffer.from(note.slice(0, 1000), "utf8"))
      : undefined;

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount: Math.floor(Number(amountMicroAlgos)),
    suggestedParams,
    note: noteBytes,
  });

  const unsignedBytes = algosdk.encodeUnsignedTransaction(txn);
  const txnBase64 = Buffer.from(unsignedBytes).toString("base64");

  return NextResponse.json({
    txnBase64,
    receiver,
  });
}
