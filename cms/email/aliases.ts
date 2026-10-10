import { formatDubai, lookup, stringifyValue, type TemplateVars } from "./render";
import type { EmailTemplateKey } from "./variables";

/**
 * ==========================================================================
 * Variable aliases — the callers' spellings mapped onto the template names
 * ==========================================================================
 *
 * SPEC §O fixes `sendTemplated(req, { key, to, vars })` but not the shape
 * of `vars`, and the agents that send (orders, waitlist, jobs, inbox, the
 * webhook) were written in parallel with this module. Rather than leave an
 * email blank because one caller says `sessionTitle` and the template says
 * `{{session.title}}`, this one function fills each documented name
 * (cms/email/variables.ts) from the other spellings in use — ONLY when the
 * documented name is absent, so a caller that already uses it always wins.
 *
 * Kept deliberately boring: plain lookups, a date formatted in Dubai time,
 * an order summary built from `lines[]`, a few codes turned into words.
 * New callers should pass the documented names; this list exists so the
 * ones already written are not silently wrong.
 */

type Fill = Record<string, () => unknown>;

const first = (vars: TemplateVars, ...names: string[]): unknown => {
  for (const name of names) {
    const value = lookup(vars, name);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const when = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}T/.test(value)) return value; // already words
  return formatDubai(value as string) || undefined;
};

/** Refund reasons in the staff's voice ("Requested by you" is right for the customer, wrong in an alert to an admin). */
const STAFF_REASON: Record<string, string> = {
  customer_request: "customer asked",
  session_cancelled: "session cancelled",
  post_expiry_payment: "paid after the hold expired",
  duplicate: "duplicate payment",
  goodwill: "goodwill",
  other: "other — see the note",
};

const words = (code: unknown): string | undefined => {
  if (typeof code !== "string" || !code) return undefined;
  const known: Record<string, string> = {
    customer_request: "Requested by you",
    session_cancelled: "The session was cancelled",
    post_expiry_payment: "Your payment arrived after the booking had expired",
    duplicate: "Duplicate payment",
    goodwill: "Goodwill gesture",
    amount_mismatch: "The amount paid did not match the booking",
    mode_or_link_mismatch: "The payment did not match this booking",
    voided_after_capture: "The payment was voided after it was taken",
    failed_after_capture: "The payment was reported failed after it was taken",
  };
  return known[code] ?? (code.includes("_") ? code.replace(/_/g, " ") : code);
};

/** `lines[]` in any of the shapes callers build → "Title — when — venue — n seats" per line. */
function summary(vars: TemplateVars): string | undefined {
  const lines = lookup(vars, "lines") ?? lookup(vars, "order.lines");
  if (!Array.isArray(lines) || !lines.length) return undefined;
  return lines
    .map((raw) => {
      const line = (raw ?? {}) as Record<string, unknown>;
      const qty = Number(line.qty);
      return [
        stringifyValue(line.title),
        when(line.when ?? line.startsAt),
        stringifyValue(line.venue ?? line.venueName),
        Number.isFinite(qty) && qty > 0 ? `${qty} ${qty === 1 ? "seat" : "seats"}` : "",
      ]
        .filter(Boolean)
        .join(" — ");
    })
    .join("\n");
}

const hoursUntil = (iso: unknown): string | undefined => {
  if (typeof iso !== "string") return undefined;
  const ms = new Date(iso).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 ? String(Math.max(1, Math.round(ms / 3_600_000))) : undefined;
};

/** Fills shared by every template. */
function common(v: TemplateVars): Fill {
  return {
    "customer.firstName": () => first(v, "firstName", "contact.firstName", "name"),
    "customer.name": () =>
      first(v, "customerName", "contact.name") ??
      ([first(v, "customer.firstName", "firstName"), first(v, "customer.lastName", "lastName")].filter(Boolean).join(" ") || undefined),
    "customer.email": () => first(v, "email", "contact.email"),
    "order.reference": () => first(v, "reference", "orderReference"),
    "order.total": () => first(v, "total", "totals.gross", "amount"),
    "order.vat": () => first(v, "totals.vat", "vat"),
    "order.summary": () => summary(v),
    "order.channel": () => (first(v, "channel") === "desk" ? "at the desk" : first(v, "channel") ? "online" : undefined),
    "session.title": () => first(v, "sessionTitle", "event.title", "title"),
    "session.when": () => when(first(v, "event.when", "startsAt", "event.startsAt", "session.startsAt")),
    "session.venue": () => first(v, "venueName", "event.venue", "venue"),
    "links.retry": () => first(v, "retryUrl"),
    "links.myBookings": () => first(v, "myBookingsUrl"),
    "links.book": () => first(v, "bookUrl"),
    "invoice.number": () => first(v, "invoiceNumber"),
  };
}

