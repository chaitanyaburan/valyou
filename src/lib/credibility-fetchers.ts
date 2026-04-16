import type { CodeforcesScoringData, GitHubScoringData, LeetCodeScoringData } from "@/lib/credibility-engine";

const DEFAULT_GITHUB: GitHubScoringData = {
  publicRepos: 0,
  followers: 0,
  totalStars: 0,
  totalForks: 0,
  languages: [],
  repoNames: [],
  recentPushesLast30Days: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
};

const DEFAULT_LEETCODE: LeetCodeScoringData = {
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  totalSolved: 0,
  acceptanceRate: 0,
  ranking: 0,
  submissionsLast30Days: 0,
};

const DEFAULT_CODEFORCES: CodeforcesScoringData = {
  rating: 0,
  maxRating: 0,
  rank: "unrated",
  maxRank: "unrated",
};

async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 20000, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    if (!res.ok) {
      const err = new Error(`${res.status} ${res.statusText}`);
      (err as Error & { statusCode?: number }).statusCode = res.status;
      throw err;
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(id);
  }
}

type GhRepo = {
  name?: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  pushed_at?: string | null;
};

async function fetchAllRepos(username: string, headers: HeadersInit): Promise<GhRepo[]> {
  const all: GhRepo[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=updated&type=owner`;
    const data = await fetchJson<GhRepo[]>(url, { headers, timeoutMs: 25000 });
    all.push(...data);
    if (data.length < perPage || all.length >= 500) break;
    page += 1;
  }
  return all;
}

export async function fetchGitHubData(username: string): Promise<GitHubScoringData> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Valyou-Credibility/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const [profile, repos] = await Promise.all([
    fetchJson<{
      public_repos?: number;
      followers?: number;
      updated_at?: string | null;
    }>(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, timeoutMs: 20000 }),
    fetchAllRepos(username, headers),
  ]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let totalStars = 0;
  let totalForks = 0;
  const languages = new Set<string>();
  let recentPushes = 0;
  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
  const dayMs = 24 * 60 * 60 * 1000;

  for (const r of repos) {
    totalStars += r.stargazers_count || 0;
    totalForks += r.forks_count || 0;
    if (r.language) languages.add(r.language);
    const pushed = r.pushed_at ? new Date(r.pushed_at).getTime() : 0;
    if (pushed >= thirtyDaysAgo) recentPushes += 1;
    if (pushed) {
      const dayIdx = Math.floor((Date.now() - pushed) / dayMs);
      if (dayIdx >= 0 && dayIdx < 7) {
        weeklyActivity[6 - dayIdx] += 1;
      }
    }
  }

  return {
    publicRepos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    totalStars,
    totalForks,
    languages: [...languages],
    repoNames: repos.map((r) => r.name || ""),
    recentPushesLast30Days: recentPushes,
    weeklyActivity,
  };
}

const LC_BASE = "https://alfa-leetcode-api.onrender.com";

async function lcGet(path: string): Promise<unknown> {
  const url = `${LC_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  return fetchJson<unknown>(url, { timeoutMs: 25000 });
}

export async function fetchLeetCodeData(username: string): Promise<LeetCodeScoringData> {
  const [solvedRes, profileRes, userProfileRes, calendarRes] = await Promise.allSettled([
    lcGet(`/${encodeURIComponent(username)}/solved`),
    lcGet(`/${encodeURIComponent(username)}`),
    lcGet(`/userProfile/${encodeURIComponent(username)}`),
    lcGet(`/${encodeURIComponent(username)}/calendar`),
  ]);

  if (solvedRes.status === "rejected") {
    throw solvedRes.reason instanceof Error ? solvedRes.reason : new Error("LeetCode: failed to load solved stats");
  }

  const s = solvedRes.value as Record<string, unknown>;
  const pr =
    profileRes.status === "fulfilled" && profileRes.value && typeof profileRes.value === "object"
      ? (profileRes.value as Record<string, unknown>)
      : {};
  const up =
    userProfileRes.status === "fulfilled" && userProfileRes.value && typeof userProfileRes.value === "object"
      ? (userProfileRes.value as Record<string, unknown>)
      : {};

  let acceptance = Number(up.acceptanceRate ?? up.acceptance_rate ?? pr.acceptanceRate ?? 0);
  const subs = up.totalSubmissions ?? pr.totalSubmissions;
  if (!acceptance && Array.isArray(subs)) {
    const all = subs.find((x: { difficulty?: string }) => x.difficulty === "All") as
      | { submissions?: number; count?: number }
      | undefined;
    if (all?.submissions && all.submissions > 0 && typeof all.count === "number") {
      acceptance = Math.round((all.count / all.submissions) * 10000) / 100;
    }
  }

  let solvedLast30 = 0;
  if (calendarRes.status === "fulfilled" && calendarRes.value && typeof calendarRes.value === "object") {
    const cal = calendarRes.value as Record<string, unknown>;
    const raw = cal.submissionCalendar ?? cal.calendar;
    if (raw) {
      const map = typeof raw === "string" ? (JSON.parse(raw) as Record<string, string>) : (raw as Record<string, string>);
      const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      for (const [ts, cnt] of Object.entries(map)) {
        if (parseInt(ts, 10) >= cutoff && parseInt(String(cnt), 10) > 0) {
          solvedLast30 += parseInt(String(cnt), 10);
        }
      }
    }
  }

  const easy = Number(s.easySolved ?? s.easy_solved ?? 0);
  const med = Number(s.mediumSolved ?? s.medium_solved ?? 0);
  const hard = Number(s.hardSolved ?? s.hard_solved ?? 0);
  const total = Number(s.solvedProblem ?? s.solved_problem ?? easy + med + hard);

  return {
    easySolved: easy,
    mediumSolved: med,
    hardSolved: hard,
    totalSolved: total,
    acceptanceRate: acceptance,
    ranking: Number(pr.ranking ?? up.ranking ?? 0),
    submissionsLast30Days: solvedLast30,
  };
}

export async function fetchCodeforcesData(handle: string): Promise<CodeforcesScoringData> {
  const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
  const data = await fetchJson<{ status: string; result?: Array<Record<string, unknown>>; comment?: string }>(url, {
    timeoutMs: 15000,
  });
  if (data.status !== "OK" || !data.result?.length) {
    const err = new Error(data.comment?.toLowerCase().includes("not found") ? "Codeforces: user not found." : "Codeforces: user not found.");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  const u = data.result[0]!;
  return {
    rating: Number(u.rating ?? 0),
    maxRating: Number(u.maxRating ?? 0),
    rank: String(u.rank ?? "unrated"),
    maxRank: String(u.maxRank ?? "unrated"),
  };
}

export function defaultGithub(): GitHubScoringData {
  return { ...DEFAULT_GITHUB, weeklyActivity: [...DEFAULT_GITHUB.weeklyActivity] };
}
export function defaultLeetcode(): LeetCodeScoringData {
  return { ...DEFAULT_LEETCODE };
}
export function defaultCodeforces(): CodeforcesScoringData {
  return { ...DEFAULT_CODEFORCES };
}

export async function fetchCredibilitySources(
  github: string,
  leetcode: string,
  codeforces: string,
): Promise<{
  githubData: GitHubScoringData;
  leetcodeData: LeetCodeScoringData;
  codeforcesData: CodeforcesScoringData;
  errors: Partial<Record<"github" | "leetcode" | "codeforces", string>>;
}> {
  const errors: Partial<Record<"github" | "leetcode" | "codeforces", string>> = {};
  let githubData = defaultGithub();
  let leetcodeData = defaultLeetcode();
  let codeforcesData = defaultCodeforces();

  const tasks: Promise<void>[] = [];
  if (github.trim()) {
    tasks.push(
      fetchGitHubData(github.trim())
        .then((d) => {
          githubData = d;
        })
        .catch((err: unknown) => {
          errors.github = err instanceof Error ? err.message : "failed";
        }),
    );
  }
  if (leetcode.trim()) {
    tasks.push(
      fetchLeetCodeData(leetcode.trim())
        .then((d) => {
          leetcodeData = d;
        })
        .catch((err: unknown) => {
          errors.leetcode = err instanceof Error ? err.message : "failed";
        }),
    );
  }
  if (codeforces.trim()) {
    tasks.push(
      fetchCodeforcesData(codeforces.trim())
        .then((d) => {
          codeforcesData = d;
        })
        .catch((err: unknown) => {
          errors.codeforces = err instanceof Error ? err.message : "failed";
        }),
    );
  }

  await Promise.all(tasks);
  return { githubData, leetcodeData, codeforcesData, errors };
}
