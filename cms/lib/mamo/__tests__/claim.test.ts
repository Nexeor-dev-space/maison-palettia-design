import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

import { PgDialect } from "drizzle-orm/pg-core";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { claimStatement, reclaimById, releaseClaim, type ClaimRow } from "../claim";

/**
 * The webhook claim (SPEC §H.5 step 4) run for real against Postgres —
 * the statement's guarantees live in `ON CONFLICT … DO UPDATE … WHERE`
 * under the row lock, which no mock can prove.
 *
 * ISOLATION. The `.env` database is the owner's (DECISIONS.md #1), so this
 * suite never touches it: it creates a throwaway database next to it
 * (`mp_claim_test_<random>`), builds a `payment_events` table with the
 * columns the statement writes and the same UNIQUE index on `dedupe_key`
 * that Payload generates for the field, and drops the database afterwards.
 * It skips itself when there is no DATABASE_URL or the server refuses
 * CREATE DATABASE.
 *
 * The exact SQL the receiver runs is compiled from `claimStatement` with
 * drizzle's Postgres dialect — the same compilation the adapter does — so
 * what is tested is what ships.
 */

function databaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
    return line ? line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const dialect = new PgDialect();
const baseUrl = databaseUrl();
const dbName = `mp_claim_test_${randomBytes(4).toString("hex")}`;
let admin: pg.Client | null = null;
let testUrl = "";
let available = false;
const pools: pg.Pool[] = [];

function pool(): pg.Pool {
  const p = new pg.Pool({ connectionString: testUrl, max: 12 });
  // Teardown's DROP … WITH (FORCE) terminates idle clients; without a listener
  // pg rethrows that as an uncaught error whose dump includes the client's
  // connection settings — database password included. Swallow it, print nothing.
  p.on("error", () => undefined);
  pools.push(p);
  return p;
}

async function run(p: pg.Pool | pg.PoolClient, query: ReturnType<typeof claimStatement>) {
  const { sql, params } = dialect.sqlToQuery(query);
  return p.query(sql, params as unknown[]);
}

/** A stand-in for `payload.db.drizzle` that routes through the test pool. */
function fakePayload(p: pg.Pool): Payload {
  return { db: { drizzle: { execute: (q: ReturnType<typeof claimStatement>) => run(p, q) } } } as unknown as Payload;
}

const row = (dedupeKey: string): ClaimRow => ({
  dedupeKey,
  eventType: "payment.succeeded",
  mode: "test",
  providerPaymentId: "MPB-CHRG-TEST",
  providerLinkId: "MB-LINK-TEST",
  headers: { authorization: "[redacted]" },
  payload: { id: "MPB-CHRG-TEST", event_type: "payment.succeeded", status: "captured" },
  ipHash: "abc",
});

