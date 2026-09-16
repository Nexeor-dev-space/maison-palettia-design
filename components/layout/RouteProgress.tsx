"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Give up on a navigation that never lands, so the bar cannot stick. */
const SAFETY_MS = 8000;

/**
 * The route-change indicator.
 *
 * WHY THIS IS NOT `app/loading.tsx`. That is the conventional answer and it is
 * the wrong one for this architecture — measured, not assumed. Every route
 * here is statically prerendered, and a root `loading.tsx` wraps them all in a
 * Suspense boundary: the built HTML for /about then carried a 279-character
 * `<main>` holding the loading bar and nothing else, with the real page
 * streamed in afterwards by JavaScript. That costs the first paint, and costs
 * a crawler or a JS-disabled visitor the page entirely. A loading state that
 * deletes the content it is waiting for is worse than no loading state.
 *
 * So the pending state is derived from a click instead, and nothing about the
 * server render changes. `pending` is computed during render from the path the
 * visitor asked for versus the path they are on — no effect writes it, so
 * there is no cascading render and no chance of it disagreeing with the route.
 *
 * WHEN IT APPEARS. Rarely, and that is correct: these pages are static and
 * Next prefetches links in the viewport, so most navigations resolve in a
 * frame or two and the bar never paints. It is there for a cold link on a slow
 * connection, which is the only moment a visitor would otherwise be left
 * wondering whether their tap registered.
 *
 * The track is always painted and the runner crosses it, so under reduced
 * motion — where globals.css collapses every animation — the static track
 * still carries the message.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);

  const pending = target !== null && target !== pathname;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Let the browser have modified clicks: they open tabs and windows, and
      // this page is not navigating anywhere.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or a jump to an anchor on it — nothing loads.
      if (url.pathname === window.location.pathname) return;

      setTarget(url.pathname);
      window.setTimeout(() => setTarget(null), SAFETY_MS);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div
      aria-hidden={!pending}
      className={[
        // At the very top of the window, and out of the document flow so it
        // can never shift the page it is reporting on.
        //
        // It used to hang at `top-header`, tucked under a bar that was pinned
        // there. The bar is in flow now and leaves with the page, so that
        // offset would strand this line 64px down the window with nothing
        // above it. Nought is where a progress line belongs anyway.
        "pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 overflow-hidden",
        "transition-opacity duration-200 ease-soft",
        pending ? "bg-primary/20 opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {pending ? <div className="h-full w-[28%] animate-runner bg-primary" /> : null}
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? "Loading page" : ""}
      </span>
    </div>
  );
}
