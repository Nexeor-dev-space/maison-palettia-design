import { sql } from "@payloadcms/db-postgres";

import { drizzleOf } from "@/cms/lib/mamo/claim";
import { allow, json, siteRequest, tooMany } from "@/cms/lib/mamo/http";

/**
 * ==========================================================================
 * GET /api/site/availability/{slug} — live seats for one session
 * ==========================================================================
 *
 * SPEC §G.3 / §H. A session page is prerendered and only revalidated on
 * publish; seats move with every hold and sale, which never purge the page
 * (inventory writes skip revalidation by design). `<SeatsLive>`
 * (components/cms/SeatsLive.tsx) asks here on mount and when the tab comes
 * back into view, and caps the quantity picker / swaps in the waitlist form
 * from the answer:
 *
 *     { available, bookingStatus, salesCloseAt, holdMinutes, bookingsOpen }
 *
 * One SQL read of the two tables the inventory statement itself uses
 * (`sessions` + `session_inventory`, SPEC §H.3), so the number shown is the
 * number `acquireSeats` will test against — published sessions only. A
 * draft, an unknown slug or an experience slug is a 404 with no detail.
 * `no-store`, 60/min per hashed IP.
 */

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  if (!allow(request, "availability", 60, 60_000)) return tooMany();
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) return json({ error: "Not found." }, 404);

  const req = await siteRequest(request);
  const { payload } = req;

  const result = await drizzleOf(payload).execute(sql`
    SELECT s.seats_total - coalesce(i.seats_sold, 0) - coalesce(i.seats_held, 0) AS available,
           s.booking_status, s.sales_close_at, s.starts_at, s.cancelled_at
      FROM sessions s
      LEFT JOIN session_inventory i ON i.session_id = s.id
     WHERE s.slug = ${slug} AND s._status = 'published'
     LIMIT 1
  `);
  const row = result.rows[0];
  if (!row) return json({ error: "Not found." }, 404);

  const [booking, payments] = await Promise.all([
    payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, select: { bookingsOpen: true } }),
    payload.findGlobal({ slug: "payment-settings", depth: 0, overrideAccess: true, select: { checkout: { holdMinutes: true } } }),
  ]);

  const toIso = (value: unknown) => (value ? new Date(value as string).toISOString() : null);
  const closesAt = toIso(row.sales_close_at) ?? toIso(row.starts_at);
  const onSale = !row.cancelled_at && (!closesAt || Date.parse(closesAt) > Date.now());
  const status = String(row.booking_status ?? "closed");

  return json({
    available: Math.max(0, Number(row.available ?? 0)),
    bookingStatus: onSale && (status === "open" || status === "waitlist") ? status : "closed",
    salesCloseAt: closesAt,
    holdMinutes: Number((payments as { checkout?: { holdMinutes?: number | null } }).checkout?.holdMinutes ?? 15),
    bookingsOpen: (booking as { bookingsOpen?: boolean | null }).bookingsOpen === true,
  });
}
