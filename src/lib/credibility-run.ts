import {
  computeCredibility,
  type CodeforcesScoringData,
  type CredibilityPayload,
  type GitHubScoringData,
  type LeetCodeScoringData,
} from "@/lib/credibility-engine";
import { fetchCredibilitySources } from "@/lib/credibility-fetchers";

export type CredibilityApiResponse = CredibilityPayload & {
  success: true;
  profiles: { github: string; leetcode: string; codeforces: string };
  rawData: {
    github: GitHubScoringData;
    leetcode: LeetCodeScoringData;
    codeforces: CodeforcesScoringData;
  };
  warnings?: Partial<Record<"github" | "leetcode" | "codeforces", string>>;
};

export async function runCredibilityAnalysis(
  github: string,
  leetcode: string,
  codeforces: string,
): Promise<{ ok: true; body: CredibilityApiResponse } | { ok: false; status: number; error: string; errors?: CredibilityApiResponse["warnings"] }> {
  const g = github.trim();
  const l = leetcode.trim();
  const c = codeforces.trim();
  if (!g && !l && !c) {
    return { ok: false, status: 400, error: "Provide at least one handle: github or leetcode or codeforces." };
  }

  const { githubData, leetcodeData, codeforcesData, errors } = await fetchCredibilitySources(g, l, c);
  const attempted = [g, l, c].filter(Boolean).length;
  if (Object.keys(errors).length === attempted) {
    return {
      ok: false,
      status: 502,
      error: "All provided data sources failed. Check usernames and try again.",
      errors,
    };
  }

  const payload = computeCredibility({
    githubData,
    leetcodeData,
    codeforcesData,
    repoNames: githubData.repoNames || [],
  });

  const body: CredibilityApiResponse = {
    success: true,
    ...payload,
    profiles: { github: g, leetcode: l, codeforces: c },
    rawData: {
      github: githubData,
      leetcode: leetcodeData,
      codeforces: codeforcesData,
    },
  };
  if (Object.keys(errors).length) {
    body.warnings = errors;
  }
  return { ok: true, body };
}
