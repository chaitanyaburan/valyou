import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import {
  algoCreditForInr,
  getRazorpay,
  getRazorpayKeyId,
  getRazorpayMaxInr,
  isRazorpayWalletConfigured,
} from "@/lib/razorpay-wallet";
import { RazorpayWalletOrderModel } from "@/models";

export async function POST(req: Request) {
  try {
    if (!isRazorpayWalletConfigured()) {
      return NextResponse.json({ error: "Razorpay is not configured on this server." }, { status: 503 });
    }

    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Sign in to top up your wallet." }, { status: 401 });
    }

    let body: { amountInr?: number };
    try {
      body = (await req.json()) as { amountInr?: number };
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const amountInr = Number(body.amountInr);
    if (!Number.isFinite(amountInr) || amountInr < 1) {
      return NextResponse.json({ error: "Enter at least ₹1." }, { status: 400 });
    }
    const maxInr = getRazorpayMaxInr();
    if (amountInr > maxInr) {
      return NextResponse.json({ error: `Maximum top-up is ₹${maxInr.toLocaleString("en-IN")}.` }, { status: 400 });
    }

    const amountPaise = Math.round(amountInr * 100);
    if (amountPaise < 100) {
      return NextResponse.json({ error: "Minimum payment is ₹1." }, { status: 400 });
    }

    const algoCredit = algoCreditForInr(amountInr);
    if (algoCredit <= 0) {
      return NextResponse.json({ error: "Configured ALGO rate is invalid." }, { status: 500 });
    }

    await connectMongo();

    const receipt = `w_${session.userId.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    const rp = getRazorpay();
    const order = await rp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: session.userId,
        algoCredit: String(algoCredit),
        amountInr: String(amountInr),
      },
    });

    const orderId = typeof order.id === "string" ? order.id : "";
    if (!orderId) {
      return NextResponse.json({ error: "Could not create Razorpay order." }, { status: 502 });
    }

    await RazorpayWalletOrderModel.create({
      razorpayOrderId: orderId,
      userId: session.userId,
      amountPaise,
      amountInr,
      algoCredit,
      status: "created",
    });

    return NextResponse.json({
      orderId,
      amount: order.amount,
      currency: order.currency ?? "INR",
      keyId: getRazorpayKeyId(),
      amountInr,
      algoCredit,
    });
  } catch (e) {
    console.error("POST /api/wallet/razorpay/create-order", e);
    return NextResponse.json({ error: "Could not start payment. Try again later." }, { status: 500 });
  }
}
