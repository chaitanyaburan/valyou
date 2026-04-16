"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CredibilityCharts } from "@/lib/credibility-engine";

export default function ActivityChart({ data }: { data: CredibilityCharts["activity"] }) {
  if (!data?.length) return null;

  return (
    <div className="h-64 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
          <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "var(--muted)" }}
          />
          <Bar dataKey="pushes" fill="#6366f1" name="Repo pushes" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
