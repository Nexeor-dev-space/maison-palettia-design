import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { drizzle } from "@payloadcms/db-postgres/drizzle/node-postgres";
import pg from "pg";
import type { PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { acquireSeats, consumeSeats, refundSeats, releaseSeats, SoldOut } from "../../cms/lib/inventory";
import { nextInvoiceNumber } from "../../cms/lib/invoiceNumber";
import { reservePassSql, reservePromoSql, restorePassSql } from "../../cms/lib/pricing";
import { runSql } from "../../cms/lib/inventory";

/**
 * Commerce SQL against a real Postgres (SPEC §K integration rows):
 *
 *   · two concurrent holds on the LAST seat → exactly one wins, the other
 *     gets SoldOut with the live count; 20 parallel × 9 on 12 seats → one;
 *   · drafts, closed sessions, sales-closed sessions and waitlist-only
 *     sessions without a token can never be acquired;
 *   · invoice numbers stay gapless under 21 concurrent issuers when one of
 *     them rolls back;
 *   · 20 parallel checkouts against a 3-credit pass spend exactly 3; a promo
 *     with maxUses 5 is used exactly 5 times.
 *
 * It runs the REAL statements from cms/lib (acquireSql, nextNumberSql,
 * reservePassSql …) through the same `runSql` → `payload.db.execute` path
 * production uses, with a stand-in `req` whose adapter is a drizzle
 * node-postgres instance — so row locking and the re-evaluated WHERE are
 * Postgres's own, not a mock's.
 *
 * ISOLATION: a throwaway database `maison_test_<random>` is created on the
 * server named by DATABASE_URL (read from the environment, else `.env`),
 * given only the columns the statements touch, and dropped afterwards. The
 * project database is never written. If the server refuses CREATE DATABASE
 * (a non-superuser production role) the suite skips itself.
 */

function databaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = fs.readFileSync(path.resolve(__dirname, "../../.env"), "utf8");
    const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
    return line?.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const url = databaseUrl();
const dbName = `maison_test_${randomBytes(4).toString("hex")}`;
let admin: pg.Pool | undefined;
let pool: pg.Pool | undefined;
let ready = false;

type Drizzle = ReturnType<typeof drizzle>;
let db: Drizzle;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const silent = { warn() {}, info() {}, error() {}, debug() {} };

/** The slice of `req` the commerce SQL path touches, bound to a transaction when given. */
function fakeReq(tx?: unknown): PayloadRequest {
  const sessions: Record<string, { db: unknown }> = {};
  const id = tx ? `tx-${randomBytes(4).toString("hex")}` : undefined;
  if (id) sessions[id] = { db: tx };
  return {
    transactionID: id,
    context: {},
    payload: {
      db: { drizzle: db, sessions, execute: ({ db: d, sql }: { db?: Drizzle; sql: unknown }) => (d ?? db).execute(sql as never) },
      logger: silent,
      config: { jobs: { tasks: [], workflows: [] } },
      findGlobal: async () => ({}),
      jobs: { queue: async () => undefined },
    },
  } as unknown as PayloadRequest;
}

/** Runs `fn` in its own transaction, holding it open for `holdMs` after the work so racers overlap. */
async function inTx<T>(fn: (req: PayloadRequest) => Promise<T>, holdMs = 25): Promise<T> {
  return db.transaction(async (tx) => {
    const out = await fn(fakeReq(tx));
    await sleep(holdMs);
    return out;
  });
}

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await (pool as pg.Pool).query(text, params)).rows as T[];
}

async function newSession(opts: { seats: number; status?: string; booking?: string; startsInMin?: number; closesInMin?: number | null }): Promise<string> {
  const [row] = await q<{ id: string }>(
    `INSERT INTO sessions (_status, booking_status, starts_at, sales_close_at, seats_total, title)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval, CASE WHEN $4::int IS NULL THEN NULL ELSE now() + ($4 || ' minutes')::interval END, $5, 'Test')
     RETURNING id`,
    [opts.status ?? "published", opts.booking ?? "open", String(opts.startsInMin ?? 1440), opts.closesInMin ?? null, opts.seats],
  );
  await q(`INSERT INTO session_inventory (session_id) VALUES ($1)`, [row.id]);
  return row.id;
}

const counters = async (sessionId: string) =>
  (await q<{ sold: string; held: string }>(`SELECT seats_sold AS sold, seats_held AS held FROM session_inventory WHERE session_id = $1`, [sessionId])).map((r) => ({ sold: Number(r.sold), held: Number(r.held) }))[0];

