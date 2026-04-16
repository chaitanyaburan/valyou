import { NextResponse } from "next/server";
import algosdk from "algosdk";
import { getDemoReceiverAddress } from "@/lib/algorand-server";

export async function GET() {
  const demoReceiver = getDemoReceiverAddress();
  const testnetReady = Boolean(demoReceiver && algosdk.isValidAddress(demoReceiver));
  return NextResponse.json({
    testnetReady,
    demoReceiver: testnetReady ? demoReceiver : null,
    algodServer: process.env.ALGORAND_ALGOD_SERVER ?? "https://testnet-api.algonode.cloud",
  });
}
