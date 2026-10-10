import { z } from "zod";

/**
 * ==========================================================================
 * Request bodies of the public booking endpoints (zod)
 * ==========================================================================
 *
 * Every `/api/site/**` body is validated before it touches the database
 * (SPEC §H.3 step 1, §K "zod schemas for all /api/site/* bodies"). The
 * shapes are the contract's (`StartCheckoutInput`, `QuoteInput` in
 * cms/lib/contracts.ts) minus what the server supplies itself — channel,
 * source, desk — so a browser can never claim to be the front desk or pick
 * its own IP hash. Limits are generous for a real basket and tight for a
 * script: 20 lines, 20 seats a line, 3 codes (SPEC: codes ≤ 3).
 *
 * Prices are not accepted at all. The browser says WHAT it wants; the
 * server re-prices every line from the database (`quote`).
 */

const id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9-]+$/, "invalid id");

export const lineSchema = z.object({
  kind: z.enum(["session", "pass"]),
  id,
  qty: z.number().int().min(1).max(20),
});

const codes = z.array(z.string().trim().min(1).max(40)).max(3).default([]);

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().toLowerCase().email("A valid email is required.").max(200),
  phone: z.string().trim().max(40).optional(),
  marketingOptIn: z.boolean().optional(),
});

export const checkoutStartSchema = z.object({
  basketId: z.string().uuid("basketId must be a UUID."),
  lines: z.array(lineSchema).min(1, "The basket is empty.").max(20),
  details: contactSchema,
  codes,
  consents: z
    .array(z.object({ policy: z.string().trim().min(1).max(80), version: z.number().int().min(0).max(100_000) }))
    .max(10)
    .default([]),
  waitlistToken: z.string().trim().min(10).max(200).optional(),
});

export const checkoutQuoteSchema = z.object({
  lines: z.array(lineSchema).min(1).max(20),
  codes,
  email: z.string().trim().toLowerCase().email().max(200).optional(),
});

export const orderLookupSchema = z.object({
  reference: z.string().trim().toUpperCase().min(4).max(20).regex(/^[A-Z0-9-]+$/),
  email: z.string().trim().toLowerCase().email().max(200),
});

/** The first issue as one readable line — what the checkout form shows. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const where = issue.path.length ? `${issue.path.map(String).join(".")}: ` : "";
  return `${where}${issue.message}`;
}
