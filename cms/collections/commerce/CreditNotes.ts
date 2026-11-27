import crypto from "node:crypto";
import { APIError, ValidationError, type CollectionAfterChangeHook, type CollectionBeforeValidateHook, type CollectionConfig } from "payload";

import { isAdmin, isStaff } from "@/cms/access/roles";
import { money } from "@/cms/fields";
import { formatAed } from "@/cms/lib/money";
import { appendTimeline } from "@/cms/lib/orderState";

import { BOOKINGS_GROUP, sidebarFor, systemDate, systemField } from "./shared";

/**
 * ==========================================================================
 * credit-notes — booking credits issued to customers (FEAT #183)
 * ==========================================================================
 *
 * Allows admins to issue booking credits to customers who want to reschedule
 * their sessions, rather than direct refunds. Each credit note is linked to the
 * original booking ID, has a mandatory expiry date, and carries a unique promo
 * code that the customer can redeem on a future booking.
 *
 * Status:
 *   available → partially_redeemed → redeemed | expired
 *
 * A note is a balance, not a single-use voucher: a booking takes what it
 * needs (at most the booking total) and the rest stays on the note for the
 * next booking. `redeemedAmountFils` is the running total spent, the balance
 * is `amountFils − redeemedAmountFils`, and a cancellation puts its share
 * back (cms/lib/pricing.ts reserveCreditNoteSql / restoreCreditNoteSql).
 *
 * Validated at checkout:
 *   - belongs to the matching customer email (online)
 *   - not expired (current time < expiresAt)
 *   - has a balance left
 */

export const CREDIT_NOTE_STATUSES = [
  { label: "Available", value: "available" },
  { label: "Partially Redeemed", value: "partially_redeemed" },
  { label: "Fully Redeemed", value: "redeemed" },
  { label: "Expired", value: "expired" },
] as const;

export const normaliseCreditNoteCode = (value: unknown): unknown =>
  typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : value;

