import { createLocalReq } from "payload";

import { renderOrderTicketsPdf, renderTicketPdf } from "@/cms/lib/pdf/ticket";
import { verifyPdf } from "@/cms/lib/pdf/links";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { getCms } from "@/lib/cms/payload";
import type { Ticket } from "@/payload-types";

/**
 * ==========================================================================
 * GET /api/site/tickets/{code}/pdf?exp&sig[&scope=order] — a customer's ticket
 * ==========================================================================
 *
 * SPEC §H.7 / §H.10: the signed link from the confirmation email and from
 * "My bookings". The signature (cms/lib/pdf/links.ts) binds the code, the
 * scope and the expiry; nothing else is trusted — there is no cookie and no
 * role check, because the link IS the permission, and it expires within 30
 * days. With `scope=order` the PDF holds every still-valid ticket of the
 * booking (one page each); without, just this seat.
 *
 * Refusals are deliberately vague: a wrong code, a forged signature and a
 * code that does not exist all answer the same 403/404 shape, so the route
 * cannot be used to discover which ticket codes exist. Expired links get
 * their own 410 with the way out ("open My bookings for a fresh link"),
 * because that is the case a real customer hits. 60 requests a minute per
 * client (SPEC §H rate table).
 */

const CODE_RE = /^MPT-[A-Z0-9]{4,16}$/;

const headers = (filename: string) => ({
  "content-type": "application/pdf",
  "content-disposition": `attachment; filename="${filename}"`,
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
});

const refuse = (status: number, message: string) =>
  new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  if (!rateLimit("pdf-ticket", ipHash(clientIp(request.headers)), { limit: 60, windowMs: 60_000 })) {
    return refuse(429, "Too many requests. Please wait a minute.");
  }
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode ?? "").toUpperCase();
  const query = new URL(request.url).searchParams;
  if (!CODE_RE.test(code)) return refuse(404, "Not found.");

  const verdict = verifyPdf("ticket", code, { exp: query.get("exp"), sig: query.get("sig"), scope: query.get("scope") });
  if (verdict === "expired") return refuse(410, "This link has expired. Open “My bookings” on the website for a fresh one.");
  if (verdict !== "ok") return refuse(403, "This link is not valid.");

  const payload = await getCms();
  const req = await createLocalReq({}, payload);
  const found = await payload.find({ collection: "tickets", where: { code: { equals: code } }, limit: 1, depth: 0, pagination: false, overrideAccess: true, req });
  const ticket = found.docs[0] as Ticket | undefined;
  if (!ticket) return refuse(404, "Not found.");

  try {
    if (query.get("scope") === "order") {
      const orderId = typeof ticket.order === "string" ? ticket.order : ticket.order?.id;
      const result = orderId ? await renderOrderTicketsPdf(req, orderId) : null;
      if (!result) return refuse(410, "These tickets are no longer valid. Please contact us if you think this is a mistake.");
      return new Response(new Uint8Array(result.pdf), { status: 200, headers: headers(`tickets-${result.reference}.pdf`) });
    }
    if (ticket.status === "void" || ticket.status === "refunded") {
      return refuse(410, "This ticket is no longer valid. Please contact us if you think this is a mistake.");
    }
    const pdf = await renderTicketPdf(req, ticket.id);
    return new Response(new Uint8Array(pdf), { status: 200, headers: headers(`${ticket.code}.pdf`) });
  } catch (error) {
    payload.logger.error({ err: error, code }, "tickets pdf: render failed");
    return refuse(500, "We could not create the PDF just now. Please try again in a minute.");
  }
}
