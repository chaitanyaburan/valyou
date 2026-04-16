import { NextResponse } from "next/server";
import { getRazorpayKeyId, getWalletAlgoPerInr, isRazorpayWalletConfigured } from "@/lib/razorpay-wallet";

export async function GET() {
  return NextResponse.json({
    ready: isRazorpayWalletConfigured(),
    keyId: getRazorpayKeyId() || null,
    algoPerInr: getWalletAlgoPerInr(),
  });
}
