/**
 * Hooks and helpers shared by every settings global in this folder.
 *
 * NOT A GLOBAL. `cms/globals/index.ts` re-exports the twelve global configs
 * only; this module (and `copyFields.ts`) must not be re-exported from there.
 *
 * Three things every settings global needs, written once:
 *
 *   1. AUDIT. SPEC §C.3 marks a handful of fields 📝 (append a `settings-audit`
 *      row when they change) and 📣 (also tell the admins). `settingsAfterChange`
 *      diffs `previousDoc` against `doc` for the watched paths and writes one
 *      row per changed field, inside the same transaction as the save (the
 *      hook passes `req`), so a rolled-back save leaves no orphan audit row.
 *      Secrets are never logged: a watched `encryptedText` field is reported
 *      as `[set]` / `[cleared]` by comparing its `…SetAt` sibling, because the
 *      value the hook sees has already been masked by `afterRead` (§C.2).
 *
 *   2. REVALIDATION. The six content globals feed the site layout (nav,
 *      footer, booking copy…), so a save purges the layout through
 *      `safeRevalidate` (§G.4), which defers the purge with `after()` until
 *      Payload has committed. The five admin globals revalidate nothing
 *      public. Seeds pass `context.skipRevalidate` and are honoured here.
 *
 *   3. CROSS-GLOBAL PRECONDITIONS. "Bookings open" and "Mode → Live" refuse
 *      until email, payments and the site address are ready (§C.3). Those
 *      checks read other globals, so they live in global `beforeValidate`
 *      hooks and surface as a `ValidationError` on the switch itself, which
 *      the admin renders inline under the field. `readGlobal` and
 *      `settingsError` are the two helpers they share.
 *
 * WHY `overrideAccess: true` AND NO `context.system` ON NESTED WRITES. The
 * audit row's collection has `create: systemOnly` (§D.1). Passing
 * `overrideAccess: true` skips access entirely, so the row needs no context
 * flag; and `createLocalReq` *mutates* `req.context` when given both `req` and
 * `context` (verified: `utilities/createLocalReq.js:86`), which would leak
 * `system: true` into the rest of the parent request. Nested writes here pass
 * `req` (same transaction) and never `context`.
 */

import { ValidationError } from "payload";
import type {
  Condition,
  GlobalAfterChangeHook,
  GlobalSlug,
  PayloadRequest,
  RequestContext,
} from "payload";

import { safeRevalidate } from "@/cms/hooks/revalidate";
import { isProduction } from "@/cms/lib/publicUrl";
import { clientIp, ipHash } from "@/cms/lib/rateLimit";

/* ────────────────────────────────────────────────────────────────────────── */
/* Admin grouping                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/** Sidebar group for the six globals editors may open (§C.3). */
export const SETTINGS_GROUP = "Settings";
/** Sidebar group for the five admin-only globals (§C.3). */
export const ADMIN_SETTINGS_GROUP = "Settings (admin)";

/* ────────────────────────────────────────────────────────────────────────── */
/* Users and roles                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * `req.user` is typed from the generated `payload-types.ts`, which does not
 * exist until 1A's last step — and even then `role` is a field we added, so
 * reading it through a narrow cast keeps these hooks compiling in both states.
 */
export const roleOf = (user: unknown): string | undefined =>
  (user as { role?: string } | null | undefined)?.role;

export const isAdminUser = (user: unknown): boolean => roleOf(user) === "admin";

/**
 * `admin.condition` for the "Advanced (admin only)" sections of the content
 * globals: the fields are hidden from editors in the UI *and* locked with
 * `access.update: isAdminField`, because a condition is cosmetic — REST
 * ignores it — and the lock is what the §J matrix actually promises.
 */
export const adminOnlyCondition: Condition = (_data, _siblingData, { user }) => isAdminUser(user);

/* ────────────────────────────────────────────────────────────────────────── */
/* Reading other globals from a hook                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Read another global at depth 0 inside the current request/transaction.
 * Secrets come back masked (no `revealSecrets` in context), which is all a
 * precondition check needs: `Boolean(settings.live.apiKey)` is "a key is
 * saved", never the key itself.
 */
