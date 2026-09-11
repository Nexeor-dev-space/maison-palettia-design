"use client";

import { useEffect, useState } from "react";

/**
 * Echoes `value`, but only once it has stopped changing for `delayMs`.
 *
 * The search overlay's whole reason for this: the catalogue lookup itself is
 * instant (an in-memory array, not a network call), but re-filtering and
 * re-rendering a list of result cards on every single keystroke is still
 * visible work, and doing it while someone is mid-word is where a "live"
 * search starts to feel like it is fighting the typing rather than keeping
 * up with it. Debouncing the query rather than the render is what lets the
 * input itself stay perfectly responsive — it is never touched — while the
 * results settle a beat after the typing does.
 *
 * Generic rather than search-specific, so it costs nothing to reach for
 * again anywhere else on the site a fast-changing value needs a slower echo.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
