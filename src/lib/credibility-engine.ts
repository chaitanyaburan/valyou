/**
 * Port of credibility-platform credibility engine (GitHub + LeetCode + Codeforces).
 * Each platform exports maxPoints and score(data).
 */

export type GitHubScoringData = {
  publicRepos: number;
  followers: number;
  totalStars: number;
  totalForks: number;
  languages: string[];
  repoNames: string[];
  recentPushesLast30Days: number;
  weeklyActivity: number[];
};

export type LeetCodeScoringData = {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  acceptanceRate: number;
  ranking: number;
  submissionsLast30Days: number;
};

export type CodeforcesScoringData = {
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
};

const GITHUB_MAX = 400;
const LEETCODE_MAX = 400;
const CODEFORCES_MAX = 200;

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function githubRawScore(data: GitHubScoringData): number {
  const repos = data.publicRepos || 0;
  const followers = data.followers || 0;
  const stars = data.totalStars || 0;
  const forks = data.totalForks || 0;
  const repoScore = clamp01(repos / 40) * 100;
  const followerScore = clamp01(Math.log10(followers + 1) / 3) * 120;
  const starScore = clamp01(Math.log10(stars + 1) / 3) * 120;
  const forkScore = clamp01(Math.log10(forks + 1) / 2.7) * 60;
  return repoScore + followerScore + starScore + forkScore;
}

function githubScore(data: GitHubScoringData): number {
  return Math.round(Math.min(Math.max(githubRawScore(data), 0), GITHUB_MAX));
}

const LEETCODE_RAW_CAP = 2000;

function leetcodeRawScore(data: LeetCodeScoringData): number {
  const e = data.easySolved || 0;
  const m = data.mediumSolved || 0;
  const h = data.hardSolved || 0;
  const ar = data.acceptanceRate || 0;
  return e * 1 + m * 3 + h * 6 + ar * 2;
}

function leetcodeScore(data: LeetCodeScoringData): number {
  const n = Math.min(Math.max(leetcodeRawScore(data) / LEETCODE_RAW_CAP, 0), 1) * LEETCODE_MAX;
  return Math.round(n);
}

const CF_RAW_CAP = 525;

function codeforcesRawScore(data: CodeforcesScoringData): number {
  return (data.rating || 0) * 0.1 + (data.maxRating || 0) * 0.05;
}

function codeforcesScore(data: CodeforcesScoringData): number {
  return Math.round(Math.min(Math.max(codeforcesRawScore(data) / CF_RAW_CAP, 0), 1) * CODEFORCES_MAX);
}

const LANG_TAGS: Record<string, string[]> = {
  Python: ["Python"],
  "C++": ["C++"],
  JavaScript: ["JavaScript"],
  Java: ["Java"],
  TypeScript: ["TypeScript"],
  Go: ["Go"],
  Rust: ["Rust"],
  Ruby: ["Ruby"],
  PHP: ["PHP"],
  Swift: ["Swift"],
  Kotlin: ["Kotlin"],
  R: ["R", "Data Science"],
  Julia: ["Julia"],
};

const ML_KEYWORDS = /tensorflow|pytorch|keras|scikit|machine.?learning|mlops|notebook|pandas|numpy/i;

export function buildSkillTags(languages: string[] = [], repoNames: string[] = []): string[] {
  const set = new Set<string>();
  for (const lang of languages) {
    const tags = LANG_TAGS[lang];
    if (tags) tags.forEach((t) => set.add(t));
  }
  const joined = repoNames.join(" ");
  if (languages.includes("Python") && ML_KEYWORDS.test(joined)) {
    set.add("Machine Learning");
  }
  return [...set].sort();
}

export function consistencyBonus(githubData: GitHubScoringData, leetcodeData: LeetCodeScoringData): number {
  const gh = Math.min((githubData.recentPushesLast30Days || 0) * 5, 50);
  const lc = Math.min(Math.floor((leetcodeData.submissionsLast30Days || 0) / 10), 50);
  return Math.min(gh + lc, 100);
}

export function classifyLevel(score: number): string {
  if (score >= 850) return "Elite Developer";
  if (score >= 650) return "Expert";
  if (score >= 400) return "Advanced";
  if (score >= 200) return "Intermediate";
  return "Beginner";
}

export function buildRadarBreakdown(breakdown: {
  leetcode: number;
  github: number;
  codeforces: number;
  consistency: number;
}) {
  return [
    { subject: "LeetCode", value: Math.min(100, (breakdown.leetcode / 400) * 100), fullMark: 100 },
    { subject: "GitHub", value: Math.min(100, (breakdown.github / 400) * 100), fullMark: 100 },
    { subject: "Codeforces", value: Math.min(100, (breakdown.codeforces / 200) * 100), fullMark: 100 },
    { subject: "Consistency", value: breakdown.consistency, fullMark: 100 },
  ];
}

export function buildActivitySeries(githubData: GitHubScoringData) {
  const labels = ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"];
  return labels.map((name, i) => ({
    name,
    pushes: githubData.weeklyActivity?.[i] ?? 0,
  }));
}

export function buildLanguageDistribution(languages: string[]) {
  const slice = 100 / Math.max(languages.length, 1);
  return languages.map((name) => ({ name, value: Math.round(slice) }));
}

export const PLATFORM_META = [
  { id: "leetcode", label: "LeetCode", maxPoints: LEETCODE_MAX },
  { id: "github", label: "GitHub", maxPoints: GITHUB_MAX },
  { id: "codeforces", label: "Codeforces", maxPoints: CODEFORCES_MAX },
] as const;

export type CredibilityCharts = {
  radar: ReturnType<typeof buildRadarBreakdown>;
  activity: ReturnType<typeof buildActivitySeries>;
  languages: ReturnType<typeof buildLanguageDistribution>;
};

export type CredibilityPayload = {
  score: number;
  level: string;
  skills: string[];
  breakdown: {
    leetcode: number;
    github: number;
    codeforces: number;
    consistency: number;
  };
  charts: CredibilityCharts;
  meta: {
    platforms: Array<{ id: string; label: string; maxPoints: number }>;
    leetcodeRanking: number;
    codeforcesRank: string;
    weightedRaw: number;
  };
};

export function computeCredibility({
  githubData,
  leetcodeData,
  codeforcesData,
  repoNames = [],
}: {
  githubData: GitHubScoringData;
  leetcodeData: LeetCodeScoringData;
  codeforcesData: CodeforcesScoringData;
  repoNames?: string[];
}): CredibilityPayload {
  const breakdown = {
    leetcode: leetcodeScore(leetcodeData),
    github: githubScore(githubData),
    codeforces: codeforcesScore(codeforcesData),
    consistency: consistencyBonus(githubData, leetcodeData),
  };

  const weightedRaw =
    breakdown.leetcode * 0.4 + breakdown.github * 0.4 + breakdown.codeforces * 0.2 + breakdown.consistency;

  const score = Math.min(1000, Math.round((weightedRaw / 460) * 1000));
  const skills = buildSkillTags(githubData.languages || [], repoNames);

  return {
    score,
    level: classifyLevel(score),
    skills,
    breakdown,
    charts: {
      radar: buildRadarBreakdown(breakdown),
      activity: buildActivitySeries(githubData),
      languages: buildLanguageDistribution(githubData.languages || []),
    },
    meta: {
      platforms: [...PLATFORM_META],
      leetcodeRanking: leetcodeData.ranking,
      codeforcesRank: codeforcesData.rank,
      weightedRaw: Math.round(weightedRaw),
    },
  };
}
