"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Market", href: "/market" },
  { label: "Discover", href: "/discover" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Funding", href: "/funding" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 border-b border-card-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="shrink-0">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Valyou
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? "text-accent-light" : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-lg bg-accent/10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop search */}
        <div className="hidden sm:block flex-1 max-w-sm mx-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects, creators..."
              className="w-full rounded-full bg-card border border-card-border py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search toggle */}
          <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          <Link href="/notifications" className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-loss live-dot-red" />
          </Link>
          <Link href="/messages" className="hidden sm:block p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </Link>
          <Link href="/profile/sneha-iyer">
            <Avatar initials="AK" size="sm" />
          </Link>
        </div>
      </div>

      {/* Mobile search dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-b border-card-border bg-background/95 backdrop-blur-xl"
          >
            <div className="px-3 py-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects, creators..."
                  autoFocus
                  className="w-full rounded-full bg-card border border-card-border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
