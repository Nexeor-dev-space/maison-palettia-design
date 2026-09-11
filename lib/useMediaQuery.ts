"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Whether `query` currently matches, kept live as the viewport changes.
 *
 * Built on `useSyncExternalStore` rather than a `useState`/`useEffect` pair —
 * a `matchMedia` list is exactly the external store that hook exists for, and
 * the same pattern this project already uses for the shopping cart in
 * lib/cart.ts. The practical win over an effect: React can read the correct
 * answer for the *first* render a component that needs this is actually
 * interactive for, rather than committing one frame with a guessed value and
 * silently correcting it a tick later.
 *
 * `getServerSnapshot` returns `false` unconditionally — there is no viewport
 * on the server to answer honestly with — which only matters if this is ever
 * read from something rendered before the browser exists to ask. Nothing
 * that reads this today is: every consumer is inside a panel that is itself
 * not on screen until a person has already clicked something.
 */
export function useMediaQuery(query: string): boolean {
  const list = useMemo(() => (typeof window === "undefined" ? null : window.matchMedia(query)), [query]);

  return useSyncExternalStore(
    (onChange) => {
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    () => list?.matches ?? false,
    () => false,
  );
}
