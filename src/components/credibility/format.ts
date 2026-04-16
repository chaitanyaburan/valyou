export function clampScore(score: number) {
  return Math.min(1000, Math.max(0, score));
}

export const LEVEL_COLORS: Record<string, string> = {
  Beginner: "#64748b",
  Intermediate: "#38bdf8",
  Advanced: "#a78bfa",
  Expert: "#f472b6",
  "Elite Developer": "#fbbf24",
};
