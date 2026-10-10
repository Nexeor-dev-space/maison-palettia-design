import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import React from "react";

import { roleOf } from "@/cms/access/roles";
import { CheckInDesk } from "@/cms/components/checkin/CheckInDesk";
import type { DaySession } from "@/cms/components/checkin/client";
import { dubaiDate, isDubaiDate, sessionsForDay } from "@/cms/lib/tickets";

/**
 * ==========================================================================
 * /admin/check-in — the door (SPEC §H.7, §I, §J)
 * ==========================================================================
 *
 * A custom admin view (`admin.components.views.checkIn` in
 * payload.config.ts). Payload renders a custom root view WITHOUT its
 * template and WITHOUT the login redirect it gives built-in views (verified
 * in @payloadcms/next 3.90.2: `isCustomAdminView` skips the
 * `canAccessAdmin` check), so this component does both itself: signed-out
 * visitors go to the login page and come back here; a signed-in editor gets
 * a polite refusal inside the normal admin chrome. Only admin and
 * front-desk may use the door (§J); the endpoints the page calls enforce
 * the same rule independently.
 *
 * The day's sessions (Dubai calendar day, `?date=YYYY-MM-DD` to look at
 * another) are read here on the server so the page is useful before any
 * JavaScript runs; the scanner and the live counts are the client half,
 * cms/components/checkin/CheckInDesk.tsx.
 *
 * The camera needs HTTPS (or localhost) — the scanner says so on the page
 * rather than failing silently.
 */

export async function CheckInView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult;
  const { routes, admin } = req.payload.config;

  if (!req.user) {
    redirect(`${routes.admin}${admin.routes.login}?redirect=${encodeURIComponent(`${routes.admin}/check-in`)}`);
  }

  const role = roleOf(req);
  const allowed = role === "admin" || role === "front-desk";
  const today = dubaiDate();
  const asked = typeof searchParams?.date === "string" ? searchParams.date : undefined;
  const date = isDubaiDate(asked) ? asked : today;

  let sessions: DaySession[] = [];
  let loadError: string | null = null;
  if (allowed) {
    try {
      sessions = await sessionsForDay(req, date);
    } catch (error) {
      req.payload.logger.error({ err: error, msg: "check-in: could not load the day's sessions" });
      loadError = "The day's sessions could not be loaded. Scanning still works — try reloading in a moment.";
    }
  }

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
        {allowed ? (
          <CheckInDesk date={date} today={today} initialSessions={sessions} loadError={loadError} />
        ) : (
          <div style={{ paddingBlock: "calc(var(--base) * 2)" }}>
            <h1>Check-in</h1>
            <p>Check-in is for the front desk and admins. Ask an admin if you need access.</p>
          </div>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
