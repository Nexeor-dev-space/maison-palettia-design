import path from "node:path";

import { getTableColumns } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

import { bootStatus, isSealed } from "@/cms/lib/crypto";
import { assertOutsideBuildOutput } from "@/cms/lib/paths";
import { envPublicUrl, hasGlobal } from "@/cms/lib/publicUrl";
import { seedEmailTemplates } from "@/cms/seed/emailTemplates";

/**
 * ==========================================================================
 * seedDefaults — what `onInit` guarantees before the first request (SPEC §F.0)
 * ==========================================================================
 *
 * Runs on every `getPayload()`, so it is small, idempotent and guarded:
 *
 *   · never during `next build` — prerender workers must only read; and the
 *     CLI's `migrate` already passes `disableOnInit`;
 *   · never concurrently — several workers can boot at once (dev HMR, a
 *     restart under load), so the whole routine runs under a Postgres
 *     advisory lock (`pg_advisory_lock(hashtext('maison-seed-defaults'))`)
 *     held on a dedicated connection; the second worker waits, then finds
 *     nothing left to do;
 *   · never fatal — a fresh database without migrations, or a global whose
 *     required fields have no defaults yet, logs a clear line and lets the
 *     server come up. The admin surfaces the consequences (dashboard
 *     warnings); the owner is not met by a dead process.
 *
 * WHY A SESSION LOCK AND NOT ONE BIG TRANSACTION. Postgres aborts a whole
 * transaction at the first failed statement, so one global that cannot be
 * created blind would silently cancel the canary check and everything after
 * it. Each write below is its own Local API call — atomic on its own, with
 * Payload's validation and hooks — and the lock, not a transaction, is what
 * serialises workers. Idempotency comes from checking before writing.
 *
 * WHAT IT DOES, in order: assert that every upload directory is outside the
 * `.next` build output (the G12 regression the standalone server invites —
 * cms/lib/paths.ts), ensure every global has a row (so reads return
 * defaults rather than `{}`), mint `system-state.canary` once and stamp
 * `installedAt`, open the canary and set the in-memory "secret changed" flag
 * on failure (the red banner, SPEC §C.1), then assert the inventory schema
 * the Phase 3 SQL depends on. Missing email templates are created from the
 * house copy (3C's `seedEmailTemplates`, never overwriting an edited one;
 * the call is 3A-1's line, SPEC §L).
 *
 * It mints NO webhook secret — Register/Rotate does (SPEC §C.3).
 */

const LOCK_KEY = "hashtext('maison-seed-defaults')";

/** Context every write carries: system origin, no revalidation storm at boot. */
const SEED_CONTEXT = { system: true, seed: true, skipRevalidate: true, disableRevalidate: true } as const;

/**
 * Required fields that have no `defaultValue` in their global, so a blind
 * `{}` save cannot create the row. `site-settings.publicUrl` takes the
 * `.env` origin — the same fallback `publicUrl()` would return — and stays a
 * "placeholder" until an admin saves Site details (`isPlaceholderPublicUrl`).
 */
function requiredSeeds(slug: string): Record<string, unknown> {
  if (slug === "site-settings") {
    const url = envPublicUrl();
    return url ? { publicUrl: url } : {};
  }
  return {};
}

/**
 * Tables and the columns the Phase 3 inventory SQL (cms/lib/inventory.ts)
 * writes by name. Checked only once the collections exist, so a Phase 1/2
 * boot is not failed by a Phase 3 contract.
 */
const EXPECTED_COLUMNS: Array<{ collection: string; table: string; columns: string[] }> = [
  { collection: "sessions", table: "sessions", columns: ["seats_total", "booking_status", "sales_close_at", "starts_at", "_status"] },
  { collection: "session-inventory", table: "session_inventory", columns: ["session_id", "seats_sold", "seats_held"] },
];

