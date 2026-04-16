"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { CredibilityCharts } from "@/lib/credibility-engine";

const PALETTE = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb923c", "#60a5fa"];

export default function LanguageChart({ data }: { data: CredibilityCharts["languages"] }) {
  if (!data?.length) {
    return <p className="py-8 text-center text-sm text-muted">No language data from public repos.</p>;
  }

  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--background)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
