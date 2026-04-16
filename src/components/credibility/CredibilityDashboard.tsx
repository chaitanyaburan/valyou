"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CredibilityApiResponse } from "@/lib/credibility-run";
import ScoreMeter from "./ScoreMeter";
import LevelBadge from "./LevelBadge";
import PlatformBreakdown from "./PlatformBreakdown";
import RadarSkills from "./RadarSkills";
import ActivityChart from "./ActivityChart";
import LanguageChart from "./LanguageChart";
import CredibilityForm, { type CredibilityHandles } from "./CredibilityForm";

type LoadJson = {
  handles: CredibilityHandles;
  result: CredibilityApiResponse | null;
  fromCache?: boolean;
  stale?: boolean;
  warning?: string;
  errors?: Partial<Record<string, string>>;
  error?: string;
  computedAt?: string | null;
};

export default function CredibilityDashboard({ profileId, isOwner }: { profileId: string; isOwner: boolean }) {
  const [handles, setHandles] = useState<CredibilityHandles>({ github: "", leetcode: "", codeforces: "" });
  const [result, setResult] = useState<CredibilityApiResponse | null>(null);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const applyPayload = useCallback((j: LoadJson) => {
    setHandles(j.handles);
    setResult(j.result);
    setComputedAt(j.computedAt ?? null);
    setFromCache(Boolean(j.fromCache));
    setWarning(j.warning || (j.errors ? `Partial data: ${Object.entries(j.errors).map(([k, v]) => `${k}: ${v}`).join(" · ")}` : ""));
  }, []);

  const load = useCallback(
    async (refresh: boolean) => {
      setError("");
      setWarning("");
      if (refresh) setLoading(true);
      else setBootLoading(true);
      try {
        const q = refresh ? "?refresh=1" : "";
        const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/credibility${q}`);
        const j = (await res.json()) as LoadJson;
        if (!res.ok && res.status === 502 && !j.result) {
          setError(j.error || "Could not load credibility data.");
          applyPayload({ handles: j.handles ?? { github: "", leetcode: "", codeforces: "" }, result: null });
          return;
        }
        applyPayload(j);
      } catch {
        setError("Network error while loading credibility.");
      } finally {
        setBootLoading(false);
        setLoading(false);
      }
    },
    [applyPayload, profileId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const onSave = async () => {
    if (!isOwner) return;
    if (!handles.github.trim() && !handles.leetcode.trim() && !handles.codeforces.trim()) {
      setError("Enter at least one handle.");
      return;
    }
    setError("");
    setWarning("");
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/credibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handles),
      });
      const j = (await res.json()) as LoadJson & { error?: string };
      if (!res.ok) {
        setError(j.error || "Save failed.");
        return;
      }
      applyPayload(j);
    } catch {
      setError("Network error while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-6"
        >
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Connect platforms</h3>
          <CredibilityForm values={handles} onChange={(k, v) => setHandles((p) => ({ ...p, [k]: v }))} onSubmit={onSave} loading={loading} />
          {error && (
            <p className="mt-4 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>
          )}
        </motion.div>
      )}

      {!isOwner && !result && (
        <p className="rounded-lg border border-card-border bg-card/50 px-4 py-6 text-center text-sm text-muted">
          This profile has not published developer credibility data yet.
        </p>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted">
              {computedAt && (
                <span>
                  Last computed: {new Date(computedAt).toLocaleString()}
                  {fromCache ? " (cached)" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void load(true)}
              className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent/50 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh live data"}
            </button>
          </div>
          {(warning ||
            (result.warnings && Object.keys(result.warnings).length > 0)) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
              {warning ||
                `Partial data: ${Object.entries(result.warnings ?? {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}`}
            </div>
          )}

          <section className="grid gap-8 rounded-2xl border border-card-border bg-card/40 p-6 md:grid-cols-2 md:p-8">
            <div className="flex flex-col items-center justify-center">
              <ScoreMeter score={result.score} />
              <div className="mt-6">
                <LevelBadge level={result.level} />
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                Platform score breakdown (calculated points)
              </h3>
              <PlatformBreakdown breakdown={result.breakdown} rawData={result.rawData} />
              {result.skills?.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted">Detected skills</p>
                  <div className="flex flex-wrap gap-2">
                    {result.skills.map((s) => (
                      <span key={s} className="rounded-md bg-accent/15 px-2.5 py-1 text-xs text-accent-light">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Skill radar</h3>
              <p className="mb-4 text-xs text-muted">Relative strength across dimensions (0–100 scale).</p>
              <RadarSkills data={result.charts.radar} />
            </div>
            <div className="glass-card p-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">GitHub activity</h3>
              <p className="mb-4 text-xs text-muted">Repository pushes aggregated by day (approximation).</p>
              <ActivityChart data={result.charts.activity} />
            </div>
          </section>

          <section className="glass-card p-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Languages from repositories</h3>
            <p className="mb-4 text-xs text-muted">Distribution across unique languages in public repos.</p>
            <LanguageChart data={result.charts.languages} />
          </section>

          <section className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Raw platform data</h3>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-card-border bg-background/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">GitHub</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li>
                    Public repos: <span className="font-mono text-accent-light">{result.rawData.github.publicRepos}</span>
                  </li>
                  <li>
                    Followers: <span className="font-mono text-accent-light">{result.rawData.github.followers}</span>
                  </li>
                  <li>
                    Total stars: <span className="font-mono text-accent-light">{result.rawData.github.totalStars}</span>
                  </li>
                  <li>
                    Total forks: <span className="font-mono text-accent-light">{result.rawData.github.totalForks}</span>
                  </li>
                  <li>
                    Recent pushes (30d):{" "}
                    <span className="font-mono text-accent-light">{result.rawData.github.recentPushesLast30Days}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-card-border bg-background/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">LeetCode</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li>
                    Easy solved: <span className="font-mono text-accent-light">{result.rawData.leetcode.easySolved}</span>
                  </li>
                  <li>
                    Medium solved:{" "}
                    <span className="font-mono text-accent-light">{result.rawData.leetcode.mediumSolved}</span>
                  </li>
                  <li>
                    Hard solved: <span className="font-mono text-accent-light">{result.rawData.leetcode.hardSolved}</span>
                  </li>
                  <li>
                    Total solved:{" "}
                    <span className="font-mono text-accent-light">{result.rawData.leetcode.totalSolved}</span>
                  </li>
                  <li>
                    Acceptance %:{" "}
                    <span className="font-mono text-accent-light">{result.rawData.leetcode.acceptanceRate}</span>
                  </li>
                  <li>
                    Ranking: <span className="font-mono text-accent-light">{result.rawData.leetcode.ranking}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-card-border bg-background/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Codeforces</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li>
                    Rating: <span className="font-mono text-accent-light">{result.rawData.codeforces.rating}</span>
                  </li>
                  <li>
                    Max rating: <span className="font-mono text-accent-light">{result.rawData.codeforces.maxRating}</span>
                  </li>
                  <li>
                    Rank: <span className="font-mono text-accent-light">{result.rawData.codeforces.rank}</span>
                  </li>
                  <li>
                    Max rank: <span className="font-mono text-accent-light">{result.rawData.codeforces.maxRank}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
