"use client";

import { LEVEL_COLORS } from "./format";

export default function LevelBadge({ level }: { level: string }) {
  const color = LEVEL_COLORS[level] ?? "#94a3b8";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
      style={{ borderColor: color, color }}
    >
      <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: color }} />
      {level}
    </div>
  );
}
