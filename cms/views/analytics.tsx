import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import React from "react";

import { roleOf } from "@/cms/access/roles";
import { AnalyticsPage } from "@/cms/components/analytics/AnalyticsPage";
import { addDays, type AnalyticsDashboard, defaultRangePreset, getAnalyticsDashboard, resolveRange } from "@/cms/lib/analyticsQueries";
import { dubaiDay } from "@/cms/lib/crypto";

/**
 * ==========================================================================
 * /admin/analytics — the studio's numbers (SPEC §I "Analytics view", §J, 4C)
 * ==========================================================================
 *
 * A custom admin view (`admin.components.views.analytics` in
 * payload.config.ts). Like /admin/check-in, Payload renders a custom root
 * view WITHOUT the login redirect it gives built-in views (verified in
 * @payloadcms/next 3.90.2), so this component does it: signed-out visitors
 * go to the login page and come back here.
 *
 * WHO SEES WHAT (§J): admins everything; editors website traffic and the
 * first two funnel steps (the data function returns `sales: null` for
 * them — the money cannot leak through this page by accident); the front
 * desk gets a polite note inside the normal admin chrome, because
 * `getAnalyticsDashboard` refuses them outright.
 *
 * THE PERIOD comes from the query string: `?range=7|30|90`, or
 * `?from=YYYY-MM-DD&to=YYYY-MM-DD` for chosen dates. With neither, the
 * default is Analytics & tracking → Admin panel → Default period. Every
 * number on the page — tiles, charts, the VAT tile and the CSV links —
 * uses the same resolved range, so they always agree.
 *
 * The page itself is cms/components/analytics/AnalyticsPage.tsx; the
 * reads are cms/lib/analyticsQueries.ts (4A), which run as plain SQL
 * against the owner's database and return plain JSON.
 */

const str = (v: unknown): string | null => (typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v[0] : null);

/** "This month", "Last month", "This year", "Last year" — the dates accountants ask for. */
function shortcuts(base: string, today: string) {
  const y = Number(today.slice(0, 4));
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = addDays(monthStart, -1);
  const lastMonthStart = `${lastMonthEnd.slice(0, 7)}-01`;
  const link = (label: string, from: string, to: string) => ({ label, href: `${base}?from=${from}&to=${to}` });
  return [
    link("This month", monthStart, today),
    link("Last month", lastMonthStart, lastMonthEnd),
    link("This year", `${y}-01-01`, today),
    link("Last year", `${y - 1}-01-01`, `${y - 1}-12-31`),
  ];
}

export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult;
  const { routes, admin } = req.payload.config;
  const base = `${routes.admin}/analytics`;

  if (!req.user) {
    redirect(`${routes.admin}${admin.routes.login}?redirect=${encodeURIComponent(base)}`);
  }

  const role = roleOf(req);
  const allowed = role === "admin" || role === "editor";

  let data: AnalyticsDashboard | null = null;
  let loadError: string | null = null;
  const today = dubaiDay();
  const fallback = allowed ? await defaultRangePreset(req.payload) : "30";
  const range = resolveRange({ range: str(searchParams?.range), from: str(searchParams?.from), to: str(searchParams?.to) }, { fallback });

  if (allowed) {
    try {
      data = await getAnalyticsDashboard(req.payload, range, role);
    } catch (error) {
      req.payload.logger.error({ err: error, msg: "analytics: could not load the dashboard" });
      loadError = "The numbers could not be loaded just now. Reload the page in a moment — if it keeps happening, the database may be busy or unreachable.";
    }
  }

  const firstName = String((req.user as { name?: string | null } | null)?.name ?? "").trim().split(/\s+/)[0] ?? "";

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        {!allowed ? (
          <div className="mp-card" style={{ marginBlock: "calc(var(--base) * 1.5)", maxWidth: 560 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Analytics</h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>Analytics is for admins and editors. Ask an admin if you need to see the studio&rsquo;s numbers.</p>
          </div>
        ) : data ? (
          <AnalyticsPage
            data={data}
            firstName={firstName}
            adminRoute={routes.admin}
            apiRoute={routes.api}
            rangeBar={{ base, preset: range.preset, from: range.from, to: range.to, today, label: range.label, shortcuts: shortcuts(base, today) }}
          />
        ) : (
          <div className="mp-card" role="alert" style={{ marginBlock: "calc(var(--base) * 1.5)", maxWidth: 620 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Analytics</h1>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{loadError}</p>
          </div>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
