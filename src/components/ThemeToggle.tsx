"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  function setTheme(next: ThemeMode) {
    setMode(next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex rounded-full border border-card-border bg-card/60 p-0.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={mode === "light"}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          mode === "light" ? "text-foreground" : "text-muted hover:text-foreground/80"
        }`}
      >
        {mode === "light" && (
          <motion.span
            layoutId="theme-pill"
            className="absolute inset-0 rounded-full bg-background shadow-sm border border-card-border"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          Light
        </span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={mode === "dark"}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          mode === "dark" ? "text-foreground" : "text-muted hover:text-foreground/80"
        }`}
      >
        {mode === "dark" && (
          <motion.span
            layoutId="theme-pill"
            className="absolute inset-0 rounded-full bg-background shadow-sm border border-card-border"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.673-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
          Dark
        </span>
      </button>
    </div>
  );
}
