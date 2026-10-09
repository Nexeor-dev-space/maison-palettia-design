"use client";

/**
 * Site-wide admin banner while Payments is in **Mock** mode (SPEC §I,
 * "MOCK also as a site-wide banner"), mounted through
 * `admin.components.providers` in payload.config.ts (1A adds it after this
 * file exists, because `generate:importmap` resolves the path).
 *
 * WHY A BANNER AT ALL. Mock mode makes every checkout succeed without a card.
 * That is exactly right for development and for the E2E suite, and exactly
 * wrong the one time someone forgets and demos it to the owner as "payments
 * working". A strip at the top of every admin page, in the warning colour,
 * is cheaper than that conversation.
 *
 * WHY A CLIENT COMPONENT. Providers wrap the admin's root layout, which Next
 * renders once per full page load; a server component here would show the
 * mode as it was when the tab was opened and go stale the moment an admin
 * saved the Payments page. Instead this fetches the mode (only the `mode`
 * field, via `select`) when it mounts, whenever the route changes, and
 * whenever Payload reports a save of `payment-settings` (`useDocumentEvents`)
 * — so switching Test → Mock shows the strip without a reload.
 *
 * Only admins can read `payment-settings` (§J), so the fetch is skipped for
 * everyone else rather than producing a 403 on every navigation. Editors and
 * front-desk never touch the gateway; the banner is for the people who can.
 *
 * In production the mode cannot be `mock` (validator) — if the row still
 * holds it from before a deploy, the strip turns red and says so.
 */

import { useAuth, useConfig, useDocumentEvents } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const PAYMENT_SETTINGS_SLUG = "payment-settings";

export function MockBanner({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const { config } = useConfig();
  const { mostRecentUpdate } = useDocumentEvents();
  const pathname = usePathname();
  const [mode, setMode] = useState<string | null>(null);

  const isAdmin = (user as { role?: string } | null | undefined)?.role === "admin";
  const paymentsSaved = mostRecentUpdate?.entitySlug === PAYMENT_SETTINGS_SLUG ? mostRecentUpdate.updatedAt : null;

  useEffect(() => {
    // Non-admins cannot read the global (§J); skip the request rather than
    // collect a 403 on every navigation. `show` below also requires isAdmin,
    // so a stale value from a previous admin session on this tab is harmless.
    if (!isAdmin) return;
    const controller = new AbortController();
    const url = `${config.serverURL ?? ""}${config.routes.api}/globals/${PAYMENT_SETTINGS_SLUG}?depth=0&select[mode]=true`;
    fetch(url, { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ mode?: string | null }>) : null))
      .then((doc) => setMode(doc?.mode ?? null))
      .catch(() => {
        /* aborted or offline: keep whatever we last knew */
      });
    return () => controller.abort();
  }, [isAdmin, pathname, paymentsSaved, config.routes.api, config.serverURL]);

  const isProduction = process.env.NODE_ENV === "production";
  const show = isAdmin && mode === "mock";

  return (
    <>
      {show ? (
        <div
          role="status"
          data-mock-banner
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            padding: "calc(var(--base) / 3) var(--base)",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: isProduction ? "var(--theme-elevation-0)" : "var(--theme-elevation-1000)",
            background: isProduction ? "var(--theme-error-500)" : "var(--theme-warning-500)",
          }}
        >
          {isProduction
            ? "Payments are in MOCK mode on a production server — switch to Test or Live under Settings → Payments."
            : "Payments are in MOCK mode: every checkout succeeds without a card and no money moves. Switch under Settings → Payments."}
        </div>
      ) : null}
      {children}
    </>
  );
}