export const mintCreditNoteCode = (): string =>
  `CN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

/**
 * A refusal the admin can read. Payload's ValidationError puts our text only on the field and
 * toasts "The following field is invalid: …"; the toast reads `message`, so it carries ours too.
 * `name` is set explicitly: the production build strips class names (Turbopack emits anonymous
 * class expressions, see cms/endpoints/requireRole.ts withPublicErrors), and Payload's formatErrors
 * keeps a message only when the error has `data` (instanceof) or a `name`. If `instanceof` ever
 * fails, formatErrors keeps only the message (the toast), not `data`, so the inline field error is
 * lost. No ':' in messages — the toast splits on the first one.
 */
const fieldRefusal = (path: string, label: string, message: string, t?: ConstructorParameters<typeof ValidationError>[1]) => {
  const error = new ValidationError({ collection: "credit-notes", errors: [{ path, label, message }] }, t);
  error.message = message;
  error.name = "ValidationError";
  return error;
};

export const prepareCreditNote: CollectionBeforeValidateHook = async ({ data, req, operation, originalDoc }) => {
  if (!data) return data;

  if (operation === "create") {
    if (!data.code || typeof data.code !== "string" || !data.code.trim()) {
      data.code = mintCreditNoteCode();
    } else {
      data.code = normaliseCreditNoteCode(data.code);
    }

    if (!data.expiresAt) {
      throw fieldRefusal("expiresAt", "Expiry date", "Expiry date is mandatory.", req?.t);
    }
  } else if (operation === "update") {
    if (data.code && typeof data.code === "string") {
      data.code = normaliseCreditNoteCode(data.code);
    }
    if ("expiresAt" in data && !data.expiresAt && !originalDoc?.expiresAt) {
      throw fieldRefusal("expiresAt", "Expiry date", "Expiry date is mandatory.", req?.t);
    }
  }

  const orderId =
    typeof data.order === "string"
      ? data.order
      : data.order && typeof data.order === "object" && "id" in data.order
        ? String(data.order.id)
        : undefined;

  // Prevent duplicate credit note issuance against the same booking
  if (orderId && operation === "create" && req?.payload?.find && !req.context?.issuingCreditNotesBatch) {
    try {
      const existing = await req.payload.find({
        collection: "credit-notes",
        where: { order: { equals: orderId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      });
      if (existing.docs.length > 0) {
        throw fieldRefusal("order", "Original booking ID", "A credit note has already been issued for this booking.", req?.t);
      }
    } catch (err) {
      if (err instanceof APIError) throw err;
    }
  }

  if (operation === "create" && orderId && (!data.customerEmail || !data.customerName || !data.customer)) {
    try {
      const order = await req.payload.findByID({
        collection: "orders",
        id: orderId,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
        req,
      });
      if (order) {
        if (!data.customerEmail && order.contact?.email) {
          data.customerEmail = order.contact.email.toLowerCase().trim();
        }
        if (!data.customerName) {
          data.customerName = [order.contact?.firstName, order.contact?.lastName].filter(Boolean).join(" ");
        }
        if (!data.customer && order.customer) {
          data.customer = typeof order.customer === "string" ? order.customer : order.customer.id;
        }
      }
    } catch {
      // ignore
    }
  }

  // Auto-expire check
  const currentExpiresAt = data.expiresAt || (originalDoc as { expiresAt?: string } | undefined)?.expiresAt;
  const currentStatus = data.status || (originalDoc as { status?: string } | undefined)?.status;
  if ((currentStatus === "available" || currentStatus === "partially_redeemed") && currentExpiresAt) {
    if (new Date(currentExpiresAt).getTime() <= Date.now()) {
      data.status = "expired";
    }
  }

  // After auto-expiry, so a lapsed note becomes Expired rather than being refused.
  const mismatch = statusBalanceMismatch(data, originalDoc, operation);
  if (mismatch) throw fieldRefusal(mismatch.path, mismatch.label, mismatch.message, req?.t);

  return data;
};

/**
 * The status an admin picks must agree with the balance (#214 QA: a spent note
 * set back to "Available" by hand showed as usable but had nothing left).
 * Checked only on create or when the status or amount changes, so unrelated
 * edits to an older row still save. Expired is always allowed (it withdraws a
 * note). A note with any credit used can never go back to Available. The
 * error sits on `amountFils` when only the amount changed, else on `status`.
 * The checkout's atomic SQL bypasses hooks and keeps status and balance in step.
 * Messages name the amounts involved and contain no ':' (see fieldRefusal).
 */
function statusBalanceMismatch(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  operation: string,
): { path: string; label: string; message: string } | null {
  const status = (data.status ?? originalDoc?.status) as string | undefined;
  if (!status || status === "expired") return null;
  const statusChanged = operation !== "update" || !originalDoc || status !== originalDoc.status;
  const amountChanged =
    operation === "update" && (!originalDoc || Number(data.amountFils ?? originalDoc.amountFils) !== Number(originalDoc.amountFils));
  if (!statusChanged && !amountChanged) return null;
  const path = statusChanged ? "status" : "amountFils";

  const amountFils = Number(data.amountFils ?? originalDoc?.amountFils);
  if (!Number.isFinite(amountFils) || amountFils <= 0) return null;
  const redeemedFils = Math.max(0, Math.round(Number(data.redeemedAmountFils ?? originalDoc?.redeemedAmountFils ?? 0)) || 0);
  const balanceFils = Math.max(0, Math.round(amountFils) - redeemedFils);

  const used = formatAed(redeemedFils);
  const amount = formatAed(amountFils);
  const left = formatAed(balanceFils);
  const statusLabel = ({ available: "Available", partially_redeemed: "Partially Redeemed", redeemed: "Fully Redeemed" } as Record<string, string>)[status] ?? status;
  const keep = redeemedFils > 0 ? "Partially Redeemed" : "Available";

  let message: string | null = null;
  if ((status === "available" || status === "partially_redeemed") && balanceFils <= 0) {
    message = statusChanged
      ? `This credit note has already been fully redeemed (${used} of ${amount} used). Its status cannot be changed to ${statusLabel}.`
      : `${used} of this credit note has already been used, so its credit amount must be more than ${used} while it is ${statusLabel}. Enter a higher amount, or change the status to Fully Redeemed.`;
  } else if (status === "available" && redeemedFils > 0) {
    message = statusChanged
      ? `This credit note has already been partially redeemed (${left} of ${amount} left). Its status cannot be changed to Available.`
      : `With a credit amount of ${amount}, ${left} would be left after ${used} already used, so it cannot stay Available. Change the status to Partially Redeemed.`;
  } else if (status === "redeemed" && balanceFils > 0) {
    message = statusChanged
      ? `This credit note still has ${left} of ${amount} left, so its status cannot be changed to Fully Redeemed. Change the status to ${keep}, or set it to Expired to withdraw it.`
      : redeemedFils > 0
        ? `This credit note is Fully Redeemed and ${used} of it has been used, so its credit amount cannot be raised above ${used}. Keep it at ${used}, or change the status to Partially Redeemed.`
        : `No credit has been recorded as used on this note, so it cannot stay Fully Redeemed with a credit amount of ${amount}. Change the status to Available, or set it to Expired to withdraw it.`;
  }
  return message ? { path, label: statusChanged ? "Status" : "Credit amount", message } : null;
}

export const creditNoteAfterChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === "create" && doc.order) {
    const orderId = typeof doc.order === "string" ? doc.order : doc.order.id;
    if (orderId) {
      try {
        await appendTimeline(req, orderId, "credit_note_issued", {
          code: doc.code,
          amount: formatAed(doc.amountFils),
          expiresAt: doc.expiresAt,
        });
      } catch {
        // best effort
      }
    }
  }
};

export const CreditNotes: CollectionConfig = {
  slug: "credit-notes",
  labels: { singular: "Credit note", plural: "Credit notes" },
  admin: {
    group: "Credit Notes",
    useAsTitle: "code",
    defaultColumns: ["code", "order", "redeemedInOrder", "customerEmail", "amountFils", "balanceFils", "status", "expiresAt", "issuedAt"],
    description: "Credit notes issued to customers for rescheduling. Redeemed at checkout via promo code.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["code", "customerEmail", "customerName"],
    components: {
      beforeListTable: [
        {
          path: "@/cms/components/admin/ListIntro#ListIntro",
          clientProps: {
            icon: "ticket",
            heading: "No credit notes yet",
            body: "Credit notes are issued against bookings for rescheduling. Each credit note generates a unique promo code that customers can redeem on a future booking before the mandatory expiry date.",
            actions: [{ label: "Issue a credit note", href: "/collections/credit-notes/create", primary: true }],
          },
        },
      ],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [prepareCreditNote],
    afterChange: [creditNoteAfterChange],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "code",
          type: "text",
          label: "Promo code",
          required: true,
          unique: true,
          index: true,
          maxLength: 40,
          hooks: {
            beforeValidate: [
              ({ value, operation }) => {
                if (operation === "update" && (value === undefined || value === null)) return value;
                return typeof value === "string" && value.trim() ? normaliseCreditNoteCode(value) : mintCreditNoteCode();
              },
            ],
          },
          admin: {
            width: "50%",
            description: "Unique promo code redeemed by the customer at checkout (auto-generated if left blank).",
          },
        },
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "available",
          index: true,
          options: [...CREDIT_NOTE_STATUSES],
          admin: {
            width: "50%",
            description: "Available, Partially Redeemed, Fully Redeemed, or Expired.",
            components: {
              Field: "@/cms/components/fields/CreditNoteStatusField#CreditNoteStatusField",
              Cell: {
                path: "@/cms/components/admin/StatusCell#StatusCell",
                clientProps: {
                  labels: {
                    available: "Available",
                    partially_redeemed: "Partially Redeemed",
                    redeemed: "Fully Redeemed",
                    expired: "Expired",
                  },
                  tones: { available: "ok", partially_redeemed: "lilac", redeemed: "lilac", expired: "muted" },
                },
              },
            },
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "order",
          type: "relationship",
          relationTo: "orders",
          label: "Original booking ID",
          required: true,
          index: true,
          admin: {
            width: "50%",
            description: "The original booking this credit note is linked to.",
          },
        },
        money("amountFils", {
          label: "Credit amount",
          required: true,
          admin: {
            width: "50%",
            description: "Amount of credit in AED (e.g. 2500 = AED 25.00).",
          },
        }),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "customer",
          type: "relationship",
          relationTo: "customers",
          label: "Customer",
          index: true,
          admin: { width: "34%", description: "Auto-populated from the booking." },
        },
        {
          name: "customerEmail",
          type: "email",
          label: "Customer email",
          required: true,
          index: true,
          admin: { width: "33%", description: "Used to verify customer identity at checkout." },
        },
        {
          name: "customerName",
          type: "text",
          label: "Customer name",
          maxLength: 120,
          admin: { width: "33%", description: "Name as booked." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "issuedAt",
          type: "date",
          label: "Issue date",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: "50%",
            date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
            description: "When this credit note was issued.",
          },
        },
        {
          name: "expiresAt",
          type: "date",
          label: "Expiry date",
          required: true,
          index: true,
          validate: (val: unknown, { operation }: { operation?: string }) => {
            if (operation === "update" && (val === undefined || val === null)) return true;
            if (!val) return "Expiry date is mandatory.";
            return true;
          },
          admin: {
            width: "50%",
            date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
            description: "Mandatory expiry date. Cannot be redeemed after this date.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        systemField({
          name: "redeemedInOrder",
          type: "relationship",
          relationTo: "orders",
          label: "Last redeemed in booking",
          index: true,
          admin: {
            width: "34%",
            description: "The most recent booking that used this credit note. Every booking is listed under Bookings that used this note.",
          },
        }),
        systemDate("redeemedAt", "Last redeemed date", {
          description: "When the credit note was last used.",
        }),
        systemField(
          money("redeemedAmountFils", {
            label: "Redeemed so far",
            admin: {
              width: "33%",
              description: "Total credit used across all bookings.",
            },
          }),
        ),
      ],
    },
    systemField(
      money("balanceFils", {
        label: "Remaining balance",
        virtual: true,
        hooks: {
          afterRead: [
            ({ siblingData }) =>
              Math.max(0, Math.round(Number(siblingData?.amountFils ?? 0)) - Math.round(Number(siblingData?.redeemedAmountFils ?? 0))),
          ],
        },
        admin: {
          description: "Credit still available for the customer's next booking (credit amount less what has been redeemed).",
        },
      }),
    ),
    {
      name: "redemptions",
      type: "join",
      collection: "orders",
      on: "creditNoteUsed",
      label: "Bookings that used this note",
      admin: { allowCreate: false, defaultColumns: ["reference", "status", "createdAt"] },
    },
    {
      name: "notes",
      type: "textarea",
      label: "Notes",
      maxLength: 1000,
      admin: {
        description: "Reason for issuing credit note or internal notes for staff.",
      },
    },
  ],
};
