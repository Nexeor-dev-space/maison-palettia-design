"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

/**
 * ==========================================================================
 * THE SESSION CLOCK — whether a date has already begun, asked in the browser
 * ==========================================================================
 *
 * WHY THIS EXISTS. Every surface that offers a booking is prerendered. The
 * event pages and the booking step walk `generateStaticParams`, /events is a
 * static route, and checkout is a static shell. A date check made while
 * rendering any of them is a check made at build time — or at the last
 * revalidation — and from then on the HTML says whatever was true at that
 * moment. Candle Making was open when the site was built on the 9th, and with
 * nothing but a server-side check it would have kept a working Book button
 * long after the 11th: QA moved the browser's clock forward and booked it.
 *
 * So the server still gives its verdict (`hasSessionPassed` in
 * lib/workshops.ts — right most of the time, and all that someone without
 * JavaScript ever sees), and this file asks the question again against the
 * visitor's own clock once the page is live.
 *
 * WHY `useSyncExternalStore` AND NOT AN EFFECT. The wall clock is an external
 * store — a value React does not own and that changes underneath it — and
 * this hook is React's own answer to exactly that, with the property that
 * matters here:
 *
 *   hydrating .......... React renders with `getServerSnapshot`, which returns
 *                        the server's own verdict, so the first client render
 *                        is the HTML exactly. `Date.now()` never decides
 *                        anything during hydration, so there is nothing for
 *                        the two renders to disagree about.
 *   straight after ..... React compares that with `getSnapshot` — the real
 *                        clock — and re-renders if they differ. No effect, no
 *                        state set from an effect, no cascading render.
 *   client navigation .. not a hydration, so the clock decides from the
 *                        first frame and a past date never flashes as open.
 *
 * AND IT KEEPS TIME. A page left open across the start of its own session —
 * the checkout tab someone walks away from — must not go on offering it. The
 * subscription arms one timer for the next start still ahead, and asks again
 * whenever the tab comes back into view: a background tab's timers are
 * throttled and a closed laptop lid stops them outright, so a timer alone
 * would be late by however long the lid was shut.
 *
 * WHAT "PASSED" MEANS. A session stops being bookable when it STARTS, not
 * when it ends — there is no joining a candle-pour half an hour in. So a
 * date is "passed" from `startsAt` on. This is the same rule as
 * `hasSessionPassed` in lib/workshops.ts, written out again here rather than
 * imported: that module carries the session catalogue as well as its helpers,
 * and a client component that imports it ships the catalogue to the browser
 * (the note on <EventBookingBar> says the same). One comparison is cheaper to
 * keep in step than that is to pay for.
 */

/** setTimeout's ceiling (2^31 − 1 ms, about 24.8 days); longer waits re-arm. */
const MAX_TIMER = 2_147_483_647;

function parseTimes(key: string): number[] {
  return key ? key.split("|").map((startsAt) => Date.parse(startsAt)) : [];
}

/**
 * The clock, over a list of start times. `match` says which question:
 *
 *   "any" ..... has at least one of them begun? Checkout's question — a
 *               basket with a single lapsed date cannot be confirmed.
 *   "every" ... have all of them begun? The event page's question about the
 *               OTHER sessions it points to: "other sessions are open" stays
 *               true until the last of them starts.
 *
 * An empty list is never "passed" under either: there is nothing to have
 * begun. A date that will not parse never counts as passed either — an
 * unreadable `startsAt` is a data fault to fix at the source, not a reason to
 * close a booking.
 *
 * @param passedAtRender  The server's verdict when it rendered the HTML —
 *                        what hydration must reproduce. Leave it false where
 *                        there was no server verdict (a component that only
 *                        ever renders on the client, or one whose HTML only
 *                        exists for an open date).
 */
