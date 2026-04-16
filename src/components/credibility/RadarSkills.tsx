"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { CredibilityCharts } from "@/lib/credibility-engine";

export default function RadarSkills({ data }: { data: CredibilityCharts["radar"] }) {
  if (!data?.length) return <p className="text-sm text-muted">No radar data.</p>;

  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--card-border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 10 }} />
          <Radar name="Strength" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
