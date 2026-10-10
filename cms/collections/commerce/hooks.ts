import { randomUUID } from "node:crypto";

import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
} from "payload";

import { roleOf } from "@/cms/access/roles";
import type { Order, Refund } from "@/payload-types";
import { mintTicket } from "@/cms/lib/contracts";
import { queueJob, withContext } from "@/cms/lib/inventory";
import { formatAed, MIN_REFUND_FILS } from "@/cms/lib/money";
import { recomputeCustomerStats, refundableFils } from "@/cms/lib/orders";
import { timelineEntry, timelineOf } from "@/cms/lib/orderState";
import { DEFAULT_REFERENCE_PREFIX, mintPassCode, mintReference } from "@/cms/lib/reference";

/**
 * ==========================================================================
 * Bookings hooks — the rules the commerce collections enforce themselves
 * ==========================================================================
 *
 * SPEC §D.7, one place: the collection files hold the schema (3A-0), this
 * file holds what must be true of every write whoever makes it — the admin
 * form, REST, a job, the checkout.
 *
 *   orders     mint the reference · refuse a status change that did not come
 *              through `transition()` (`context.orderTransition`) · log a
 *              staff contact correction in the timeline and carry it to the
 *              customer row · recompute the customer's totals when an order
 *              is confirmed, refunded, cancelled or completed
 *   customers  one spelling of an email (lowercased, trimmed)
 *   tickets    mint code + QR + stored signature when none was given (3E)
 *   pass-purchases  mint the `MPP-` code
 *   invoices   immutable once issued, except the PDF and the sent stamp
 *   refunds    the request rules (paid order, AED 1 … what is left), the
 *              status edges and who may take them, the staff alert on a
 *              request and the `process-refund` job on approval
 *   waitlist   lowercased email; staff alert on a new entry
 *
 * Staff alerts are QUEUED (`notify-staff` job) rather than sent inline: a
 * hook runs inside the write's transaction, and a job row commits or rolls
 * back with the write — an alert can neither fire for a refund that was
 * rolled back nor take the refund down with it if the mailer is broken.
 */

const idOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

const isSystem = (req: PayloadRequest) => req.context?.system === true;

/* ────────────────────────────────────────────────────────────────────────── */
/* orders                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** beforeValidate (create): the booking reference, with the prefix from Booking settings. */
export const mintOrderReference: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data || data.reference) return data;
  const booking = (await req.payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, req }).catch(() => null)) as { referencePrefix?: string } | null;
  data.reference = mintReference(booking?.referencePrefix || DEFAULT_REFERENCE_PREFIX);
  return data;
};

/** beforeChange: `status` moves only through `transition()` (SPEC §H.1). */
export const guardOrderStatus: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (req.context?.orderTransition === true) return data;
  if (operation === "create") {
    if (data.status && data.status !== "pending_payment") throw new APIError("A new order always starts as Pending payment.", 400, undefined, true);
    return data;
  }
  if ("status" in data && data.status !== undefined && data.status !== originalDoc?.status) {
    throw new APIError("An order's status changes only through its actions (refund, cancel, move) or the payment system.", 403, undefined, true);
  }
  return data;
};

const CONTACT_FIELDS = ["firstName", "lastName", "email", "phone", "marketingOptIn"] as const;

/**
 * afterChange: a staff correction of the contact details is logged and
 * carried to the customer record (§D.3: "Contact changed by {user}"). A new
 * email moves the order to that address's customer row, creating it if
 * needed, so "my bookings" for the corrected address finds the order.
 */
