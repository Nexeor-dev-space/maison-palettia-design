/**
 * ==========================================================================
 * OrderView — what a customer may see of an order, and nothing more
 * ==========================================================================
 *
 * The one shape every customer-facing booking surface renders: the
 * confirmation (/payment-success), the status lookup (/booking-status) and
 * the guest list (/my-bookings), all through <BookingSummaryCard>. It is
 * built on the server from an `orders` document (`orderViewOf` in
 * lib/booking.ts) and is deliberately poorer than the document: no ids, no
 * customer relation, no payment rows, no internal notes, no timeline, no
 * source IP hash. A field is added here only when a customer needs to read
 * it.
 *
 * TWO DEPTHS. `detail: false` is what an unauthenticated caller gets — the
 * reference, the state and when the seat hold ends (SPEC §H.5: the status
 * endpoint without `k`). `detail: true` adds the lines, totals, tickets and
 * invoice, and is only produced behind a proof of ownership: a valid return
 * key `k`, reference + email, or the signed-in `mp_session` cookie.
 *
 * NO DIRECTIVE, NO IMPORTS. Server pages build it and client components
 * (the lookup, the polling confirmation) parse it from JSON, so this module
 * has to be importable from both sides — and `parseOrderView` is the guard
 * on the client side, because a JSON body is not a trusted input.
 */

export type OrderStatus =
  | "pending_payment"
  | "awaiting_payment"
  | "confirming"
  | "confirmed"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

/**
 * The words a customer is shown, which are fewer than the machine's states
 * (SPEC §H.1). `processing` covers every moment between pressing Pay and the
 * tickets existing — the hold, the gateway, the webhook, the finalise job —
 * because none of those distinctions is something the customer can act on.
 * `not_paid` is a failed or lapsed attempt: the basket is still theirs to
 * retry from checkout.
 */
export type DisplayStatus = "confirmed" | "processing" | "not_paid" | "completed" | "cancelled" | "refunded";

export function displayStatus(status: OrderStatus): DisplayStatus {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "failed":
    case "expired":
      return "not_paid";
    default:
      return "processing";
  }
}

/** Statuses after which nothing more will happen without a person doing something. */
export const SETTLED: ReadonlySet<DisplayStatus> = new Set(["confirmed", "completed", "cancelled", "refunded", "not_paid"]);

export interface OrderViewLine {
  kind: "session" | "pass";
  title: string;
  category?: string;
  /** ISO 8601. Sessions only. */
  startsAt?: string;
  durationMinutes?: number;
  venueName?: string;
  /** The event page, when the session still has one. */
  href?: string;
  qty: number;
  lineFils: number;
}

export interface OrderViewTicket {
  code: string;
  status: "valid" | "checked_in" | "void" | "refunded";
  seatNo: number;
  holderName?: string;
  sessionTitle?: string;
  /** Signed, expiring download link (SPEC §H.7) — the only customer path to a PDF. */
  pdfUrl?: string;
}

export interface OrderView {
  reference: string;
  status: OrderStatus;
  /** When the seat hold lapses, while payment is outstanding. */
  holdExpiresAt?: string | null;
  /** Present only on `detail: true`. */
  detail?: {
    createdAt: string;
    guest: { firstName: string; lastName: string; email?: string };
    lines: OrderViewLine[];
    totals: { subtotalFils: number; discountFils: number; grossFils: number; vatFils: number; currency: string };
    /** Money has been taken (or none was owed). */
    paid: boolean;
    tickets: OrderViewTicket[];
    invoice?: { number: string; pdfUrl?: string } | null;
    /** The gateway's customer-facing reason, after a failed attempt. */
    failureMessage?: string | null;
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Parsing (client side)                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

const STATUSES: ReadonlySet<string> = new Set([
  "pending_payment",
  "awaiting_payment",
  "confirming",
  "confirmed",
  "completed",
  "failed",
  "expired",
  "cancelled",
  "refunded",
]);

type Bag = Record<string, unknown>;
const bag = (value: unknown): Bag | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Bag) : null);
const str = (value: unknown): string | undefined => (typeof value === "string" && value !== "" ? value : undefined);
const int = (value: unknown, fallback = 0): number => (typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback);