beforeAll(async () => {
  if (!url) return;
  admin = new pg.Pool({ connectionString: url, max: 1 });
  try {
    await admin.query(`CREATE DATABASE ${dbName}`);
  } catch {
    await admin.end();
    admin = undefined;
    return;
  }
  const testUrl = new URL(url);
  testUrl.pathname = `/${dbName}`;
  pool = new pg.Pool({ connectionString: testUrl.toString(), max: 30 });
  db = drizzle(pool);
  await pool.query(`
    CREATE TYPE enum_pass_purchases_status AS ENUM ('active', 'exhausted', 'expired', 'void');
    CREATE TABLE sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), _status varchar, booking_status varchar, starts_at timestamptz,
                           sales_close_at timestamptz, seats_total numeric, title varchar);
    CREATE TABLE session_inventory (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid UNIQUE REFERENCES sessions(id),
                                    seats_sold numeric NOT NULL DEFAULT 0, seats_held numeric NOT NULL DEFAULT 0, updated_at timestamptz DEFAULT now());
    CREATE TABLE waitlist (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid, status varchar);
    CREATE TABLE pass_purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status enum_pass_purchases_status NOT NULL DEFAULT 'active',
                                 sessions_remaining numeric NOT NULL, expires_at timestamptz, exhausted_at timestamptz, updated_at timestamptz DEFAULT now());
    CREATE TABLE promo_codes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), uses numeric NOT NULL DEFAULT 0, max_uses numeric, active boolean DEFAULT true,
                              starts_at timestamptz, ends_at timestamptz, updated_at timestamptz DEFAULT now());
    CREATE TABLE invoice_counters (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind varchar NOT NULL, year numeric NOT NULL, last numeric NOT NULL DEFAULT 0,
                                   created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
    CREATE UNIQUE INDEX kind_year_idx ON invoice_counters (kind, year);
    CREATE TABLE invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number varchar UNIQUE NOT NULL, seq int NOT NULL);
  `);
  ready = true;
}, 120_000);

afterAll(async () => {
  await pool?.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin.end();
  }
});

const maybe = (name: string, fn: () => Promise<void>, timeout = 60_000) =>
  it(name, async (ctx) => {
    if (!ready) ctx.skip();
    await fn();
  }, timeout);

describe("inventory — the guarded UPDATE under concurrency", () => {
  maybe("two concurrent holds on the last seat: exactly one wins", async () => {
    const s = await newSession({ seats: 1 });
    const results = await Promise.allSettled([inTx((req) => acquireSeats(req, s, 1), 80), inTx((req) => acquireSeats(req, s, 1), 80)]);
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(lost[0].reason).toBeInstanceOf(SoldOut);
    expect((lost[0].reason as SoldOut).available).toBe(0);
    expect(await counters(s)).toEqual({ sold: 0, held: 1 });
  });

  maybe("20 parallel baskets of 9 on a 12-seat session: exactly one succeeds", async () => {
    const s = await newSession({ seats: 12 });
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => inTx((req) => acquireSeats(req, s, 9))));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected").every((r) => (r as PromiseRejectedResult).reason instanceof SoldOut)).toBe(true);
    expect(await counters(s)).toEqual({ sold: 0, held: 9 });
  });

  maybe("a rolled-back checkout gives its seats back with the transaction", async () => {
    const s = await newSession({ seats: 2 });
    await expect(
      inTx(async (req) => {
        await acquireSeats(req, s, 2);
        throw new Error("link failed");
      }),
    ).rejects.toThrow("link failed");
    expect(await counters(s)).toEqual({ sold: 0, held: 0 });
  });

  maybe("drafts, closed, sales-closed and waitlist-only sessions cannot be acquired", async () => {
    const draft = await newSession({ seats: 5, status: "draft" });
    const closed = await newSession({ seats: 5, booking: "closed" });
    const salesClosed = await newSession({ seats: 5, closesInMin: -1 });
    const started = await newSession({ seats: 5, startsInMin: -5 });
    const waitlist = await newSession({ seats: 5, booking: "waitlist" });
    for (const id of [draft, closed, salesClosed, started, waitlist]) {
      await expect(inTx((req) => acquireSeats(req, id, 1), 0)).rejects.toBeInstanceOf(SoldOut);
    }
    // …but a live waitlist offer lets that one through.
    await expect(inTx((req) => acquireSeats(req, waitlist, 1, { allowWaitlist: true }), 0)).resolves.toEqual({ remaining: 4 });
  });

  maybe("release, consume and refund move the counters and never go below zero", async () => {
    const s = await newSession({ seats: 10 });
    await inTx((req) => acquireSeats(req, s, 4), 0);
    await inTx((req) => consumeSeats(req, s, 3), 0);
    expect(await counters(s)).toEqual({ sold: 3, held: 1 });
    await inTx((req) => releaseSeats(req, s, 5), 0);
    expect(await counters(s)).toEqual({ sold: 3, held: 0 });
    await inTx((req) => refundSeats(req, s, 7), 0);
    expect(await counters(s)).toEqual({ sold: 0, held: 0 });
  });
});

