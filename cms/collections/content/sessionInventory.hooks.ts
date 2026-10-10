import {
  APIError,
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionAfterReadHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
  type RequestContext,
} from "payload";

import { roleOf } from "@/cms/access/roles";
import { findLiveRow, latestIsLive } from "@/cms/hooks/formatSlug";

/**
 * ==========================================================================
 * Sessions ⇄ session-inventory — the seat counters' lifecycle (SPEC §D.2, §H.3)
 * ==========================================================================
 *
 * Seats sold and held live on a `session-inventory` row, one per session,
 * and the only thing that ever changes them is the guarded SQL in
 * cms/lib/inventory.ts (Phase 3). Editor saves of the session never touch
 * that row — which is the point: Payload writes the whole row on every
 * update and a publish copies a version snapshot over the live row, so a
 * counter kept on the session would be clobbered by any save that raced a
 * checkout. Everything in this file is about keeping the two in step
 * without ever writing a counter from Payload:
 *
 *   · afterChange   the row exists for every session — created at 0/0 with
 *                   the session (and recreated if somehow missing), through
 *                   the Local API with `context.system`, so the collection's
 *                   `create: systemOnly` rule is exercised, not bypassed.
 *   · afterRead     the four VIRTUAL fields: `seatsAvailable`,
 *                   `isFullyBooked` for everyone; `seatsSold`, `seatsHeld`
 *                   for staff (and for server code reading with
 *                   `overrideAccess`). Field access has already stripped
 *                   them for the public when this hook runs, so it must
 *                   check the same rule before adding them back.
 *   · beforeValidate  capacity never below sold + held.
 *   · beforeChange  no direct date or venue change once tickets are sold —
 *                   the Reschedule action (Phase 3) sets `context.reschedule`
 *                   because it also tells the ticket holders.
 *   · beforeDelete  refuse while seats are sold or held; otherwise remove
 *                   the counter row FIRST, inside the same transaction, so
 *                   the row's required foreign key never dangles.
 *   · afterDelete   belt and braces: sweep any row still pointing here.
 */

export type SeatCounts = { seatsSold: number; seatsHeld: number };

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);

/**
 * The counter row for a session, read at the adapter level: no access, no
 * hooks, inside the request's transaction. `null` when there is none (a
 * session created before this hook existed — the virtual fields then read
 * as "nothing sold" and the next save creates the row). Errors propagate:
 * guessing "no row" on a failed read would make `ensureInventoryRow` try a
 * second insert, and a swallowed error inside a transaction resurfaces at
 * commit anyway.
 */
export async function readSeatCounts(req: PayloadRequest, sessionId: unknown): Promise<SeatCounts | null> {
  if (sessionId === undefined || sessionId === null || sessionId === "") return null;
  const row = (await req.payload.db.findOne({
    collection: "session-inventory",
    req,
    where: { session: { equals: sessionId } },
  })) as Record<string, unknown> | null;
  if (row) req.context[seenKey(sessionId)] = true;
  return row ? { seatsSold: count(row.seatsSold), seatsHeld: count(row.seatsHeld) } : null;
}

/** Set when this request has already seen the session's counter row (saves a query in `ensureInventoryRow`). */
const seenKey = (sessionId: unknown) => `inventorySeen:${String(sessionId)}`;

/**
 * Run a Local API call as "the system" on the CALLER's request (so it joins
 * the caller's transaction) and put the context back afterwards. Payload's
 * Local API merges `context` into `req.context` in place
 * (utilities/createLocalReq.js), which would otherwise leave every later
 * operation in this request flagged as system.
 */
async function asSystem<T>(req: PayloadRequest, run: (context: RequestContext) => Promise<T>): Promise<T> {
  const saved = req.context;
  try {
    return await run({ system: true, skipRevalidate: true });
  } finally {
    req.context = saved;
  }
}

const idOf = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : undefined;
  }
  return undefined;
};

const instant = (value: unknown): number | undefined => {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? undefined : ms;
};

const people = (n: number) => (n === 1 ? "1 person holds a ticket" : `${n} people hold tickets`);

/* ────────────────────────────────────────────────────────────────────────── */

/** afterRead: the virtual seat fields, from the counter row. */
export const addSeatVirtuals: CollectionAfterReadHook = async ({ doc, overrideAccess, req }) => {
  if (!doc || typeof doc !== "object" || !doc.id) return doc;

  // Use the join when this read already populated it (staff, depth ≥ 1); otherwise one indexed lookup.
  const joined = (doc.inventory as { docs?: unknown[] } | undefined)?.docs?.[0];
  let counts: SeatCounts;
  if (joined && typeof joined === "object" && "seatsSold" in joined) {
    counts = { seatsSold: count((joined as SeatCounts).seatsSold), seatsHeld: count((joined as SeatCounts).seatsHeld) };
    req.context[seenKey(doc.id)] = true;
  } else {
    counts = (await readSeatCounts(req, doc.id)) ?? { seatsSold: 0, seatsHeld: 0 };
  }

  // A `select` that left out capacity cannot be answered; say nothing rather than something wrong.
  if (typeof doc.seatsTotal === "number") {
    const available = Math.max(0, doc.seatsTotal - counts.seatsSold - counts.seatsHeld);
    doc.seatsAvailable = available;
    doc.isFullyBooked = available === 0;
  }

  const role = roleOf(req);
  if (overrideAccess === true || role === "admin" || role === "front-desk") {
    doc.seatsSold = counts.seatsSold;
    doc.seatsHeld = counts.seatsHeld;
  }
  return doc;
};

