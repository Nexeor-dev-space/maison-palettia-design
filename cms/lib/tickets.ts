import { randomBytes, timingSafeEqual } from "node:crypto";

import { sql } from "@payloadcms/db-postgres";
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from "payload";

import type { Order, Session, Ticket, User } from "@/payload-types";

/**
 * ==========================================================================
 * Tickets — minting, QR lookup, check-in and the attendee list (SPEC §H.7)
 * ==========================================================================
 *
 * One ticket per seat. A ticket is three strings:
 *
 *   · `code`  — `MPT-` + 8 Crockford base32 characters (40 random bits).
 *               Printed under the QR and typed by the front desk when a
 *               phone screen will not scan. Crockford's alphabet has no
 *               I, L, O or U, so a typed `O` is read as `0` and `I`/`L` as
 *               `1` — the desk never has to ask "is that an oh or a zero?".
 *   · `qrSig` — 22 characters of base64url (128 random bits), STORED on the
 *               row at issue and never recomputed.
 *   · `qr`    — `mp1.<code>.<qrSig>`, which is what the QR image encodes.
 *
 * VERIFICATION IS BY LOOKUP. A scan finds the row by `code` (unique,
 * indexed) and compares the presented `qrSig` to the stored one with
 * `timingSafeEqual`. The database is the authority: nothing is derived from
 * `PAYLOAD_SECRET`, so rotating the secret, rebuilding the server or
 * restoring a backup onto a new host never invalidates a printed or emailed
 * ticket. The SPEC's first draft computed `qrSig` as an HMAC of the code;
 * since the value is stored and compared rather than re-derived, the HMAC
 * bought nothing a random value does not, and it tied minting to the secret
 * (`mintTicket()` takes no request, so it would have had to read the
 * environment). The signature's only job is to stop someone who has seen
 * one code from fabricating QR images for neighbouring codes.
 *
 * CHECK-IN NEVER THROWS FOR A BAD TICKET. Every outcome a scanner can
 * produce is a verdict (`ok | already_checked_in | void | refunded |
 * wrong_day | not_found`); only infrastructure failures (database down)
 * reject. `force` overrides `wrong_day` and `already_checked_in` and
 * nothing else — a cancelled or refunded ticket cannot be waved through
 * from the scanner, by design.
 *
 * Two scanners at the door can read the same ticket in the same second. The
 * check-in runs in a transaction that first takes a row lock
 * (`SELECT … FOR UPDATE`) and only then re-reads the status, so the second
 * scan waits for the first and answers "already checked in" instead of a
 * second "welcome".
 *
 * Runtime imports stay out of `@/…` on purpose: the pure helpers below are
 * unit-tested by vitest without the Next path aliases (types are erased).
 */

// ─── format ──────────────────────────────────────────────────────────────────

export const TICKET_CODE_PREFIX = "MPT-";
export const QR_VERSION = "mp1";
/** Crockford base32: digits then letters without I, L, O, U. */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_RE = /^MPT-[0-9A-HJKMNP-TV-Z]{8}$/;
const SIG_RE = /^[A-Za-z0-9_-]{22}$/;

/** Five random bytes → eight base32 characters (exactly 40 bits, no padding). */
function base32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

/** A fresh code, signature and QR payload. Pure: the caller stores all three. */
export function mintTicket(): { code: string; qr: string; qrSig: string } {
  const code = `${TICKET_CODE_PREFIX}${base32(randomBytes(5))}`;
  const qrSig = randomBytes(16).toString("base64url").slice(0, 22);
  return { code, qrSig, qr: `${QR_VERSION}.${code}.${qrSig}` };
}

/**
 * What a human typed, made canonical: case, spaces and dashes are forgiven,
 * the `MPT-` prefix is optional, and the letters Crockford leaves out are
 * read as the digits they look like. Returns null when it cannot be a code
 * — the caller answers `not_found` without touching the database.
 */
export function normaliseCode(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  let s = input.toUpperCase().replace(/[\s\-_.]/g, "");
  // Strip the prefix only when the rest is a whole code: "MPT12345" typed alone is eight characters of code.
  if (s.length === 11 && s.startsWith("MPT")) s = s.slice(3);
  s = s.replace(/O/g, "0").replace(/[IL]/g, "1");
  const code = `${TICKET_CODE_PREFIX}${s}`;
  return CODE_RE.test(code) ? code : null;
}

