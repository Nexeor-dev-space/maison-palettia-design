import { randomUUID } from "node:crypto";

import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { CLAIM_STALE_AFTER } from "./verify";

/**
 * ==========================================================================
 * The claim — webhook idempotency that survives our own failures
 * ==========================================================================
 *
 * SPEC §H.5 step 4. A webhook can arrive twice (Mamo retries, or two
 * deliveries of the same event race each other), and processing one twice
 * would at best send two confirmation emails and at worst consume seats
 * twice. The naive guard — "insert the event if new, else skip" — has a
 * hole the SPEC calls out (§N): if our first attempt fails half-way (Mamo
 * timed out on the verify-by-fetch, the database blipped), the row exists
 * and every retry is skipped, so a paid order stays unpaid.
 *
 * So the row is CLAIMED, in one statement, keyed on `dedupe_key`:
 *
 *   · no row yet                                  → INSERT, ours to process
 *   · a row that was processed                    → nothing returned: "duplicate"
 *   · a row being processed right now             → nothing returned: "duplicate"
 *   · a row whose processing started > 2 min ago
 *     and never finished (the process died)       → re-claimed, ours to process
 *
 * Postgres evaluates `ON CONFLICT … DO UPDATE … WHERE` under the row lock,
 * so two concurrent deliveries can never both get a row back. When an
 * attempt fails in a way we CATCH, `releaseClaim` clears
 * `processing_started_at` as well as recording the error, so the very next
 * retry re-claims at once instead of waiting out the two minutes — the
 * two-minute rule is only for attempts that never got to say they failed.
 *
 * Written with the drizzle `sql` tag (every value a bound parameter) and
 * executed on the adapter's drizzle instance. Column names are Payload's
 * snake_case of the `payment-events` fields (cms/collections/commerce/
 * PaymentEvents.ts); `headerNames` is a hasMany text field, which Postgres
 * stores in a side table, so it is written afterwards through the Local
 * API (`finishClaimedInsert`).
 */

export interface ClaimRow {
  dedupeKey: string;
  eventType: string;
  mode: "test" | "live" | "mock";
  providerPaymentId?: string | null;
  providerLinkId?: string | null;
  headers: Record<string, string>;
  payload: unknown;
  ipHash: string;
}

/** The statement on its own, so the unit test can run exactly this SQL against a scratch table. */
export function claimStatement(row: ClaimRow, id: string = randomUUID()) {
  return sql`
    INSERT INTO payment_events (
      id, provider, event_type, verified, needs_review, provider_payment_id, provider_link_id,
      dedupe_key, headers, payload, ip_hash, mode, received_at, processing_started_at, updated_at, created_at
    ) VALUES (
      ${id}, 'mamo', ${row.eventType}, true, false, ${row.providerPaymentId ?? null}, ${row.providerLinkId ?? null},
      ${row.dedupeKey}, ${JSON.stringify(row.headers)}::jsonb, ${JSON.stringify(row.payload)}::jsonb, ${row.ipHash},
      ${row.mode}, now(), now(), now(), now()
    )
    ON CONFLICT (dedupe_key) DO UPDATE
      SET processing_started_at = now(), updated_at = now()
      WHERE payment_events.processed_at IS NULL
        AND (payment_events.processing_started_at IS NULL
             OR payment_events.processing_started_at < now() - ${CLAIM_STALE_AFTER}::interval)
    RETURNING id, (xmax = 0) AS inserted
  `;
}

type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Array<Record<string, unknown>> }> };

/** The adapter's drizzle instance, typed only as far as this module needs. */
export function drizzleOf(payload: Payload): Executor {
  return (payload.db as unknown as { drizzle: Executor }).drizzle;
}

/**
 * Runs the claim. Returns the row id when this delivery is ours to process
 * (`inserted` says whether it is new or a re-claim), or null for a
 * duplicate. Outside any request transaction on purpose: the claim must be
 * visible to a concurrent delivery the moment it is made.
 */
export async function claimEvent(payload: Payload, row: ClaimRow): Promise<{ id: string; inserted: boolean } | null> {
  const result = await drizzleOf(payload).execute(claimStatement(row));
  const first = result.rows[0];
  if (!first) return null;
  return { id: String(first.id), inserted: first.inserted === true };
}

/**
 * After a fresh INSERT: the header NAMES (a side table, so not part of the
 * statement above). A re-claim keeps the names the first delivery recorded.
 */
export async function finishClaimedInsert(payload: Payload, id: string, headerNames: string[]): Promise<void> {
  await payload.update({
    collection: "payment-events",
    id,
    data: { headerNames },
    depth: 0,
    overrideAccess: true,
    context: { skipRevalidate: true },
  });
}

/** Processing succeeded (or concluded there was nothing to do): close the row. */
export async function completeEvent(
  payload: Payload,
  id: string,
  fields: { order?: string | null; needsReview?: boolean; note?: string | null } = {},
): Promise<void> {
  await payload.update({
    collection: "payment-events",
    id,
    data: {
      processedAt: new Date().toISOString(),
      error: fields.note ?? null,
      ...(fields.order !== undefined ? { order: fields.order } : {}),
      ...(fields.needsReview !== undefined ? { needsReview: fields.needsReview } : {}),
    },
    depth: 0,
    overrideAccess: true,
    context: { skipRevalidate: true },
  });
}

/**
 * Our own failure: record why, leave `processed_at` NULL and release the
 * claim so Mamo's next retry (or `reconcile-payments` after 5 minutes)
 * picks it up. The message is the error's message only — `MamoApiError`
 * messages never carry request details, and a database error message
 * carries no secrets of ours.
 */
export async function releaseClaim(payload: Payload, id: string, message: string): Promise<void> {
  await drizzleOf(payload).execute(sql`
    UPDATE payment_events
       SET error = ${message.slice(0, 2000)}, processing_started_at = NULL, updated_at = now()
     WHERE id = ${id} AND processed_at IS NULL
  `);
}

/**
 * Re-claim an open row by id, for the `reconcile-payments` sweep (§H.6:
 * "payment-events with processed_at IS NULL AND received_at < now() − 5 min
 * → re-run steps 6–8"). Same rule as the webhook's claim: a row someone is
 * processing right now is left alone.
 */
export async function reclaimById(payload: Payload, id: string): Promise<boolean> {
  const result = await drizzleOf(payload).execute(sql`
    UPDATE payment_events
       SET processing_started_at = now(), updated_at = now()
     WHERE id = ${id}
       AND verified = true
       AND processed_at IS NULL
       AND (processing_started_at IS NULL OR processing_started_at < now() - ${CLAIM_STALE_AFTER}::interval)
    RETURNING id
  `);
  return result.rows.length > 0;
}
