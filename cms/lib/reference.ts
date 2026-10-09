import { randomBytes, randomInt } from "node:crypto";

/**
 * ==========================================================================
 * Human-facing codes — booking references, ticket and pass codes, tokens
 * ==========================================================================
 *
 * A booking reference is read aloud at a desk, typed into the status page
 * and printed on an invoice, so it is drawn from an alphabet with no look-
 * alikes: no 0/O, no 1/I/L. 32 symbols × 6 positions is a billion
 * references; collisions are caught by the unique index and retried by the
 * caller (cms/lib/orders.ts, Phase 3), not prevented here.
 *
 * `randomInt` rather than `Math.random() * n | 0`: the latter is both
 * predictable and biased, and a predictable reference is a way to look up
 * somebody else's booking.
 *
 * Prefixes (SPEC §D.3): orders `MP-` (editable in Booking settings), tickets
 * `MPT-`, pass purchases `MPP-`, invoices `MP-INV` / credit notes `MP-CN`
 * (numbered, not random — cms/lib/invoiceNumber.ts, Phase 3).
 */

export const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERENCE_LENGTH = 6;
export const CODE_LENGTH = 8;

export const DEFAULT_REFERENCE_PREFIX = "MP-";
export const TICKET_PREFIX = "MPT-";
export const PASS_PREFIX = "MPP-";

/** `^[A-Z]{2,4}-?$` is the rule Booking settings validates the prefix against (SPEC §C.3). */
export const REFERENCE_PREFIX_PATTERN = /^[A-Z]{2,4}-?$/;

export function randomCode(length: number, alphabet: string = REFERENCE_ALPHABET): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[randomInt(alphabet.length)];
  return out;
}

/** "MP" and "MP-" both mean "MP-": the hyphen is always printed. */
export function normalisePrefix(prefix: string): string {
  const trimmed = prefix.trim().toUpperCase();
  return trimmed.endsWith("-") ? trimmed : `${trimmed}-`;
}

export function mintReference(prefix: string = DEFAULT_REFERENCE_PREFIX): string {
  return `${normalisePrefix(prefix)}${randomCode(REFERENCE_LENGTH)}`;
}

export function mintTicketCode(): string {
  return `${TICKET_PREFIX}${randomCode(CODE_LENGTH)}`;
}

export function mintPassCode(): string {
  return `${PASS_PREFIX}${randomCode(CODE_LENGTH)}`;
}

/**
 * Pattern for anything that claims to be one of our references, used to
 * reject junk before it reaches a query (status lookups, check-in input).
 */
export const REFERENCE_PATTERN = /^[A-Z]{2,4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
export const CODE_PATTERN = /^MP[TP]-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

/**
 * An opaque, URL-safe random token for things a person never types: the
 * waitlist re-entry token (22 chars ≈ 131 bits, SPEC §D.3), one-time links.
 */
export function randomToken(length = 22): string {
  return randomBytes(Math.ceil((length * 3) / 4) + 2)
    .toString("base64url")
    .slice(0, length);
}
