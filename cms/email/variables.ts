/**
 * ==========================================================================
 * The variables each email template may use (SPEC §D.5, §H.8)
 * ==========================================================================
 *
 * One code-owned map, three consumers:
 *
 *   · the **Variables** panel on every template (cms/components/email/
 *     TemplateVariables.tsx) lists exactly these names, so an editor never
 *     has to guess what `{{…}}` is available;
 *   · the template's `beforeValidate` refuses a save that uses a name not on
 *     this list ("{{order.ref}} is not a variable of this email") — a typo
 *     would otherwise reach customers as a silent blank;
 *   · **Preview** renders with the `sample` values, so a template can be
 *     read as a customer would before any order exists.
 *
 * The callers that send (orders, jobs, waitlist, enquiries) pass values
 * under these names; values that are not on the list are ignored by the
 * renderer only in the sense that no template can reference them.
 *
 * NAMING. Dotted paths, grouped by what they describe (`order.*`,
 * `session.*`, `links.*`). Anything under `links.*` — and any `token`, `url`
 * or `magic…` key — is replaced by "[redacted]" in the notification log
 * (SPEC §D.5), so links are the ONLY place a template should put a URL.
 *
 * Pure data with no imports: this file is bundled into the admin's client
 * components as well as the server renderer.
 */

/** Mirrors `TemplateKey` in cms/lib/contracts.ts (kept import-free so client components can load it). */
export type EmailTemplateKey =
  | "order_confirmation"
  | "payment_failed"
  | "ticket_reminder_24h"
  | "order_refunded"
  | "order_cancelled"
  | "order_moved"
  | "session_rescheduled"
  | "session_cancelled"
  | "post_expiry_payment"
  | "magic_link"
  | "enquiry_received"
  | "waitlist_joined"
  | "waitlist_seat_available"
  | "staff_login_link"
  | "admin_new_order"
  | "admin_failed_payment"
  | "admin_refund_requested"
  | "admin_refund"
  | "admin_dispute"
  | "admin_new_enquiry"
  | "admin_waitlist_joined"
  | "admin_job_failed"
  | "admin_low_seats"
  | "admin_settings_changed"
  | "admin_webhook_unverified_spike"
  | "admin_daily_digest"
  | "test";

export interface TemplateVariable {
  /** Dotted path used as `{{name}}`. */
  name: string;
  /** One line for the Variables panel. */
  description: string;
  /** What Preview shows. Multi-line values use "\n". */
  sample: string;
}

const v = (name: string, description: string, sample: string): TemplateVariable => ({ name, description, sample });

/** Available in every template; filled from Site details by the renderer. */
export const COMMON_VARIABLES: TemplateVariable[] = [
  v("site.name", "The studio's name (Site details)", "Maison Palettia"),
  v("site.url", "The site's address", "https://www.maisonpalettia.com"),
  v("site.email", "Contact email (Site details)", "hello@maisonpalettia.com"),
  v("site.phone", "Contact phone (Site details)", "+971 50 000 0000"),
];

// ── shared groups ─────────────────────────────────────────────────────────
const customer = [v("customer.firstName", "Customer's first name", "Layla"), v("customer.name", "Customer's full name", "Layla Haddad")];
const orderRef = v("order.reference", "Booking reference", "MP-7KQ2XD");
const orderSummary = v(
  "order.summary",
  "One line per item: what, when, where, how many",
  "Candle Making — Sun 11 Oct 2026, 10:00 — Times Square Center — 2 seats",
);
const orderTotal = v("order.total", "Amount paid, with currency", "AED 480.00");
const session = [
  v("session.title", "Session name", "Candle Making"),
  v("session.when", "Date and time (Dubai)", "Sun 11 Oct 2026, 10:00"),
  v("session.venue", "Venue name", "Times Square Center"),
];
const myBookings = v("links.myBookings", "Link to the customer's bookings page", "https://www.maisonpalettia.com/my-bookings");
const ticketsLink = v("links.tickets", "Signed link to the ticket PDF (valid 30 days)", "https://www.maisonpalettia.com/api/site/tickets/MPT-AB12CD34/pdf?…");
const adminLink = v("links.admin", "Link to the record in the admin", "https://www.maisonpalettia.com/admin/collections/orders/…");
const recipient = v("recipient.name", "The staff member this alert is addressed to", "Nadia");
const refundAmount = v("refund.amount", "Refund amount, with currency", "AED 240.00");
const refundWhere = v(
  "refund.where",
  "Where the money goes back: “to the card you paid with” online, “at the studio …” for desk bookings",
  "to the card you paid with",
);