export const syncContactChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || isSystem(req) || !req.user || !previousDoc) return doc;
  const order = doc as Order;
  const before = (previousDoc as Order).contact ?? {};
  const after = order.contact ?? {};
  const changed = CONTACT_FIELDS.filter((key) => (before[key] ?? null) !== (after[key] ?? null));
  if (changed.length === 0) return doc;

  const email = after.email?.trim().toLowerCase();
  let customerId = idOf(order.customer);
  await withContext(req, { system: true }, async (context) => {
    if (email && changed.includes("email")) {
      const found = await req.payload.find({ collection: "customers", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, req });
      customerId =
        found.docs[0]?.id ??
        (await req.payload.create({
          collection: "customers",
          data: { email, firstName: after.firstName, lastName: after.lastName, phone: after.phone ?? undefined, sessionVersion: 1 },
          depth: 0,
          overrideAccess: true,
          context,
          req,
        })).id;
    }
    if (customerId && (changed.includes("phone") || changed.includes("firstName") || changed.includes("lastName"))) {
      await req.payload.update({
        collection: "customers",
        id: customerId,
        data: { ...(after.phone ? { phone: after.phone } : {}), ...(after.firstName ? { firstName: after.firstName } : {}), ...(after.lastName ? { lastName: after.lastName } : {}) },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      });
    }
    await req.payload.update({
      collection: "orders",
      id: order.id,
      data: {
        ...(customerId && customerId !== idOf(order.customer) ? { customer: customerId } : {}),
        timeline: [...timelineOf(order), timelineEntry(req, "contact_changed", { fields: changed })],
      },
      depth: 0,
      overrideAccess: true,
      context,
      req,
    });
    // The order changed hands: both customers' totals follow it.
    const previousCustomer = idOf(order.customer);
    if (customerId && customerId !== previousCustomer) {
      await recomputeCustomerStats(req, customerId);
      if (previousCustomer) await recomputeCustomerStats(req, previousCustomer);
    }
  });
  return doc;
};

/** afterChange: the customer's totals follow every status that changes them. */
export const refreshCustomerStats: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const order = doc as Order;
  if (previousDoc && (previousDoc as Order).status === order.status) return doc;
  if (!["confirmed", "completed", "refunded", "cancelled"].includes(order.status)) return doc;
  const customerId = idOf(order.customer);
  if (customerId) await withContext(req, { system: true }, () => recomputeCustomerStats(req, customerId));
  return doc;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* customers · waitlist · tickets · pass-purchases                            */
/* ────────────────────────────────────────────────────────────────────────── */

/** beforeValidate: one spelling of an address — "Ana@Example.com " and "ana@example.com" are one customer. */
export const lowercaseEmail: CollectionBeforeValidateHook = ({ data }) => {
  if (data && typeof data.email === "string") data.email = data.email.trim().toLowerCase();
  return data;
};

/** beforeValidate (create): code + QR payload + stored signature, when the creator did not mint them (3E's `mintTicket`). */
export const mintTicketCode: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation !== "create" || !data || data.code) return data;
  const minted = mintTicket();
  return { ...data, ...minted };
};

/** beforeValidate (create): the `MPP-` code customers type at checkout. */
export const mintPassPurchaseCode: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation !== "create" || !data || data.code) return data;
  data.code = mintPassCode();
  return data;
};

/** afterChange (create): somebody joined a waitlist — staff hear about it whoever added them. */
export const alertWaitlistJoined: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== "create") return doc;
  const session = idOf(doc.session);
  await queueJob(req, "notify-staff", {
    event: "waitlist_joined",
    vars: { name: doc.name, email: doc.email, qty: doc.qty, position: doc.position ?? null },
    refs: session ? { session } : undefined,
  });
  return doc;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* invoices                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const MUTABLE_AFTER_ISSUE = new Set(["file", "generatedAt", "emailedAt", "updatedAt", "createdAt", "id"]);

/** Strips array-row ids and populated relationships so "the same value" compares equal. */
const normalise = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") {
    if ("id" in value && Object.keys(value).length > 2 && "createdAt" in value) return (value as { id: unknown }).id;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => k !== "id")
        .map(([k, v]) => [k, normalise(v)]),
    );
  }
  return value ?? null;
};

/** beforeChange: an issued invoice's figures never change — a mistake is corrected by a credit note. */
export const freezeIssuedInvoice: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation !== "update" || !originalDoc?.issuedAt) return data;
  for (const [key, value] of Object.entries(data)) {
    if (MUTABLE_AFTER_ISSUE.has(key)) continue;
    if (JSON.stringify(normalise(value)) !== JSON.stringify(normalise((originalDoc as Record<string, unknown>)[key]))) {
      throw new APIError(`Invoice ${originalDoc.number} was issued and cannot change (“${key}”). Issue a credit note instead.`, 409, undefined, true);
    }
  }
  return data;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* refunds                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** Who may take each status edge. `system` = the jobs and the order actions (Local API, `context.system`). */
export const REFUND_EDGES: Readonly<Record<Refund["status"], readonly Refund["status"][]>> = {
  requested: ["approved", "succeeded", "failed"], // succeeded: Mark repaid (desk)
  approved: ["processing", "succeeded", "failed"], // succeeded: found already refunded at Mamo
  processing: ["succeeded", "failed"],
  succeeded: [],
  failed: ["approved"], // an admin may retry a failed refund
};

