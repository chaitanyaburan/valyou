"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const registered = searchParams.get("registered") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      await refresh();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card space-y-6 p-6 sm:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Use your Valyou account email and password.</p>
      </div>

      {registered && (
        <p className="rounded-lg border border-gain/30 bg-gain/10 px-3 py-2 text-sm text-gain">
          Account created. You can sign in now.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-accent/60"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-accent/60"
          />
        </div>
        {error && <p className="text-sm text-loss">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/auth/sign-up" className="font-medium text-accent-light hover:text-accent">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

export default function SignInPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center py-8">
      <Suspense
        fallback={
          <div className="glass-card animate-pulse space-y-4 p-8">
            <div className="h-8 w-48 rounded bg-card-border" />
            <div className="h-10 w-full rounded bg-card-border" />
            <div className="h-10 w-full rounded bg-card-border" />
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </section>
  );
}
