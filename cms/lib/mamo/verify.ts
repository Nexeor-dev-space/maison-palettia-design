import { createHash, timingSafeEqual } from "node:crypto";

/**
 * ==========================================================================
 * Webhook verification — the pure half (no database, no Payload)
 * ==========================================================================
 *
 * Mamo signs nothing. The only proof a delivery came from Mamo is that it
 * carries the `auth_header` string we registered (research 02 §A5), and the
 * docs never say under which request header that string arrives, or whether
 * it is prefixed with "Bearer ". This module is where that uncertainty is
 * contained: every guess is a named constant marked TODO(mamo-verify), and
 * correcting one after the first sandbox delivery (whose header NAMES are
 * always recorded on the `payment-events` row, and whose actual header is
 * stamped as `observedAuthHeaderName` in Settings → Payments) is a one-line
 * change here.
 *
 * Even a perfectly verified delivery is only a HINT: the route re-fetches
 * the payment from Mamo with our own key before anything changes (SPEC §H.5
 * step 6), so a leaked secret lets an attacker trigger a re-check, never a
 * fake payment. That is why best-effort header matching is acceptable.
 *
 * Kept free of Payload imports so the unit tests (./__tests__) can exercise
 * it without a database.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* TODO(mamo-verify) — the UNVERIFIED delivery details, all in one place      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * TODO(mamo-verify): the header Mamo sends our `auth_header` value in.
 * Best reading of the docs (research 02 §A5: the go-live checklist says
 * "Validate the `Authorization` header"): `Authorization`, value either raw
 * or `Bearer <value>`. `X-Auth-Header` is the second guess. Checked in this
 * order; the first that matches wins.
 */
export const WEBHOOK_AUTH_HEADER_CANDIDATES = ["authorization", "x-auth-header"] as const;

/** TODO(mamo-verify): an optional scheme prefix stripped before comparing (case-insensitive). */
export const WEBHOOK_AUTH_SCHEME_PREFIX = /^(?:Bearer|Token)\s+/i;

/**
 * TODO(mamo-verify): when no candidate header matches, try EVERY header's
 * value against the secrets (SPEC §H.5 step 1, "else any header whose value
 * equals a secret"), so a delivery under an unexpected header name still
 * verifies — and its name is recorded as `observedAuthHeaderName` so this
 * list can be corrected. Set to false once the header is confirmed.
 */
export const WEBHOOK_SCAN_ALL_HEADERS = true;

/**
 * TODO(mamo-verify): the header the MOCK gateway's poster sends the secret
 * in, mirroring the best reading above (raw value, no prefix). The mock
 * exercises the real verification path, so it must use a header the real
 * path accepts.
 */
export const MOCK_DELIVERY_HEADER = "authorization";

/**
 * TODO(mamo-verify): Mamo's retry schedule, delivery timeout and ordering
 * are undocumented (research 02 §A5). The hedge is structural, not a
 * constant: our own failures answer 5xx and leave the claim re-claimable
 * after this long (SPEC §H.5 step 4), and the `reconcile-payments` job
 * revisits unprocessed rows older than `UNPROCESSED_REVISIT_AFTER_MS`.
 */
export const CLAIM_STALE_AFTER = "2 minutes";
export const UNPROCESSED_REVISIT_AFTER_MS = 5 * 60_000;

/* ────────────────────────────────────────────────────────────────────────── */
/* Limits (SPEC §H.5 steps 0 and 2)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export const MAX_BODY_BYTES = 256 * 1024;
export const EXCERPT_BYTES = 1024;
export const UNVERIFIED_ROWS_PER_DAY = 500;
export const UNVERIFIED_SPIKE_PER_HOUR = 50;

/** Headers whose values are never stored, matched or not (SPEC §H.5 step 4). */
const ALWAYS_REDACTED = new Set(["authorization", "cookie", "x-auth-header", "proxy-authorization", "set-cookie"]);

export const REDACTED = "[redacted]";

/* ────────────────────────────────────────────────────────────────────────── */
/* Matching                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export interface WebhookSecret {
  mode: "test" | "live" | "mock";
  value: string;
  previous: boolean;
}

export interface DeliveryMatch {
  mode: "test" | "live" | "mock";
  /** Lower-case header name the secret arrived in — recorded as `observedAuthHeaderName`. */
  headerName: string;
  /** True when it matched a previous secret still inside its grace window. */
  previous: boolean;
}

/**
 * Constant-time string equality. Both sides are hashed first so the
 * comparison is always 32 bytes against 32 bytes: `timingSafeEqual` throws
 * on unequal lengths, and an early length check would leak the secret's
 * length one request at a time.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db) && a.length === b.length;
}

/** The value with an optional `Bearer `/`Token ` prefix removed and surrounding whitespace trimmed. */
export function presentedValue(raw: string): string {
  return raw.trim().replace(WEBHOOK_AUTH_SCHEME_PREFIX, "").trim();
}

function matchValue(raw: string | null, secrets: WebhookSecret[]): WebhookSecret | null {
  if (!raw) return null;
  const candidates = [raw.trim(), presentedValue(raw)];
  // Every secret is compared (no early exit inside the secret loop), so the
  // time taken does not say which mode, or whether a previous secret, matched.
  let hit: WebhookSecret | null = null;
  for (const secret of secrets) {
    if (!secret.value) continue;
    for (const candidate of candidates) {
      if (constantTimeEquals(candidate, secret.value) && !hit) hit = secret;
    }
  }
  return hit;
}

