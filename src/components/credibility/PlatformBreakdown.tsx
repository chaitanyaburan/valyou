"use client";

import type { CredibilityApiResponse } from "@/lib/credibility-run";

const COLORS: Record<string, string> = {
  leetcode: "#f59e0b",
  github: "#8b5cf6",
  codeforces: "#3b82f6",
  consistency: "#10b981",
};

const LABELS: Record<string, string> = {
  leetcode: "LeetCode",
  github: "GitHub",
  codeforces: "Codeforces",
  consistency: "Consistency",
};

function rawValueLabel(key: string, rawData: CredibilityApiResponse["rawData"]) {
  if (!rawData) return "—";
  if (key === "leetcode") return `Real solved: ${rawData.leetcode?.totalSolved ?? 0}`;
  if (key === "github") return `Real repos: ${rawData.github?.publicRepos ?? 0}`;
  if (key === "codeforces") return `Real rating: ${rawData.codeforces?.rating ?? 0}`;
  if (key === "consistency") {
    const pushes = rawData.github?.recentPushesLast30Days ?? 0;
    const subs = rawData.leetcode?.submissionsLast30Days ?? 0;
    return `Real activity: pushes ${pushes}, submissions ${subs}`;
  }
  return "—";
}

export default function PlatformBreakdown({
  breakdown,
  rawData,
}: {
  breakdown: CredibilityApiResponse["breakdown"];
  rawData: CredibilityApiResponse["rawData"];
}) {
  if (!breakdown) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.entries(breakdown) as [keyof typeof breakdown, number][]).map(([key, val]) => (
        <div
          key={key}
          className="rounded-xl border border-card-border bg-card/80 p-4 shadow-inner"
          style={{ borderTopColor: COLORS[key], borderTopWidth: "3px" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{LABELS[key]}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: COLORS[key] }}>
            {val}
          </p>
          <p className="mt-1 text-[10px] text-muted">Score points (calculated)</p>
          <p className="mt-1 text-[10px] text-accent-light/90">{rawValueLabel(key, rawData)}</p>
        </div>
      ))}
    </div>
  );
}
