import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import { createAlgodClient } from "@/lib/algorand-server";

type Body = {
  signedTxnBase64: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { signedTxnBase64 } = body;
  if (!signedTxnBase64 || typeof signedTxnBase64 !== "string") {
    return NextResponse.json({ error: "signedTxnBase64 is required" }, { status: 400 });
  }

  let signedBytes: Uint8Array;
  try {
    signedBytes = Uint8Array.from(Buffer.from(signedTxnBase64, "base64"));
  } catch {
    return NextResponse.json({ error: "Invalid base64" }, { status: 400 });
  }

  const algod = createAlgodClient();

  try {
    const submitted = await algod.sendRawTransaction(signedBytes).do();
    const txId = "txid" in submitted ? submitted.txid : (submitted as { txId?: string }).txId;
    if (!txId) {
      return NextResponse.json({ error: "Missing transaction id from node" }, { status: 502 });
    }
    try {
      await algosdk.waitForConfirmation(algod, txId, 8);
    } catch {
      // Still return txId so the client can open explorer while pending
    }
    return NextResponse.json({ txId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Submit failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
