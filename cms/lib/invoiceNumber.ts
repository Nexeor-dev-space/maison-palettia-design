import { sql } from "@payloadcms/db-postgres/drizzle";
import type { PayloadRequest } from "payload";

import type { Invoice, Order, Payment, Refund } from "@/payload-types";

import { dubaiDay } from "./crypto";
import { runSql, withContext, withTransaction } from "./inventory";
import { CURRENCY, DEFAULT_VAT_RATE_BPS } from "./money";
import { vatSplit } from "./pricing";

/**
 * ==========================================================================
 * Invoice numbers and invoice documents (SPEC §H.7, research 03 §6)
 * ==========================================================================
 *
 * GAPLESS, PER KIND, PER DUBAI YEAR. The FTA expects a tax invoice series
 * with no holes, so a number is handed out by ONE statement on a counter row
 * keyed (kind, year):
 *
 *   INSERT INTO invoice_counters (kind, year, last) VALUES (…, 1)
 *   ON CONFLICT (kind, year) DO UPDATE SET last = invoice_counters.last + 1
 *   RETURNING last
 *
 * in the SAME transaction that inserts the invoice row. Two issuers queue on
 * the counter row's lock; a rollback (PDF settings missing, DB error) rolls
 * the number back with the invoice, so a number is either printed on an
 * invoice or was never taken. The unique (kind, year) index the ON CONFLICT
 * needs is declared on the collection (cms/collections/commerce/
 * InvoiceCounters.ts) so `migrate:create` emits it. The year is the Dubai
 * calendar year of the issue moment — an order paid at 01:30 on 1 January
 * Dubai time is next year's invoice even though it is still 31 December UTC.
 *
 * DOCUMENTS ARE SNAPSHOTS. `issueInvoice` copies the seller from Settings →
 * Invoices & VAT, the buyer from the order's contact, and the lines and
 * totals from the order — the figures the customer paid, never re-priced.
 * Lines print at list price with their own VAT split; discounts (promo, pass
 * credits, desk adjustment, complimentary) are the difference to the totals,
 * which are the order's totals to the fil. Both functions are idempotent:
 * an order has one invoice, a refund one credit note, and asking again
 * returns the existing document (the `issue-invoice` job may retry).
 *
 * The PDF is 3C's (`renderInvoicePdf`, `generate-invoice-pdf`); nothing here
 * waits for it, so a failed render never loses a number.
 */

export type InvoiceKind = "invoice" | "credit_note";

/** "MP-INV-2026-000123". Six digits: a studio will not pass a million invoices a year. */
export function formatInvoiceNumber(prefix: string, year: number, seq: number): string {
  return `${prefix.replace(/-+$/, "")}-${year}-${String(seq).padStart(6, "0")}`;
}

/** The Dubai calendar year of an instant (UTC+4, no DST). */
export function dubaiYear(at: Date = new Date()): number {
  return Number(dubaiDay(at).slice(0, 4));
}

/** The counter statement (exported for the integration test). */
export const nextNumberSql = (kind: InvoiceKind, year: number) => sql`
  INSERT INTO invoice_counters (id, kind, year, last, created_at, updated_at)
       VALUES (gen_random_uuid(), ${kind}, ${year}, 1, now(), now())
  ON CONFLICT (kind, year) DO UPDATE SET last = invoice_counters.last + 1, updated_at = now()
    RETURNING last`;

type InvoiceSettingsLike = {
  invoicePrefix?: string | null;
  creditNotePrefix?: string | null;
  legalName?: string | null;
  trn?: string | null;
  tradeLicenceNumber?: string | null;
  vatRateBps?: number | null;
  addressLines?: Array<{ line?: string | null }> | null;
  issuerEmail?: string | null;
  issuerPhone?: string | null;
};

async function invoiceSettings(req: PayloadRequest): Promise<InvoiceSettingsLike> {
  return ((await req.payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, req }).catch(() => null)) ?? {}) as InvoiceSettingsLike;
}

/**
 * The contract's `nextInvoiceNumber`: takes the next number in the CALLER's
 * transaction. Call it only where the invoice row is inserted in the same
 * transaction, or the gap-free guarantee is gone.
 */
