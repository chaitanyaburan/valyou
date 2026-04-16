import type { ListingBias } from "./market-projects";

export type RaiseEstimatorInput = {
  category: string;
  listingBias: ListingBias;
  daysLeft: number;
  proofCount: number;
};

export type RaiseEstimatorOutput = {
  suggestedMin: number;
  suggestedMax: number;
  platformCap: number;
  confidence: "low" | "medium" | "high";
  rationale: string;
};

function baseForCategory(category: string): number {
  const key = category.toLowerCase();
  if (key.includes("ai")) return 12;
  if (key.includes("defi") || key.includes("blockchain")) return 10;
  if (key.includes("devops") || key.includes("infra") || key.includes("db")) return 11;
  if (key.includes("fintech")) return 11;
  if (key.includes("health")) return 10;
  if (key.includes("climate") || key.includes("energy")) return 9;
  return 8;
}

export function estimateRaiseInLakhs(input: RaiseEstimatorInput): RaiseEstimatorOutput {
  const base = baseForCategory(input.category || "");
  let score = base;

  if (input.listingBias === "Trending") score += 1;
  if (input.listingBias === "Top Performer") score += 2;

  if (input.proofCount === 0) score -= 2;
  else if (input.proofCount === 1) score += 0;
  else if (input.proofCount === 2) score += 1;
  else score += 2;

  if (input.daysLeft < 21) score -= 1;
  if (input.daysLeft > 45) score += 1;

  score = Math.max(4, Math.min(score, 18));

  const suggestedMid = score;
  const suggestedMin = Math.max(3, suggestedMid - 2);
  const suggestedMax = suggestedMid + 2;

  const platformCap = Math.round(suggestedMax * 1.4);

  const confidence: RaiseEstimatorOutput["confidence"] =
    input.proofCount >= 2 ? "high" : input.proofCount === 1 ? "medium" : "low";

  const rationale =
    "Based on your category, timeline, and number of proof links, this range reflects what similar projects on Valyou typically raise while keeping expectations realistic.";

  return {
    suggestedMin: suggestedMin * 100_000,
    suggestedMax: suggestedMax * 100_000,
    platformCap: platformCap * 100_000,
    confidence,
    rationale,
  };
}

