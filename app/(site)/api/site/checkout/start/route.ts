import { startCheckout } from "@/cms/lib/contracts";
import { allow, checkoutErrorResponse, hashedClient, isCrossSite, json, readJson, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { getPaymentGateway } from "@/cms/lib/mamo/index";
import { checkoutStartSchema, firstIssue } from "@/cms/lib/mamo/schemas";
import { isDisabled } from "@/cms/lib/mamo/types";

/**
 * ==========================================================================
 * POST /api/site/checkout/start — basket in, Mamo payment page out
 * ==========================================================================
 *
 * SPEC §H.3. The handler is the gatekeeper; the work is `startCheckout`
 * (cms/lib/orders.ts, 3A-1): basket reuse, customer upsert, re-pricing from
 * the database, atomic promo/pass reservation, the order and its seat
 * holds, then either "paid by credits" or a Mamo link. In order:
 *
 *   1. 10/min per hashed IP; cross-site posts refused; body ≤ 16 KB, zod.
 *   2. Bookings closed (Settings → Booking & checkout wording) → 503
 *      `bookings_closed`. The UI never shows Pay while closed; this is the
 *      guard behind it.
 *   3. No usable gateway → 503 `gateway_disabled` (production with no key;
 *      in development a missing key means the MOCK gateway, so the whole
 *      flow runs with no Mamo account).
 *   4. `startCheckout` with the server's own channel and source — the
 *      browser cannot claim to be the desk or choose its IP hash.
 *
 * Answers (StartCheckoutResult): `{ reference, paymentUrl, holdExpiresAt }`
 * → the browser does `location.assign(paymentUrl)`; `{ reference, paid:
 * true, k }` → straight to /payment-success; `reused: true` when a
 * double-submit found the same open basket. Errors carry a stable `reason`
 * (`sold_out` 409, `payment_link_failed` 502 with `retry`, …).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!allow(request, "checkout-start", 10, 60_000)) return tooMany();
  if (isCrossSite(request)) return json({ reason: "forbidden" }, 403);

  const raw = await readJson(request);
  if (raw === null) return json({ reason: "invalid", message: "The request body is not valid JSON." }, 400);
  const parsed = checkoutStartSchema.safeParse(raw);
  if (!parsed.success) return json({ reason: "invalid", message: firstIssue(parsed.error) }, 400);

  const req = await siteRequest(request);
  const { payload } = req;

  const booking = (await payload.findGlobal({
    slug: "booking-settings",
    depth: 0,
    overrideAccess: true,
    select: { bookingsOpen: true },
  })) as { bookingsOpen?: boolean | null };
  if (booking.bookingsOpen !== true) return json({ reason: "bookings_closed" }, 503);

  const gateway = await getPaymentGateway(req);
  if (isDisabled(gateway)) {
    payload.logger.warn({ msg: "checkout refused: payments gateway disabled", reason: gateway.reason });
    return json({ reason: "gateway_disabled" }, 503);
  }

  const { details, ...rest } = parsed.data;
  try {
    const result = await startCheckout(req, {
      ...rest,
      channel: "online",
      details: {
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone || undefined,
        marketingOptIn: details.marketingOptIn === true,
      },
      source: {
        ipHash: hashedClient(request),
        userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300),
        // Origin only: a full referrer could carry another site's query string.
        referrer: refererOrigin(request.headers.get("referer")),
      },
    });
    return json(result, 200);
  } catch (error) {
    return checkoutErrorResponse(error, (message) => payload.logger.warn({ msg: "checkout/start failed", err: message }));
  }
}

function refererOrigin(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin.slice(0, 200);
  } catch {
    return undefined;
  }
}
