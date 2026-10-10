import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import pg from "pg";

import { BASE_URL, projectEnv, REPO, type E2EAdmin } from "./env";

/**
 * ==========================================================================
 * The e2e suite's hands on the owner's database — setup and EXACT cleanup
 * ==========================================================================
 *
 * The dev server on 3200 serves the owner's database (DECISIONS.md #1), so
 * whatever a spec creates there it deletes again, by id, in a `finally`.
 * Every foreign key into the commerce tables is ON DELETE SET NULL or
 * CASCADE (checked against the schema), so rows can be removed child-first
 * without constraint juggling. Nothing here deletes by pattern except the
 * job rows, which are matched on the exact ids a spec created, and the
 * sweep of day-old `e2e-admin-…@example.test` accounts a killed run left.
 *
 * Two settings are flipped by SQL rather than through the admin, each put
 * back afterwards:
 *   · `booking_settings.bookings_open` — the admin's switch-on refuses
 *     until a real mailer is verified and a Mamo webhook registered (SPEC
 *     §M step 9), which a test cannot do; the integration suite covers that
 *     the switch gates checkout.
 * A SQL write skips Payload's hooks, so the cached pages are purged through
 * the same signed loopback route the server uses for scheduled publishing
 * (`POST /api/site/revalidate`, SPEC §G.4), signed with the project secret.
 */

let pool: pg.Pool | undefined;

function db(): pg.Pool {
  const url = projectEnv("DATABASE_URL");
  if (!url) throw new Error("e2e: DATABASE_URL is not set and .env has none — cannot clean up, refusing to run");
  pool ??= new pg.Pool({ connectionString: url, max: 3 });
  return pool;
}

export async function q<T extends pg.QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await db().query<T>(text, params)).rows;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** POST /api/site/revalidate with the `revalidate-v1` bearer the server's own hooks use. */
export async function revalidate(body: { tags?: string[]; paths?: string[]; layout?: boolean }): Promise<number> {
  process.env.PAYLOAD_SECRET ??= projectEnv("PAYLOAD_SECRET");
  const { sha256Hex } = await import("../../cms/lib/crypto");
  const { sign } = await import("../../cms/lib/signing");
  const json = JSON.stringify({ tags: body.tags ?? [], paths: body.paths ?? [], layout: body.layout ?? false });
  const unix = Math.floor(Date.now() / 1000);
  const hash = sha256Hex(json);
  const response = await fetch(`${BASE_URL}/api/site/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${unix}.${hash}.${sign("revalidate-v1", `${unix}.${hash}`)}` },
    body: json,
  });
  return response.status;
}

/** Sets the online-bookings switch and purges what reads it; returns the previous value. */
export async function setBookingsOpen(open: boolean): Promise<boolean> {
  const [row] = await q<{ bookings_open: boolean }>(`SELECT bookings_open FROM booking_settings LIMIT 1`);
  await q(`UPDATE booking_settings SET bookings_open = $1`, [open]);
  const status = await revalidate({ tags: ["global:booking-settings"], layout: true });
  if (status !== 200) throw new Error(`e2e: revalidate after the booking switch answered ${status}`);
  return Boolean(row?.bookings_open);
}

/** Payment mode, read only: the booking spec needs the mock gateway and skips otherwise. */
export async function paymentMode(): Promise<string | undefined> {
  return (await q<{ mode: string }>(`SELECT mode FROM payment_settings LIMIT 1`))[0]?.mode;
}

const INVOICE_DIR = path.join(REPO, "private", "invoices");

/**
 * Removes an order and everything it produced: tickets, refunds, invoices
 * (and their PDFs on disk), payments, payment events, seat holds,
 * notification-log rows, queued/finished job rows, then the order and —
 * when it has no other orders — its customer. Puts the invoice counters
 * back when this order's numbers are still the latest issued.
 */