export async function nextInvoiceNumber(req: PayloadRequest, kind: InvoiceKind, year: number): Promise<{ seq: number; number: string }> {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new RangeError(`invoice year out of range: ${year}`);
  const rows = await runSql<{ last: unknown }>(req, nextNumberSql(kind, year));
  const seq = Number(rows[0]?.last);
  if (!Number.isInteger(seq) || seq < 1) throw new Error("invoice counter returned no number");
  const settings = await invoiceSettings(req);
  const prefix = (kind === "invoice" ? settings.invoicePrefix || "MP-INV" : settings.creditNotePrefix || "MP-CN").trim();
  return { seq, number: formatInvoiceNumber(prefix, year, seq) };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Snapshots (pure)                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const DESK_LABELS: Record<string, string> = {
  cash: "Paid at venue (cash)",
  card_terminal: "Card terminal",
  bank_transfer: "Bank transfer",
  complimentary: "Complimentary",
};

/** "Mamo Pay · card ****1157 · ref PAY-…" / "Paid at venue (cash)" / "Complimentary" / "Paid with pass credits". */
export function paymentLabel(order: Pick<Order, "channel" | "deskPayment" | "totals">, payment?: Pick<Payment, "provider" | "method" | "providerPaymentId"> | null): string {
  if (order.channel === "desk") return DESK_LABELS[order.deskPayment?.method ?? ""] ?? "Paid at the studio";
  if (order.totals.grossFils === 0) return "Paid with pass credits";
  if (!payment || payment.provider !== "mamo") return "Mamo Pay";
  const method = payment.method?.type === "wallet" ? "wallet" : payment.method?.cardLast4 ? `card ****${payment.method.cardLast4}` : "card";
  return [`Mamo Pay · ${method}`, payment.providerPaymentId ? `ref ${payment.providerPaymentId}` : ""].filter(Boolean).join(" · ").slice(0, 120);
}

const dubaiStamp = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
};

/** Inclusive pricing is recorded in the totals themselves: subtotal − discounts = gross only when VAT was inside. */
export const pricesIncludedVat = (totals: Order["totals"]): boolean => totals.subtotalFils - totals.discountFils === totals.grossFils;

type InvoiceLine = NonNullable<Invoice["lines"]>[number];

/** One invoice line per order line, at list price, VAT split per line. */
export function invoiceLinesFor(order: Pick<Order, "lines" | "totals">): InvoiceLine[] {
  const rate = order.totals.vatRateBps ?? DEFAULT_VAT_RATE_BPS;
  const inclusive = pricesIncludedVat(order.totals);
  return (order.lines ?? []).map((line) => {
    const split = vatSplit(line.lineFils, rate, inclusive);
    const when = dubaiStamp(line.startsAt);
    const credits = line.passCredits ? ` — ${line.passCredits} by pass` : "";
    return {
      description: `${line.title}${when ? ` · ${when}` : ""}${line.venueName ? ` · ${line.venueName}` : ""}${credits}`.slice(0, 200),
      qty: line.qty,
      unitNetFils: Math.round(split.netFils / Math.max(1, line.qty)),
      netFils: split.netFils,
      vatFils: split.vatFils,
      grossFils: split.grossFils,
    };
  });
}

/** Credit-note lines: the invoice's lines for a full refund, one "Refund" line for a partial one. */
export function creditNoteLinesFor(order: Pick<Order, "lines" | "totals" | "reference">, amountFils: number): InvoiceLine[] {
  if (amountFils >= order.totals.grossFils && order.totals.discountFils === 0) return invoiceLinesFor(order);
  const split = vatSplit(amountFils, order.totals.vatRateBps ?? DEFAULT_VAT_RATE_BPS, true);
  return [{ description: `Refund — order ${order.reference}`, qty: 1, unitNetFils: split.netFils, netFils: split.netFils, vatFils: split.vatFils, grossFils: split.grossFils }];
}

function sellerOf(settings: InvoiceSettingsLike): Invoice["seller"] {
  return {
    legalName: settings.legalName ?? null,
    trn: settings.trn || null,
    tradeLicenceNumber: settings.tradeLicenceNumber ?? null,
    vatRateBps: settings.vatRateBps ?? DEFAULT_VAT_RATE_BPS,
    addressLines: (settings.addressLines ?? []).filter((row) => row?.line).map((row) => ({ line: String(row.line) })),
    email: settings.issuerEmail ?? null,
    phone: settings.issuerPhone ?? null,
  };
}

const buyerOf = (order: Order): Invoice["buyer"] => ({
  name: `${order.contact.firstName} ${order.contact.lastName}`.trim().slice(0, 120),
  email: order.contact.email ?? null,
  phone: order.contact.phone ?? null,
});

const idOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

