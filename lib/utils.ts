import type { ClassValue } from "@/types/utils";

/**
 * Join conditional class names. Deliberately dependency-free — we only need
 * concatenation, not Tailwind conflict resolution.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a Date for UAE-facing copy, e.g. "14 March 2026". */
export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