export async function purgeOrder(orderId: string): Promise<void> {
  const [order] = await q<{ id: string; customer_id: string | null; payment_id: string | null }>(`SELECT id, customer_id, payment_id FROM orders WHERE id = $1`, [orderId]);
  if (!order) return;

  const invoices = await q<{ id: string; kind: string; year: number; sequence: number; number: string }>(
    `SELECT id, kind, year, sequence, number FROM invoices WHERE order_id = $1`,
    [orderId],
  );
  const files = await q<{ id: string; filename: string | null }>(
    `SELECT id, filename FROM invoice_files WHERE invoice_id = ANY($1::uuid[])`,
    [invoices.map((i) => i.id)],
  );
  const tickets = (await q<{ id: string }>(`SELECT id FROM tickets WHERE order_id = $1`, [orderId])).map((t) => t.id);
  const refunds = (await q<{ id: string }>(`SELECT id FROM refunds WHERE order_id = $1`, [orderId])).map((r) => r.id);
  const payments = (await q<{ id: string; provider_link_id: string | null }>(`SELECT id, provider_link_id FROM payments WHERE order_id = $1`, [orderId]));

  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM notification_log WHERE order_id = $1 OR ticket_id = ANY($2::uuid[]) OR refund_id = ANY($3::uuid[])`, [orderId, tickets, refunds]);
    await client.query(`DELETE FROM tickets WHERE order_id = $1`, [orderId]);
    await client.query(`DELETE FROM refunds WHERE order_id = $1`, [orderId]);
    await client.query(`DELETE FROM invoice_files WHERE id = ANY($1::uuid[])`, [files.map((f) => f.id)]);
    await client.query(`DELETE FROM invoices WHERE order_id = $1`, [orderId]);
    await client.query(
      `DELETE FROM payment_events WHERE order_id = $1 OR (provider_link_id IS NOT NULL AND provider_link_id = ANY($2::text[]))`,
      [orderId, payments.map((p) => p.provider_link_id).filter(Boolean)],
    );
    await client.query(`DELETE FROM seat_holds WHERE order_id = $1`, [orderId]);
    await client.query(`DELETE FROM payments WHERE order_id = $1`, [orderId]);
    await client.query(`DELETE FROM payload_jobs WHERE input::text LIKE '%' || $1 || '%'`, [orderId]);
    await client.query(`DELETE FROM orders WHERE id = $1`, [orderId]);
    if (order.customer_id) {
      await client.query(`DELETE FROM customers WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = $1)`, [order.customer_id]);
      await client.query(`DELETE FROM payload_jobs WHERE input::text LIKE '%' || $1 || '%'`, [order.customer_id]);
    }
    // Gapless numbering: hand the numbers back only if nothing was issued after them.
    for (const invoice of invoices) {
      await client.query(`UPDATE invoice_counters SET last = last - 1, updated_at = now() WHERE kind = $1 AND year = $2 AND last = $3`, [
        invoice.kind,
        invoice.year,
        invoice.sequence,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  for (const file of files) {
    if (file.filename) fs.rmSync(path.join(INVOICE_DIR, path.basename(file.filename)), { force: true });
  }
}

/** Orders that booked a session (to purge before the session itself). */
export async function ordersForSession(sessionId: string): Promise<string[]> {
  return (await q<{ id: string }>(`SELECT DISTINCT _parent_id AS id FROM orders_lines WHERE session_id = $1`, [sessionId])).map((r) => r.id);
}

/** Removes a session the spec created, its versions and counters, and purges the pages that listed it. */
export async function purgeSession(sessionId: string, paths: string[] = []): Promise<void> {
  for (const orderId of await ordersForSession(sessionId)) await purgeOrder(orderId);
  const [row] = await q<{ slug: string | null }>(`SELECT slug FROM sessions WHERE id = $1`, [sessionId]);
  await q(`DELETE FROM notification_log WHERE session_id = $1`, [sessionId]);
  await q(`DELETE FROM seat_holds WHERE session_id = $1`, [sessionId]);
  await q(`DELETE FROM payload_jobs WHERE input::text LIKE '%' || $1 || '%'`, [sessionId]);
  await q(`DELETE FROM session_inventory WHERE session_id = $1`, [sessionId]);
  await q(`DELETE FROM _sessions_v WHERE parent_id = $1`, [sessionId]);
  await q(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
  const slug = row?.slug;
  await revalidate({
    tags: ["collection:sessions"],
    paths: ["/", "/events", ...(slug ? [`/events/${slug}`, `/events/${slug}/book`] : []), ...paths],
  });
}

/** Removes an enquiry and what it triggered (auto-reply / staff alert log rows, their jobs). */
export async function purgeEnquiry(enquiryId: string): Promise<void> {
  await q(`DELETE FROM notification_log WHERE enquiry_id = $1`, [enquiryId]);
  await q(`DELETE FROM payload_jobs WHERE input::text LIKE '%' || $1 || '%'`, [enquiryId]);
  await q(`DELETE FROM enquiries WHERE id = $1`, [enquiryId]);
}

// ─── the run's throwaway admin ───────────────────────────────────────────────

/**
 * Payload's current password format (payload/dist/auth/strategies/local/
 * generatePasswordSaltHash.js in 3.90): a 32-byte hex salt and
 * `pbkdf2-sha256-v1:` + PBKDF2-SHA256, 600 000 rounds, 32-byte key, hex.
 * The account is inserted by SQL so that no hook runs (no invite email, no
 * audit row) and so the owner's own login is never needed. If a Payload
 * upgrade changes the format, globalSetup's REST login fails at once with a
 * message pointing here — never a silently half-signed-in suite.
 */
function payloadPasswordHash(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString("hex");
  const key = crypto.pbkdf2Sync(password, salt, 600_000, 32, "sha256").toString("hex");
  return { salt, hash: `pbkdf2-sha256-v1:${key}` };
}

const E2E_ADMIN_EMAIL = /^e2e-admin-[a-z0-9-]+@example\.test$/;

/** Creates an active admin no person knows the password of, for this run only. */
export async function createE2EAdmin(run: string): Promise<E2EAdmin> {
  const email = `e2e-admin-${run}@example.test`;
  const password = crypto.randomBytes(24).toString("base64url");
  const { salt, hash } = payloadPasswordHash(password);
  const [row] = await q<{ id: string }>(
    `INSERT INTO users (name, role, active, email, salt, hash, login_attempts)
     VALUES ('E2E admin (deleted after the test run)', 'admin', true, $1, $2, $3, 0) RETURNING id`,
    [email, salt, hash],
  );
  return { id: row.id, email, password };
}

/**
 * Deletes one throwaway admin and what the admin UI wrote for it: its saved
 * list/nav preferences and any document locks it held. The `_rels` rows go
 * with the user (ON DELETE CASCADE); their parent rows are removed first,
 * by the user's id. Rows the specs created that point at the user (an
 * enquiry it was assigned, a ticket it checked in) are deleted by the specs
 * themselves; any other such link is ON DELETE SET NULL.
 */
export async function deleteE2EAdmin(id: string): Promise<void> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM payload_preferences WHERE id IN (SELECT parent_id FROM payload_preferences_rels WHERE users_id = $1)`, [id]);
    await client.query(`DELETE FROM payload_locked_documents WHERE id IN (SELECT parent_id FROM payload_locked_documents_rels WHERE users_id = $1)`, [id]);
    // The email check is a guard: this function never deletes a real person.
    await client.query(`DELETE FROM users WHERE id = $1 AND email LIKE 'e2e-admin-%@example.test'`, [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Throwaway admins a crashed run never deleted (the process was killed
 * before teardown). Only accounts older than a day are swept, so a run in
 * progress elsewhere is never touched; an unknown-password admin is a
 * liability, not history, so it does not wait for anyone to notice it.
 */
export async function sweepStaleE2EAdmins(): Promise<number> {
  const stale = await q<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email LIKE 'e2e-admin-%@example.test' AND created_at < now() - interval '1 day'`,
  );
  for (const user of stale.filter((u) => E2E_ADMIN_EMAIL.test(u.email))) await deleteE2EAdmin(user.id);
  return stale.length;
}
