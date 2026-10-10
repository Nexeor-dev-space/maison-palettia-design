import { timingSafeEqual } from "node:crypto";

import type { PayloadRequest } from "payload";

import type { Session, Waitlist } from "@/payload-types";

import { publicUrl, sendTemplated } from "./contracts";
import { bestEffort, withContext } from "./inventory";
import { randomToken } from "./reference";

/**
 * ==========================================================================
 * Waitlist — join, offer, and the token that lets an offer be booked (§H.11)
 * ==========================================================================
 *
 * ONE ROW PER SESSION + EMAIL. Joining twice updates the seats wanted and
 * keeps the original place in the queue (`position` = earlier `waiting`
 * rows + 1 at the first join). Emails are stored lowercased so the checkout
 * can match the offer to the address the customer types.
 *
 * OFFERS, NOT RESERVATIONS. When seats come back (`releaseSeats` /
 * `refundSeats` queue `waitlist-notify`), `notifyWaitlist` walks the
 * `waiting` rows strictly first-come first-served and stops at the first
 * party that does not fit the freed seats — a family of four is not skipped
 * for a single behind them. Each offered row gets a 22-character token valid
 * for 24 hours and an email with `/events/{slug}/book?w={token}`. The seats
 * are NOT held: the first to pay gets them, and the email says so.
 *
 * WHAT THE TOKEN UNLOCKS. A session in `waitlist` status refuses ordinary
 * checkouts (`acquireSeats` WHERE clause). `validWaitlistTokenFor` is the
 * checkout's question "may THIS email book THIS session while it is
 * waitlist-only?", answered by lookup plus a constant-time compare; the
 * answer becomes `acquireSeats(…, { allowWaitlist: true })`. `finalize-order`
 * marks the row `converted`, `expire-holds` marks stale offers `expired`.
 *
 * Staff alerts for a new entry come from the collection's `afterChange`
 * (so a caller added at the desk alerts too); this module sends only the
 * customer's acknowledgement and offer emails.
 */

export const OFFER_HOURS = 24;

const lower = (email: string) => email.trim().toLowerCase();

