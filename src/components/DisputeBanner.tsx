"use client";

import { motion } from "framer-motion";
import type { Dispute } from "@/lib/data";

interface DisputeBannerProps {
  dispute: Dispute;
  onViewDetails?: () => void;
}

export default function DisputeBanner({ dispute, onViewDetails }: DisputeBannerProps) {
  const statusConfig = {
    open: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "Under Review" },
    confirmed: { bg: "bg-red/10", border: "border-red/30", text: "text-red", label: "Confirmed Stolen" },
    cleared: { bg: "bg-green/10", border: "border-green/30", text: "text-green", label: "Cleared" },
  };

  const cfg = statusConfig[dispute.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cfg.bg} ${cfg.border} border rounded-lg p-3`}
    >
      <div className="flex items-start gap-2">
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.text}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${cfg.text}`}>Disputed Project</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-muted line-clamp-2">{dispute.reason}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px]">
              <svg className="w-3 h-3 text-red" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
              </svg>
              <span className="text-red font-medium">{dispute.votesFor} stolen</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <svg className="w-3 h-3 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-green font-medium">{dispute.votesAgainst} legit</span>
            </div>
            {dispute.proofLinks.length > 0 && (
              <span className="text-[10px] text-muted">{dispute.proofLinks.length} proof link{dispute.proofLinks.length > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-[10px] text-accent-light hover:underline flex-shrink-0 mt-1"
          >
            Details
          </button>
        )}
      </div>

      {dispute.status === "open" && (
        <div className="mt-2 pt-2 border-t border-amber-500/20">
          <p className="text-[10px] text-amber-400/80">
            Trading continues during review. Exercise caution — community vote in progress.
          </p>
        </div>
      )}
      {dispute.status === "confirmed" && (
        <div className="mt-2 pt-2 border-t border-red/20">
          <p className="text-[10px] text-red/80">
            This project has been suspended. Trading is frozen and the creator received a -30 credibility penalty.
          </p>
        </div>
      )}
    </motion.div>
  );
}
