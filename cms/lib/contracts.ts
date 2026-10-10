// cms/lib/contracts.ts — exported types + function signatures for every cross-agent call (SPEC §O).
//
// This file is the interface between the agents that build the CMS in
// parallel: anything one agent calls in another agent's code is declared
// here first, so `tsc` is meaningful from the first day of a phase. Phase 1
// lands the "shared (1A)" section with real bodies (re-exported from the
// modules that own them). Phase 3A-0 replaces the file with the full §O,
// where every not-yet-built function `throw new NotImplemented(name)` until
// its owner lands a body — keep this header and the shared section verbatim
// when doing so.
//
// HOW AN OWNER LANDS A BODY. Each Phase 3 section below names its agent
// (3A-1, 3B, 3C, 3E, 3D). The owner writes the real implementation in the
// module SPEC §A.3 assigns (cms/lib/orders.ts, cms/lib/mamo/index.ts, …)
// and replaces the stub here with a re-export from that module — exactly as
// the shared section does — so `@/cms/lib/contracts` stays the one import
// path every other agent uses. Signatures are the contract: change one here
// and the implementers who built against it break at `tsc`, which is the
// point.
// The generated document types the Phase 3 signatures are written in, re-exported so implementers
// import them from the same path as the functions (regenerate with `npm run generate:types`).
export type { Customer, Invoice, Order, PassPurchase, PromoCode, Refund, Session, Ticket } from "@/payload-types";

/**
 * What a not-yet-landed body threw. Every Phase 3 stub has now been replaced
 * by a re-export from its owner's module (the stub helper that threw it went
 * with the last one); the class stays because callers still recognise it
 * (e.g. the checkout routes answer 503 `not_ready` for it).
 */
export class NotImplemented extends Error {
  constructor(name: string) {
    super(`${name} not implemented yet`);
    this.name = "NotImplemented";
  }
}

export type Mode = "test" | "live" | "mock";
export type Role = "admin" | "editor" | "front-desk";
/** Integer AED fils. Never a float, never a string. */
export type Fils = number;
export type Channel = "online" | "desk";
export type DeskMethod = "cash" | "card_terminal" | "complimentary" | "bank_transfer";

// ───────── shared (1A) ─────────
// site-settings.publicUrl → NEXT_PUBLIC_SERVER_URL → ""; the sync form returns the last resolved value (hooks).
export { isPlaceholderPublicUrl, publicUrl, publicUrlSync, routeFor } from "./publicUrl";
// "enc:v1:<b64url(iv‖tag‖ct)>" — AES-256-GCM under hkdf(PAYLOAD_SECRET, "secrets-v1").
export { MASK, open, seal } from "./crypto";
// field + `${name}SetAt`
export { encryptedText } from "@/cms/fields/encryptedText";
// b64url(hmac256(hkdf(PAYLOAD_SECRET, info), payload)); verifySig is timingSafeEqual.
export type { SigningInfo } from "./signing";
export { sign, verifySig } from "./signing";
// true = allowed; clientIp reads the LAST X-Forwarded-For hop; ipHash is daily-salted.
export { ipHash } from "./crypto";
export { clientIp, rateLimit } from "./rateLimit";
// throws 401/403; rejects Sec-Fetch-Site: cross-site
export { requireRole } from "@/cms/endpoints/requireRole";
export { revalidateAllContent, revalidateCollection, safeRevalidate } from "@/cms/hooks/revalidate";
export { findMediaReferences } from "./mediaReferences";
export type { MediaReference } from "./mediaReferences";

// ───────── inventory (3A) ─────────
// cms/lib/inventory.ts — the four guarded UPDATEs on `session_inventory` (SPEC §H.3), each inside the caller's transaction.
// SoldOut is thrown by acquireSeats; the checkout turns it into a 409 with the live count.
export { acquireSeats, consumeSeats, refundSeats, releaseSeats, SoldOut } from "./inventory";