/**
 * Which secret, if any, this delivery carries (SPEC §H.5 step 1). Checks the
 * candidate headers in order, then — while `WEBHOOK_SCAN_ALL_HEADERS` — every
 * other header. Returns null when nothing matched: the caller stores the
 * minimal unverified row and answers 401.
 */
export function identifyDelivery(headers: Headers, secrets: WebhookSecret[]): DeliveryMatch | null {
  const usable = secrets.filter((secret) => typeof secret.value === "string" && secret.value.length > 0);
  if (!usable.length) return null;

  for (const name of WEBHOOK_AUTH_HEADER_CANDIDATES) {
    const hit = matchValue(headers.get(name), usable);
    if (hit) return { mode: hit.mode, headerName: name, previous: hit.previous };
  }
  if (!WEBHOOK_SCAN_ALL_HEADERS) return null;

  const tried = new Set<string>(WEBHOOK_AUTH_HEADER_CANDIDATES);
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    if (tried.has(lower) || lower === "cookie") continue;
    const hit = matchValue(value, usable);
    if (hit) return { mode: hit.mode, headerName: lower, previous: hit.previous };
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* What a stored row may contain                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** Header NAMES only — always recorded, verified or not. Sorted so rows compare. */
export function headerNamesOf(headers: Headers): string[] {
  return [...new Set([...headers.keys()].map((name) => name.toLowerCase()))].sort();
}

/**
 * Headers for a VERIFIED row: every value equal to ANY secret (current or
 * previous, any mode, with or without a scheme prefix) and the always-secret
 * names are replaced by "[redacted]". A serialised `payment-events` row must
 * never contain a secret substring (SPEC §K) — the unit test checks exactly
 * that, including a secret smuggled in a header we do not expect.
 */
export function redactHeaders(headers: Headers, secretValues: string[]): Record<string, string> {
  const secrets = secretValues.filter((value) => typeof value === "string" && value.length > 0);
  const out: Record<string, string> = {};
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    const containsSecret = secrets.some((secret) => value.includes(secret));
    out[lower] = ALWAYS_REDACTED.has(lower) || containsSecret ? REDACTED : value.slice(0, 500);
  }
  return out;
}

/**
 * Removes every secret substring from arbitrary text — applied to the body
 * excerpt of an unverified delivery (someone guessing at our header might
 * paste a near-miss into the body) and to anything else written next to it.
 */
export function scrubSecrets(text: string, secretValues: string[]): string {
  let out = text;
  for (const secret of secretValues) {
    if (secret && secret.length >= 8) out = out.split(secret).join(REDACTED);
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Body                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Reads the request body up to `max` bytes and stops reading beyond it
 * (SPEC §H.5 step 0: "abort beyond") — a 50 MB POST costs us 256 KB of
 * memory, not 50 MB. Returns null when the body was too large.
 */
export async function readBodyCapped(request: Request, max: number = MAX_BODY_BYTES): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

/**
 * `eventType` and the payment id from the first kilobyte of an UNVERIFIED
 * body, by pattern rather than `JSON.parse` (SPEC §H.5 step 2: no parsing of
 * unauthenticated input beyond the read). Both are clamped to what Mamo's
 * values look like, so the row cannot be used to store arbitrary strings.
 */
export function parseDefensively(excerpt: string): { eventType?: string; providerPaymentId?: string } {
  const head = excerpt.slice(0, EXCERPT_BYTES);
  const eventType = /"event_type"\s*:\s*"([a-z_]{1,30}\.[a-z_]{1,30})"/.exec(head)?.[1];
  const providerPaymentId = /"id"\s*:\s*"([A-Za-z0-9_-]{1,60})"/.exec(head)?.[1];
  return { eventType, providerPaymentId };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Classification and the idempotency key                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export type EventFamily = "payment" | "dispute";

/** SPEC §H.5 step 3: `id` and `event_type` (`payment.*` or `dispute.*`) are required; anything else is "ignored". */
export function classifyEvent(body: unknown): { family: EventFamily; id: string; eventType: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { id, event_type: eventType } = body as { id?: unknown; event_type?: unknown };
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return null;
  if (typeof eventType !== "string") return null;
  const match = /^(payment|dispute)\.[a-z_]{1,40}$/.exec(eventType);
  if (!match) return null;
  return { family: match[1] as EventFamily, id, eventType };
}

/**
 * The claim key (SPEC §D.3 `payment-events.dedupeKey`): one row per payment
 * × event × status × refunded amount, so a refund's three webhooks
 * (initiated, refunded, a second partial refund) are three rows while a
 * re-delivery of any one of them is the same row. Disputes: `{id}:{event}`.
 * Mamo sends no event id (research 02 §A5, UNVERIFIED), which is why the
 * key is derived from the payload at all.
 */
export function dedupeKeyFor(body: Record<string, unknown>, family: EventFamily): string {
  const id = String(body.id);
  const eventType = String(body.event_type);
  if (family === "dispute") return `${id}:${eventType}`.slice(0, 200);
  const status = typeof body.status === "string" ? body.status : "";
  const refunded = body.refund_amount === undefined || body.refund_amount === null ? 0 : Number(body.refund_amount);
  return `${id}:${eventType}:${status}:${Number.isFinite(refunded) ? refunded : 0}`.slice(0, 200);
}