/** beforeValidate: "12 seats are already sold or held; capacity cannot go below 12". */
export const capacityFloor: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data || !originalDoc?.id || !("seatsTotal" in data)) return data;
  const total = data.seatsTotal;
  if (typeof total !== "number") return data;
  // Unchanged or raised: the earlier value already cleared the floor, and the
  // inventory SQL never sells past capacity — only a cut needs the counters.
  if (typeof originalDoc.seatsTotal === "number" && total >= originalDoc.seatsTotal) return data;
  const counts = await readSeatCounts(req, originalDoc.id);
  const taken = counts ? counts.seatsSold + counts.seatsHeld : 0;
  if (total < taken) {
    throw new ValidationError(
      {
        collection: "sessions",
        errors: [
          {
            path: "seatsTotal",
            message: `${taken} ${taken === 1 ? "seat is" : "seats are"} already sold or held; capacity cannot go below ${taken}.`,
          },
        ],
      },
      req.t,
    );
  }
  return data;
};

/** beforeChange: the date and venue are frozen while tickets are out, except through Reschedule. */
export const requireRescheduleOnceSold: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== "update" || !originalDoc?.id || req.context?.reschedule === true) return data;
  let touchesWhen = "startsAt" in data;
  let touchesWhere = "venue" in data;
  // Against a published latest version (= the live row), unchanged values need no lookup at all.
  if (latestIsLive(originalDoc)) {
    touchesWhen &&= instant(data.startsAt) !== instant(originalDoc.startsAt);
    touchesWhere &&= (idOf(data.venue) ?? null) !== (idOf(originalDoc.venue) ?? null);
  }
  if (!touchesWhen && !touchesWhere) return data;

  const counts = await readSeatCounts(req, originalDoc.id);
  if (!counts || counts.seatsSold === 0) return data;

  const live = await findLiveRow(req, "sessions", originalDoc.id);
  if (!live) return data;

  const errors: Array<{ path: string; message: string }> = [];
  const message = `${people(counts.seatsSold)} for this session — use Reschedule so they are told.`;
  if (touchesWhen && instant(data.startsAt) !== instant(live.startsAt)) errors.push({ path: "startsAt", message });
  if (touchesWhere && (idOf(data.venue) ?? null) !== (idOf(live.venue) ?? null)) errors.push({ path: "venue", message });
  if (errors.length > 0) throw new ValidationError({ collection: "sessions", errors }, req.t);
  return data;
};

/** afterChange: every session has its counter row. */
export const ensureInventoryRow: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!doc?.id || req.context[seenKey(doc.id)] === true || (await readSeatCounts(req, doc.id))) return doc;
  await asSystem(req, (context) =>
    req.payload.create({
      collection: "session-inventory",
      data: { session: doc.id, seatsSold: 0, seatsHeld: 0 },
      depth: 0,
      overrideAccess: false,
      context,
      req,
    }),
  );
  return doc;
};

/** beforeDelete: never with tickets out or seats in a basket; otherwise take the counter row with it. */
export const refuseDeleteWithSeats: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const counts = await readSeatCounts(req, id);
  if (counts && counts.seatsSold > 0) {
    throw new APIError(
      `${people(counts.seatsSold)} for this session, so it cannot be deleted. Use “Cancel session & refund all” instead.`,
      409,
      undefined,
      true,
    );
  }
  if (counts && counts.seatsHeld > 0) {
    throw new APIError(
      `${counts.seatsHeld} ${counts.seatsHeld === 1 ? "seat is" : "seats are"} in someone's basket right now. Try again when the hold has expired (a few minutes).`,
      409,
      undefined,
      true,
    );
  }
  await removeInventoryRows(req, id);
};

/** afterDelete: nothing should be left; sweep anyway. */
export const removeInventoryRow: CollectionAfterDeleteHook = async ({ doc, id, req }) => {
  await removeInventoryRows(req, id ?? doc?.id);
  return doc;
};

/**
 * `overrideAccess: true` here, unlike the create above: Payload validates a
 * delete's `where` against the caller's READ access, and an editor — who
 * may delete a session — may not read seat counters (§J), so the clause
 * would be refused ("The following path cannot be queried: session").
 * The call is still marked `context.system`.
 */
async function removeInventoryRows(req: PayloadRequest, sessionId: unknown): Promise<void> {
  if (sessionId === undefined || sessionId === null || sessionId === "") return;
  await asSystem(req, (context) =>
    req.payload.delete({
      collection: "session-inventory",
      where: { session: { equals: sessionId } },
      depth: 0,
      overrideAccess: true,
      context,
      req,
    }),
  );
}
