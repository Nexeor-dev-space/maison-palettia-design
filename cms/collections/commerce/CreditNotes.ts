import crypto from "node:crypto";
import { APIError, type CollectionAfterChangeHook, type CollectionBeforeValidateHook, type CollectionConfig } from "payload";

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
 *   available → redeemed | expired
 *
 * Validated at checkout:
 *   - belongs to the matching customer email (online)
 *   - not expired (current time < expiresAt)
 *   - not already redeemed (single-use)
 */

export const CREDIT_NOTE_STATUSES = [
  { label: "Available", value: "available" },
  { label: "Redeemed", value: "redeemed" },
  { label: "Expired", value: "expired" },
] as const;

export const normaliseCreditNoteCode = (value: unknown): unknown =>
  typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : value;

export const mintCreditNoteCode = (): string =>
  `CN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export const prepareCreditNote: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (!data) return data;

  if (!data.code || typeof data.code !== "string" || !data.code.trim()) {
    data.code = mintCreditNoteCode();
  } else {
    data.code = normaliseCreditNoteCode(data.code);
  }

  if (!data.expiresAt) {
    throw new APIError("Expiry date is mandatory.", 400);
  }

  const orderId =
    typeof data.order === "string"
      ? data.order
      : data.order && typeof data.order === "object" && "id" in data.order
        ? String(data.order.id)
        : undefined;

  // Prevent duplicate credit note issuance against the same booking
  if (orderId && operation === "create" && req?.payload?.find) {
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
        throw new APIError("A credit note has already been issued for this booking.", 409);
      }
    } catch (err) {
      if (err instanceof APIError) throw err;
    }
  }

  if (orderId && (!data.customerEmail || !data.customerName || !data.customer)) {
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
  if (data.status === "available" && data.expiresAt) {
    if (new Date(data.expiresAt).getTime() <= Date.now()) {
      data.status = "expired";
    }
  }

  return data;
};

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
    defaultColumns: ["code", "order", "redeemedInOrder", "customerEmail", "amountFils", "status", "expiresAt", "issuedAt"],
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
            beforeValidate: [({ value }) => (typeof value === "string" && value.trim() ? normaliseCreditNoteCode(value) : mintCreditNoteCode())],
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
            description: "Available, Redeemed, or Expired.",
            components: {
              Cell: {
                path: "@/cms/components/admin/StatusCell#StatusCell",
                clientProps: {
                  labels: { available: "Available", redeemed: "Redeemed", expired: "Expired" },
                  tones: { available: "ok", redeemed: "lilac", expired: "muted" },
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
          validate: (val: unknown) => {
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
          label: "Redeemed in booking",
          index: true,
          admin: {
            width: "34%",
            description: "Future booking where this credit note was redeemed.",
          },
        }),
        systemDate("redeemedAt", "Redeemed date", {
          description: "Timestamp when the credit note was redeemed.",
        }),
        systemField(
          money("redeemedAmountFils", {
            label: "Redeemed amount",
            admin: {
              width: "33%",
              description: "Actual discount applied to the new booking.",
            },
          }),
        ),
      ],
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
