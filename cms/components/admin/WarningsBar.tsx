"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import type { Warning } from "./adminData";

/**
 * ==========================================================================
 * WarningsBar — the red checks as a slim strip on every admin page (SPEC §I)
 * ==========================================================================
 *
 * SPEC §I: the dashboard warnings are "also rendered as a slim bar on every
 * admin page via `providers`". Only the RED ones — something broken now
 * (background tasks paused, an open card dispute, the webhook at an old
 * address, a burst of fake payment notifications, the secret changed) —
 * because those must reach the owner on the Orders page too. The amber
 * "finish setting up" list stays on the dashboard.
 *
 * A client provider, like MockBanner beside it: providers wrap the admin's
 * root layout, which renders once per full page load, so a server component
 * would go stale. It asks `/api/actions/admin/warnings` (the dashboard's
 * own `loadWarnings`, role filtering included) on load and on navigation —
 * at most once a minute, the checks are a dozen small queries — and hides
 * itself on the dashboard, which already shows the full cards.
 */

const REFRESH_MS = 60_000;

export function WarningsBar({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const { config } = useConfig();
  const pathname = usePathname() ?? "";
  const [red, setRed] = useState<Warning[]>([]);
  const lastFetch = useRef(0);

  const admin = config.routes.admin;
  const onDashboard = pathname === admin || pathname === `${admin}/`;
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!signedIn) return;
    if (Date.now() - lastFetch.current < REFRESH_MS) return;
    const controller = new AbortController();
    fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/admin/warnings`, { credentials: "include", signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ red?: Warning[] }>) : null))
      .then((data) => {
        // Stamped on an ANSWER, not on the request: an aborted first try
        // (React's development double-mount) must not block the retry.
        lastFetch.current = Date.now();
        setRed(data?.red ?? []);
      })
      .catch(() => {
        /* offline or aborted: keep what we last knew */
      });
    return () => controller.abort();
  }, [signedIn, pathname, config.routes.api, config.serverURL]);

  const show = signedIn && !onDashboard && red.length > 0;
  const first = red[0];

  return (
    <>
      {show && first ? (
        <div className="mp-warnbar" role="alert">
          <span className="mp-warnbar__dot" aria-hidden />
          <span className="mp-warnbar__text">
            <strong>Needs attention: </strong>
            {first.text}
          </span>
          {first.href ? (
            <Link className="mp-warnbar__cta" href={first.href}>
              {first.cta ?? "Fix"} →
            </Link>
          ) : null}
          {red.length > 1 ? (
            <Link className="mp-warnbar__cta" href={admin}>
              +{red.length - 1} more on the dashboard
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </>
  );
}