/**
 * Splits a scanned payload. `mp1.<code>.<sig>` gives both parts; anything
 * else is treated as a code typed into a QR (or a printed code scanned as
 * text) and carries no signature. Returns null for junk.
 */
export function parseQr(raw: string | null | undefined): { code: string; sig: string | null } | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > 200) return null;
  const parts = value.split(".");
  if (parts[0] === QR_VERSION) {
    if (parts.length !== 3 || !SIG_RE.test(parts[2])) return null;
    const code = normaliseCode(parts[1]);
    return code ? { code, sig: parts[2] } : null;
  }
  const code = normaliseCode(value);
  return code ? { code, sig: null } : null;
}

/** Constant-time string compare; unequal lengths are compared against themselves so timing does not leak length. */
export function sigMatches(stored: string | null | undefined, presented: string | null | undefined): boolean {
  if (typeof stored !== "string" || typeof presented !== "string" || stored.length === 0) return false;
  const a = Buffer.from(stored, "utf8");
  const b = Buffer.from(presented, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

// ─── time (Dubai has no daylight saving: a fixed +04:00) ─────────────────────

export const DUBAI_TZ = "Asia/Dubai";
const DUBAI_OFFSET = "+04:00";

/** `YYYY-MM-DD` in Dubai. */
export function dubaiDate(at: Date | string | number = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DUBAI_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at));
}

