const STORAGE_KEY = "valyou.fundingPledges.v1";

/** Extra INR pledged from this browser (simulated crowdfunding until a payments API exists). */
export function loadFundingPledges(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export function addFundingPledge(projectId: string, amountInr: number): void {
  if (typeof window === "undefined") return;
  const cur = loadFundingPledges();
  const prev = cur[projectId] ?? 0;
  const next = { ...cur, [projectId]: prev + amountInr };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function totalPledgedAcrossProjects(pledges: Record<string, number>): number {
  return Object.values(pledges).reduce((a, b) => a + b, 0);
}
