"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APP_TOUR_RISK_ACCEPTED_EVENT, RISK_DISCLOSURE_ACCEPTED_KEY } from "@/lib/app-tour";

type GateState = "pending" | "needAck" | "ok";

export default function RiskDisclosureGate({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<GateState>("pending");

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setGate(window.localStorage.getItem(RISK_DISCLOSURE_ACCEPTED_KEY) === "1" ? "ok" : "needAck");
      } catch {
        setGate("needAck");
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const onAccept = useCallback(() => {
    try {
      window.localStorage.setItem(RISK_DISCLOSURE_ACCEPTED_KEY, "1");
    } catch {
      /* ignore */
    }
    setGate("ok");
  }, []);

  const blocked = gate !== "ok";

  useEffect(() => {
    if (gate !== "ok") return;
    window.dispatchEvent(new CustomEvent(APP_TOUR_RISK_ACCEPTED_EVENT));
  }, [gate]);

  useEffect(() => {
    document.documentElement.style.overflow = blocked ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [blocked]);

  return (
    <div className="relative min-h-screen">
      <div
        className={blocked ? "pointer-events-none select-none" : undefined}
        inert={blocked ? true : undefined}
        aria-hidden={blocked ? true : undefined}
      >
        {children}
      </div>

      <AnimatePresence>
        {blocked && (
          <motion.div
            key="risk-gate"
            className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="risk-disclosure-title"
            aria-describedby="risk-disclosure-body"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="max-h-[min(92vh,840px)] w-full overflow-hidden rounded-t-2xl border border-card-border border-b-0 bg-card shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
            >
              <div className="mx-auto max-h-[inherit] max-w-2xl overflow-y-auto overscroll-contain px-4 pb-4 pt-3 sm:px-6 sm:pt-4">
                <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-muted/40" aria-hidden />

                <h2 id="risk-disclosure-title" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Important Risk Disclosures for Valyou
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Please read the following points carefully before investing in projects on Valyou.
                </p>

                <div id="risk-disclosure-body" className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/90">
                  <p className="font-semibold text-foreground">Risk disclosures on project-based investing</p>
                  <ol className="list-decimal space-y-3 pl-4 marker:text-muted">
                    <li>
                      A majority of early-stage projects may fail or not achieve expected outcomes. Investments made in
                      such projects may result in partial or complete loss of capital.
                    </li>
                    <li>
                      Project valuations and share prices on Valyou are not regulated financial instruments and may be
                      highly volatile based on user activity, sentiment, and platform dynamics.
                    </li>
                    <li>
                      Information provided by project creators (including demos, GitHub links, and progress updates) may
                      not always be independently verified. Investors must perform their own due diligence before
                      investing.
                    </li>
                    <li>
                      Past performance, credibility scores, or previous project success do not guarantee future results
                      or returns.
                    </li>
                    <li>
                      Investments made on Valyou are speculative in nature and should not be considered as traditional
                      equity, securities, or legally enforceable ownership.
                    </li>
                    <li>
                      Liquidity is not guaranteed. Users may not be able to exit or sell their positions at desired
                      prices or timeframes.
                    </li>
                    <li>
                      Market activity, including buying and selling trends, may be influenced by user behavior and does
                      not necessarily reflect the intrinsic value of a project.
                    </li>
                    <li>
                      Any tokenized or virtual currency used within the platform is for simulation or utility purposes and
                      may not represent real-world monetary value.
                    </li>
                    <li>Valyou does not provide financial advice. All investment decisions are made at the user&apos;s own risk.</li>
                  </ol>
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-muted">
                    By proceeding, you acknowledge that you understand the risks involved and agree to participate
                    responsibly.
                  </p>
                </div>

                <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 border-t border-card-border bg-card/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
                  <button
                    type="button"
                    onClick={onAccept}
                    disabled={gate === "pending"}
                    className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-40"
                  >
                    I understand &amp; accept the risks
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
