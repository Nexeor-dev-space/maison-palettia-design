import { sql, type SQL } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

import type { DayRange } from "./analyticsQueries";

/**
 * ==========================================================================
 * CSV exports — orders, invoices, customers, tickets, enquiries (SPEC §H.12)
 * ==========================================================================
 *
 * For the accountant, the FTA return and the owner's own spreadsheets.
 * `GET /api/actions/exports/{kind}.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`
 * (cms/endpoints/exports.ts, admin only) streams what `exportCsv` yields.
 *
 * THE HOUSE RULES, ONCE:
 *
 *   · UTF-8 with a byte-order mark, CRLF line ends — Excel on Windows and
 *     Numbers both open it with Arabic names intact.
 *   · Dates and times are Dubai-local ("2026-10-09 18:30"), the studio's
 *     clock; the date filter is Dubai days too, inclusive at both ends.
 *   · Money is AED with two decimals and no currency sign or thousands
 *     separator ("1240.00"), so a spreadsheet sums it as a number.
 *   · A cell that starts with = + - @ is prefixed with ' (formula injection:
 *     a customer named "=HYPERLINK(…)" stays a name) — EXCEPT a cell that is
 *     a plain number. A credit note's "-38.10" must stay a number or Excel
 *     and Numbers read it as text and leave it out of every SUM; a bare
 *     signed decimal can't carry a formula, so letting it through is safe.
 *   · Streamed with keyset pagination, 500 rows per page, ordered by
 *     (created_at, id) — memory stays flat whether the file has 50 rows or
 *     50,000, and a row inserted mid-export can neither duplicate nor
 *     shift a page.
 *
 * WHICH ROWS: orders by the day they were created; invoices and credit
 * notes by the day they were issued; customers created OR last ordering in
 * the range; tickets by their session's date (the door list); enquiries by
 * the day they arrived. Every order mode (live/test/mock) is included and
 * labelled in a `Mode` column, so test rows can be filtered out rather than
 * silently missing.
 */