/** Fills that only make sense for some templates (a bare `name` means different people). */
function byKey(key: EmailTemplateKey, v: TemplateVars): Fill {
  switch (key) {
    case "waitlist_joined":
    case "waitlist_seat_available":
    case "admin_waitlist_joined":
      return {
        "waitlist.name": () => first(v, "name"),
        "waitlist.email": () => first(v, "email"),
        "waitlist.qty": () => first(v, "qty"),
        "waitlist.position": () => first(v, "position"),
        expiresHours: () => hoursUntil(first(v, "expiresAt")) ?? (key === "waitlist_seat_available" ? "24" : undefined),
      };
    case "enquiry_received":
    case "admin_new_enquiry":
      return {
        "enquiry.name": () => first(v, "name"),
        "enquiry.email": () => first(v, "email"),
        "enquiry.phone": () => first(v, "phone"),
        "enquiry.topic": () => first(v, "topic"),
        "enquiry.message": () => first(v, "message"),
      };
    case "admin_refund":
    case "admin_refund_requested": {
      const reason = first(v, "reason");
      return {
        "refund.amount": () => first(v, "amount", "refundAmount"),
        "refund.reason": () => (typeof reason === "string" ? (STAFF_REASON[reason] ?? words(reason)) : undefined),
        "refund.status": () => words(first(v, "outcome", "status")),
        "creditNote.number": () => first(v, "creditNoteNumber"),
        requestedBy: () => first(v, "by", "requestedByName"),
      };
    }
    case "order_refunded":
    case "post_expiry_payment":
    case "session_cancelled":
    case "order_cancelled":
      return {
        "refund.amount": () => first(v, "amount", "refundAmount"),
        "refund.reason": () => words(first(v, "reason")),
        "refund.status": () => words(first(v, "outcome", "status")),
        "creditNote.number": () => first(v, "creditNoteNumber"),
        requestedBy: () => first(v, "by", "requestedByName"),
      };
    case "admin_failed_payment":
      return { "failure.reason": () => first(v, "problem") ?? words(first(v, "reason", "errorCode")) };
    case "admin_dispute":
      return { "dispute.status": () => words(first(v, "status", "eventType")), "payment.id": () => first(v, "mamoPaymentId", "paymentId") };
    case "admin_job_failed":
      return { "job.task": () => first(v, "task", "taskSlug"), "job.error": () => first(v, "error"), "job.attempts": () => first(v, "attempts") ?? "1" };
    case "admin_low_seats":
      return { "session.seatsLeft": () => first(v, "seatsLeft", "available", "remaining"), "session.seatsTotal": () => first(v, "seatsTotal", "capacity") };
    case "admin_webhook_unverified_spike":
      return { windowMinutes: () => first(v, "windowMinutes") ?? (first(v, "hour") ? "60" : undefined) };
    case "admin_daily_digest":
      return {
        "digest.day": () => first(v, "day"),
        "digest.orders": () => first(v, "orders.count"),
        "digest.revenue": () => first(v, "revenue.total"),
        "digest.enquiries": () => first(v, "enquiries.count"),
        "digest.problems": () => {
          const p = lookup(v, "problems") as Record<string, unknown> | undefined;
          if (!p || typeof p !== "object") return undefined;
          return [
            `${p.failedEmails ?? 0} failed email(s)`,
            `${p.failedJobs ?? 0} failed background task(s)`,
            `${p.needsReview ?? 0} order(s) needing review`,
            `${p.disputes ?? 0} open dispute(s)`,
          ].join("\n");
        },
      };
    default:
      return {};
  }
}

function setPath(target: TemplateVars, name: string, value: unknown) {
  const segments = name.split(".");
  let cursor = target as Record<string, unknown>;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }
    const next = cursor[segment];
    if (typeof next !== "object" || next === null || Array.isArray(next)) cursor[segment] = {};
    else cursor[segment] = { ...(next as Record<string, unknown>) };
    cursor = cursor[segment] as Record<string, unknown>;
  });
}

/** A copy of `vars` with every documented name the caller left out filled from its known aliases. */
export function normalizeVars(key: EmailTemplateKey | string, vars: TemplateVars | undefined): TemplateVars {
  const source = vars ?? {};
  const out: TemplateVars = { ...source };
  const fills = { ...common(source), ...byKey(key as EmailTemplateKey, source) };
  for (const [name, fill] of Object.entries(fills)) {
    const current = lookup(out, name);
    if (current !== undefined && current !== null && current !== "") continue;
    const value = fill();
    if (value !== undefined && value !== null && value !== "") setPath(out, name, value);
  }
  return out;
}
