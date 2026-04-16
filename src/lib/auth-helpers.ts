import crypto from "node:crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function newUserId(): string {
  return `user_${crypto.randomBytes(12).toString("hex")}`;
}

export function displayNameToInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "U";
}

export function emailToUsername(email: string, userId: string): string {
  const local = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16) || "user";
  return `@${local}_${userId.slice(-6)}`;
}
