/** Testnet explorer (AlgoExplorer). */
export const TESTNET_TX_EXPLORER = (txId: string) =>
  `https://testnet.algoexplorer.io/tx/${encodeURIComponent(txId)}`;

export const TESTNET_FAUCET_URL = "https://bank.testnet.algorand.network/";

export const MICRO_ALGO = 1_000_000;

export function algoToMicro(algo: number): number {
  if (!Number.isFinite(algo) || algo <= 0) return 0;
  return Math.ceil(algo * MICRO_ALGO);
}

export function microToAlgo(micro: number): number {
  if (!Number.isFinite(micro) || micro < 0) return 0;
  return micro / MICRO_ALGO;
}

/** Must match server limits in `assertValidAmountMicro`. */
export const DEMO_PAYMENT_MICRO_MIN = 1_000;
export const DEMO_PAYMENT_MICRO_MAX = 10 * MICRO_ALGO;

export function clampPaymentMicro(micro: number): number {
  const n = Math.floor(micro);
  if (!Number.isFinite(n)) return DEMO_PAYMENT_MICRO_MIN;
  return Math.min(DEMO_PAYMENT_MICRO_MAX, Math.max(DEMO_PAYMENT_MICRO_MIN, n));
}

export function base64ToUint8(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}
