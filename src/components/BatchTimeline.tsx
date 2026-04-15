"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Batch } from "@/lib/data";
import { getBatchInvestorDetails } from "@/lib/data";

interface BatchTimelineFullProps {
  batches: Batch[];
  timelineLocked: boolean;
}

function statusColor(status: Batch["status"]) {
  switch (status) {
    case "completed": return "bg-green/20 text-green border-green/30";
    case "in_progress": return "bg-accent/20 text-accent-light border-accent/30";
    case "overdue": return "bg-red/20 text-red border-red/30";
    case "upcoming": return "bg-muted/10 text-muted border-card-border";
  }
}

function statusDot(status: Batch["status"]) {
  switch (status) {
    case "completed": return "bg-green";
    case "in_progress": return "bg-accent";
    case "overdue": return "bg-red";
    case "upcoming": return "bg-muted/40";
  }
}

function statusLabel(status: Batch["status"]) {
  switch (status) {
    case "completed": return "Completed";
    case "in_progress": return "In progress";
    case "overdue": return "Overdue";
    case "upcoming": return "Upcoming";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-card-border/60 bg-background/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{title}</p>
      <div className="space-y-1.5 text-[11px] text-foreground/85 leading-relaxed">{children}</div>
    </div>
  );
}

export function BatchTimelineFull({ batches, timelineLocked }: BatchTimelineFullProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2" id="investor-timeline">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Investor timeline</h3>
          <p className="text-[10px] text-muted mt-0.5">Tap a step to see what shipped, what is in flight, and transparency links.</p>
        </div>
        {timelineLocked && (
          <span className="flex w-fit items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent-light border border-accent/20">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Immutable dates
          </span>
        )}
      </div>

      <div className="relative pl-0.5">
        {batches.map((batch, i) => {
          const isLast = i === batches.length - 1;
          const isOpen = openId === batch.id;
          const details = getBatchInvestorDetails(batch);

          return (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-0 sm:gap-1 relative"
            >
              <div className="flex flex-col items-center w-5 shrink-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`batch-panel-${batch.id}`}
                  onClick={() => setOpenId(isOpen ? null : batch.id)}
                  className={`mt-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background transition hover:ring-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${statusDot(batch.status)}`}
                  title={`${batch.title} — ${statusLabel(batch.status)}`}
                />
                {!isLast && (
                  <div
                    className={`w-px flex-1 min-h-[0.75rem] ${batch.status === "completed" ? "bg-green/35" : "bg-card-border"}`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <button
                  type="button"
                  id={`batch-trigger-${batch.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`batch-panel-${batch.id}`}
                  onClick={() => setOpenId(isOpen ? null : batch.id)}
                  className={`w-full text-left rounded-xl border transition-colors ${statusColor(batch.status)} ${
                    isOpen ? "ring-1 ring-accent/25 bg-card/30" : "hover:bg-card/20"
                  } px-3 py-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-muted tabular-nums">Step {i + 1} of {batches.length}</span>
                      <p className="text-xs font-semibold text-foreground leading-snug">{batch.title}</p>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{batch.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${statusColor(batch.status)}`}>
                        {statusLabel(batch.status)}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="text-muted"
                        aria-hidden
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </motion.span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted">
                    <span>Deadline · {formatDate(batch.deadline)}</span>
                    {batch.completedAt && <span className="text-green">Done · {formatDate(batch.completedAt)}</span>}
                    {batch.status === "overdue" && (
                      <span className="text-red font-medium">
                        {Math.max(0, Math.floor((Date.now() - new Date(batch.deadline).getTime()) / 86400000))}d past deadline
                      </span>
                    )}
                    <span className={batch.priceImpact > 0 ? "text-green/90" : "text-muted"}>
                      +{batch.priceImpact}% on verified completion
                    </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      id={`batch-panel-${batch.id}`}
                      role="region"
                      aria-labelledby={`batch-trigger-${batch.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2 pl-0.5 pr-0.5 pb-1">
                        {details.done.length > 0 && (
                          <Section title="What was done">
                            <ul className="list-disc pl-4 space-y-1">
                              {details.done.map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </Section>
                        )}
                        {details.active.length > 0 && (
                          <Section title="What is happening now">
                            <ul className="list-disc pl-4 space-y-1">
                              {details.active.map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </Section>
                        )}
                        {details.planned.length > 0 && (
                          <Section title="What is planned next">
                            <ul className="list-disc pl-4 space-y-1">
                              {details.planned.map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </Section>
                        )}
                        <Section title="Transparency">
                          <p>{details.transparency}</p>
                          {details.lastUpdateLabel && (
                            <p className="text-[10px] text-muted mt-2">{details.lastUpdateLabel}</p>
                          )}
                          {details.links.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {details.links.map((l) => (
                                <li key={l.href}>
                                  <a
                                    href={l.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-light hover:underline inline-flex items-center gap-1"
                                  >
                                    {l.label}
                                    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Section>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface BatchTimelineCompactProps {
  batches: Batch[];
  currentBatchTitle: string | null;
  batchProgress: string;
  batchStatus: "on_track" | "overdue" | "all_done";
  /** When set, shows a link to the full interactive timeline on the trade page */
  projectId?: string;
}

export function BatchTimelineCompact({
  batches,
  currentBatchTitle,
  batchProgress,
  batchStatus,
  projectId,
}: BatchTimelineCompactProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-0.5" role="img" aria-label={`Timeline ${batchProgress} batches`}>
        {batches.map((b) => (
          <span
            key={b.id}
            className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot(b.status)}`}
            title={`${b.title}: ${statusLabel(b.status)}`}
          />
        ))}
      </div>
      <span
        className={`text-[10px] font-medium ${
          batchStatus === "overdue" ? "text-red" : batchStatus === "all_done" ? "text-green" : "text-muted"
        }`}
      >
        {batchProgress}
        {currentBatchTitle && ` · ${currentBatchTitle}`}
      </span>
      {projectId && (
        <Link
          href={`/trade/${projectId}#investor-timeline`}
          className="text-[10px] font-medium text-accent-light hover:text-accent hover:underline"
        >
          Details
        </Link>
      )}
    </div>
  );
}