export async function readGlobal<T extends Record<string, unknown> = Record<string, unknown>>(
  req: PayloadRequest,
  slug: string,
): Promise<T> {
  const doc = await req.payload.findGlobal({
    slug: slug as GlobalSlug,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return doc as unknown as T;
}

/** Dotted-path read used by the audit diff and the precondition checks. */
export function getByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cursor, key) => {
    if (cursor === null || cursor === undefined) return undefined;
    return (cursor as Record<string, unknown>)[key];
  }, source);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Validation errors that land on a field                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * A `ValidationError` for one field of a global. Payload's REST layer turns it
 * into `{ errors: [{ path, message }] }` and the admin form marks the field
 * with the message, so a refused "Bookings open" reads like a field error
 * ("Set up Email first…") rather than a red toast with no location.
 */
export function settingsError(
  req: PayloadRequest,
  global: string,
  path: string,
  message: string,
): ValidationError {
  return new ValidationError({ global, errors: [{ path, message }], req }, req.t);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public-URL shape                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The shape rules live beside the resolver in cms/lib/publicUrl.ts, so that
 * `isPlaceholderPublicUrl` (the "Bookings open" gate) and the Site details
 * validator apply ONE definition of an acceptable address — the Phase 1
 * review found them disagreeing (https-only there, local http allowed here),
 * which made the switch impossible to turn on against the mock gateway.
 * Re-exported so the globals in this folder keep importing from one place.
 */
export { isAcceptablePublicUrl, isProduction, LOCAL_HTTP_RE, PUBLIC_URL_RE } from "@/cms/lib/publicUrl";

/* ────────────────────────────────────────────────────────────────────────── */
/* Audit                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export interface WatchedField {
  /** Dotted data path, e.g. `"test.apiKey"`. */
  path: string;
  /** 📣 — also notify admins (SPEC §C.3). */
  notify?: boolean;
  /**
   * The field is an `encryptedText` pair. Changes are detected through the
   * `${path}SetAt` sibling and logged as `[set]` / `[cleared]`, never a value.
   */
  secret?: boolean;
}

export interface AuditEntry {
  global: string;
  field: string;
  from: string;
  to: string;
}

