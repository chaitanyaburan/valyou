"use client";

export type CredibilityHandles = { github: string; leetcode: string; codeforces: string };

export default function CredibilityForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: CredibilityHandles;
  onChange: (key: keyof CredibilityHandles, v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const fields: { key: keyof CredibilityHandles; label: string; placeholder: string }[] = [
    { key: "github", label: "GitHub", placeholder: "torvalds" },
    { key: "leetcode", label: "LeetCode", placeholder: "lee215" },
    { key: "codeforces", label: "Codeforces", placeholder: "tourist" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid gap-4 md:grid-cols-3"
    >
      <p className="text-xs text-muted md:col-span-3">
        Enter at least one public handle. Data is fetched live from GitHub, LeetCode, and Codeforces (same engine as
        credibility-platform).
      </p>
      {fields.map(({ key, label, placeholder }) => (
        <label key={key} className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
          <input
            name={key}
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="rounded-lg border border-card-border bg-card px-3 py-2.5 font-mono text-sm text-foreground outline-none transition focus:border-accent/60"
          />
        </label>
      ))}
      <div className="flex flex-col gap-2 md:col-span-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-accent to-indigo-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Save & calculate credibility"}
        </button>
      </div>
    </form>
  );
}
