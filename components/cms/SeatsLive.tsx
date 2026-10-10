"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * ==========================================================================
 * SeatsLive — the seat count a static page cannot know (SPEC §G.3)
 * ==========================================================================
 *
 * A session page is prerendered and revalidated on publish, but seats are
 * sold between publishes: inventory changes set `context.skipRevalidate`
 * (cms/lib/inventory.ts, Phase 3), so no job ever purges a page for a sale.
 * The HTML therefore carries the server's verdict at render time, and this
 * asks for the live one:
 *
 *     GET /api/site/availability/{slug}   (no-store, rate-limited)
 *     → { available, bookingStatus, salesCloseAt, holdMinutes, bookingsOpen }
 *
 * on mount and whenever the tab becomes visible again (a visitor who left the
 * page open over lunch comes back to today's number). It renders nothing. The
 * answer goes into a tiny per-slug store that the booking bar reads with
 * `useSeatsLive(slug)` — capping the quantity picker, or swapping to the
 * waitlist form when `available` reaches 0 (Phase 3, components/booking).
 * An empty store means "trust the HTML" — exactly today's behaviour.
 *
 * NOT MOUNTED IN PHASE 2. The endpoint lands in Phase 3, and a mounted
 * component meant a 404 on every session page view until then; the session
 * page (app/(site)/events/[slug]/page.tsx) says where Phase 3 mounts it.
 */

export interface SeatsAvailability {
  available: number;
  bookingStatus: "open" | "waitlist" | "closed";
  salesCloseAt: string | null;
  holdMinutes: number;
  bookingsOpen: boolean;
}

const store = new Map<string, SeatsAvailability>();
const listeners = new Set<() => void>();

function publish(slug: string, value: SeatsAvailability) {
  store.set(slug, value);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The live availability for a session, or null until (or unless) the server has answered. */
export function useSeatsLive(slug: string): SeatsAvailability | null {
  return useSyncExternalStore(
    subscribe,
    () => store.get(slug) ?? null,
    () => null,
  );
}

function isAvailability(value: unknown): value is SeatsAvailability {
  const v = value as Partial<SeatsAvailability> | null;
  return Boolean(v) && typeof v!.available === "number" && typeof v!.bookingStatus === "string";
}

export function SeatsLive({ slug }: { slug: string }) {
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/site/availability/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) return;
        const body: unknown = await response.json();
        if (!cancelled && isAvailability(body)) publish(slug, body);
      } catch {
        // Offline or the endpoint is not there yet: the static verdict stands.
      }
    };
    void refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [slug]);

  return null;
}