/** One row per session + email (a repeat updates `qty`); position = earlier `waiting` rows + 1; acks and staff alert. */
export async function joinWaitlist(
  req: PayloadRequest,
  input: { sessionId: string; name: string; email: string; phone?: string; qty: number; meta: { ipHash: string; userAgent: string } },
): Promise<{ position: number }> {
  const email = lower(input.email);
  const qty = Math.max(1, Math.min(12, Math.floor(input.qty)));
  const existing = await req.payload.find({
    collection: "waitlist",
    where: { and: [{ session: { equals: input.sessionId } }, { email: { equals: email } }, { status: { in: ["waiting", "notified"] } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });

  let row: Waitlist;
  if (existing.docs[0]) {
    row = (await withContext(req, { system: true, viaWaitlistEndpoint: true }, (context) =>
      req.payload.update({
        collection: "waitlist",
        id: existing.docs[0].id,
        data: { qty, name: input.name.slice(0, 120), ...(input.phone ? { phone: input.phone.slice(0, 32) } : {}) },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    )) as Waitlist;
  } else {
    const ahead = await req.payload.count({
      collection: "waitlist",
      where: { and: [{ session: { equals: input.sessionId } }, { status: { equals: "waiting" } }] },
      overrideAccess: true,
      req,
    });
    row = (await withContext(req, { system: true, viaWaitlistEndpoint: true }, (context) =>
      req.payload.create({
        collection: "waitlist",
        data: {
          session: input.sessionId,
          name: input.name.slice(0, 120),
          email,
          phone: input.phone?.slice(0, 32),
          qty,
          status: "waiting",
          position: ahead.totalDocs + 1,
          meta: { ipHash: input.meta.ipHash.slice(0, 64), userAgent: input.meta.userAgent.slice(0, 300) },
        },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    )) as Waitlist;

    const session = (await req.payload.findByID({ collection: "sessions", id: input.sessionId, depth: 0, overrideAccess: true, disableErrors: true, req })) as Session | null;
    await bestEffort(req, "waitlist_joined email", () =>
      sendTemplated(req, {
        key: "waitlist_joined",
        to: email,
        vars: { name: input.name, sessionTitle: session?.title ?? "", startsAt: session?.startsAt ?? "", qty, position: row.position ?? 1 },
        refs: { session: input.sessionId },
      }),
    );
  }
  return { position: row.position ?? 1 };
}

/** FIFO over `waiting` rows while qty ≤ freed seats: `notified`, 24-hour token, `waitlist_seat_available` email. Seats are not reserved. */
export async function notifyWaitlist(req: PayloadRequest, sessionId: string, freedSeats: number): Promise<{ notified: number }> {
  if (!Number.isInteger(freedSeats) || freedSeats < 1) return { notified: 0 };
  // depth 1: the venue's name is in the email ("… at {{session.venue}}").
  const session = (await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 1, overrideAccess: true, disableErrors: true, req })) as
    | (Session & { _status?: string })
    | null;
  if (!session || session._status !== "published" || session.bookingStatus === "closed" || session.cancelledAt) return { notified: 0 };
  const venueName = session.venue && typeof session.venue === "object" ? ((session.venue as { name?: string | null }).name ?? "") : "";

  const waiting = await req.payload.find({
    collection: "waitlist",
    where: { and: [{ session: { equals: sessionId } }, { status: { equals: "waiting" } }] },
    sort: "position",
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  });

  const base = await publicUrl(req);
  let left = freedSeats;
  let notified = 0;
  for (const row of waiting.docs as Waitlist[]) {
    if (row.qty > left) break; // strictly first come, first served
    const token = randomToken(22);
    const expires = new Date(Date.now() + OFFER_HOURS * 3_600_000);
    await withContext(req, { system: true }, (context) =>
      req.payload.update({
        collection: "waitlist",
        id: row.id,
        data: { status: "notified", notifiedAt: new Date().toISOString(), token, tokenExpiresAt: expires.toISOString() },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    );
    left -= row.qty;
    notified += 1;
    await bestEffort(req, "waitlist_seat_available email", () =>
      sendTemplated(req, {
        key: "waitlist_seat_available",
        to: row.email,
        vars: {
          name: row.name,
          sessionTitle: session.title ?? "",
          startsAt: session.startsAt,
          venueName,
          qty: row.qty,
          bookUrl: `${base}/events/${session.slug}/book?w=${token}`,
          expiresAt: expires.toISOString(),
        },
        refs: { session: sessionId },
      }),
    );
  }
  return { notified };
}

/** True when `token` is the live, unexpired token of a `notified` row for this session + email — lets checkout book a waitlist-only session. */
export async function validWaitlistTokenFor(req: PayloadRequest, sessionId: string, email: string, token?: string): Promise<boolean> {
  if (!token || typeof token !== "string" || token.length < 16 || token.length > 32 || !email) return false;
  const found = await req.payload.find({
    collection: "waitlist",
    where: { and: [{ session: { equals: sessionId } }, { email: { equals: lower(email) } }, { status: { equals: "notified" } }] },
    limit: 5,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const now = Date.now();
  return (found.docs as Waitlist[]).some((row) => {
    if (!row.token || !row.tokenExpiresAt || new Date(row.tokenExpiresAt).getTime() <= now) return false;
    const a = Buffer.from(row.token, "utf8");
    const b = Buffer.from(token, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** `finalize-order` bookkeeping: the offer for this session + email turned into a booking. */
export async function markWaitlistConverted(req: PayloadRequest, sessionId: string, email: string, orderId: string): Promise<void> {
  const found = await req.payload.find({
    collection: "waitlist",
    where: { and: [{ session: { equals: sessionId } }, { email: { equals: lower(email) } }, { status: { in: ["waiting", "notified"] } }] },
    limit: 5,
    depth: 0,
    overrideAccess: true,
    req,
  });
  for (const row of found.docs) {
    await withContext(req, { system: true }, (context) =>
      req.payload.update({ collection: "waitlist", id: row.id, data: { status: "converted", convertedOrder: orderId }, depth: 0, overrideAccess: true, context, req }),
    );
  }
}

/** Every open entry of a session → `cancelled` (Cancel session & refund all). */
export async function cancelWaitlistFor(req: PayloadRequest, sessionId: string): Promise<number> {
  const found = await req.payload.find({
    collection: "waitlist",
    where: { and: [{ session: { equals: sessionId } }, { status: { in: ["waiting", "notified"] } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    req,
  });
  for (const row of found.docs) {
    await withContext(req, { system: true }, (context) =>
      req.payload.update({ collection: "waitlist", id: row.id, data: { status: "cancelled" }, depth: 0, overrideAccess: true, context, req }),
    );
  }
  return found.docs.length;
}
