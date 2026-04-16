/** Single in-app coin: Algorand ALGO (display + mock balances). */
export const COIN = "ALGO";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 0 });

export function formatAlgo(amount: number, decimals = 4): string {
  const v = Number(amount);
  if (!Number.isFinite(v)) return `0 ${COIN}`;
  return `${v.toFixed(decimals)} ${COIN}`;
}

export function formatAlgoShort(amount: number): string {
  return `${num.format(amount)} ${COIN}`;
}
