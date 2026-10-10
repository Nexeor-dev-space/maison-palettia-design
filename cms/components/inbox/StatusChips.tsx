"use client";

import { useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { STATUS_CHIPS } from "@/cms/collections/inbox/shared";

import { Chip, type ChipTone } from "./Chip";

/**
 * ==========================================================================
 * StatusChips — the Inbox "board" as one-click filters (SPEC §D.4, §I)
 * ==========================================================================
 *
 * Above the enquiries list: New · In progress · Closed · Possible spam ·
 * All, each with a live count, each a link that sets the list's own `where`
 * query — so the result is Payload's ordinary list (search, columns,
 * bulk edit, pagination all still work), not a custom view to maintain.
 * "Board" switches on the list's built-in group-by-status.
 *
 * Counts come from `GET /api/enquiries/count?where…`, which runs the
 * collection's read access as the signed-in user, so a role that could not
 * see a row could not count it either. They are fetched on mount and when
 * the tab regains focus; the list itself is the source of truth.
 */

type Filter = { key: string; label: string; tone: ChipTone; query: string; title?: string };

const FILTERS: Filter[] = [
  ...STATUS_CHIPS.map((chip) => ({
    key: chip.value,
    label: chip.label,
    tone: chip.tone,
    query: `where[status][equals]=${chip.value}`,
  })),
  {
    key: "spam",
    label: "Possible spam",
    tone: "spam" as const,
    query: "where[meta.honeypotTripped][equals]=true",
    title: "Messages where the hidden form field was filled in. Filed as Closed and not notified — glance through now and then in case a person was caught.",
  },
];

export function StatusChips() {
  const { config } = useConfig();
  const searchParams = useSearchParams();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const listUrl = `${config.routes.admin}/collections/enquiries`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        FILTERS.map(async (filter) => {
          try {
            const res = await fetch(`${api}/enquiries/count?${filter.query}`, { credentials: "include", cache: "no-store" });
            if (!res.ok) return [filter.key, undefined] as const;
            const { totalDocs } = (await res.json()) as { totalDocs?: number };
            return [filter.key, typeof totalDocs === "number" ? totalDocs : undefined] as const;
          } catch {
            return [filter.key, undefined] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [key, value] of entries) if (value !== undefined) next[key] = value;
      setCounts(next);
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
  }, [api]);

  const status = searchParams.get("where[status][equals]");
  const spam = searchParams.get("where[meta.honeypotTripped][equals]") === "true";
  const active = spam ? "spam" : (status ?? (searchParams.toString().includes("where") ? "custom" : "all"));
  const grouped = searchParams.get("groupBy") === "status";

  return (
    <nav
      aria-label="Enquiries by status"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.5em", alignItems: "center", marginBlock: "0 calc(var(--base) * 0.75)" }}
    >
      {FILTERS.map((filter) => (
        <Link key={filter.key} href={`${listUrl}?${filter.query}`} style={{ textDecoration: "none" }} aria-current={active === filter.key ? "page" : undefined} title={filter.title}>
          <Chip tone={filter.tone} selected={active === filter.key}>
            {filter.label}
            {counts[filter.key] !== undefined ? <strong>{counts[filter.key]}</strong> : null}
          </Chip>
        </Link>
      ))}
      <Link href={listUrl} style={{ textDecoration: "none" }} aria-current={active === "all" ? "page" : undefined}>
        <Chip selected={active === "all"}>All</Chip>
      </Link>
      <span aria-hidden style={{ flex: "0 0 auto", width: 1, height: "1.2em", background: "var(--theme-elevation-150)", marginInline: "0.25em" }} />
      <Link
        href={`${listUrl}?groupBy=${grouped ? "" : "status"}`}
        style={{ textDecoration: "none" }}
        title={grouped ? "Show one flat list again" : "Group the list into New / In progress / Closed"}
      >
        <Chip selected={grouped}>{grouped ? "Board on" : "Board"}</Chip>
      </Link>
    </nav>
  );
}
