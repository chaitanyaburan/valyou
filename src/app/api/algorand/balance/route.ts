import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import { createAlgodClient } from "@/lib/algorand-server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !algosdk.isValidAddress(address)) {
    return NextResponse.json({ error: "Valid address query param is required" }, { status: 400 });
  }

  const algod = createAlgodClient();
  try {
    const info = await algod.accountInformation(address).do();
    const amount = typeof info.amount === "bigint" ? Number(info.amount) : Number(info.amount);
    return NextResponse.json({ amount });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