function useSessionsPassed(
  startsAt: readonly string[],
  match: "any" | "every",
  passedAtRender: boolean,
): boolean {
  /*
    One string, so the callbacks below are stable across renders for the same
    dates. A fresh array arrives on every render (`[workshop.startsAt]`), and
    a `subscribe` that changed identity each time would have React tear the
    timer down and set it up again on every render.
  */
  const key = startsAt.join("|");

  const subscribe = useCallback(
    (onChange: () => void) => {
      const times = parseTimes(key);
      let timer: ReturnType<typeof setTimeout> | undefined;

      const arm = () => {
        const now = Date.now();
        const next = Math.min(...times.filter((t) => t > now));
        if (!Number.isFinite(next)) return;
        // +1 so the timer lands on or after the start, never a tick before.
        // If a browser fires early anyway, `onChange` finds nothing changed
        // and `arm` sets the remainder.
        timer = setTimeout(() => {
          onChange();
          arm();
        }, Math.min(next - now + 1, MAX_TIMER));
      };

      const recheck = () => {
        if (document.visibilityState !== "visible") return;
        clearTimeout(timer);
        onChange();
        arm();
      };

      arm();
      document.addEventListener("visibilitychange", recheck);
      // A page restored from the back/forward cache comes back with the
      // clock it left with; this is the event that says it is live again.
      window.addEventListener("pageshow", recheck);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", recheck);
        window.removeEventListener("pageshow", recheck);
      };
    },
    [key],
  );

  /*
    `passedAtRender ||` — A SERVER THAT SAID "PASSED" IS NEVER OVERRULED.
    Time only runs one way, so a date the server already saw go by stays gone
    by; the only way the browser's clock could disagree is by being wrong — a
    phone set a day behind would otherwise reopen a session that has run. The
    browser is trusted to close a date, never to reopen one.
  */
  const getSnapshot = useCallback(() => {
    if (passedAtRender) return true;
    const now = Date.now();
    const times = parseTimes(key);
    const started = (t: number) => t <= now;
    return times.length > 0 && (match === "any" ? times.some(started) : times.every(started));
  }, [key, match, passedAtRender]);

  const getServerSnapshot = useCallback(() => passedAtRender, [passedAtRender]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True once ANY of the given sessions has begun. See {@link useSessionsPassed}. */
export function useAnySessionPassed(
  startsAt: readonly string[],
  passedAtRender = false,
): boolean {
  return useSessionsPassed(startsAt, "any", passedAtRender);
}

/** One session's answer. See {@link useSessionsPassed}. */
export function useSessionPassed(startsAt: string, passedAtRender = false): boolean {
  return useSessionsPassed([startsAt], "any", passedAtRender);
}

/**
 * Renders `open` while a session can still be booked and `passed` once it
 * has begun.
 *
 * THE SERVER'S DOOR INTO THE CLOCK. Most of what changes when a date passes
 * is drawn by server components — the event page's action, its availability
 * line, the booking step — and a server component cannot call a hook. Both
 * states are rendered on the server as ordinary elements and handed in as
 * slots, the interleaving pattern in node_modules/next/dist/docs/01-app/
 * 01-getting-started/05-server-and-client-components.md, and this picks
 * between them. Nothing about either state is decided in the browser except
 * which one is showing, and nothing from lib/workshops crosses into it.
 */
export function SessionGate({
  startsAt,
  passedAtRender = false,
  open,
  passed = null,
}: {
  /**
   * ISO 8601, as the session carries it. A list means "once every one of
   * these has begun" — the "every" question in {@link useSessionsPassed}.
   */
  startsAt: string | readonly string[];
  /** The server's verdict — see {@link useSessionsPassed}. */
  passedAtRender?: boolean;
  /** What shows while the date (or any of the dates) is still ahead. */
  open: ReactNode;
  /** What shows once it has begun. Nothing, by default. */
  passed?: ReactNode;
}) {
  const hasPassed = useSessionsPassed(
    typeof startsAt === "string" ? [startsAt] : startsAt,
    "every",
    passedAtRender,
  );
  return <>{hasPassed ? passed : open}</>;
}
