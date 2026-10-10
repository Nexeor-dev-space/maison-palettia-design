"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { COLLECT_URL, isExcludedPath, normalisePath, type SiteAnalyticsConfig } from "@/cms/collections/analytics/shared";

/**
 * ==========================================================================
 * AnalyticsBeacon — one anonymous ping per page view (SPEC §D.6)
 * ==========================================================================
 *
 * Renders nothing. On every route change it sends
 *
 *     { p: "/events/candle-making", r?: "instagram.com", e: true }
 *
 * to POST /api/site/analytics/collect with `navigator.sendBeacon` (a fetch
 * with `keepalive` where sendBeacon is missing). That is ALL it sends: the
 * pathname (no query string, no #fragment — they are stripped here and
 * again on the server), the referring site's hostname on the first page of
 * a visit only, and whether this is that first page. No cookie, no
 * localStorage, no screen size, no id of any kind — the server derives a
 * daily anonymous visitor hash from what every request carries anyway, so
 * there is nothing here that needs consent.
 *
 * It does not send:
 *   · on the booking surfaces and any path in Analytics & tracking →
 *     "Paths never recorded" (the server refuses them too);
 *   · when the browser asks not to be tracked (Do-Not-Track or Global
 *     Privacy Control) and the setting says to honour it;
 *   · on the branded 404 (its heading has the id `not-found-title`), so a
 *     mistyped address is not a page view; the server maps any unknown
 *     path to `/other` as a second line;
 *   · twice for the same path in a row (React's dev double-effects, a
 *     re-render) — the timer below is cancelled by the effect's cleanup, so
 *     only the surviving effect fires.
 *
 * Mounted by app/(site)/layout.tsx outside draft mode only: an editor
 * previewing a change is not a visitor.
 */
export function AnalyticsBeacon({ enabled, respectDoNotTrack, excludePaths }: SiteAnalyticsConfig["beacon"]) {
  const pathname = usePathname();
  const firstView = useRef(true);
  const lastSent = useRef<string | null>(null);
  const exclude = excludePaths.join("\n");

  useEffect(() => {
    if (!enabled) return;
    const path = normalisePath(pathname || window.location.pathname);
    if (!path) return;

    // After paint, so the new page's DOM (and a 404's marker) is in place.
    const timer = window.setTimeout(() => {
      if (lastSent.current === path) return;
      lastSent.current = path;
      let entry = firstView.current;
      firstView.current = false;

      if (isExcludedPath(path, exclude.split("\n"))) return;
      const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
      if (respectDoNotTrack && (nav.doNotTrack === "1" || nav.globalPrivacyControl === true)) return;
      if (document.getElementById("not-found-title")) return;

      let referrer: string | undefined;
      if (entry && document.referrer) {
        try {
          const host = new URL(document.referrer).hostname;
          // A full reload or a plain link from our own pages is navigation, not a new visit.
          if (host === window.location.hostname) entry = false;
          else if (host) referrer = host;
        } catch {
          // an unparseable referrer is simply not sent
        }
      }

      const body = JSON.stringify(referrer ? { p: path, r: referrer, e: entry } : { p: path, e: entry });
      try {
        if (navigator.sendBeacon?.(COLLECT_URL, body)) return;
      } catch {
        // fall through to fetch
      }
      void fetch(COLLECT_URL, { method: "POST", body, keepalive: true, credentials: "omit", headers: { "content-type": "text/plain" } }).catch(() => undefined);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [pathname, enabled, respectDoNotTrack, exclude]);

  return null;
}
