"use client";

import { motion } from "framer-motion";
import type { Batch } from "@/lib/data";

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
    case "in_progress": return "In Progress";
    case "overdue": return "Overdue";
    case "upcoming": return "Upcoming";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function BatchTimelineFull({ batches, timelineLocked }: BatchTimelineFullProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Project Timeline</h3>
        {timelineLocked && (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent-light border border-accent/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Immutable
          </span>
        )}
      </div>

      <div className="relative">
        {batches.map((batch, i) => {
          const isLast = i === batches.length - 1;
          return (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 relative"
            >
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-background ${statusDot(batch.status)}`} />
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[2rem] ${batch.status === "completed" ? "bg-green/30" : "bg-card-border"}`} />
                )}
              </div>

              {/* Batch content */}
              <div className={`flex-1 mb-3 p-3 rounded-lg border ${statusColor(batch.status)} bg-opacity-50`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{batch.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor(batch.status)}`}>
                    {statusLabel(batch.status)}
                  </span>
                </div>
                <p className="text-[11px] text-muted mb-1.5">{batch.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span>Deadline: {formatDate(batch.deadline)}</span>
                  {batch.completedAt && <span className="text-green">Done: {formatDate(batch.completedAt)}</span>}
                  {batch.status === "overdue" && (
                    <span className="text-red font-medium">
                      {Math.floor((Date.now() - new Date(batch.deadline).getTime()) / 86400000)}d overdue
                    </span>
                  )}
                  <span className={batch.priceImpact > 0 ? "text-green" : "text-muted"}>
                    +{batch.priceImpact}% on completion
                  </span>
                </div>
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
}

export function BatchTimelineCompact({ batches, currentBatchTitle, batchProgress, batchStatus }: BatchTimelineCompactProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Dots */}
      <div className="flex items-center gap-0.5">
        {batches.map((b) => (
          <div
            key={b.id}
            className={`w-1.5 h-1.5 rounded-full ${statusDot(b.status)}`}
            title={`${b.title}: ${statusLabel(b.status)}`}
          />
        ))}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-medium ${
        batchStatus === "overdue" ? "text-red" : batchStatus === "all_done" ? "text-green" : "text-muted"
      }`}>
        {batchProgress}
        {currentBatchTitle && ` · ${currentBatchTitle}`}
      </span>
    </div>
  );
}