describe("invoice numbering — gapless", () => {
  maybe("21 concurrent issuers, one rolls back: the committed numbers are exactly 1…20", async () => {
    const year = 2031;
    const runs = Array.from({ length: 21 }, (_, i) =>
      inTx(async (req) => {
        const { seq, number } = await nextInvoiceNumber(req, "invoice", year);
        await runSql(req, (await import("@payloadcms/db-postgres/drizzle")).sql`INSERT INTO invoices (number, seq) VALUES (${number}, ${seq})`);
        if (i === 6) throw new Error("render settings missing");
        return seq;
      }, 10),
    );
    const results = await Promise.allSettled(runs);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const seqs = (await q<{ seq: number }>(`SELECT seq FROM invoices WHERE number LIKE $1 ORDER BY seq`, [`%-${year}-%`])).map((r) => Number(r.seq));
    expect(seqs).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    const [{ last }] = await q<{ last: string }>(`SELECT last FROM invoice_counters WHERE kind = 'invoice' AND year = $1`, [year]);
    expect(Number(last)).toBe(20);
  });

  maybe("credit notes have their own series and the number format is MP-CN-YYYY-000001", async () => {
    const out = await inTx((req) => nextInvoiceNumber(req, "credit_note", 2031), 0);
    expect(out).toEqual({ seq: 1, number: "MP-CN-2031-000001" });
  });
});

describe("pass credits and promo uses — reserved like seats", () => {
  maybe("20 parallel checkouts against a 3-credit pass spend exactly 3 credits; restoring brings it back to active", async () => {
    const [pass] = await q<{ id: string }>(`INSERT INTO pass_purchases (sessions_remaining) VALUES (3) RETURNING id`);
    const results = await Promise.all(Array.from({ length: 20 }, () => inTx(async (req) => (await runSql(req, reservePassSql(pass.id, 1))).length > 0)));
    expect(results.filter(Boolean)).toHaveLength(3);
    let [row] = await q<{ sessions_remaining: string; status: string }>(`SELECT sessions_remaining, status FROM pass_purchases WHERE id = $1`, [pass.id]);
    expect(Number(row.sessions_remaining)).toBe(0);
    expect(row.status).toBe("exhausted");
    await inTx((req) => runSql(req, restorePassSql(pass.id, 2)), 0);
    [row] = await q(`SELECT sessions_remaining, status FROM pass_purchases WHERE id = $1`, [pass.id]);
    expect(Number(row.sessions_remaining)).toBe(2);
    expect(row.status).toBe("active");
  });

  maybe("an expired pass cannot be spent", async () => {
    const [pass] = await q<{ id: string }>(`INSERT INTO pass_purchases (sessions_remaining, expires_at) VALUES (5, now() - interval '1 day') RETURNING id`);
    expect(await inTx(async (req) => (await runSql(req, reservePassSql(pass.id, 1))).length, 0)).toBe(0);
  });

  maybe("a promo with maxUses 5 is used exactly 5 times by 20 racers; outside its window never", async () => {
    const [promo] = await q<{ id: string }>(`INSERT INTO promo_codes (max_uses) VALUES (5) RETURNING id`);
    const results = await Promise.all(Array.from({ length: 20 }, () => inTx(async (req) => (await runSql(req, reservePromoSql(promo.id))).length > 0)));
    expect(results.filter(Boolean)).toHaveLength(5);
    const [late] = await q<{ id: string }>(`INSERT INTO promo_codes (ends_at) VALUES (now() - interval '1 minute') RETURNING id`);
    expect(await inTx(async (req) => (await runSql(req, reservePromoSql(late.id))).length, 0)).toBe(0);
  });
});
