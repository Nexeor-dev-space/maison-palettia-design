"use client";

import { useConfig, useDocumentInfo } from "@payloadcms/ui";
import React, { useEffect, useState } from "react";

/**
 * ==========================================================================
 * SessionQuickStats — sold · held · left, beside the Save button (SPEC §D.2, §I)
 * ==========================================================================
 *
 * The one line front-desk and editors look for on a session: how full is
 * it? The numbers are the session's virtual fields (`seatsSold`,
 * `seatsHeld`, `seatsAvailable`), which the collection's afterRead computes
 * from the `session-inventory` row — so this component never reads the
 * counter table itself and sees exactly what the field access allows:
 * staff get sold and held, editors only "left".
 *
 * The document view's data is a snapshot from page load, and seats move
 * while the page is open (holds are taken and released every few minutes),
 * so the line refetches the document on mount, after every save
 * (`lastUpdateTime`) and when the tab becomes visible again.
 */

type Stats = { total?: number; sold?: number; held?: number; available?: number; full?: boolean };

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

const statsOf = (doc: Record<string, unknown> | null | undefined): Stats | null =>
  doc
    ? {
        total: num(doc.seatsTotal),
        sold: num(doc.seatsSold),
        held: num(doc.seatsHeld),
        available: num(doc.seatsAvailable),
        full: doc.isFullyBooked === true,
      }
    : null;

function Chip({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: "0.35em",
        alignItems: "baseline",
        padding: "0.15em 0.6em",
        borderRadius: "999px",
        border: `1px solid ${tone === "warn" ? "var(--theme-warning-500)" : "var(--theme-elevation-150)"}`,
        background: tone === "warn" ? "var(--theme-warning-100)" : "var(--theme-elevation-50)",
        whiteSpace: "nowrap",
        fontSize: "0.85em",
      }}
    >
      <span style={{ color: "var(--theme-elevation-600)" }}>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

export function SessionQuickStats() {
  const { id, data, lastUpdateTime } = useDocumentInfo();
  const { config } = useConfig();
  const [fetched, setFetched] = useState<Stats | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${config.serverURL ?? ""}${config.routes.api}/sessions/${id}?depth=0&draft=true`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const doc = (await res.json()) as Record<string, unknown>;
        if (!cancelled) setFetched(statsOf(doc));
      } catch {
        /* offline or signed out: keep the last numbers */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, lastUpdateTime, config.serverURL, config.routes.api]);

  if (!id) return null; // a session that has not been saved yet has no seats to count
  const stats = fetched ?? statsOf(data as Record<string, unknown> | undefined);
  if (!stats) return null;

  return (
    <div
      className="mp-session-stats"
      aria-label="Seats"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.4em", alignItems: "center", marginInlineEnd: "calc(var(--base) / 2)" }}
    >
      {stats.sold !== undefined ? <Chip label="Sold" value={stats.sold} /> : null}
      {stats.held !== undefined ? <Chip label="Held" value={stats.held} /> : null}
      {stats.available !== undefined ? (
        <Chip
          label={stats.full ? "Fully booked" : "Left"}
          value={stats.total !== undefined ? `${stats.available} of ${stats.total}` : stats.available}
          tone={stats.full ? "warn" : undefined}
        />
      ) : null}
    </div>
  );
}
