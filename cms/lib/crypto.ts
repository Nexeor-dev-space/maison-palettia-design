import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";

import { MASK } from "./mask";

export { MASK };

/**
 * ==========================================================================
 * Secrets at rest — AES-256-GCM under a key derived from PAYLOAD_SECRET
 * ==========================================================================
 *
 * The owner's constraint is that nothing beyond three keys lives in `.env`
 * (SPEC §C.1): Mamo Pay API keys, SMTP passwords and the like are typed into
 * the admin and must survive in the database without being readable from a
 * database dump. This module is the whole of that promise.
 *
 * WHY NOT PAYLOAD'S OWN `payload.encrypt`. It is AES-CTR without
 * authentication: a flipped byte in the ciphertext decrypts to a different,
 * plausible-looking key with no error. GCM fails closed — a tampered or
 * wrong-key value throws instead of returning garbage — which is what lets
 * the boot canary (SPEC §C.3 `system-state.canary`) detect a rotated secret.
 *
 * KEY DERIVATION. `PAYLOAD_SECRET` is never used as a key directly. HKDF
 * (SHA-256, salt "maison-palettia") turns it into independent keys per
 * purpose — `secrets-v1` here, each `SigningInfo` in ./signing.ts, the daily
 * `analytics-<day>` salt below — so a weakness or a leak in one derived key
 * says nothing about the others, and so a future `secrets-v2` can coexist
 * with v1 during a migration.
 *
 * WIRE FORMAT. `enc:v1:` + base64url(iv ‖ tag ‖ ciphertext), iv 12 bytes,
 * tag 16 bytes. The prefix is what lets the encryptedText hook tell a sealed
 * value (keep as is: reseal, import) from a new plain-text entry (seal it),
 * and lets `isSealed` guard every `open`.
 *
 * ROTATION. `cms/scripts/reseal.ts` decrypts every stored value with the old
 * secret and re-seals with the new one — the `key` parameters on `seal` and
 * `open` exist for that script alone. Everything else uses the defaults.
 */

const PREFIX = "enc:v1:";
const HKDF_SALT = "maison-palettia";
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** The process secret, required at the moment of first use rather than at import so the CLI can load the config without it. */
function processSecret(): string {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is not set — it is required to read or write encrypted settings.");
  return secret;
}

/**
 * HKDF-SHA256 over an input secret for one named purpose. Memoised per
 * (info, secret) because a request can open several settings in a row and
 * HKDF is deliberately not cheap.
 */
const keyCache = new Map<string, Buffer>();
export function deriveKey(info: string, length = 32, ikm: string = processSecret()): Buffer {
  const cacheKey = `${length}:${info}:${createHash("sha256").update(ikm).digest("hex")}`;
  const hit = keyCache.get(cacheKey);
  if (hit) return hit;
  const key = Buffer.from(hkdfSync("sha256", ikm, HKDF_SALT, info, length));
  keyCache.set(cacheKey, key);
  return key;
}

/** The key under which settings secrets are stored (SPEC §C.2). */
export const secretsKey = (ikm?: string): Buffer => deriveKey("secrets-v1", 32, ikm);

/** True for a value this module produced. The only thing `open` will accept. */
export const isSealed = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith(PREFIX);

export function seal(plain: string, key: Buffer = secretsKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

/**
 * Decrypts a sealed value. Throws on anything that is not ours, has been
 * tampered with, or was sealed under a different secret — callers that want
 * a soft failure use `tryOpen`.
 */
export function open(sealed: string, key: Buffer = secretsKey()): string {
  if (!isSealed(sealed)) throw new Error("Not an encrypted value (missing enc:v1: prefix).");
  const packed = Buffer.from(sealed.slice(PREFIX.length), "base64url");
  if (packed.length < IV_BYTES + TAG_BYTES) throw new Error("Encrypted value is truncated.");
  const iv = packed.subarray(0, IV_BYTES);
  const tag = packed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = packed.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * `open` that records a failure instead of throwing. A decrypt failure in
 * production has one realistic cause — `PAYLOAD_SECRET` changed without the
 * reseal script — and the right response is the red banner in the admin
 * (SPEC §C.1), not a 500 on the settings page. So the flag is set here, where
 * the failure is detected, and read by the dashboard warnings component.
 */
export function tryOpen(sealed: string, key?: Buffer): string | null {
  try {
    return open(sealed, key);
  } catch {
    bootStatus.secretChanged = true;
    bootStatus.lastDecryptFailureAt = new Date().toISOString();
    return null;
  }
}

/**
 * In-memory health of the encryption layer for this process. Written by the
 * boot canary in cms/seed/defaults.ts and by `tryOpen`; rendered by
 * cms/components/admin/Warnings.tsx (Phase 4). Resetting it means restarting
 * the process with a secret that opens the canary — there is no "dismiss".
 */
export const bootStatus: { secretChanged: boolean; canaryCheckedAt?: string; lastDecryptFailureAt?: string } = {
  secretChanged: false,
};

// ─── hashing helpers shared by signing, rate limiting and analytics ──────────

export const sha256Hex = (input: Buffer | string): string => createHash("sha256").update(input).digest("hex");

export const hmacSha256 = (key: Buffer, data: Buffer | string): Buffer =>
  createHmac("sha256", key).update(data).digest();

/**
 * Today's date in the studio's timezone as YYYY-MM-DD. Everything that is
 * "per day" in the CMS — the analytics salt, the daily digest stamp, the
 * reconciliation window — means a Dubai day, not a UTC one, because that is
 * the day the owner reads on the dashboard.
 */
export function dubaiDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // en-CA gives ISO order: 2026-10-09
}

/**
 * A visitor/IP identifier that cannot be reversed and cannot be joined across
 * days: HMAC of the IP under a key derived from today's date. The salt is
 * never stored — it is re-derived from PAYLOAD_SECRET + the day, so there is
 * nothing to generate at boot and nothing to leak (SPEC §P, "analytics
 * salt"). Used for rate-limit buckets and the analytics beacon alike; 32 hex
 * characters is plenty to be unique and short enough to index.
 */
export function ipHash(ip: string, day: string = dubaiDay()): string {
  const key = deriveKey(`analytics-${day}`);
  return hmacSha256(key, ip.trim()).toString("hex").slice(0, 32);
}
