import type { ArrayFieldServerComponent } from "payload";
import React from "react";

import { REVIEW_REASONS } from "@/cms/collections/commerce/Orders";

/**
 * ==========================================================================
 * OrderTimeline — the order's history as plain sentences (SPEC §I)
 * ==========================================================================
 *
 * SPEC §I: the timeline is "rendered as a list". Payload's own array UI
 * drew each entry as an editable-looking row with a JSON code editor for
 * its detail — the front desk's most-used page reading like a database.
 * This server component replaces the array's UI (the data, the access
 * rules and `appendTimeline` are untouched): one dated line per entry,
 * oldest first, e.g. "Created at the desk · by Nexeor Dev · 9 Oct, 09:52".
 *
 * A server component because the timeline is read-only and written only by
 * the system: `data` is the saved document, and the order actions refresh
 * the view after every action, so the list is never stale.
 */

type Entry = { at?: string | null; event?: string | null; by?: string | null; detail?: unknown };

const TZ = "Asia/Dubai";
const when = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";
const whenFull = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";

const REASON = Object.fromEntries(REVIEW_REASONS.map((r) => [r.value, r.label])) as Record<string, string>;
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const words = (s: string) => s.replace(/[_.]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** "Ayesha (admin)" → "Ayesha"; "system" → null (said as "automatically"). */
function actor(by?: string | null): string | null {
  if (!by || by === "system") return null;
  return by.replace(/\s*\((admin|editor|front-desk)\)$/, "");
}

/** One entry as a sentence a non-technical owner reads at a glance. */
export function describe(entry: Entry): { text: string; tone: "ok" | "warn" | "muted" | "lilac" } {
  const d = (entry.detail && typeof entry.detail === "object" ? entry.detail : {}) as Record<string, unknown>;
  const note = str(d.note);
  const withNote = (s: string) => (note ? `${s} — “${note}”` : s);
  switch (entry.event) {
    case "created":
      return { text: d.channel === "desk" ? "Created at the desk" : "Booked on the website", tone: "lilac" };
    case "pending_payment":
      return { text: "Waiting for payment", tone: "muted" };
    case "awaiting_payment":
      return { text: "Sent to Mamo Pay for payment", tone: "lilac" };
    case "confirming":
      return { text: "Payment received — issuing tickets and invoice", tone: "lilac" };
    case "confirmed":
      return { text: withNote("Confirmed — tickets and invoice sent"), tone: "ok" };
    case "completed":
      return { text: "Completed — the session has taken place", tone: "ok" };
    case "failed":
      return { text: withNote("Payment failed"), tone: "warn" };
    case "expired":
      return { text: "Seat hold ran out before payment — seats released", tone: "muted" };
    case "cancelled":
      return { text: withNote("Cancelled"), tone: "muted" };
    case "refunded":
      return { text: withNote("Refunded in full"), tone: "muted" };
    case "moved":
      return { text: withNote("Moved to another date"), tone: "lilac" };
    case "rescheduled":
      return { text: `Session rescheduled${d.to ? ` to ${whenFull(str(d.to))}` : ""}`, tone: "lilac" };
    case "session_cancelled":
      return { text: `Session cancelled${d.reason ? ` — “${str(d.reason)}”` : ""}`, tone: "warn" };
    case "contact_changed":
      return { text: `Contact details corrected${Array.isArray(d.fields) && d.fields.length ? ` (${d.fields.map((f) => words(str(f)).toLowerCase()).join(", ")})` : ""}`, tone: "muted" };
    case "needs_review":
      return { text: `Flagged for a look: ${REASON[str(d.reason)] ?? words(str(d.reason) || "something did not add up")}`, tone: "warn" };
    case "review_resolved":
      return { text: withNote("Review marked resolved"), tone: "ok" };
    case "refund_requested":
      return { text: `Refund of ${str(d.amount) || "an amount"} requested${d.reason ? ` (${words(str(d.reason)).toLowerCase()})` : ""}`, tone: "warn" };
    case "refund_approved":
      return { text: `Refund of ${str(d.amount) || "an amount"} approved`, tone: "lilac" };
    case "refund_succeeded":
      return { text: `Refund of ${str(d.amount) || "an amount"} paid back`, tone: "ok" };
    case "tickets_resent":
      return { text: "Tickets emailed again", tone: "muted" };
    case "confirmation_resent":
      return { text: "Confirmation emailed again", tone: "muted" };
    case "check_in_forced":
      return { text: `Ticket ${str(d.code)} let in by override`, tone: "warn" };
    case "check_in_undone":
      return { text: withNote(`Check-in undone for ticket ${str(d.code)}`), tone: "muted" };
    case "link_reissued":
      return { text: "A fresh payment link was made (the same basket was submitted again)", tone: "muted" };
    case "capture_ignored":
      return { text: "A late payment notice was ignored — the order had already moved on", tone: "muted" };
    case "charge_failed":
      return { text: "A payment attempt failed", tone: "warn" };
    default:
      return { text: withNote(words(str(entry.event) || "Updated")), tone: "muted" };
  }
}

export const OrderTimeline: ArrayFieldServerComponent = ({ data, clientField }) => {
  const entries = (((data as { timeline?: Entry[] } | undefined)?.timeline ?? []) as Entry[]).filter((e) => e && e.event);
  const label = typeof clientField?.label === "string" ? clientField.label : "History";
  return (
    <div className="field-type mp-timeline">
      <div className="mp-timeline__head">
        <span className="mp-eyebrow">{label}</span>
        <small>Everything that happened to this booking, oldest first. Written by the system.</small>
      </div>
      {entries.length ? (
        <ol className="mp-timeline__list">
          {entries.map((entry, index) => {
            const { text, tone } = describe(entry);
            const who = actor(entry.by);
            return (
              <li key={index} className={`mp-timeline__item mp-timeline__item--${tone}`}>
                <span className="mp-timeline__dot" aria-hidden />
                <span className="mp-timeline__text">{text}</span>
                <span className="mp-timeline__meta">
                  {who ? `by ${who}` : "automatically"} · <time dateTime={entry.at ?? undefined} title={whenFull(entry.at)}>{when(entry.at)}</time>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mp-timeline__empty">Nothing yet — each step of the booking appears here as it happens.</p>
      )}
    </div>
  );
};
