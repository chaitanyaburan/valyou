"use client";

import { clampScore } from "./format";

export default function ScoreMeter({ score }: { score: number }) {
  const s = clampScore(score);
  const pct = s / 1000;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-40 w-72 max-w-full">
        <svg viewBox="0 0 200 120" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="credArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent, #6366f1)" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--card-border, #1e293b)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#credArcGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${pct * 251.2} 251.2`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-5xl font-bold tabular-nums text-foreground">{s}</span>
          <span className="text-xs uppercase tracking-widest text-muted">Credibility score</span>
        </div>
      </div>
    </div>
  );
}
