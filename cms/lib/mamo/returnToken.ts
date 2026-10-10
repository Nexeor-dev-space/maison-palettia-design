import { sign, verifySig } from "../signing";

/**
 * ==========================================================================
 * `k` — the 24-hour key to an order's details on the return page
 * ==========================================================================
 *
 * SPEC §H.3 step 5 / §H.5. The customer comes back from Mamo to
 * `/payment-success?ref=MP-ABC123&k=…`. A reference alone is six characters
 * anyone could guess at, so on its own it buys only `{ status,
 * holdExpiresAt }`; with a valid `k` the status endpoint adds the lines and
 * tickets. Nothing is valid forever:
 *
 *     k = <exp>.<b64url(hmac("return-v1", `${ref}|${exp}`))>      exp = unix seconds, now + 24 h
 *
 * The signature binds the reference AND the expiry, so neither can be
 * edited, and the `return-v1` key is used for nothing else (cms/lib/
 * signing.ts). Minted by checkout (cms/lib/orders.ts → ./links.ts), by the
 * pass-only/zero-total path, and by the booking-status lookup after a
 * reference + email match; verified by app/(site)/api/site/orders/**.
 */

export const RETURN_K_TTL_SECONDS = 24 * 60 * 60;

/** Clock skew tolerated on the upper bound, so a `k` minted on a slightly fast clock still verifies. */
const SKEW_SECONDS = 300;

export function mintReturnK(reference: string, ttlSeconds: number = RETURN_K_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, Math.min(ttlSeconds, RETURN_K_TTL_SECONDS));
  return `${exp}.${sign("return-v1", `${reference}|${exp}`)}`;
}

/**
 * True only for an unexpired `k` minted for exactly this reference. Rejects
 * an expiry further out than 24 h (+ skew) even with a valid signature, so a
 * future change that mints long-lived keys by mistake still fails closed.
 */
export function verifyReturnK(reference: string, k: unknown): boolean {
  if (typeof k !== "string" || k.length > 128) return false;
  const match = /^(\d{9,11})\.([A-Za-z0-9_-]{20,64})$/.exec(k);
  if (!match) return false;
  const exp = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!(exp > now) || exp > now + RETURN_K_TTL_SECONDS + SKEW_SECONDS) return false;
  return verifySig("return-v1", `${reference}|${exp}`, match[2]);
}
