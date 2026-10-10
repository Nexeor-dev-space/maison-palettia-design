import type { PayloadRequest } from "payload";

import { publicUrl } from "@/cms/lib/publicUrl";
import { sign, verifySig } from "@/cms/lib/signing";

/**
 * ==========================================================================
 * Signed, expiring PDF links — the ONLY way a customer downloads a PDF
 * ==========================================================================
 *
 * `/api/site/tickets/{code}/pdf?exp&sig[&scope=order]` and
 * `/api/site/invoices/{id}/pdf?exp&sig` (SPEC §H.7, §H.10). No session, no
 * cookie: the link in the confirmation email and on "My bookings" is the
 * credential, so it is bound to exactly one document and one expiry:
 *
 *   sig = sign("pdf-v1", "<kind>:<id>:<scope>:<exp>")   (cms/lib/signing.ts)
 *
 * HKDF gives `pdf-v1` its own key, so no other token the site issues can be
 * replayed here. `exp` is a Unix time no more than 30 days ahead — the
 * verifier refuses a later one even with a valid signature, so a leaked
 * signing bug cannot mint a forever-link. Verification is constant-time
 * (`verifySig` → `timingSafeEqual`). Links are regenerated on every page
 * view and email, so expiry never strands a customer: "My bookings" always
 * has fresh ones.
 */

export type PdfKind = "ticket" | "invoice";
/** `order` on a ticket link = every valid ticket of that ticket's order in one PDF. */
export type PdfScope = "one" | "order";

export const MAX_PDF_LINK_SECONDS = 30 * 24 * 60 * 60;
/** Clock skew tolerated between the signer and the verifier. */
const SKEW_SECONDS = 120;

const material = (kind: PdfKind, id: string, scope: PdfScope, exp: number) => `${kind}:${id}:${scope}:${exp}`;

export function signPdf(kind: PdfKind, id: string, opts: { scope?: PdfScope; ttlSeconds?: number; now?: number } = {}): { exp: number; sig: string } {
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  const ttl = Math.min(Math.max(60, Math.floor(opts.ttlSeconds ?? MAX_PDF_LINK_SECONDS)), MAX_PDF_LINK_SECONDS);
  const exp = now + ttl;
  return { exp, sig: sign("pdf-v1", material(kind, id, opts.scope ?? "one", exp)) };
}

/** `ok` or the reason it is not — the route maps both "expired" and "bad" to one response. */
export function verifyPdf(kind: PdfKind, id: string, query: { exp?: string | null; sig?: string | null; scope?: string | null }, now = Date.now()): "ok" | "expired" | "bad" {
  const exp = Number(query.exp);
  const scope: PdfScope = query.scope === "order" ? "order" : "one";
  if (!Number.isInteger(exp) || !query.sig || !id) return "bad";
  const nowSec = Math.floor(now / 1000);
  if (exp > nowSec + MAX_PDF_LINK_SECONDS + SKEW_SECONDS) return "bad";
  if (!verifySig("pdf-v1", material(kind, id, scope, exp), query.sig)) return "bad";
  return exp < nowSec ? "expired" : "ok";
}

/** Absolute URL of a ticket PDF (one seat, or the whole order with `scope: "order"`). */
export async function signedTicketPdfUrl(req: PayloadRequest | undefined, code: string, opts: { scope?: PdfScope; ttlSeconds?: number } = {}): Promise<string> {
  const { exp, sig } = signPdf("ticket", code, opts);
  const scope = opts.scope === "order" ? "&scope=order" : "";
  return `${await publicUrl(req)}/api/site/tickets/${encodeURIComponent(code)}/pdf?exp=${exp}${scope}&sig=${sig}`;
}

/** Absolute URL of an invoice or credit-note PDF. */
export async function signedInvoicePdfUrl(req: PayloadRequest | undefined, invoiceId: string, opts: { ttlSeconds?: number } = {}): Promise<string> {
  const { exp, sig } = signPdf("invoice", invoiceId, opts);
  return `${await publicUrl(req)}/api/site/invoices/${encodeURIComponent(invoiceId)}/pdf?exp=${exp}&sig=${sig}`;
}