/* ────────────────────────────────────────────────────────────────────────── */
/* issueInvoice / issueCreditNote                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const lockOrderSql = (orderId: string) => sql`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;

/** Idempotent: returns the existing invoice when the order already has one. */
export async function issueInvoice(req: PayloadRequest, orderId: string): Promise<{ invoiceId: string; number: string }> {
  return withTransaction(req, async () => {
    // Serialise two issuers for the same order (a retried job beside a manual "Regenerate").
    await runSql(req, lockOrderSql(orderId));
    const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 1, overrideAccess: true, req })) as Order;
    const existing = await req.payload.find({
      collection: "invoices",
      where: { and: [{ order: { equals: orderId } }, { kind: { equals: "invoice" } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (existing.docs[0]) {
      const doc = existing.docs[0] as Invoice;
      if (idOf(order.invoice) !== doc.id) await linkInvoice(req, orderId, doc.id);
      return { invoiceId: doc.id, number: doc.number };
    }

    const issuedAt = new Date();
    const year = dubaiYear(issuedAt);
    const { seq, number } = await nextInvoiceNumber(req, "invoice", year);
    const settings = await invoiceSettings(req);
    const payment = order.payment && typeof order.payment === "object" ? (order.payment as Payment) : null;
    const invoice = (await withContext(req, { system: true }, (context) =>
      req.payload.create({
        collection: "invoices",
        data: {
          number,
          kind: "invoice",
          year,
          sequence: seq,
          order: orderId,
          seller: sellerOf(settings),
          buyer: buyerOf(order),
          lines: invoiceLinesFor(order),
          totals: {
            netFils: order.totals.netFils,
            vatFils: order.totals.vatFils,
            grossFils: order.totals.grossFils,
            discountFils: order.totals.discountFils,
          },
          currency: CURRENCY,
          paymentLabel: paymentLabel(order, payment),
          issuedAt: issuedAt.toISOString(),
        },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    )) as Invoice;
    await linkInvoice(req, orderId, invoice.id);
    return { invoiceId: invoice.id, number };
  });
}

async function linkInvoice(req: PayloadRequest, orderId: string, invoiceId: string): Promise<void> {
  await withContext(req, { system: true }, (context) =>
    req.payload.update({ collection: "orders", id: orderId, data: { invoice: invoiceId }, depth: 0, overrideAccess: true, context, req }),
  );
}

/** Idempotent: returns the existing credit note when the refund already has one. */
export async function issueCreditNote(req: PayloadRequest, refundId: string): Promise<{ invoiceId: string; number: string }> {
  return withTransaction(req, async () => {
    const refund = (await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req })) as Refund;
    const orderId = idOf(refund.order);
    if (!orderId) throw new Error(`refund ${refundId} has no order`);
    await runSql(req, lockOrderSql(orderId));

    const existing = await req.payload.find({
      collection: "invoices",
      where: { and: [{ refund: { equals: refundId } }, { kind: { equals: "credit_note" } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (existing.docs[0]) {
      const doc = existing.docs[0] as Invoice;
      if (idOf(refund.creditNote) !== doc.id) await linkCreditNote(req, refundId, doc.id);
      return { invoiceId: doc.id, number: doc.number };
    }

    // A credit note corrects an invoice; an order refunded before it was ever invoiced gets its invoice first.
    await issueInvoice(req, orderId);
    const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;

    const issuedAt = new Date();
    const year = dubaiYear(issuedAt);
    const { seq, number } = await nextInvoiceNumber(req, "credit_note", year);
    const settings = await invoiceSettings(req);
    const lines = creditNoteLinesFor(order, refund.amountFils);
    const sum = (pick: (l: InvoiceLine) => number) => lines.reduce((acc, l) => acc + pick(l), 0);
    const doc = (await withContext(req, { system: true }, (context) =>
      req.payload.create({
        collection: "invoices",
        data: {
          number,
          kind: "credit_note",
          year,
          sequence: seq,
          order: orderId,
          refund: refundId,
          seller: sellerOf(settings),
          buyer: buyerOf(order),
          lines,
          totals: { netFils: sum((l) => l.netFils), vatFils: sum((l) => l.vatFils), grossFils: sum((l) => l.grossFils), discountFils: 0 },
          currency: CURRENCY,
          paymentLabel: refund.providerRefundId === "desk" ? "Repaid at the studio" : "Refunded to the original payment method",
          issuedAt: issuedAt.toISOString(),
        },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    )) as Invoice;
    await linkCreditNote(req, refundId, doc.id);
    return { invoiceId: doc.id, number };
  });
}

async function linkCreditNote(req: PayloadRequest, refundId: string, invoiceId: string): Promise<void> {
  await withContext(req, { system: true }, (context) =>
    req.payload.update({ collection: "refunds", id: refundId, data: { creditNote: invoiceId }, depth: 0, overrideAccess: true, context, req }),
  );
}