/** beforeValidate (create): the double-click key and the requester, when the admin form created the row. */
export const prepareRefund: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== "create" || !data) return data;
  if (!data.idempotencyKey) data.idempotencyKey = `manual:${randomUUID()}`;
  if (!data.requestedBy && req.user) data.requestedBy = req.user.id;
  return data;
};

/** beforeChange: request rules for human-made rows; status edges and the admin-only approval for everyone. */
export const guardRefund: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation === "create") {
    if (isSystem(req)) return data;
    // Created from the admin form (front desk may request): the same rules as the Refund action.
    const order = (await req.payload.findByID({ collection: "orders", id: idOf(data.order) as string, depth: 0, overrideAccess: true, disableErrors: true, req })) as Order | null;
    if (!order || !["confirming", "confirmed", "completed"].includes(order.status)) throw new APIError("Only paid orders can be refunded.", 400, undefined, true);
    const amount = Number(data.amountFils);
    if (!Number.isInteger(amount) || amount < MIN_REFUND_FILS) throw new APIError("The smallest refund is AED 1.00.", 400, undefined, true);
    const max = await refundableFils(req, order);
    if (amount > max) throw new APIError(`At most ${formatAed(max)} can still be refunded on this order.`, 400, undefined, true);
    // The money comes back from THIS order's payment, whatever the form sent: a supplied payment of
    // another order would let an approved "refund on order A" move money from customer B's charge.
    const own = idOf(order.payment);
    if (data.payment && idOf(data.payment) !== own) throw new APIError("A refund can only be made against the order's own payment.", 400, undefined, true);
    data.payment = own ?? null;
    data.status = "requested";
    if (order.channel === "desk") data.providerRefundId = "desk";
    return data;
  }

  const from = originalDoc?.status as Refund["status"] | undefined;
  const to = data.status as Refund["status"] | undefined;
  if (from && to && to !== from) {
    if (!isSystem(req)) throw new APIError("A refund's status changes only through Approve, Mark repaid and the refund job.", 403, undefined, true);
    if (!REFUND_EDGES[from].includes(to)) throw new APIError(`A refund cannot go from “${from}” to “${to}”.`, 409, undefined, true);
    const role = roleOf(req);
    if (to === "approved" && req.user && role !== "admin") throw new APIError("Only an admin can approve a refund.", 403, undefined, true);
  }
  // Once approved, the request itself is frozen: approving one amount and paying another is not a thing.
  if (!isSystem(req) && from && from !== "requested") {
    for (const key of ["amountFils", "reason", "releaseSeats", "order", "payment"] as const) {
      if (key in data && JSON.stringify(normalise(data[key])) !== JSON.stringify(normalise(originalDoc?.[key]))) {
        throw new APIError("This refund has been approved; its amount and reason can no longer change.", 409, undefined, true);
      }
    }
  }
  return data;
};

/** afterChange: a request alerts the admins; an approval queues `process-refund` (Mamo refunds only). */
export const refundSideEffects: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  const refund = doc as Refund;
  const orderId = idOf(refund.order) as string;
  const became = (status: Refund["status"]) => refund.status === status && (operation === "create" || (previousDoc as Refund | undefined)?.status !== status);

  if (became("requested")) {
    const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, disableErrors: true, req })) as Order | null;
    // Who asked, by name: the requester row, else the signed-in user, else the system (a cancel or a move).
    const requesterId = idOf(refund.requestedBy) ?? idOf(req.user);
    const requester = requesterId
      ? ((await req.payload.findByID({ collection: "users", id: requesterId, depth: 0, overrideAccess: true, disableErrors: true, req })) as { name?: string | null; email?: string | null } | null)
      : null;
    await queueJob(req, "notify-staff", {
      event: "refund_requested",
      vars: {
        reference: order?.reference ?? "",
        refund: { amount: formatAed(refund.amountFils) },
        reason: refund.reason, // a code; aliases.ts words it in the staff's voice
        requestedByName: requester?.name || requester?.email || "The system",
        note: refund.note ?? "",
      },
      refs: { order: orderId, refund: refund.id },
    });
  }
  if (became("approved") && refund.providerRefundId !== "desk") {
    const paymentId = idOf(refund.payment);
    if (paymentId) await queueJob(req, "process-refund", { refundId: refund.id, paymentId, orderId });
  }
  return doc;
};
