/** Dispatched after app-wallet mutations so the header badge can refetch without a full page reload. */
export const APP_WALLET_REFRESH_EVENT = "elevaura:app-wallet-refresh";

export function emitAppWalletRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APP_WALLET_REFRESH_EVENT));
}
