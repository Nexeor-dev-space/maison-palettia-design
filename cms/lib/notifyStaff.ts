import type { PayloadRequest } from "payload";

import type { StaffEvent, TemplateKey } from "@/cms/lib/contracts";
import { sendTemplated } from "@/cms/lib/mailer";
import { publicUrl } from "@/cms/lib/publicUrl";
import type { NotificationSetting } from "@/payload-types";

/**
 * ==========================================================================
 * notifyStaff — one alert, every subscribed recipient (SPEC §C.3, §H.8)
 * ==========================================================================
 *
 * Settings → Who gets notified lists people and the alerts each wants. An
 * event fans out to one `admin_<event>` email per subscribed address — one
 * email per person rather than one with everybody in `To`, so each is
 * greeted by name and a bounce on one address does not hide the others.
 * Nobody subscribed is not an error: the event is still in the admin (the
 * Inbox, the order, the dashboard warning that says nobody is subscribed).
 *
 * `links.admin` defaults to the admin home; callers pass the record's own
 * admin URL when they have one (`adminUrl()` below builds it).
 *
 * `settings_changed` accepts the `{ entries }` shape that
 * cms/globals/settingsHooks.ts already collects and turns it into the
 * template's `changes` lines.
 */

export const STAFF_TEMPLATE: Record<StaffEvent, TemplateKey> = {
  new_order: "admin_new_order",
  failed_payment: "admin_failed_payment",
  refund_requested: "admin_refund_requested",
  refund: "admin_refund",
  dispute: "admin_dispute",
  new_enquiry: "admin_new_enquiry",
  waitlist_joined: "admin_waitlist_joined",
  job_failed: "admin_job_failed",
  low_seats: "admin_low_seats",
  settings_changed: "admin_settings_changed",
  webhook_unverified_spike: "admin_webhook_unverified_spike",
  daily_digest: "admin_daily_digest",
};

/** `${publicUrl}/admin/collections/<slug>/<id>`, or the admin home. */
export async function adminUrl(req: PayloadRequest, collection?: string, id?: string): Promise<string> {
  const base = `${await publicUrl(req)}/admin`;
  if (!collection) return base;
  return id ? `${base}/collections/${collection}/${id}` : `${base}/collections/${collection}`;
}

/** The recipients subscribed to `event`, de-duplicated by address. */
export async function staffRecipients(req: PayloadRequest, event: StaffEvent): Promise<Array<{ name: string; email: string }>> {
  let settings: NotificationSetting | null = null;
  try {
    settings = (await req.payload.findGlobal({ slug: "notification-settings", depth: 0, overrideAccess: true, req })) as NotificationSetting;
  } catch (error) {
    req.payload.logger.warn({ err: error }, "notifyStaff: could not read notification-settings");
    return [];
  }
  const seen = new Set<string>();
  const out: Array<{ name: string; email: string }> = [];
  for (const row of settings?.recipients ?? []) {
    const email = row.email?.trim().toLowerCase();
    if (!email || seen.has(email) || !(row.events ?? []).includes(event)) continue;
    seen.add(email);
    out.push({ name: row.name?.trim() || email.split("@")[0], email });
  }
  return out;
}

/**
 * The "few seats left" threshold for the `low_seats` alert:
 * notification-settings.lowSeatsOverride when set, else the site's own
 * booking-settings.lowSeatThreshold (the one the public labels use), else 4.
 * The caller (3A-1's low-seat check) decides when to fire; this is the number.
 */
export async function lowSeatThreshold(req: PayloadRequest): Promise<number> {
  try {
    const notify = (await req.payload.findGlobal({ slug: "notification-settings", depth: 0, overrideAccess: true, req })) as NotificationSetting;
    if (typeof notify.lowSeatsOverride === "number" && notify.lowSeatsOverride > 0) return notify.lowSeatsOverride;
    const booking = (await req.payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, req })) as { lowSeatThreshold?: number | null };
    if (typeof booking.lowSeatThreshold === "number" && booking.lowSeatThreshold > 0) return booking.lowSeatThreshold;
  } catch {
    /* fall through to the default */
  }
  return 4;
}

/** `[{ global, field, from, to }]` → "payment-settings.mode: test → live" lines. */
function changeLines(entries: unknown): string {
  if (!Array.isArray(entries)) return "";
  return entries
    .map((entry) => {
      const e = entry as { global?: string; field?: string; from?: string; to?: string };
      return `${e.global ?? ""}.${e.field ?? ""}: ${e.from || "—"} → ${e.to || "—"}`;
    })
    .join("\n");
}

/** SPEC §O `notifyStaff`. */
export async function notifyStaff(req: PayloadRequest, event: StaffEvent, vars: Record<string, unknown>, refs?: Record<string, string>): Promise<{ logIds: string[] }> {
  const key = STAFF_TEMPLATE[event];
  if (!key) return { logIds: [] };
  const recipients = await staffRecipients(req, event);
  if (!recipients.length) return { logIds: [] };

  const base: Record<string, unknown> = { ...vars };
  const links = (base.links && typeof base.links === "object" ? base.links : {}) as Record<string, unknown>;
  base.links = { ...links, admin: links.admin ?? (await adminUrl(req)) };
  if (event === "settings_changed") {
    if (base.changes === undefined && base.entries !== undefined) base.changes = changeLines(base.entries);
    if (base.changedBy === undefined) base.changedBy = (req.user as { email?: string } | null)?.email ?? "the system";
  }

  const logIds: string[] = [];
  for (const recipient of recipients) {
    // One failure (a bad address, a full disk) must not stop the others.
    try {
      const { logId } = await sendTemplated(req, {
        key,
        to: recipient.email,
        vars: { ...base, recipient: { name: recipient.name, email: recipient.email } },
        refs: refs as never,
      });
      logIds.push(logId);
    } catch (error) {
      req.payload.logger.error({ err: error, event }, "notifyStaff: could not queue a staff alert");
    }
  }
  return { logIds };
}