export const TEMPLATE_VARIABLES: Record<EmailTemplateKey, TemplateVariable[]> = {
  order_confirmation: [
    ...customer,
    orderRef,
    orderSummary,
    orderTotal,
    v("order.vat", "VAT included in the total", "AED 22.86"),
    v("invoice.number", "Invoice (or receipt) number", "MP-INV-2026-000123"),
    ticketsLink,
    v("links.invoice", "Signed link to the invoice PDF (valid 30 days)", "https://www.maisonpalettia.com/api/site/invoices/…/pdf?…"),
    myBookings,
  ],
  payment_failed: [
    ...customer,
    orderRef,
    orderTotal,
    v("hold.until", "Until when the seats stay held for a retry (Dubai)", "Sun 11 Oct 2026, 09:25"),
    v("links.retry", "Link back to checkout to try again", "https://www.maisonpalettia.com/checkout?…"),
  ],
  ticket_reminder_24h: [
    ...customer,
    orderRef,
    ...session,
    v("tickets.count", "Number of tickets on the booking", "2"),
    v("session.directions", "How to find the venue", "Level 1, beside the atrium. Parking in P2."),
    ticketsLink,
  ],
  order_refunded: [
    ...customer,
    orderRef,
    refundAmount,
    v("refund.reason", "Why the refund was made", "Requested by you"),
    v("creditNote.number", "Credit note number", "MP-CN-2026-000007"),
    myBookings,
  ],
  order_cancelled: [...customer, orderRef, v("reason", "Why the booking was cancelled", "The session could not go ahead."), refundAmount, refundWhere],
  order_moved: [
    ...customer,
    orderRef,
    v("previous.when", "The original date and time", "Sun 11 Oct 2026, 10:00"),
    ...session,
    v("note", "A note from the studio (may be empty)", "See you on the new date!"),
    ticketsLink,
  ],
  session_rescheduled: [
    ...customer,
    orderRef,
    v("previous.when", "The original date and time", "Sun 11 Oct 2026, 10:00"),
    ...session,
    v("message", "The studio's message about the change (may be empty)", "Our instructor is unwell; we have moved the session by a week."),
    ticketsLink,
  ],
  session_cancelled: [
    ...customer,
    orderRef,
    ...session,
    v("message", "The studio's message (may be empty)", "We are so sorry — the venue is closed that day."),
    refundAmount,
    refundWhere,
  ],
  post_expiry_payment: [...customer, orderRef, refundAmount],
  magic_link: [
    v("customer.firstName", "Customer's first name (may be empty)", "Layla"),
    myBookings,
    v("expiresMinutes", "How long the link works", "30"),
  ],
  enquiry_received: [
    v("enquiry.name", "Name the person gave", "Layla Haddad"),
    v("enquiry.topic", "What the enquiry is about", "Private event"),
  ],
  waitlist_joined: [
    v("waitlist.name", "Name the person gave", "Layla Haddad"),
    ...session,
    v("waitlist.qty", "Seats they asked for", "2"),
    v("waitlist.position", "Their place in the queue", "3"),
  ],
  waitlist_seat_available: [
    v("waitlist.name", "Name the person gave", "Layla Haddad"),
    ...session,
    v("waitlist.qty", "Seats they asked for", "2"),
    v("links.book", "Personal link to book (works for 24 hours)", "https://www.maisonpalettia.com/events/…/book?w=…"),
    v("expiresHours", "How long the link works", "24"),
  ],
  staff_login_link: [
    v("user.name", "The staff member's name", "Nadia"),
    v("user.email", "Their login email", "nadia@maisonpalettia.com"),
    v("invitedBy", "Who sent the link", "Rohit"),
    v("links.login", "One-time link to set a password and sign in", "https://www.maisonpalettia.com/admin/reset/…"),
    v("expiresHours", "How long the link works", "24"),
  ],
  admin_new_order: [
    recipient,
    orderRef,
    v("customer.name", "Customer's full name", "Layla Haddad"),
    v("customer.email", "Customer's email", "layla@example.com"),
    orderSummary,
    orderTotal,
    v("order.channel", "Online or at the desk", "Online"),
    adminLink,
  ],
  admin_failed_payment: [
    recipient,
    orderRef,
    v("customer.name", "Customer's full name", "Layla Haddad"),
    v("customer.email", "Customer's email", "layla@example.com"),
    orderTotal,
    v("failure.reason", "What the payment provider said", "Card declined"),
    adminLink,
  ],
  admin_refund_requested: [
    recipient,
    orderRef,
    refundAmount,
    v("refund.reason", "Why", "Customer request"),
    v("requestedBy", "Who asked for it", "Front desk — Sara"),
    adminLink,
  ],
  admin_refund: [
    recipient,
    orderRef,
    refundAmount,
    v("refund.status", "Outcome", "Succeeded"),
    v("creditNote.number", "Credit note number", "MP-CN-2026-000007"),
    adminLink,
  ],
  admin_dispute: [
    recipient,
    orderRef,
    v("dispute.status", "What the provider reported", "Opened"),
    v("payment.id", "Payment id at Mamo Pay", "PAY-1A2B3C"),
    adminLink,
  ],
  admin_new_enquiry: [
    recipient,
    v("enquiry.name", "Name", "Layla Haddad"),
    v("enquiry.email", "Email", "layla@example.com"),
    v("enquiry.phone", "Phone", "+971 50 000 0000"),
    v("enquiry.topic", "Topic", "Private event"),
    v("enquiry.message", "Their message", "We would love a candle workshop for 12 people in November."),
    adminLink,
  ],
  admin_waitlist_joined: [
    recipient,
    v("waitlist.name", "Name", "Layla Haddad"),
    v("waitlist.email", "Email", "layla@example.com"),
    v("waitlist.qty", "Seats asked for", "2"),
    v("waitlist.position", "Place in the queue", "3"),
    ...session,
    adminLink,
  ],
  admin_job_failed: [
    recipient,
    v("job.task", "Which background task", "send-email"),
    v("job.error", "The last error", "Connection timed out"),
    v("job.attempts", "How many times it was tried", "5"),
    adminLink,
  ],
  admin_low_seats: [
    recipient,
    ...session,
    v("session.seatsLeft", "Seats still available", "3"),
    v("session.seatsTotal", "Seats in total", "12"),
    adminLink,
  ],
  admin_settings_changed: [
    recipient,
    v("changedBy", "Who saved the change", "rohit@nexeor.com"),
    v("changes", "One line per changed setting", "payment-settings.mode: test → live"),
    adminLink,
  ],
  admin_webhook_unverified_spike: [
    recipient,
    v("count", "How many unverified webhook calls", "25"),
    v("windowMinutes", "In how many minutes", "10"),
    adminLink,
  ],
  admin_daily_digest: [
    recipient,
    v("digest.day", "The day it covers", "Sat 10 Oct 2026"),
    v("digest.orders", "Orders confirmed", "6"),
    v("digest.revenue", "Revenue", "AED 1,440.00"),
    v("digest.enquiries", "New enquiries", "2"),
    v("digest.problems", "Anything that needs attention (one per line)", "1 failed payment\n0 failed emails"),
    adminLink,
  ],
  test: [
    v("sentBy", "Who pressed the button", "rohit@nexeor.com"),
    v("provider", "How it was sent", "SMTP"),
    v("sentAt", "When (Dubai time)", "Sat 10 Oct 2026, 14:05"),
  ],
};

/** Every name a template of `key` may reference, common ones included. */
export function variableNamesFor(key: EmailTemplateKey | string | null | undefined): Set<string> {
  const own = TEMPLATE_VARIABLES[key as EmailTemplateKey] ?? [];
  return new Set([...COMMON_VARIABLES, ...own].map((variable) => variable.name));
}

/** `{ "order.reference": "MP-7KQ2XD", … }` → nested object, for Preview. */
export function sampleVariables(key: EmailTemplateKey | string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const variable of [...COMMON_VARIABLES, ...(TEMPLATE_VARIABLES[key as EmailTemplateKey] ?? [])]) {
    const segments = variable.name.split(".");
    let cursor = out;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = variable.sample;
        return;
      }
      if (typeof cursor[segment] !== "object" || cursor[segment] === null) cursor[segment] = {};
      cursor = cursor[segment] as Record<string, unknown>;
    });
  }
  return out;
}

/** Staff alerts (`admin_*` and the login link): a failure to send one never pages staff again (SPEC §H.8). */
export function isStaffTemplate(key: string | null | undefined): boolean {
  return typeof key === "string" && (key.startsWith("admin_") || key === "staff_login_link");
}