/** Audit rows hold text; this is how each value type reads in the log. */
function describe(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "on" : "off";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function diffWatched(
  global: string,
  watch: WatchedField[],
  previousDoc: unknown,
  doc: unknown,
): Array<AuditEntry & { notify: boolean }> {
  const entries: Array<AuditEntry & { notify: boolean }> = [];
  for (const { path, notify = false, secret = false } of watch) {
    if (secret) {
      // The masked value only says whether a secret exists; `…SetAt` says
      // whether it was replaced. Both are needed to see a rotation.
      const prev = getByPath(previousDoc, path);
      const next = getByPath(doc, path);
      const prevAt = getByPath(previousDoc, `${path}SetAt`);
      const nextAt = getByPath(doc, `${path}SetAt`);
      if (Boolean(prev) === Boolean(next) && prevAt === nextAt) continue;
      entries.push({
        global,
        field: path,
        from: prev ? "[set]" : "",
        to: next ? "[set]" : "[cleared]",
        notify,
      });
      continue;
    }
    const from = describe(getByPath(previousDoc, path));
    const to = describe(getByPath(doc, path));
    if (from === to) continue;
    entries.push({ global, field: path, from, to, notify });
  }
  return entries;
}

/**
 * 📣 fields: email every recipient subscribed to `settings_changed`
 * (`notifyStaff`, SPEC §O). The server log line stays so the change is visible
 * even with log-only email. A mail failure never fails the settings save — the
 * audit log already holds the change. Loaded lazily: the mailer pulls in the
 * template/notification collections, which import these hooks.
 */
export async function notifySettingsChanged(req: PayloadRequest, entries: AuditEntry[]): Promise<void> {
  req.payload.logger.info({
    msg: "settings_changed",
    by: (req.user as { email?: string } | null)?.email ?? "system",
    changes: entries.map((e) => `${e.global}.${e.field}: ${e.from || "—"} → ${e.to || "—"}`),
  });
  try {
    const { notifyStaff } = await import("@/cms/lib/notifyStaff");
    await notifyStaff(req, "settings_changed", { entries });
  } catch (error) {
    req.payload.logger.warn({ msg: "settings_changed: staff email not queued", err: error instanceof Error ? error.message : "unknown" });
  }
}

/**
 * `afterChange` for a settings global: audit the 📝 fields, notify on 📣,
 * revalidate the site layout when the global feeds it.
 *
 * Skips: `context.system` / `context.skipAudit` suppress the audit (seeds and
 * system stamps are not human changes); `context.skipRevalidate` /
 * `context.disableRevalidate` suppress the purge (§D.7).
 */
export function settingsAfterChange(options: {
  slug: string;
  watch?: WatchedField[];
  /** A `lib/cms/cache.ts` tag; when set the layout is revalidated with it. */
  revalidateTag?: string;
}): GlobalAfterChangeHook {
  const { slug, watch = [], revalidateTag } = options;

  return async ({ doc, previousDoc, req, context }) => {
    const ctx = (context ?? {}) as RequestContext & Record<string, unknown>;

    if (watch.length && ctx.system !== true && ctx.skipAudit !== true) {
      const entries = diffWatched(slug, watch, previousDoc, doc);
      if (entries.length) {
        const user = req.user as { id?: string | number; collection?: string } | null;
        const at = new Date().toISOString();
        // `req.headers` is a WHATWG Headers on REST/admin requests and an empty
        // one for Local API calls; `clientIp` copes with both.
        const hashedIp = ipHash(clientIp(req.headers));

        for (const entry of entries) {
          // Fail closed: an audit row that cannot be written aborts the save
          // (same transaction), because a settings change that leaves no trace
          // is the failure mode this log exists to rule out.
          await req.payload.create({
            collection: "settings-audit",
            data: {
              global: entry.global,
              field: entry.field,
              from: entry.from,
              to: entry.to,
              user: user?.collection === "users" ? String(user.id) : undefined,
              at,
              ipHash: hashedIp,
            },
            depth: 0,
            overrideAccess: true,
            req,
          });
        }

        const loud = entries.filter((e) => e.notify);
        if (loud.length) await notifySettingsChanged(req, loud);
      }
    }

    if (revalidateTag && ctx.skipRevalidate !== true && ctx.disableRevalidate !== true) {
      safeRevalidate(req, [revalidateTag], [], true);
    }

    return doc;
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Shapes of the globals these hooks read (depth 0, secrets masked)           */
/* ────────────────────────────────────────────────────────────────────────── */

/** The slice of `payment-settings` the preconditions look at. */
export interface PaymentSettingsLike extends Record<string, unknown> {
  mode?: "test" | "live" | "mock";
  test?: ModeCredentialsLike;
  live?: ModeCredentialsLike;
}

export interface ModeCredentialsLike {
  apiKey?: string | null;
  webhookUrl?: string | null;
  webhookId?: string | null;
  lastConnectionCheck?: { ok?: boolean } | null;
}

export interface EmailSettingsLike extends Record<string, unknown> {
  provider?: "log-only" | "smtp" | "resend";
  lastVerify?: { ok?: boolean } | null;
}

export interface SiteSettingsLike extends Record<string, unknown> {
  publicUrl?: string | null;
  legalName?: string | null;
  logoOnLight?: string | number | { id?: string | number } | null;
}

/**
 * Checks shared by "Bookings open" (§C.3 booking-settings, checks 2 and 4)
 * and "Mode → Live" (§C.3 payment-settings): is the gateway for `mode`
 * verified, and is its webhook registered against the current site address?
 *
 * `mock` has no real gateway and no webhook — it passes outside production
 * ("mock counts outside production") and is refused by the mode validator in
 * production before this is ever reached.
 */
export function gatewayReadiness(
  payments: PaymentSettingsLike,
  mode: "test" | "live" | "mock",
  publicUrl: string | null | undefined,
): { keyVerified: boolean; webhookRegistered: boolean } {
  if (mode === "mock") {
    const ok = !isProduction();
    return { keyVerified: ok, webhookRegistered: ok };
  }
  const creds = payments[mode] ?? {};
  const keyVerified = Boolean(creds.apiKey) && creds.lastConnectionCheck?.ok === true;
  const webhookRegistered =
    Boolean(creds.webhookId) &&
    typeof creds.webhookUrl === "string" &&
    typeof publicUrl === "string" &&
    publicUrl.length > 0 &&
    creds.webhookUrl.startsWith(publicUrl);
  return { keyVerified, webhookRegistered };
}
