import { sql, type SQL } from "@payloadcms/db-postgres/drizzle";
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest, type RequestContext } from "payload";

import type { JobInputs } from "./contracts";

/**
 * ==========================================================================
 * Inventory — the four guarded UPDATEs on `session_inventory` (SPEC §H.3)
 * ==========================================================================
 *
 * Seats are counted on a `session-inventory` row per session (seats_sold,
 * seats_held), never on the session document an editor saves (§D.2: Payload
 * writes the whole row on every update, so a counter there would be
 * clobbered by any save that raced a checkout). The only writers of those
 * two columns are the four statements below.
 *
 * WHY ONE STATEMENT AND NO LOCKING CODE. `acquireSeats` is a single
 * `UPDATE … FROM sessions … WHERE <room for qty> RETURNING`. Postgres takes
 * a row lock on the inventory row it updates; a second checkout racing for
 * the same session waits on that lock and, when the first commits,
 * RE-EVALUATES its WHERE against the new counters. So the guard "seats_total
 * − sold − held ≥ qty" can never be passed by two transactions that each
 * saw the last seat free — no SELECT … FOR UPDATE, no retry loop, no
 * advisory lock (research 03 §4.2; the race is a vitest integration test).
 * The same WHERE also refuses drafts (`_status`), closed sessions, sessions
 * whose sales have closed, and `waitlist` sessions unless the caller holds a
 * live waitlist token.
 *
 * EVERYTHING RUNS IN THE CALLER'S TRANSACTION. `txDb(req)` resolves the
 * drizzle handle of the transaction Payload attached to `req`, so a checkout
 * that fails after acquiring seats rolls the counters back with the order.
 * `withTransaction` is the small wrapper the commerce modules use to own a
 * transaction when the caller did not open one.
 *
 * SQL is written only with drizzle's `sql` tag (values become bind
 * parameters, never string concatenation) — a hard rule for this phase.
 *
 * This module also carries the plumbing the other commerce modules share
 * (transaction handle, scoped `req.context`, guarded job queueing), because
 * every one of them is "run a few statements inside the caller's
 * transaction" and this file is where that idea lives.
 */