export async function seedDefaults(payload: Payload): Promise<void> {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.PAYLOAD_MIGRATING === "true") return;

  const log = payload.logger;
  let lockClient: { query: (sql: string) => Promise<unknown>; release: () => void } | undefined;

  // Needs no database and must not be skipped because one is missing, so it
  // runs before the lock and outside the block below. It is an ERROR line
  // and not an exit for the reason given at the top: the site stays up, and
  // the message says exactly what will be lost on the next release.
  try {
    assertUploadDirs(payload);
  } catch (error) {
    log.error({ err: error }, "seedDefaults: an upload directory is inside the build output — files saved there are lost on the next deploy.");
  }

  try {
    // A dedicated connection: a session-level advisory lock belongs to the
    // connection that took it, so it must outlive the pooled queries below.
    lockClient = await payload.db.pool.connect();
    await lockClient.query(`SELECT pg_advisory_lock(${LOCK_KEY})`);

    await ensureGlobals(payload);
    if ((payload.collections as Record<string, unknown>)["email-templates"]) await seedEmailTemplates(payload);
    await ensureCanary(payload);
    assertSchema(payload);

    bootStatus.canaryCheckedAt = new Date().toISOString();
  } catch (error) {
    log.error(
      { err: error },
      "seedDefaults: start-up defaults could not be applied. If this is a fresh database, run `npx payload migrate` and restart.",
    );
  } finally {
    if (lockClient) {
      await lockClient.query(`SELECT pg_advisory_unlock(${LOCK_KEY})`).catch(() => undefined);
      lockClient.release();
    }
  }
}

/**
 * A global with no row reads as `{}` from the adapter and as "defaults" from
 * the Local API only after a first save. Saving `{}` (plus any required
 * seeds) runs beforeValidate, which fills every `defaultValue`, and creates
 * the row. A global that still cannot be created is left for the admin's
 * first save and named in the log, without the stack of a validation error.
 */
async function ensureGlobals(payload: Payload) {
  for (const global of payload.globals.config) {
    const existing = (await payload.db.findGlobal({ slug: global.slug })) as { id?: unknown };
    if (existing && existing.id !== undefined && existing.id !== null) continue;
    try {
      await payload.updateGlobal({
        slug: global.slug,
        data: requiredSeeds(global.slug),
        depth: 0,
        overrideAccess: true,
        context: { ...SEED_CONTEXT },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      payload.logger.warn(`seedDefaults: global "${global.slug}" has no row yet and could not be created with defaults (${message}); it is created on first save.`);
    }
  }
}

/**
 * The canary is the sealed string "ok". Opening it at boot is the only
 * reliable way to notice that PAYLOAD_SECRET changed without a reseal —
 * before an admin opens Payments and finds eight bullets that decrypt to
 * nothing.
 */
async function ensureCanary(payload: Payload) {
  if (!hasGlobal(payload, "system-state")) return;
  const raw = (await payload.db.findGlobal({ slug: "system-state" })) as { canary?: unknown; installedAt?: unknown };

  if (!isSealed(raw?.canary)) {
    await payload.updateGlobal({
      slug: "system-state",
      data: { canary: "ok", installedAt: typeof raw?.installedAt === "string" ? raw.installedAt : new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
      context: { ...SEED_CONTEXT },
    });
  }

  const opened = (await payload.findGlobal({
    slug: "system-state",
    depth: 0,
    overrideAccess: true,
    context: { ...SEED_CONTEXT, internalRead: true },
  })) as { canary?: unknown };

  if (opened?.canary === "ok") {
    bootStatus.secretChanged = false;
  } else {
    bootStatus.secretChanged = true;
    payload.logger.error(
      "Encrypted settings cannot be read — PAYLOAD_SECRET changed without a reseal. Run `OLD_PAYLOAD_SECRET=<old> npx payload run cms/scripts/reseal.ts`, or re-enter each key in the admin.",
    );
  }
}

/**
 * Every upload collection's `staticDir` must be outside `.next`. A relative
 * `staticDir` (Payload's default is the slug under `process.cwd()`) is
 * resolved the way Payload would, against the cwd — which under the
 * standalone server IS the build output, so that case fails here too.
 */
function assertUploadDirs(payload: Payload) {
  for (const collection of payload.config.collections) {
    const upload = collection.upload as { staticDir?: string } | false | undefined;
    if (!upload) continue;
    const dir = path.resolve(process.cwd(), upload.staticDir ?? collection.slug);
    assertOutsideBuildOutput(`upload.staticDir of "${collection.slug}"`, dir);
  }
}

/** Fail loudly at boot, not in the first checkout, if a migration left the inventory tables behind. */
function assertSchema(payload: Payload) {
  for (const expected of EXPECTED_COLUMNS) {
    if (!(payload.collections as Record<string, unknown>)[expected.collection]) continue;
    const table = payload.db.tables?.[expected.table];
    if (!table) throw new Error(`schema: table "${expected.table}" is missing — has the latest migration been applied?`);
    const columns = getTableColumns(table) as Record<string, { name: string }>;
    const present = new Set(Object.values(columns).map((column) => column.name));
    const missing = expected.columns.filter((column) => !present.has(column));
    if (missing.length) throw new Error(`schema: table "${expected.table}" is missing column(s) ${missing.join(", ")}`);
  }
}
