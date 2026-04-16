import Razorpay from "razorpay";
import { getEnvValue } from "@/lib/db";

export function round2(n: number) {
  return Number(n.toFixed(2));
}

export function isRazorpayWalletConfigured(): boolean {
  const id = getEnvValue("RAZORPAY_KEY_ID")?.trim();
  const secret = getEnvValue("RAZORPAY_KEY_SECRET")?.trim();
  return Boolean(id && secret);
}

export function getRazorpayKeyId(): string {
  return getEnvValue("RAZORPAY_KEY_ID")?.trim() ?? "";
}

/** ALGO credited per 1 INR paid (e.g. 0.02 → ₹100 → 2 ALGO). */
export function getWalletAlgoPerInr(): number {
  const raw = Number(getEnvValue("WALLET_ALGO_PER_INR") ?? "0.01");
  return Number.isFinite(raw) && raw > 0 ? raw : 0.01;
}

export function algoCreditForInr(amountInr: number): number {
  return round2(amountInr * getWalletAlgoPerInr());
}

export function getRazorpayMaxInr(): number {
  const raw = Number(getEnvValue("WALLET_RAZORPAY_MAX_INR") ?? "500000");
  return Number.isFinite(raw) && raw > 0 ? raw : 500_000;
}

export function getRazorpay(): Razorpay {
  const key_id = getEnvValue("RAZORPAY_KEY_ID")?.trim();
  const key_secret = getEnvValue("RAZORPAY_KEY_SECRET")?.trim();
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured.");
  }
  return new Razorpay({ key_id, key_secret });
}