/** Thrown by `acquireSeats`; the checkout turns it into a 409 with the live count. */
export class SoldOut extends Error {
  constructor(
    public sessionId: string,
    public wanted: number,
    public available: number,
  ) {
    super("sold_out");
    this.name = "SoldOut";
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Transaction plumbing                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/** The minimal slice of the postgres adapter this module touches (typed loosely so tests can fake it). */
type Executor = { execute: (query: SQL) => Promise<unknown> };
type AdapterLike = {
  drizzle: Executor;
  sessions?: Record<string, { db: Executor } | undefined>;
  execute: (args: { db?: Executor; drizzle?: Executor; sql: SQL }) => Promise<unknown>;
};

const adapterOf = (req: PayloadRequest): AdapterLike => req.payload.db as unknown as AdapterLike;

/**
 * The drizzle handle for the transaction on `req`, or the pool when there is
 * none. `req.transactionID` may still be a Promise while Payload is opening
 * the transaction (initTransaction stores the promise first), so await it.
 */
export async function txDb(req: PayloadRequest): Promise<Executor> {
  const adapter = adapterOf(req);
  const id = req.transactionID ? await req.transactionID : undefined;
  return (id !== undefined && adapter.sessions?.[String(id)]?.db) || adapter.drizzle;
}

/** Runs one statement inside the request's transaction and returns its rows. */
export async function runSql<Row extends Record<string, unknown> = Record<string, unknown>>(req: PayloadRequest, query: SQL): Promise<Row[]> {
  const result = (await adapterOf(req).execute({ db: await txDb(req), sql: query })) as { rows?: Row[] } | Row[] | undefined;
  if (Array.isArray(result)) return result;
  return result?.rows ?? [];
}

/**
 * Runs `fn` inside a transaction on `req`. If the caller already opened one
 * (a hook, a job step, another commerce function) `fn` simply joins it and
 * the caller decides commit or rollback; otherwise this opens one, commits
 * on success and rolls back on any throw.
 */
export async function withTransaction<T>(req: PayloadRequest, fn: () => Promise<T>): Promise<T> {
  const owner = await initTransaction(req);
  try {
    const result = await fn();
    if (owner) await commitTransaction(req);
    return result;
  } catch (error) {
    if (owner) await killTransaction(req);
    throw error;
  }
}

/**
 * Runs a Local API call with extra `req.context` flags and puts the context
 * back afterwards. Payload's Local API REPLACES `req.context` with the merge
 * of the old one and the call's `context` (utilities/createLocalReq.js), so
 * without this a single `orderTransition: true` would leak into every later
 * write on the same request.
 */
export async function withContext<T>(req: PayloadRequest, extra: RequestContext, run: (context: RequestContext) => Promise<T>): Promise<T> {
  const saved = req.context;
  try {
    return await run({ ...(saved ?? {}), ...extra });
  } finally {
    req.context = saved;
  }
}

/**
 * Queues a background task or workflow if this build registers it, and
 * reports whether it did. `payload-jobs.task_slug` / `workflow_slug` are
 * Postgres ENUMs of the registered slugs, so queueing a slug 3D has not
 * landed yet would be an enum violation that aborts the caller's whole
 * transaction (a checkout failing because a reminder task is missing). The
 * check makes the commerce code safe to run before, during and after 3D.
 */
export async function queueJob<K extends keyof JobInputs>(
  req: PayloadRequest,
  slug: K,
  input: JobInputs[K],
  opts: { workflow?: boolean; queue?: string } = {},
): Promise<boolean> {
  const jobs = req.payload.config.jobs as { tasks?: Array<{ slug: string }>; workflows?: Array<{ slug: string }> } | undefined;
  const registered = (opts.workflow ? jobs?.workflows : jobs?.tasks)?.some((entry) => entry.slug === slug) ?? false;
  if (!registered) {
    req.payload.logger.warn(`commerce: ${opts.workflow ? "workflow" : "task"} "${slug}" is not registered yet; not queued`);
    return false;
  }
  const queue = req.payload.jobs.queue as unknown as (args: Record<string, unknown>) => Promise<unknown>;
  await queue({ ...(opts.workflow ? { workflow: slug } : { task: slug }), input, req, ...(opts.queue ? { queue: opts.queue } : {}) });
  return true;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The four statements (exported for the integration test)                    */
/* ────────────────────────────────────────────────────────────────────────── */

const positiveInt = (qty: number, label = "qty"): number => {
  if (!Number.isInteger(qty) || qty < 1 || qty > 1000) throw new RangeError(`${label} must be a whole number of seats, got ${String(qty)}`);
  return qty;
};

/**
 * SPEC §H.3 verbatim. `seats_total` and the counters are `numeric` columns
 * (Payload's number type), so `remaining` comes back as a string and is
 * converted by the caller.
 */
export const acquireSql = (sessionId: string, qty: number, allowWaitlist: boolean): SQL => sql`
  UPDATE session_inventory i
     SET seats_held = i.seats_held + ${qty}, updated_at = now()
    FROM sessions s
   WHERE i.session_id = s.id AND s.id = ${sessionId}
     AND s._status = 'published'
     AND (s.booking_status = 'open' OR (s.booking_status = 'waitlist' AND ${allowWaitlist}::boolean))
     AND coalesce(s.sales_close_at, s.starts_at) > now()
     AND s.seats_total - i.seats_sold - i.seats_held >= ${qty}
  RETURNING s.seats_total - i.seats_sold - i.seats_held AS remaining`;

/** Why an acquire failed, for the 409 body: the live count (0 for a session that cannot be booked at all). */
export const availableSql = (sessionId: string): SQL => sql`
  SELECT greatest(0, s.seats_total - i.seats_sold - i.seats_held) AS available
    FROM session_inventory i JOIN sessions s ON s.id = i.session_id
   WHERE s.id = ${sessionId}`;

export const releaseSql = (sessionId: string, qty: number): SQL => sql`
  UPDATE session_inventory i
     SET seats_held = greatest(0, i.seats_held - ${qty}), updated_at = now()
    FROM sessions s
   WHERE i.session_id = s.id AND i.session_id = ${sessionId}
  RETURNING s.seats_total - i.seats_sold - i.seats_held AS remaining, s.booking_status AS booking_status`;

export const consumeSql = (sessionId: string, qty: number): SQL => sql`
  UPDATE session_inventory i
     SET seats_held = greatest(0, i.seats_held - ${qty}), seats_sold = i.seats_sold + ${qty}, updated_at = now()
    FROM sessions s
   WHERE i.session_id = s.id AND i.session_id = ${sessionId}
  RETURNING s.seats_total - i.seats_sold - i.seats_held AS remaining, s.seats_total AS seats_total, s.title AS title, s.starts_at AS starts_at`;

export const refundSql = (sessionId: string, qty: number): SQL => sql`
  UPDATE session_inventory i
     SET seats_sold = greatest(0, i.seats_sold - ${qty}), updated_at = now()
    FROM sessions s
   WHERE i.session_id = s.id AND i.session_id = ${sessionId}
  RETURNING s.seats_total - i.seats_sold - i.seats_held AS remaining, s.booking_status AS booking_status`;

const num = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Public API (re-exported from cms/lib/contracts.ts)                          */
/* ────────────────────────────────────────────────────────────────────────── */

/** seats_held += qty where the session is published, open (or waitlist when allowed), on sale and has room; throws SoldOut. */
export async function acquireSeats(req: PayloadRequest, sessionId: string, qty: number, opts?: { allowWaitlist?: boolean }): Promise<{ remaining: number }> {
  positiveInt(qty);
  const rows = await runSql(req, acquireSql(sessionId, qty, opts?.allowWaitlist === true));
  if (rows.length === 0) {
    const live = await runSql(req, availableSql(sessionId));
    throw new SoldOut(sessionId, qty, Math.max(0, num(live[0]?.available)));
  }
  return { remaining: num(rows[0].remaining) };
}

/** seats_held = greatest(0, seats_held − qty); queues `waitlist-notify` when the session was full or waitlist-only. */
export async function releaseSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void> {
  positiveInt(qty);
  const rows = await runSql(req, releaseSql(sessionId, qty));
  await maybeNotifyWaitlist(req, sessionId, qty, rows[0]);
}

/** held → sold on capture (or directly for desk / pass-only orders); low-seats check runs here. */
export async function consumeSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void> {
  positiveInt(qty);
  const rows = await runSql(req, consumeSql(sessionId, qty));
  const row = rows[0];
  if (!row) return;
  const remaining = num(row.remaining);
  const threshold = await lowSeatThreshold(req);
  // Fire once, on the sale that CROSSES the threshold — not on every later sale.
  if (threshold > 0 && remaining <= threshold && remaining + qty > threshold) {
    await queueJob(req, "notify-staff", {
      event: "low_seats",
      vars: { sessionTitle: String(row.title ?? ""), startsAt: row.starts_at ? new Date(String(row.starts_at)).toISOString() : "", seatsLeft: remaining, seatsTotal: num(row.seats_total), threshold },
      refs: { session: sessionId },
    });
  }
}

/** seats_sold = greatest(0, seats_sold − qty) after a refund, cancel or move; queues `waitlist-notify` likewise. */
export async function refundSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void> {
  positiveInt(qty);
  const rows = await runSql(req, refundSql(sessionId, qty));
  await maybeNotifyWaitlist(req, sessionId, qty, rows[0]);
}

/**
 * After seats come back: if the session was full (the freed seats are all
 * there is) or is waitlist-only, and somebody is actually waiting, queue
 * the FIFO notifier. Seats are not reserved for them (§H.11).
 */
async function maybeNotifyWaitlist(req: PayloadRequest, sessionId: string, freed: number, row: Record<string, unknown> | undefined): Promise<void> {
  if (!row) return;
  const remaining = num(row.remaining);
  const wasFull = remaining <= freed;
  if (!wasFull && row.booking_status !== "waitlist") return;
  const waiting = await runSql(req, sql`SELECT 1 AS one FROM waitlist WHERE session_id = ${sessionId} AND status = 'waiting' LIMIT 1`);
  if (waiting.length === 0) return;
  await queueJob(req, "waitlist-notify", { sessionId, freedSeats: freed });
}

/** notification-settings.lowSeatsOverride, else booking-settings.lowSeatThreshold, else 4. */
async function lowSeatThreshold(req: PayloadRequest): Promise<number> {
  try {
    const [notify, booking] = await Promise.all([
      req.payload.findGlobal({ slug: "notification-settings", depth: 0, overrideAccess: true, req }) as Promise<{ lowSeatsOverride?: number | null }>,
      req.payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, req }) as Promise<{ lowSeatThreshold?: number | null }>,
    ]);
    return num(notify?.lowSeatsOverride) || num(booking?.lowSeatThreshold) || 4;
  } catch {
    return 4;
  }
}

/**
 * Runs a side effect that must never undo the work before it — an email, a
 * staff alert — and logs instead of throwing. Call it AFTER the transaction
 * that did the work has committed: inside a Postgres transaction a failed
 * statement aborts everything after it, so "best effort" there would not be.
 * Until 3C lands, `sendTemplated` / `notifyStaff` reject with NotImplemented
 * and this is what keeps a refund or a move from failing on a missing email.
 */
export async function bestEffort(req: PayloadRequest, label: string, run: () => Promise<unknown>): Promise<boolean> {
  try {
    await run();
    return true;
  } catch (error) {
    req.payload.logger.warn({ err: error instanceof Error ? { name: error.name, message: error.message } : String(error) }, `commerce: ${label} failed`);
    return false;
  }
}
