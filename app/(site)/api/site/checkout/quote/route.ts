import { quote } from "@/cms/lib/contracts";
import { allow, checkoutErrorResponse, isCrossSite, json, readJson, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { checkoutQuoteSchema, firstIssue } from "@/cms/lib/mamo/schemas";

/**
 * ==========================================================================
 * POST /api/site/checkout/quote — what the basket costs, priced by the server
 * ==========================================================================
 *
 * The checkout page shows totals, VAT and the effect of a promo or pass code
 * before the customer commits. The basket in the browser carries prices for
 * display only; this re-prices from the database with the same `quote`
 * (cms/lib/pricing.ts, 3A-1) that `startCheckout` will run — with
 * `reserve: false`, so asking reserves nothing.
 *
 * Returned: the priced lines, totals, the applied promo (code and discount
 * only) and every rejected code with its reason. Pass-purchase ids are NOT
 * returned (the lines' `passCredits` say how many credits apply): a quote is
 * anonymous, and ids would let anyone probe which emails hold a pass.
 * 30/min per hashed IP (SPEC §H).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!allow(request, "checkout-quote", 30, 60_000)) return tooMany();
  if (isCrossSite(request)) return json({ reason: "forbidden" }, 403);

  const raw = await readJson(request);
  if (raw === null) return json({ reason: "invalid", message: "The request body is not valid JSON." }, 400);
  const parsed = checkoutQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    // `field` lets checkout say which input was refused (an email → "check the email address").
    const field = parsed.error.issues[0]?.path[0];
    return json({ reason: "invalid", ...(typeof field === "string" ? { field } : {}), message: firstIssue(parsed.error) }, 400);
  }

  const req = await siteRequest(request);
  // What a failed quote is logged with: never the email itself, only whether one was sent.
  const context = {
    codes: parsed.data.codes,
    sessionIds: parsed.data.lines.filter((line) => line.kind === "session").map((line) => line.id),
    passIds: parsed.data.lines.filter((line) => line.kind === "pass").map((line) => line.id),
    hasEmail: Boolean(parsed.data.email),
  };
  try {
    const result = await quote(req, { ...parsed.data, channel: "online" }, { reserve: false });
    return json({
      lines: result.lines,
      totals: result.totals,
      promo: result.promo ? { code: result.promo.code, discountFils: result.promo.discountFils } : null,
      rejectedCodes: result.rejectedCodes,
    });
  } catch (error) {
    // checkoutErrorResponse calls this only for real failures (5xx), never for a refused code.
    return checkoutErrorResponse(error, (message) => req.payload.logger.error({ msg: "checkout/quote failed", err: message, ...context }));
  }
}
