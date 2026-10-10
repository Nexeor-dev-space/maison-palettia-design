"use client";

import { useConfig, useListQuery } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

/**
 * ==========================================================================
 * JobsViews — "Failed · Last hour · Everything" above Background jobs (4B)
 * ==========================================================================
 *
 * The queue writes a row for every routine every-minute check, so the plain
 * list is hundreds of "OK" rows with the one failure somewhere among them
 * (the dashboard's "See tasks" link already opens it filtered). Three links
 * that set the list's own filter, and one sentence saying what the page is.
 * Links, not state: the filter lives in the URL like any Payload filter.
 */
export function JobsViews() {
  const { config } = useConfig();
  const { query } = useListQuery();
  const base = `${config.routes.admin}/collections/payload-jobs`;
  const router = useRouter();
  const where = JSON.stringify(query?.where ?? {});
  const views = [
    { key: "failed", label: "Failed", href: `${base}?where[hasError][equals]=true`, active: where.includes('"hasError"') },
    { key: "all", label: "Everything", href: `${base}?sort=-createdAt`, active: where === "{}" },
  ];
  // "Last hour" is worked out at the click — an hour before NOW, not before the page loaded.
  const lastHour = () => router.push(`${base}?where[createdAt][greater_than]=${encodeURIComponent(new Date(Date.now() - 3_600_000).toISOString())}&sort=-createdAt`);
  return (
    <div className="mp-toolbar" role="navigation" aria-label="Background job views">
      <Link href={views[0].href} className="mp-chip mp-chip--bad" aria-current={views[0].active ? "page" : undefined}>
        {views[0].label}
      </Link>
      <button type="button" className="mp-chip mp-chip--lilac" style={{ border: 0, font: "inherit" }} aria-pressed={where.includes('"createdAt"')} onClick={lastHour}>
        Last hour
      </button>
      <Link href={views[1].href} className="mp-chip mp-chip--muted" aria-current={views[1].active ? "page" : undefined}>
        {views[1].label}
      </Link>
      <p className="mp-toolbar__note">Most rows are routine checks that run every minute. A failed job shows its error and a Retry button when you open it.</p>
    </div>
  );
}