/** The UTC instants bounding a Dubai calendar day, for `startsAt` range queries. */
export function dubaiDayBounds(date: string): { from: string; to: string } {
  const from = new Date(`${date}T00:00:00${DUBAI_OFFSET}`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function isDubaiDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00${DUBAI_OFFSET}`).getTime());
}

// ─── the verdict (pure) ──────────────────────────────────────────────────────

export type CheckInVerdict = "ok" | "already_checked_in" | "void" | "refunded" | "wrong_day" | "not_found";
export type CheckInDevice = "camera" | "manual" | "list";
export const CHECK_IN_DEVICES: readonly CheckInDevice[] = ["camera", "manual", "list"];
export const FORCEABLE: readonly CheckInVerdict[] = ["wrong_day", "already_checked_in"];

/** Sessions default to "an hour before until half an hour after the start" (cms/collections/content/Sessions.ts). */
export const DEFAULT_WINDOW = { beforeMinutes: 60, afterMinutes: 30 } as const;

export function checkInWindow(session: Pick<Session, "startsAt" | "checkInWindow">): { opensAt: Date; closesAt: Date } {
  const start = new Date(session.startsAt).getTime();
  const before = session.checkInWindow?.beforeMinutes ?? DEFAULT_WINDOW.beforeMinutes;
  const after = session.checkInWindow?.afterMinutes ?? DEFAULT_WINDOW.afterMinutes;
  return { opensAt: new Date(start - before * 60_000), closesAt: new Date(start + after * 60_000) };
}

/**
 * The verdict for a ticket as it stands, before any write. Order matters:
 * a dead ticket (refunded, void, or on an order that is no longer live) is
 * reported as such even when it is also the wrong day; an arrival that was
 * already recorded is reported before the clock is looked at, because "she
 * is already inside" is the more useful thing for the desk to hear.
 */
export function decideVerdict(input: {
  ticketStatus: Ticket["status"] | null | undefined;
  orderStatus?: Order["status"] | null;
  session?: Pick<Session, "startsAt" | "checkInWindow"> | null;
  now?: Date;
}): CheckInVerdict {
  const { ticketStatus, orderStatus, session, now = new Date() } = input;
  if (!ticketStatus) return "not_found";
  if (ticketStatus === "refunded" || orderStatus === "refunded") return "refunded";
  if (ticketStatus === "void") return "void";
  if (orderStatus && orderStatus !== "confirmed" && orderStatus !== "completed") return "void";
  if (ticketStatus === "checked_in") return "already_checked_in";
  if (session) {
    const { opensAt, closesAt } = checkInWindow(session);
    if (now < opensAt || now > closesAt) return "wrong_day";
  }
  return "ok";
}

// ─── lookups ─────────────────────────────────────────────────────────────────

const idOf = (value: unknown): string | null =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : null;

async function ticketByCode(req: PayloadRequest, code: string): Promise<Ticket | null> {
  const res = await req.payload.find({
    collection: "tickets",
    where: { code: { equals: code } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  return (res.docs[0] as Ticket | undefined) ?? null;
}

/**
 * Lookup then constant-time compare. A `qr` in the `mp1.` format must carry
 * the stored signature; a bare code (typed, or a QR that holds only the
 * code) is accepted as a code — the person behind the endpoint is staff,
 * and the code is printed on the ticket anyway.
 */
export async function findTicketByQr(req: PayloadRequest, input: { qr?: string; code?: string }): Promise<Ticket | null> {
  const parsed = input.qr ? parseQr(input.qr) : null;
  const code = parsed?.code ?? (input.code ? normaliseCode(input.code) : null);
  if (!code) return null;
  const ticket = await ticketByCode(req, code);
  if (!ticket) return null;
  if (parsed?.sig != null && !sigMatches(ticket.qrSig, parsed.sig)) return null;
  return ticket;
}

// ─── check-in ────────────────────────────────────────────────────────────────

/** The contract shape (SPEC §O) plus what the desk screen shows. Never carries `qr`/`qrSig`. */
export interface CheckInResult {
  verdict: CheckInVerdict;
  ticket?: Ticket;
  sessionTitle?: string;
  holder?: string;
  seatNo?: number;
  qty?: number;
  remainingOnOrder?: number;
  /** True when staff overrode `wrong_day` / `already_checked_in`. */
  forced?: boolean;
  forceable?: boolean;
  code?: string;
  ticketId?: string;
  orderId?: string;
  orderReference?: string;
  sessionId?: string;
  sessionStartsAt?: string;
  window?: { opensAt: string; closesAt: string };
  checkedInAt?: string | null;
  checkedInByName?: string | null;
}

const withoutSecrets = (ticket: Ticket): Ticket => {
  const copy = { ...ticket };
  delete copy.qr;
  delete copy.qrSig;
  return copy;
};

const asDevice = (device: string): CheckInDevice => ((CHECK_IN_DEVICES as readonly string[]).includes(device) ? (device as CheckInDevice) : "manual");

export const sessionTitleOf = (session: Session | null | undefined): string => {
  if (!session) return "";
  if (session.title) return session.title;
  const exp = session.experience;
  return exp && typeof exp === "object" && "name" in exp ? String(exp.name) : "";
};

const holderOf = (ticket: Ticket, order: Order | null): string => {
  if (ticket.holderName) return ticket.holderName;
  const c = order?.contact;
  return c ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "";
};

const userName = (user: unknown): string | null => {
  if (!user || typeof user !== "object") return null;
  const u = user as Partial<User>;
  return u.name || u.email || null;
};

/** Row lock on the ticket for the rest of the request's transaction (§H.7 "double scan"). */
async function lockTicket(req: PayloadRequest, ticketId: string): Promise<void> {
  const adapter = req.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> }; sessions?: Record<string, { db?: { execute: (q: unknown) => Promise<unknown> } }> };
  const tx = req.transactionID ? adapter.sessions?.[String(await req.transactionID)]?.db : undefined;
  await (tx ?? adapter.drizzle).execute(sql`SELECT id FROM tickets WHERE id = ${ticketId} FOR UPDATE`);
}

/** Appends one entry to the order's timeline (forced check-ins and undos are worth an audit line). */
async function appendTimeline(req: PayloadRequest, order: Order, event: string, detail: Record<string, unknown>): Promise<void> {
  // Same row shape as cms/lib/orderState.ts `timelineOf`/`timelineEntry` (without Payload's array-row ids).
  const by = (userName(req.user) ?? "system").slice(0, 120);
  const kept = (order.timeline ?? []).map(({ at, event: e, by: b, detail: d }) => ({ at, event: e, by: b ?? "system", detail: d ?? null }));
  await req.payload.update({
    collection: "orders",
    id: order.id,
    data: { timeline: [...kept, { at: new Date().toISOString(), event: event.slice(0, 60), by, detail }] },
    depth: 0,
    overrideAccess: true,
    context: { system: true, timelineOnly: true },
    req,
  });
}

/**
 * Scanner, typed code or "Mark as arrived" — the same path for all three.
 * Runs in a transaction: lock the row, read it fresh, decide, write.
 */
export async function checkIn(req: PayloadRequest, input: { qr?: string; code?: string; device: string; force?: boolean }): Promise<CheckInResult> {
  const found = await findTicketByQr(req, input);
  if (!found) return { verdict: "not_found", code: normaliseCode(input.code ?? parseQr(input.qr)?.code) ?? undefined };

  const shouldCommit = await initTransaction(req);
  try {
    await lockTicket(req, found.id);
    const ticket = (await req.payload.findByID({ collection: "tickets", id: found.id, depth: 0, overrideAccess: true, req })) as Ticket;
    const [order, session, checker] = await Promise.all([
      req.payload.findByID({ collection: "orders", id: idOf(ticket.order) ?? "", depth: 0, overrideAccess: true, req, disableErrors: true }) as Promise<Order | null>,
      req.payload.findByID({ collection: "sessions", id: idOf(ticket.session) ?? "", depth: 1, overrideAccess: true, req, disableErrors: true }) as Promise<Session | null>,
      ticket.checkedInBy
        ? (req.payload.findByID({ collection: "users", id: idOf(ticket.checkedInBy) ?? "", depth: 0, overrideAccess: true, req, disableErrors: true }) as Promise<User | null>)
        : Promise.resolve(null),
    ]);

    const before = decideVerdict({ ticketStatus: ticket.status, orderStatus: order?.status, session });
    const forceable = FORCEABLE.includes(before);
    const proceed = before === "ok" || (forceable && input.force === true);

    let current = ticket;
    if (proceed) {
      const forced = before !== "ok";
      current = (await req.payload.update({
        collection: "tickets",
        id: ticket.id,
        data: {
          status: "checked_in",
          // A forced re-entry keeps the first arrival time; the timeline records the override.
          checkedInAt: ticket.status === "checked_in" && ticket.checkedInAt ? ticket.checkedInAt : new Date().toISOString(),
          checkedInBy: req.user?.id ?? null,
          checkInDevice: asDevice(input.device),
          checkInForced: forced || ticket.checkInForced === true,
        },
        depth: 0,
        overrideAccess: true,
        context: { system: true, viaCheckIn: true },
        req,
      })) as Ticket;
      if (forced && order) await appendTimeline(req, order, "check_in_forced", { code: ticket.code, overrode: before, device: asDevice(input.device) });
    }

    const remaining = order
      ? (
          await req.payload.count({
            collection: "tickets",
            where: { and: [{ order: { equals: order.id } }, { status: { equals: "valid" } }] },
            overrideAccess: true,
            req,
          })
        ).totalDocs
      : undefined;

    if (shouldCommit) await commitTransaction(req);

    const line = order?.lines?.[ticket.lineIndex];
    const win = session ? checkInWindow(session) : null;
    return {
      verdict: proceed ? "ok" : before,
      forced: proceed && before !== "ok",
      forceable: !proceed && forceable,
      ticket: withoutSecrets(current),
      code: ticket.code,
      ticketId: ticket.id,
      orderId: order?.id,
      orderReference: order?.reference,
      sessionId: session?.id,
      sessionTitle: sessionTitleOf(session),
      sessionStartsAt: session?.startsAt,
      window: win ? { opensAt: win.opensAt.toISOString(), closesAt: win.closesAt.toISOString() } : undefined,
      holder: holderOf(ticket, order),
      seatNo: ticket.seatNo,
      qty: line?.qty ?? undefined,
      remainingOnOrder: remaining,
      checkedInAt: current.checkedInAt ?? null,
      checkedInByName: proceed ? userName(req.user) : userName(checker),
    };
  } catch (error) {
    if (shouldCommit) await killTransaction(req);
    throw error;
  }
}

/**
 * Undo a check-in (admin only, with a note — enforced by the endpoint).
 * Returns false when the ticket is not checked in, so a double click is
 * harmless.
 */
export async function undoCheckIn(req: PayloadRequest, ticketId: string, note: string): Promise<boolean> {
  const shouldCommit = await initTransaction(req);
  try {
    await lockTicket(req, ticketId);
    const ticket = (await req.payload.findByID({ collection: "tickets", id: ticketId, depth: 0, overrideAccess: true, req, disableErrors: true })) as Ticket | null;
    if (!ticket || ticket.status !== "checked_in") {
      if (shouldCommit) await commitTransaction(req);
      return false;
    }
    await req.payload.update({
      collection: "tickets",
      id: ticket.id,
      data: { status: "valid", checkedInAt: null, checkedInBy: null, checkInDevice: null, checkInForced: false },
      depth: 0,
      overrideAccess: true,
      context: { system: true, viaCheckIn: true },
      req,
    });
    const order = (await req.payload.findByID({ collection: "orders", id: idOf(ticket.order) ?? "", depth: 0, overrideAccess: true, req, disableErrors: true })) as Order | null;
    if (order) await appendTimeline(req, order, "check_in_undone", { code: ticket.code, note, was: ticket.checkedInAt });
    if (shouldCommit) await commitTransaction(req);
    return true;
  } catch (error) {
    if (shouldCommit) await killTransaction(req);
    throw error;
  }
}

// ─── issuing ─────────────────────────────────────────────────────────────────

const ISSUABLE: readonly Order["status"][] = ["confirmed", "completed"];

/**
 * One ticket per seat on every session line of a confirmed order.
 *
 * Idempotent by (line, seat, session): a LIVE ticket (`valid`,
 * `checked_in`) for that triple is skipped. A `refunded` ticket blocks its
 * (line, seat) on EVERY session — a seat refunded on its own is never
 * re-issued, not even after a move. A `void` ticket blocks nothing: a move
 * voids the old session's tickets, and moving back to that session must
 * mint fresh ones (the Phase 3 review found A → B → A left zero valid
 * tickets). Lines on a cancelled session get no tickets at all.
 * The job runs with `concurrency: order:<id>` (§H.9), so two runs for one
 * order never interleave; a fresh code is checked against the unique
 * index before it is written.
 */
export async function issueTickets(req: PayloadRequest, orderId: string): Promise<{ created: number }> {
  const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;
  if (!ISSUABLE.includes(order.status)) {
    throw new Error(`issueTickets: order ${order.reference} is ${order.status}; tickets are issued only for confirmed orders.`);
  }

  const existing = await req.payload.find({
    collection: "tickets",
    where: { order: { equals: order.id } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { lineIndex: true, seatNo: true, session: true, status: true },
    req,
  });
  const have = new Set<string>();
  for (const t of existing.docs) {
    if (t.status === "valid" || t.status === "checked_in") have.add(`${t.lineIndex}:${t.seatNo}:${idOf(t.session)}`);
    else if (t.status === "refunded") have.add(`${t.lineIndex}:${t.seatNo}:*`);
  }
  const sessionIds = [...new Set((order.lines ?? []).map((l) => (l.kind === "session" ? idOf(l.session) : null)).filter((x): x is string => Boolean(x)))];
  const cancelled = sessionIds.length
    ? new Set(
        (
          await req.payload.find({
            collection: "sessions",
            where: { and: [{ id: { in: sessionIds } }, { cancelledAt: { exists: true } }] },
            limit: sessionIds.length,
            depth: 0,
            overrideAccess: true,
            select: { cancelledAt: true },
            req,
          })
        ).docs.map((d) => String(d.id)),
      )
    : new Set<string>();
  const holderName = `${order.contact?.firstName ?? ""} ${order.contact?.lastName ?? ""}`.trim() || undefined;

  let created = 0;
  for (const [lineIndex, line] of (order.lines ?? []).entries()) {
    const sessionId = line.kind === "session" ? idOf(line.session) : null;
    if (!sessionId || cancelled.has(sessionId)) continue;
    for (let seatNo = 1; seatNo <= line.qty; seatNo++) {
      if (have.has(`${lineIndex}:${seatNo}:${sessionId}`) || have.has(`${lineIndex}:${seatNo}:*`)) continue;
      // 40 random bits: a clash is about one in 10¹² per ticket, but a unique-index violation would abort the
      // caller's transaction, so look before writing rather than catching the error and retrying.
      let minted = mintTicket();
      while ((await req.payload.count({ collection: "tickets", where: { code: { equals: minted.code } }, overrideAccess: true, req })).totalDocs > 0) {
        minted = mintTicket();
      }
      await req.payload.create({
        collection: "tickets",
        data: { ...minted, status: "valid", order: order.id, session: sessionId, holderName, lineIndex, seatNo },
        depth: 0,
        overrideAccess: true,
        context: { system: true },
        req,
      });
      created++;
    }
  }
  return { created };
}

// ─── attendee list ───────────────────────────────────────────────────────────

export interface AttendeeRow {
  ticketId: string;
  code: string;
  status: Ticket["status"];
  holder: string;
  orderId: string | null;
  orderReference: string;
  seatNo: number;
  qty: number;
  email: string;
  phone: string;
  notes: string;
  checkedInAt: string | null;
  checkedInByName: string | null;
  forced: boolean;
}

/**
 * Every ticket on a session, booker by booker, for the desk's paper list,
 * the check-in view and the CSV. Staff-only data (phone, email, notes):
 * callers must have checked the role already.
 */
export async function listAttendees(req: PayloadRequest, sessionId: string): Promise<{ session: Session | null; rows: AttendeeRow[] }> {
  const session = (await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 1, overrideAccess: true, req, disableErrors: true })) as Session | null;
  if (!session) return { session: null, rows: [] };
  const tickets = await req.payload.find({
    collection: "tickets",
    where: { session: { equals: sessionId } },
    depth: 1,
    pagination: false,
    overrideAccess: true,
    sort: "createdAt",
    req,
  });
  const rows = (tickets.docs as Ticket[]).map((t): AttendeeRow => {
    const order = t.order && typeof t.order === "object" ? (t.order as Order) : null;
    return {
      ticketId: t.id,
      code: t.code,
      status: t.status,
      holder: holderOf(t, order),
      orderId: order?.id ?? idOf(t.order),
      orderReference: order?.reference ?? "",
      seatNo: t.seatNo,
      qty: order?.lines?.[t.lineIndex]?.qty ?? 1,
      email: order?.contact?.email ?? "",
      phone: order?.contact?.phone ?? "",
      notes: order?.notes ?? "",
      checkedInAt: t.checkedInAt ?? null,
      checkedInByName: userName(t.checkedInBy),
      forced: t.checkInForced === true,
    };
  });
  rows.sort((a, b) => a.holder.localeCompare(b.holder) || a.orderReference.localeCompare(b.orderReference) || a.seatNo - b.seatNo);
  return { session, rows };
}

const csvCell = (value: unknown): string => {
  let s = value == null ? "" : String(value);
  // Spreadsheet formula injection: a cell starting with = + - @ is data, not a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const dubaiDateTime = (iso: string | null): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI_TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso)) : "";

/**
 * The attendee list as CSV (UTF-8 with BOM so Excel reads Arabic names),
 * for `GET /api/actions/sessions/{id}/attendees.csv` (§H.7 — the route
 * itself lives in cms/endpoints/admin-sessions.ts, 3A-1).
 */
export async function attendeesCsv(req: PayloadRequest, sessionId: string): Promise<{ filename: string; body: string } | null> {
  const { session, rows } = await listAttendees(req, sessionId);
  if (!session) return null;
  const header = ["Holder", "Order", "Seat", "Of", "Status", "Checked in (Dubai)", "By", "Forced", "Email", "Phone", "Notes", "Ticket code"];
  const lines = rows.map((r) =>
    [r.holder, r.orderReference, r.seatNo, r.qty, r.status, dubaiDateTime(r.checkedInAt), r.checkedInByName ?? "", r.forced ? "yes" : "", r.email, r.phone, r.notes, r.code]
      .map(csvCell)
      .join(","),
  );
  const slug = (session as { slug?: string | null }).slug || session.id;
  return { filename: `attendees-${slug}.csv`, body: `﻿${[header.join(","), ...lines].join("\r\n")}\r\n` };
}

// ─── the day sheet for /admin/check-in ───────────────────────────────────────

export interface DaySession {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  status: string;
  sold: number;
  checkedIn: number;
  seatsTotal: number;
}

/** A Dubai day's sessions with sold (valid + checked in) and arrived counts. */
export async function sessionsForDay(req: PayloadRequest, date: string): Promise<DaySession[]> {
  const { from, to } = dubaiDayBounds(date);
  const sessions = await req.payload.find({
    collection: "sessions",
    where: { and: [{ startsAt: { greater_than_equal: from } }, { startsAt: { less_than: to } }] },
    sort: "startsAt",
    depth: 1,
    limit: 50,
    overrideAccess: true,
    req,
  });
  return Promise.all(
    (sessions.docs as Session[]).map(async (s) => {
      const [sold, checkedIn] = await Promise.all([
        req.payload.count({ collection: "tickets", where: { and: [{ session: { equals: s.id } }, { status: { in: ["valid", "checked_in"] } }] }, overrideAccess: true, req }),
        req.payload.count({ collection: "tickets", where: { and: [{ session: { equals: s.id } }, { status: { equals: "checked_in" } }] }, overrideAccess: true, req }),
      ]);
      const venue = s.venue && typeof s.venue === "object" ? s.venue.name : "";
      return {
        id: s.id,
        title: sessionTitleOf(s),
        startsAt: s.startsAt,
        venue,
        status: (s as { _status?: string | null })._status ?? "published",
        sold: sold.totalDocs,
        checkedIn: checkedIn.totalDocs,
        seatsTotal: s.seatsTotal,
      };
    }),
  );
}