// ───────── pricing (3A) ─────────
// cms/lib/pricing.ts — re-prices every line from the database; promo and pass credits reserved atomically when `reserve`.
export interface QuoteLineInput {
  kind: "session" | "pass";
  id: string;
  qty: number;
}
export interface QuoteInput {
  lines: QuoteLineInput[];
  email?: string;
  codes: string[];
  channel: Channel;
  desk?: { method: DeskMethod; amountFils?: Fils };
}
export interface OrderLine {
  kind: "session" | "pass";
  session?: string;
  pass?: string;
  title: string;
  category?: string;
  startsAt?: string;
  durationMinutes?: number;
  venueName?: string;
  qty: number;
  unitFils: Fils;
  lineFils: Fils;
  passCredits: number;
}
export interface Totals {
  subtotalFils: Fils;
  discountFils: Fils;
  grossFils: Fils;
  netFils: Fils;
  vatFils: Fils;
  vatRateBps: number;
  currency: "AED";
}
export interface Quote {
  lines: OrderLine[];
  totals: Totals;
  passRedemptions: Array<{ passPurchase: string; n: number }>;
  promo?: { promoCode: string; code: string; discountFils: Fils };
  rejectedCodes: Array<{ code: string; reason: "invalid" | "expired" | "exhausted" | "min_spend" | "not_applicable" | "one_promo_only" }>;
}
// reserve=true runs the atomic UPDATEs (promo `uses`, pass `sessions_remaining`) inside the request's transaction.
// The returned object is a `Quote` plus the per-line breakdown the checkout stores (`DetailedQuote`).
export { quote } from "./pricing";

// ───────── orders (3A) ─────────
// cms/lib/orders.ts, cms/lib/orderState.ts, cms/lib/invoiceNumber.ts — the §H.1 machine and the §H.3/§H.7 flows.
export type OrderStatus = "pending_payment" | "awaiting_payment" | "confirming" | "confirmed" | "completed" | "failed" | "expired" | "cancelled" | "refunded";
export interface Contact {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  marketingOptIn?: boolean;
}
export interface StartCheckoutInput {
  basketId: string;
  channel: Channel;
  details: Contact;
  lines: QuoteLineInput[];
  codes: string[];
  consents: Array<{ policy: string; version: number }>;
  waitlistToken?: string;
  desk?: { method: DeskMethod; amountFils?: Fils; note?: string };
  source: { ipHash: string; userAgent: string; referrer?: string };
}
export type StartCheckoutResult =
  | { reference: string; paid: true; k: string }
  | { reference: string; paymentUrl: string; holdExpiresAt: string }
  | { reference: string; reused: true; paymentUrl: string; holdExpiresAt: string };
// §H.3 steps 1–5 (startCheckout), §H.5 step 7 (applyPaymentSnapshot), §H.6 (expireOrder), §H.7 (refunds, move,
// session cancel / reschedule / repeat) live in cms/lib/orders.ts; the state machine in cms/lib/orderState.ts
// (`transition` is the ONLY way `orders.status` changes); gapless numbering + invoice snapshots in cms/lib/invoiceNumber.ts.
export { applyPaymentSnapshot, cancelSession, completeRefund, expireOrder, moveOrder, repeatSession, rescheduleSession, startCheckout, syncRefunds } from "./orders";
export { transition } from "./orderState";
export { issueCreditNote, issueInvoice, nextInvoiceNumber } from "./invoiceNumber";

