"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dispute } from "@/lib/data";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  existingDispute?: Dispute;
  antiCheatFlags?: string[];
}

export default function DisputeModal({ isOpen, onClose, projectTitle, existingDispute, antiCheatFlags = [] }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [proofLinks, setProofLinks] = useState<string[]>([""]);
  const [submitted, setSubmitted] = useState(false);
  const [userVote, setUserVote] = useState<"stolen" | "legit" | null>(null);

  function addProofLink() {
    setProofLinks((prev) => [...prev, ""]);
  }

  function updateProofLink(index: number, value: string) {
    setProofLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  }

  function removeProofLink(index: number) {
    setProofLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!reason.trim() || proofLinks.filter((l) => l.trim()).length === 0) return;
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-card p-5 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {existingDispute ? "Dispute Details" : "Flag Project"}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">{projectTitle}</p>
              </div>
              <button onClick={onClose} className="text-muted hover:text-foreground transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {existingDispute ? (
              <>
                {/* Existing dispute view */}
                <div className="space-y-3">
                  {antiCheatFlags.length > 0 && (
                    <div className="p-3 rounded-lg bg-red/10 border border-red/30">
                      <p className="text-xs font-medium text-red mb-1">Anti-cheat flags</p>
                      <p className="text-[11px] text-foreground/80">{antiCheatFlags.join(", ")}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs font-medium text-amber-400 mb-1">Reason</p>
                    <p className="text-[11px] text-muted">{existingDispute.reason}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Evidence Links</p>
                    <div className="space-y-1.5">
                      {existingDispute.proofLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[11px] text-accent-light hover:underline p-2 rounded bg-card/50 border border-card-border"
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                          </svg>
                          <span className="truncate">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Voting */}
                  <div className="pt-3 border-t border-card-border">
                    <p className="text-xs font-medium text-foreground mb-2">Community Vote</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 text-center p-2 rounded-lg bg-red/5 border border-red/20">
                        <p className="text-lg font-bold text-red">{existingDispute.votesFor + (userVote === "stolen" ? 1 : 0)}</p>
                        <p className="text-[10px] text-muted">Stolen</p>
                      </div>
                      <div className="flex-1 text-center p-2 rounded-lg bg-green/5 border border-green/20">
                        <p className="text-lg font-bold text-green">{existingDispute.votesAgainst + (userVote === "legit" ? 1 : 0)}</p>
                        <p className="text-[10px] text-muted">Legit</p>
                      </div>
                    </div>

                    {userVote ? (
                      <p className="text-[11px] text-center text-muted">
                        You voted: <span className={userVote === "stolen" ? "text-red" : "text-green"}>{userVote}</span>
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserVote("stolen")}
                          className="flex-1 py-2 text-xs font-medium rounded-lg bg-red/10 text-red border border-red/20 hover:bg-red/20 transition-colors"
                        >
                          Vote Stolen
                        </button>
                        <button
                          onClick={() => setUserVote("legit")}
                          className="flex-1 py-2 text-xs font-medium rounded-lg bg-green/10 text-green border border-green/20 hover:bg-green/20 transition-colors"
                        >
                          Vote Legit
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-muted text-center">
                    Filed on {new Date(existingDispute.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </>
            ) : submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Dispute Submitted</p>
                <p className="text-[11px] text-muted">
                  A &quot;Disputed&quot; badge will appear on this project. The community will now vote on the evidence.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <>
                {/* Filing form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why you believe this project is stolen or duplicated..."
                      rows={3}
                      className="w-full text-xs bg-card/50 border border-card-border rounded-lg p-2.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/40 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Proof Links <span className="text-muted font-normal">(GitHub commits, timestamps, prior art)</span>
                    </label>
                    <div className="space-y-2">
                      {proofLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => updateProofLink(i, e.target.value)}
                            placeholder="https://github.com/..."
                            className="flex-1 text-xs bg-card/50 border border-card-border rounded-lg p-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/40"
                          />
                          {proofLinks.length > 1 && (
                            <button
                              onClick={() => removeProofLink(i)}
                              className="text-muted hover:text-red transition-colors p-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addProofLink}
                      className="mt-1.5 text-[11px] text-accent-light hover:text-accent transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add another link
                    </button>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2 text-xs font-medium rounded-lg bg-card/50 text-muted border border-card-border hover:bg-card/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!reason.trim() || proofLinks.filter((l) => l.trim()).length === 0}
                      className="flex-1 py-2 text-xs font-medium rounded-lg bg-red/10 text-red border border-red/20 hover:bg-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Submit Dispute
                    </button>
                  </div>

                  <p className="text-[10px] text-muted text-center">
                    Frivolous disputes affect your credibility score. Only flag if you have genuine evidence.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
