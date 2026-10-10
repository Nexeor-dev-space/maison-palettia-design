import { timingSafeEqual } from "node:crypto";

import { deriveKey, hmacSha256 } from "./crypto";

/**
 * ==========================================================================
 * Signatures for URLs and tokens — HMAC-SHA256 under purpose-bound keys
 * ==========================================================================
 *
 * Several things the site hands out have to be unforgeable but need no
 * database row to verify: the `k` on a payment-return page, the magic link
 * to "my bookings", the customer session cookie, the signed loopback call
 * that revalidates pages from a job, the PDF download links, the waitlist
 * re-entry token. Each gets its own `SigningInfo`, and HKDF turns that label
 * into its own key (cms/lib/crypto.ts), so a signature minted for one
 * purpose can never be replayed as another — a `pdf-v1` signature over some
 * bytes is meaningless to the `revalidate-v1` verifier even if the bytes
 * happen to match.
 *
 * Each caller decides what goes into `payload` (and so what the signature
 * binds): typically an id plus an expiry timestamp, joined with ".", so the
 * verifier can reject stale tokens without a lookup. The `-v1` suffix is the
 * version to bump if a payload format ever changes.
 *
 * Ticket QR codes are deliberately NOT on this list — they are verified by
 * database lookup against a stored `qrSig` (SPEC §H.7), so a secret rotation
 * never invalidates a printed ticket.
 */
export type SigningInfo = "return-v1" | "magic-link-v1" | "session-v1" | "revalidate-v1" | "pdf-v1" | "waitlist-v1";

/** base64url(HMAC-SHA256(key(info), payload)). 43 characters, URL-safe, no padding. */
export function sign(info: SigningInfo, payload: string): string {
  return hmacSha256(deriveKey(info), payload).toString("base64url");
}

/**
 * Constant-time comparison. `timingSafeEqual` throws on unequal lengths, so
 * the length check comes first and returns false — the length of a valid
 * signature is public knowledge anyway.
 */
export function verifySig(info: SigningInfo, payload: string, sig: string): boolean {
  if (typeof sig !== "string" || sig.length === 0) return false;
  const expected = Buffer.from(sign(info, payload), "utf8");
  const given = Buffer.from(sig, "utf8");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/**
 * Convenience for the common "value, expires-at, signature" token shape:
 * `<payload>.<unixExpiry>.<sig>` where the signature covers payload and
 * expiry together. `parseSignedToken` returns `null` for malformed, forged or
 * expired tokens — one answer, so route handlers cannot accidentally treat
 * "expired" more leniently than "forged".
 */
export function makeSignedToken(info: SigningInfo, payload: string, ttlSeconds: number): string {
  if (payload.includes(".")) throw new Error("Signed-token payloads may not contain '.'");
  const expires = Math.floor(Date.now() / 1000) + Math.max(1, Math.floor(ttlSeconds));
  const body = `${payload}.${expires}`;
  return `${body}.${sign(info, body)}`;
}

export function parseSignedToken(info: SigningInfo, token: string): { payload: string; expires: number } | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [payload, expiresRaw, sig] = parts;
  const expires = Number(expiresRaw);
  if (!Number.isInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return null;
  if (!verifySig(info, `${payload}.${expiresRaw}`, sig)) return null;
  return { payload, expires };
}
