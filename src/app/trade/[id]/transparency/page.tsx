"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BatchTimelineFull } from "@/components/BatchTimeline";
import type { Batch } from "@/lib/data";
import { apiGetProjectTransparency, type ProjectTransparencyResponse } from "@/lib/api-client";

function asBatches(raw: unknown): Batch[] {
  if (!Array.isArray(raw)) return [];
  return raw as Batch[];
}

export default function ProjectTransparencyPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ProjectTransparencyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetProjectTransparency(id);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setError("Could not load transparency record.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-loss">{error}</p>
        <Link href={`/trade/${id}`} className="mt-4 inline-block text-sm text-accent-light hover:underline">
          Back to project
        </Link>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center text-muted">
        <p>Loading transparency…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-12">
      <Link href={`/trade/${id}`} className="text-xs font-medium text-accent-light hover:underline">
        ← Back to trading
      </Link>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transparency</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Append-only publication log for <span className="text-foreground font-medium">{data.title}</span>. Each entry is stored once and never updated; milestone
            snapshots preserve what backers saw at publish time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="rounded-full border border-card-border px-2.5 py-1">
            Timeline locked: {data.timelineLocked ? "yes" : "no"}
          </span>
          <span className="rounded-full border border-card-border px-2.5 py-1">
            Publication frozen: {data.publicationLocked ? "yes" : "no"}
          </span>
          {data.publishedAt && (
            <span className="rounded-full border border-card-border px-2.5 py-1">
              Published: {new Date(data.publishedAt).toLocaleString()}
            </span>
          )}
        </div>

        <div className="space-y-8 pt-4">
          {data.ledger.length === 0 ? (
            <p className="text-sm text-muted">No ledger entries yet for this project.</p>
          ) : (
            data.ledger.map((entry) => {
              const snap = entry.snapshot ?? {};
              const batches = asBatches(snap.batches);
              const publishedAt =
                typeof snap.publishedAt === "string" ? snap.publishedAt : entry.createdAt ?? "";
              return (
                <article key={entry.seq} className="glass-card space-y-4 p-5">
                  <header className="space-y-1 border-b border-card-border pb-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{entry.headline}</h2>
                      <span className="text-[11px] uppercase tracking-wide text-muted">Seq #{entry.seq}</span>
                    </div>
                    <p className="text-xs text-muted">
                      Kind: <code className="text-accent-light/90">{entry.kind}</code> · Actor:{" "}
                      <code className="text-foreground/80">{entry.actorUserId}</code>
                      {publishedAt ? ` · Snapshot time: ${new Date(publishedAt).toLocaleString()}` : null}
                    </p>
                  </header>
                  {batches.length > 0 ? (
                    <BatchTimelineFull batches={batches} timelineLocked />
                  ) : (
                    <p className="text-sm text-muted">Snapshot did not include milestone data.</p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </motion.div>
    </section>
  );
}
