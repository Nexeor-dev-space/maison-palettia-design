import { createLocalReq } from "payload";

import { readStoredInvoicePdf, renderInvoicePdf } from "@/cms/lib/pdf/invoice";
import { verifyPdf } from "@/cms/lib/pdf/links";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { getCms } from "@/lib/cms/payload";
import type { Invoice } from "@/payload-types";

/**
 * ==========================================================================
 * GET /api/site/invoices/{id}/pdf?exp&sig — a customer's invoice or credit note
 * ==========================================================================
 *
 * SPEC §H.7: "customers download ONLY via this route". The `invoice-files`
 * upload collection is staff-read (`checkFileAccess` runs before any upload
 * handler, so a signed URL could never work there — verified in 3.90.2);
 * this route checks the `pdf-v1` signature over (id, expiry) instead
 * (cms/lib/pdf/links.ts, ≤ 30 days, constant-time), then streams the stored
 * PDF straight from `private/invoices` — or, if 3D's `generate-invoice-pdf`
 * has not written it yet, renders it from the invoice row on the spot
 * (the same bytes the stored file would have, without storing).
 *
 * Same refusal rules as the ticket route: one 403 for anything forged, a
 * 410 that explains the way out for an expired link, 60 a minute per client.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const refuse = (status: number, message: string) =>
  new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!rateLimit("pdf-invoice", ipHash(clientIp(request.headers)), { limit: 60, windowMs: 60_000 })) {
    return refuse(429, "Too many requests. Please wait a minute.");
  }
  const { id } = await params;
  if (!UUID_RE.test(id ?? "")) return refuse(404, "Not found.");
  const query = new URL(request.url).searchParams;

  const verdict = verifyPdf("invoice", id, { exp: query.get("exp"), sig: query.get("sig") });
  if (verdict === "expired") return refuse(410, "This link has expired. Open “My bookings” on the website for a fresh one.");
  if (verdict !== "ok") return refuse(403, "This link is not valid.");

  const payload = await getCms();
  const req = await createLocalReq({}, payload);
  const invoice = (await payload.findByID({ collection: "invoices", id, depth: 0, overrideAccess: true, req }).catch(() => null)) as Invoice | null;
  if (!invoice) return refuse(404, "Not found.");

  try {
    const pdf = (await readStoredInvoicePdf(req, invoice)) ?? (await renderInvoicePdf(req, id));
    const filename = `${invoice.number.replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, no-store",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    payload.logger.error({ err: error, invoiceId: id }, "invoices pdf: render failed");
    return refuse(500, "We could not create the PDF just now. Please try again in a minute.");
  }
}