beforeAll(async () => {
  if (!baseUrl) return;
  try {
    admin = new pg.Client({ connectionString: baseUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(baseUrl);
    url.pathname = `/${dbName}`;
    testUrl = url.toString();
    const setup = new pg.Client({ connectionString: testUrl });
    await setup.connect();
    await setup.query(`
      CREATE TABLE payment_events (
        id uuid PRIMARY KEY,
        provider varchar,
        event_type varchar,
        verified boolean,
        needs_review boolean,
        provider_payment_id varchar,
        provider_link_id varchar,
        dedupe_key varchar NOT NULL,
        headers jsonb,
        payload jsonb,
        ip_hash varchar,
        mode varchar,
        error varchar,
        received_at timestamptz,
        processing_started_at timestamptz,
        processed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX payment_events_dedupe_key_idx ON payment_events (dedupe_key);
    `);
    await setup.end();
    available = true;
  } catch (error) {
    console.warn(`[claim.test] skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
});

afterAll(async () => {
  await Promise.all(pools.map((p) => p.end().catch(() => undefined)));
  if (admin) {
    if (available) await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
});

describe("payment-events claim", () => {
  it("first delivery inserts and is ours; an immediate duplicate is refused", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const first = await run(p, claimStatement(row("k1")));
    expect(first.rows).toHaveLength(1);
    expect(first.rows[0].inserted).toBe(true);

    const again = await run(p, claimStatement(row("k1")));
    expect(again.rows).toHaveLength(0); // being processed right now → "duplicate"
  });

  it("a processed row is never claimed again", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const first = await run(p, claimStatement(row("k2")));
    await p.query("UPDATE payment_events SET processed_at = now() WHERE id = $1", [first.rows[0].id]);
    expect((await run(p, claimStatement(row("k2")))).rows).toHaveLength(0);
    // …not even after the stale window.
    await p.query("UPDATE payment_events SET processing_started_at = now() - interval '10 minutes' WHERE id = $1", [first.rows[0].id]);
    expect((await run(p, claimStatement(row("k2")))).rows).toHaveLength(0);
    expect(await reclaimById(fakePayload(p), first.rows[0].id)).toBe(false);
  });

  it("an attempt that died mid-way is re-claimable after 2 minutes, not before", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const first = await run(p, claimStatement(row("k3")));
    const id = first.rows[0].id;
    await p.query("UPDATE payment_events SET processing_started_at = now() - interval '90 seconds' WHERE id = $1", [id]);
    expect((await run(p, claimStatement(row("k3")))).rows).toHaveLength(0);
    await p.query("UPDATE payment_events SET processing_started_at = now() - interval '3 minutes' WHERE id = $1", [id]);
    const retry = await run(p, claimStatement(row("k3")));
    expect(retry.rows).toHaveLength(1);
    expect(retry.rows[0].id).toBe(id);
    expect(retry.rows[0].inserted).toBe(false); // re-claim of the same row, not a second row
    const count = await p.query("SELECT count(*)::int AS n FROM payment_events WHERE dedupe_key = 'k3'");
    expect(count.rows[0].n).toBe(1);
  });

  it("a failure we caught releases the claim so the very next retry wins", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const first = await run(p, claimStatement(row("k4")));
    const id = first.rows[0].id;
    await releaseClaim(fakePayload(p), id, "MamoApiError: Mamo Pay did not answer within 15 seconds.");
    const stored = await p.query("SELECT error, processing_started_at, processed_at FROM payment_events WHERE id = $1", [id]);
    expect(stored.rows[0].error).toMatch(/did not answer/);
    expect(stored.rows[0].processing_started_at).toBeNull();
    expect(stored.rows[0].processed_at).toBeNull();

    const retry = await run(p, claimStatement(row("k4")));
    expect(retry.rows.map((r) => r.id)).toEqual([id]);
    // The sweep's re-claim respects a claim in progress.
    expect(await reclaimById(fakePayload(p), id)).toBe(false);
  });

  it("twenty concurrent deliveries of one event: exactly one is processed", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const results = await Promise.all(Array.from({ length: 20 }, () => run(p, claimStatement(row("k5")))));
    expect(results.filter((r) => r.rows.length === 1)).toHaveLength(1);
    const count = await p.query("SELECT count(*)::int AS n FROM payment_events WHERE dedupe_key = 'k5'");
    expect(count.rows[0].n).toBe(1);
  });

  it("twenty concurrent retries of a stale claim: exactly one re-claims", async (ctx) => {
    if (!available) return ctx.skip();
    const p = pool();
    const first = await run(p, claimStatement(row("k6")));
    await p.query("UPDATE payment_events SET processing_started_at = now() - interval '5 minutes' WHERE id = $1", [first.rows[0].id]);
    const results = await Promise.all(Array.from({ length: 20 }, () => run(p, claimStatement(row("k6")))));
    expect(results.filter((r) => r.rows.length === 1)).toHaveLength(1);
  });

  it("binds every value as a parameter (no string-built SQL)", () => {
    const { sql, params } = dialect.sqlToQuery(claimStatement(row("O'Brien'); DROP TABLE x; --")));
    expect(sql).not.toContain("O'Brien");
    expect(params).toContain("O'Brien'); DROP TABLE x; --");
  });
});