export const EXPORT_KINDS = ["orders", "invoices", "customers", "tickets", "enquiries"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export const EXPORT_PAGE_SIZE = 500;

export const isExportKind = (value: unknown): value is ExportKind => typeof value === "string" && (EXPORT_KINDS as readonly string[]).includes(value);

/* ────────────────────────────────────────────────────────────────────────── */
/* Cells                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

/** A bare signed decimal ("-38.10", "1240", "-0.5") — safe to leave unescaped. */
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvLine = (cells: unknown[]): string => `${cells.map(csvCell).join(",")}\r\n`;

/** Integer fils (number or numeric string) → "1240.00"; empty for null. */
export function aed(fils: unknown): string {
  if (fils === null || fils === undefined || fils === "") return "";
  const n = Number(fils);
  if (!Number.isFinite(n)) return "";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const DUBAI = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dubai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** A timestamp as "YYYY-MM-DD HH:mm" in Dubai; empty for null. */
export function dubaiDateTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(DUBAI.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

const pct = (bps: unknown) => (bps === null || bps === undefined ? "" : (Number(bps) / 100).toFixed(2));
const yes = (v: unknown) => (v === true ? "yes" : "");

/* ────────────────────────────────────────────────────────────────────────── */
/* Definitions                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const dubaiDate = (column: SQL) => sql`(${column} at time zone 'Asia/Dubai')::date`;
const inRange = (column: SQL, range: DayRange) => sql`${dubaiDate(column)} between ${range.from}::date and ${range.to}::date`;

type Row = Record<string, unknown>;

interface ExportDef {
  /** The friendly file stem: `maison-palettia-orders-2026-09-01-to-2026-09-30.csv`. */
  title: string;
  header: string[];
  /** One page of rows after the (createdAt, id) cursor, oldest first. */
  page: (range: DayRange, after: { at: string; id: string } | null, limit: number) => SQL;
  cells: (row: Row) => unknown[];
}

/** `(t.created_at, t.id) > (cursor)` — the keyset condition, true on the first page. */
const after = (alias: string, cursor: { at: string; id: string } | null) =>
  cursor ? sql`(${sql.raw(alias)}.created_at, ${sql.raw(alias)}.id) > (${cursor.at}::timestamptz, ${cursor.id}::uuid)` : sql`true`;

const DEFS: Record<ExportKind, ExportDef> = {
  orders: {
    title: "orders",
    header: [
      "Reference", "Created (Dubai)", "Confirmed (Dubai)", "Status", "Channel", "Mode",
      "First name", "Last name", "Email", "Phone", "Marketing opt-in",
      "Items", "Seats",
      "Subtotal (AED)", "Discount (AED)", "Net (AED)", "VAT (AED)", "Gross (AED)", "VAT rate %",
      "Promo code", "Pass credits", "Payment method", "Card last 4", "Invoice number", "Refunded (AED)", "Needs review", "Disputed",
    ],
    page: (range, cursor, limit) => sql`
      select o.id, o.created_at, o.reference, o.confirmed_at, o.status::text as status, o.channel::text as channel, o.mode::text as mode,
             o.contact_first_name, o.contact_last_name, o.contact_email, o.contact_phone, o.contact_marketing_opt_in,
             o.totals_subtotal_fils, o.totals_discount_fils, o.totals_net_fils, o.totals_vat_fils, o.totals_gross_fils, o.totals_vat_rate_bps,
             o.promo_code, o.desk_payment_method::text as desk_method, o.needs_review, o.disputed,
             (select string_agg(l.title || ' × ' || l.qty::text, '; ' order by l._order) from orders_lines l where l._parent_id = o.id) as items,
             (select coalesce(sum(l.qty), 0) from orders_lines l where l._parent_id = o.id and l.kind = 'session') as seats,
             (select coalesce(sum(r.n), 0) from orders_pass_redemptions r where r._parent_id = o.id) as pass_credits,
             p.method_type::text as method_type, p.method_card_last4,
             i.number as invoice_number,
             (select coalesce(sum(rf.amount_fils), 0) from refunds rf where rf.order_id = o.id and rf.status = 'succeeded') as refunded
      from orders o
      left join payments p on p.id = o.payment_id
      left join invoices i on i.id = o.invoice_id
      where ${inRange(sql`o.created_at`, range)} and ${after("o", cursor)}
      order by o.created_at, o.id
      limit ${limit}`,
    cells: (r) => [
      r.reference, dubaiDateTime(r.created_at), dubaiDateTime(r.confirmed_at), r.status, r.channel, r.mode,
      r.contact_first_name, r.contact_last_name, r.contact_email, r.contact_phone, yes(r.contact_marketing_opt_in),
      r.items, r.seats,
      aed(r.totals_subtotal_fils), aed(r.totals_discount_fils), aed(r.totals_net_fils), aed(r.totals_vat_fils), aed(r.totals_gross_fils), pct(r.totals_vat_rate_bps),
      r.promo_code, Number(r.pass_credits) || "", r.method_type ?? r.desk_method ?? "", r.method_card_last4, r.invoice_number, Number(r.refunded) ? aed(r.refunded) : "",
      yes(r.needs_review), yes(r.disputed),
    ],
  },

  invoices: {
    title: "invoices",
    header: [
      "Number", "Type", "Issued (Dubai)", "Order reference", "Order status", "Channel", "Mode",
      "Buyer name", "Buyer email", "Buyer phone",
      "Net (AED)", "VAT (AED)", "Gross (AED)", "Discount (AED)", "VAT rate %",
      "Payment method", "Payment label", "Promo code", "Pass credits", "Seller TRN", "Corrects invoice",
    ],
    page: (range, cursor, limit) => sql`
      select i.id, i.created_at, i.number, i.kind::text as kind, coalesce(i.issued_at, i.created_at) as issued,
             o.reference, o.status::text as order_status, o.channel::text as channel, o.mode::text as mode,
             i.buyer_name, i.buyer_email, i.buyer_phone,
             i.totals_net_fils, i.totals_vat_fils, i.totals_gross_fils, i.totals_discount_fils,
             coalesce(i.seller_vat_rate_bps, o.totals_vat_rate_bps) as vat_bps,
             coalesce(p.method_type::text, o.desk_payment_method::text) as method, i.payment_label, o.promo_code,
             (select coalesce(sum(r.n), 0) from orders_pass_redemptions r where r._parent_id = o.id) as pass_credits,
             i.seller_trn,
             case when i.kind = 'credit_note' then oi.number end as corrects
      from invoices i
      join orders o on o.id = i.order_id
      left join payments p on p.id = o.payment_id
      left join invoices oi on oi.id = o.invoice_id
      where ${inRange(sql`coalesce(i.issued_at, i.created_at)`, range)} and ${after("i", cursor)}
      order by i.created_at, i.id
      limit ${limit}`,
    cells: (r) => {
      // Credit notes are stored as positive amounts; the export shows them negative so a column sum is the net figure.
      const sign = r.kind === "credit_note" ? -1 : 1;
      const m = (v: unknown) => aed(Number(v ?? 0) * sign);
      return [
        r.number, r.kind === "credit_note" ? "Credit note" : "Invoice", dubaiDateTime(r.issued), r.reference, r.order_status, r.channel, r.mode,
        r.buyer_name, r.buyer_email, r.buyer_phone,
        m(r.totals_net_fils), m(r.totals_vat_fils), m(r.totals_gross_fils), aed(r.totals_discount_fils), pct(r.vat_bps),
        r.method, r.payment_label, r.promo_code, Number(r.pass_credits) || "", r.seller_trn, r.corrects,
      ];
    },
  },

  customers: {
    title: "customers",
    header: ["Email", "First name", "Last name", "Phone", "Marketing opt-in", "Orders", "Tickets", "Lifetime spend (AED)", "Last order (Dubai)", "First seen (Dubai)", "Notes"],
    page: (range, cursor, limit) => sql`
      select c.id, c.created_at, c.email, c.first_name, c.last_name, c.phone, c.marketing_opt_in,
             c.stats_orders_count, c.stats_tickets_count, c.stats_lifetime_fils, c.last_order_at, c.notes
      from customers c
      where (${inRange(sql`c.created_at`, range)} or (c.last_order_at is not null and ${inRange(sql`c.last_order_at`, range)}))
        and ${after("c", cursor)}
      order by c.created_at, c.id
      limit ${limit}`,
    cells: (r) => [
      r.email, r.first_name, r.last_name, r.phone, yes(r.marketing_opt_in),
      Number(r.stats_orders_count ?? 0), Number(r.stats_tickets_count ?? 0), aed(r.stats_lifetime_fils ?? 0),
      dubaiDateTime(r.last_order_at), dubaiDateTime(r.created_at), r.notes,
    ],
  },

  tickets: {
    title: "tickets",
    header: ["Ticket code", "Status", "Session", "Starts (Dubai)", "Holder", "Seat", "Order reference", "Order email", "Checked in (Dubai)", "Checked in by", "Forced", "Mode"],
    page: (range, cursor, limit) => sql`
      select t.id, t.created_at, t.code, t.status::text as status, coalesce(s.title, x.name, s.slug) as session_title, s.starts_at,
             t.holder_name, t.seat_no, o.reference, o.contact_email, o.contact_first_name, o.contact_last_name, o.mode::text as mode,
             t.checked_in_at, u.name as checked_in_by, t.check_in_forced
      from tickets t
      join sessions s on s.id = t.session_id
      left join experiences x on x.id = s.experience_id
      join orders o on o.id = t.order_id
      left join users u on u.id = t.checked_in_by_id
      where ${inRange(sql`s.starts_at`, range)} and ${after("t", cursor)}
      order by t.created_at, t.id
      limit ${limit}`,
    cells: (r) => [
      r.code, r.status, r.session_title, dubaiDateTime(r.starts_at),
      r.holder_name || [r.contact_first_name, r.contact_last_name].filter(Boolean).join(" "), r.seat_no,
      r.reference, r.contact_email, dubaiDateTime(r.checked_in_at), r.checked_in_by, yes(r.check_in_forced), r.mode,
    ],
  },

  enquiries: {
    title: "enquiries",
    header: ["Reference", "Received (Dubai)", "Status", "Form", "Topic", "Name", "Email", "Phone", "Message", "Details", "Assigned to", "Replied (Dubai)", "Possible spam"],
    page: (range, cursor, limit) => sql`
      select q.id, q.created_at, q.status::text as status, q.source::text as source, q.topic::text as topic,
             q.name, q.email, q.phone, q.message, q.replied_at, q.meta_honeypot_tripped, u.name as assignee,
             (select string_agg(d.label || ': ' || d.value, '; ' order by d._order) from enquiries_details d where d._parent_id = q.id) as details
      from enquiries q
      left join users u on u.id = q.assigned_to_id
      where ${inRange(sql`q.created_at`, range)} and ${after("q", cursor)}
      order by q.created_at, q.id
      limit ${limit}`,
    cells: (r) => [
      `ENQ-${String(r.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`, dubaiDateTime(r.created_at),
      ({ new: "New", in_progress: "In progress", closed: "Closed" } as Record<string, string>)[String(r.status)] ?? r.status,
      r.source === "private-event" ? "Private event" : "Contact",
      r.topic, r.name, r.email, r.phone, r.message, r.details, r.assignee, dubaiDateTime(r.replied_at), yes(r.meta_honeypot_tripped),
    ],
  },
};

/** `maison-palettia-invoices-2026-09-01-to-2026-09-30.csv` */
export function exportFilename(kind: ExportKind, range: DayRange): string {
  const span = range.from === range.to ? range.from : `${range.from}-to-${range.to}`;
  return `maison-palettia-${DEFS[kind].title}-${span}.csv`;
}

async function rowsOf(payload: Payload, query: SQL): Promise<Row[]> {
  const db = (payload.db as unknown as { drizzle: { execute: (q: SQL) => Promise<unknown> } }).drizzle;
  const result = (await db.execute(query)) as { rows?: Row[] } | Row[] | undefined;
  return Array.isArray(result) ? result : (result?.rows ?? []);
}

/**
 * The CSV, chunk by chunk: the BOM and header first, then one chunk per
 * page of `pageSize` rows. Feed it to a `ReadableStream` (the endpoint does).
 */
export async function* exportCsv(payload: Payload, kind: ExportKind, range: DayRange, pageSize = EXPORT_PAGE_SIZE): AsyncGenerator<string> {
  const def = DEFS[kind];
  yield `﻿${csvLine(def.header)}`;
  let cursor: { at: string; id: string } | null = null;
  for (;;) {
    const page = await rowsOf(payload, def.page(range, cursor, pageSize));
    if (page.length === 0) return;
    yield page.map((row) => csvLine(def.cells(row))).join("");
    const last = page[page.length - 1];
    const at = last.created_at instanceof Date ? last.created_at.toISOString() : new Date(String(last.created_at)).toISOString();
    cursor = { at, id: String(last.id) };
    if (page.length < pageSize) return;
  }
}

/** The generator as a byte stream for a `Response`. Errors mid-stream end the file with a visible line rather than a silent cut. */
export function exportStream(payload: Payload, kind: ExportKind, range: DayRange): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = exportCsv(payload, kind, range);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (error) {
        payload.logger.error({ msg: `exports: ${kind} failed mid-stream`, error: error instanceof Error ? error.message : String(error) });
        controller.enqueue(encoder.encode(csvLine(["EXPORT INCOMPLETE — an error stopped the file here. Please try again."])));
        controller.close();
      }
    },
    async cancel() {
      await iterator.return(undefined);
    },
  });
}