// ───────── gateway (3B) ─────────
// cms/lib/mamo/{types,client,mock,index}.ts — the Mamo Pay client, its mock, and the settings-driven factory (SPEC §H.4).
// Field names follow Mamo's Payment and Payment Link objects verbatim (docs/cms/research/02-mamo-pay-api.md §A4, §A5).
export interface MamoPayment {
  id: string;
  status: "captured" | "failed" | "processing" | "confirmation_required" | "refund_initiated" | "refunded" | "voided" | string;
  amount: number | string;
  amount_currency: string;
  refund_amount?: number;
  refunds?: Array<{ id: string; amount: number; created_date?: string }>;
  max_refund_amount?: number;
  custom_data?: Record<string, unknown>;
  created_date?: string;
  payment_method?: { type?: string; card_last4?: string; origin?: string };
  settlement_amount?: string;
  settlement_fee?: string;
  settlement_vat?: string;
  settlement_date?: string;
  payment_link_id?: string;
  external_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  event_type?: string;
}
export interface MamoLink {
  id: string;
  payment_url: string;
  active: boolean;
  external_id?: string;
  amount: number;
}
export interface CreateLinkInput {
  title: string;
  amount: number;
  amount_currency: "AED";
  return_url: string;
  failure_return_url: string;
  external_id: string;
  custom_data: Record<string, unknown>;
  capacity: 1;
  first_name?: string;
  last_name?: string;
  email?: string;
  payment_methods?: string[];
  enable_tabby?: boolean;
  send_customer_receipt?: boolean;
  terms_and_conditions_url?: string;
  link_type: "standalone" | "inline";
}
/** A Mamo webhook as we store or display it: Mamo returns `auth_header` in clear, we keep only whether it is set. */
export interface RedactedWebhook {
  id: string;
  url: string;
  enabled_events: string[];
  auth_header: "[set]" | null;
}
/**
 * Never carries request headers or bodies — only what the response envelope said (SPEC §H.4).
 * `class MamoApiError(status, errorCode, messages, errors?)` — defined in cms/lib/mamo/types.ts (3B), which imports
 * nothing but types from this file, so the re-export cannot form an evaluation-order cycle.
 */
export { MamoApiError } from "./mamo/types";
export interface PaymentGateway {
  readonly mode: Mode;
  readonly isConfigured: true;
  me(): Promise<{ business_name: string }>;
  createLink(input: CreateLinkInput): Promise<MamoLink>;
  getLink(id: string): Promise<MamoLink & { charges: MamoPayment[] }>;
  deactivateLink(id: string): Promise<MamoLink>;
  getPayment(id: string): Promise<MamoPayment>;
  refund(paymentId: string, amountAed: number): Promise<{ refund_amount: number; refund_status: string }>;
  listWebhooks(): Promise<RedactedWebhook[]>;
  createWebhook(url: string, events: string[], authHeader: string): Promise<RedactedWebhook>;
  updateWebhook(id: string, patch: Partial<{ url: string; enabled_events: string[]; auth_header: string }>): Promise<RedactedWebhook>;
  deleteWebhook(id: string): Promise<{ success: boolean }>;
}
export interface DisabledGateway {
  readonly isConfigured: false;
  readonly reason: string;
}
// getPaymentGateway(req, opts?: { forceMode?: "test" | "live" }): Promise<PaymentGateway | DisabledGateway>
//   reads payment-settings with `context.internalRead`; mock or no key → MockMamoClient outside production, else disabled.
// webhookSecrets(req): Promise<Array<{ mode: "test" | "live"; value: string; previous: boolean }>>
//   every webhook secret the receiver must try: current test/live plus the previous ones still inside their 10-minute grace.
export { getPaymentGateway, webhookSecrets } from "./mamo/index";
// Phase 3 integration addition beyond §O: 3B's stored-delivery processor
// (webhook steps 5–8), which 3D's reconcile sweep re-runs on a re-claimed row.
export { processClaimedEvent } from "./mamo/webhook";

// ───────── email + pdf (3C) ─────────
// cms/lib/{mailer,templates,notifyStaff}.ts, cms/lib/pdf/{invoice,ticket}.ts (SPEC §H.8, §H.7).
export type TemplateKey =
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
export type StaffEvent =
  | "new_order"
  | "failed_payment"
  | "refund_requested"
  | "refund"
  | "dispute"
  | "new_enquiry"
  | "waitlist_joined"
  | "job_failed"
  | "low_seats"
  | "settings_changed"
  | "webhook_unverified_spike"
  | "daily_digest";
export interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}
// Landed by 3C: cms/lib/mailer.ts (adapter + pipeline), cms/lib/templates.ts,
// cms/lib/notifyStaff.ts, cms/lib/pdf/{invoice,ticket}.ts. Signatures as §O.
//   sendTemplated — renders now, writes a `notification-log` row (`queued` | `skipped`) with redacted variables, queues `send-email { logId }`.
//   renderTemplateHtml — template document → `{{var}}` interpolation (escaped by the Lexical converters) → shell; plain text alongside.
//   notifyStaff — one `admin_*` email per `notification-settings` recipient subscribed to `event`.
//   renderInvoicePdf / renderTicketPdf / renderSampleTicketPdf — pdfkit; fonts from invoice-settings.pdfFonts (Inter, then Helvetica, fallback).
//   runtimeEmailAdapter — `email:` in payload.config.ts; reads email-settings on every send, so no setting needs a redeploy.
export { runtimeEmailAdapter, sendTemplated } from "./mailer";
// Phase 3 integration additions beyond §O (each was a cross-agent gap):
//   deliverNotification — 3C's row delivery, the body of 3D's `send-email` task;
//   signed{Ticket,Invoice}PdfUrl — 3C's signed PDF links, used in 3D's emails.
export { deliverNotification } from "./mailer";
export { signedInvoicePdfUrl, signedTicketPdfUrl } from "./pdf/links";
export { notifyStaff } from "./notifyStaff";
export { renderInvoicePdf } from "./pdf/invoice";
export { renderSampleTicketPdf, renderTicketPdf } from "./pdf/ticket";
export { renderTemplateHtml } from "./templates";

// ───────── tickets + check-in (3E) ─────────
// cms/lib/tickets.ts (SPEC §H.7). Landed by 3E.
// issueTickets: idempotent, one ticket per seat on every session line; returns how many were newly created.
// mintTicket: code = "MPT-" + Crockford base32(randomBytes(5)); qrSig = 22 chars of b64url(randomBytes(16)), STORED at
//   issue (no dependence on PAYLOAD_SECRET — see the header of cms/lib/tickets.ts); qr = `mp1.${code}.${qrSig}`.
// findTicketByQr: lookup by code first, then a constant-time compare of the stored `qrSig` — the database is the authority.
// checkIn: never throws for a bad ticket. `force` overrides only `wrong_day` and `already_checked_in`; a forced check-in
//   stores `checkInForced`. Returns the §O shape plus desk-screen extras (`CheckInResult`), never `qr`/`qrSig`.
export { checkIn, findTicketByQr, issueTickets, mintTicket } from "./tickets";
export type { CheckInResult, CheckInVerdict } from "./tickets";

// ───────── waitlist (3A) ─────────
// cms/lib/waitlist.ts (SPEC §H.11).
export { joinWaitlist, notifyWaitlist, validWaitlistTokenFor } from "./waitlist";

// ───────── jobs (3D) — input shapes; every task declares `concurrency` per §H.9 ─────────
export interface JobInputs {
  "finalize-order": { orderId: string };
  "issue-tickets": { orderId: string };
  "issue-invoice": { orderId: string };
  "generate-invoice-pdf": { invoiceId: string };
  "send-email": { logId: string };
  "notify-staff": { event: StaffEvent; vars: Record<string, unknown>; refs?: Record<string, string> };
  "process-refund": { refundId: string; paymentId: string; orderId: string };
  "waitlist-notify": { sessionId: string; freedSeats: number };
  "expire-holds": Record<string, never>;
  "reconcile-payments": Record<string, never>;
  "send-reminders": Record<string, never>;
  "complete-orders": Record<string, never>;
  "reconcile-inventory": Record<string, never>;
  "send-daily-digest": Record<string, never>;
}