function parseLine(value: unknown): OrderViewLine | null {
  const line = bag(value);
  if (!line || (line.kind !== "session" && line.kind !== "pass") || !str(line.title)) return null;
  return {
    kind: line.kind,
    title: str(line.title)!,
    category: str(line.category),
    startsAt: str(line.startsAt),
    durationMinutes: typeof line.durationMinutes === "number" ? line.durationMinutes : undefined,
    venueName: str(line.venueName),
    href: str(line.href)?.startsWith("/") ? str(line.href) : undefined,
    qty: Math.max(1, int(line.qty, 1)),
    lineFils: Math.max(0, int(line.lineFils)),
  };
}

function parseTicket(value: unknown): OrderViewTicket | null {
  const ticket = bag(value);
  if (!ticket || !str(ticket.code)) return null;
  const status = ticket.status;
  return {
    code: str(ticket.code)!,
    status: status === "checked_in" || status === "void" || status === "refunded" ? status : "valid",
    seatNo: Math.max(1, int(ticket.seatNo, 1)),
    holderName: str(ticket.holderName),
    sessionTitle: str(ticket.sessionTitle),
    // Only our own download route is followed — never an absolute URL from a body.
    pdfUrl: str(ticket.pdfUrl)?.startsWith("/api/site/") ? str(ticket.pdfUrl) : undefined,
  };
}

/**
 * A JSON body → `OrderView`, or null when it is not one. Unknown fields are
 * dropped; malformed lines and tickets are skipped rather than failing the
 * whole booking, so one odd row never blanks a confirmation.
 */
export function parseOrderView(value: unknown, fallbackReference?: string): OrderView | null {
  const root = bag(value);
  const order = bag(root?.order) ?? root;
  const reference = str(order?.reference) ?? fallbackReference;
  if (!order || !reference || !STATUSES.has(String(order.status))) return null;

  const view: OrderView = {
    reference,
    status: order.status as OrderStatus,
    holdExpiresAt: str(order.holdExpiresAt) ?? null,
  };

  // 3B's flat customer view (cms/lib/mamo/orderView.ts, the lookup and
  // status routes) carries the details at the top level, not under `detail`.
  const detail = bag(order.detail) ?? (Array.isArray(order.lines) ? flatDetail(order) : null);
  if (detail) {
    const guest = bag(detail.guest) ?? {};
    const totals = bag(detail.totals) ?? {};
    const invoice = bag(detail.invoice);
    view.detail = {
      createdAt: str(detail.createdAt) ?? "",
      guest: { firstName: str(guest.firstName) ?? "", lastName: str(guest.lastName) ?? "", email: str(guest.email) },
      lines: (Array.isArray(detail.lines) ? detail.lines : []).map(parseLine).filter((l): l is OrderViewLine => l !== null),
      totals: {
        subtotalFils: int(totals.subtotalFils),
        discountFils: int(totals.discountFils),
        grossFils: int(totals.grossFils),
        vatFils: int(totals.vatFils),
        currency: str(totals.currency) ?? "AED",
      },
      paid: detail.paid === true,
      tickets: (Array.isArray(detail.tickets) ? detail.tickets : []).map(parseTicket).filter((t): t is OrderViewTicket => t !== null),
      invoice:
        invoice && str(invoice.number)
          ? { number: str(invoice.number)!, pdfUrl: str(invoice.pdfUrl)?.startsWith("/api/site/") ? str(invoice.pdfUrl) : undefined }
          : null,
      failureMessage: str(detail.failureMessage) ?? null,
    };
  }
  return view;
}

/** `CustomerOrderView` (3B) → the `detail` shape: first name only, no PDF links (the lookup is not signed in). */
function flatDetail(order: Bag): Bag {
  const status = String(order.status);
  return {
    createdAt: str(order.confirmedAt) ?? "",
    guest: { firstName: str(order.firstName) ?? "", lastName: "" },
    lines: order.lines,
    totals: order.totals,
    paid: ["confirming", "confirmed", "completed", "refunded"].includes(status),
    tickets: Array.isArray(order.tickets)
      ? (order.tickets as unknown[]).map((ticket) => {
          const t = bag(ticket) ?? {};
          return { ...t, seatNo: typeof t.seatNo === "number" ? t.seatNo : 1, pdfUrl: undefined };
        })
      : [],
    invoice: null,
    failureMessage: order.failureMessage,
  };
}

/** "AED 320.00" from fils — the house format of the emails and invoices. */
export function formatFils(fils: number, currency = "AED"): string {
  const amount = new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(fils / 100);
  return `${currency} ${amount}`;
}
