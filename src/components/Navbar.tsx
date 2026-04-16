"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import WalletNavbarBadge from "./WalletNavbarBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTour } from "@/contexts/AppTourContext";

function avatarInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return displayName.trim().slice(0, 2).toUpperCase() || "U";
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Market", href: "/market" },
  { label: "Discover", href: "/discover" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Wallet", href: "/wallet" },
  { label: "Startups", href: "/funding" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { startTour } = useAppTour();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 border-b border-card-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="shrink-0" data-tour="brand">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Valyou
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5" data-tour="nav-desktop">
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
        <div className="hidden sm:block flex-1 max-w-sm mx-4" data-tour="nav-search">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:block" data-tour="wallet">
            <WalletNavbarBadge />
          </div>
          {/* Mobile search toggle */}
          <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          <div className="flex shrink-0 items-center" data-tour="post-project">
            <Link
              href="/post-project"
              className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border bg-card/60 px-2 py-1.5 text-[11px] font-semibold text-accent-light transition hover:border-accent/40 hover:bg-card md:px-2.5 md:text-xs"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden md:inline">Post Project</span>
            </Link>
            <Link
              href="/post-project"
              className="sm:hidden shrink-0 rounded-lg border border-card-border p-2 text-muted hover:bg-card hover:text-accent-light"
              aria-label="Post Project"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => startTour()}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-card-border p-2 text-muted transition hover:border-accent/40 hover:bg-card hover:text-accent-light"
            aria-label="Start app tour"
            title="App tour"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 .75h.008v.008H12v-.008z" />
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
          {!loading && !user && (
            <>
              <Link
                href="/auth/sign-in"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-card hover:text-foreground sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-accent/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent sm:text-sm"
              >
                Sign up
              </Link>
            </>
          )}
          {!loading && user && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden max-w-[120px] truncate text-xs text-muted lg:inline">{user.displayName}</span>
              <Link href={`/profile/${user.userId}`}>
                <Avatar initials={avatarInitials(user.displayName)} size="sm" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  void signOut().then(() => router.refresh());
                }}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-card hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          )}
          {loading && <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-card-border" aria-hidden />}
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
              <div className="mb-2 md:hidden">
                <WalletNavbarBadge />
              </div>
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
