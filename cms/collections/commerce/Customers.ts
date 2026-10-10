import type { CollectionConfig } from "payload";

import { isAdmin, isAdminField, isStaff, systemOnly } from "@/cms/access/roles";
import { money } from "@/cms/fields";

import { BOOKINGS_GROUP, lockExcept, sidebarFor, systemDate, systemField } from "./shared";
import { lowercaseEmail } from "./hooks";

/**
 * ==========================================================================
 * customers — one row per email address that has ever booked (SPEC §D.3)
 * ==========================================================================
 *
 * A guest identity, not an account: there is no password and no login. The
 * checkout upserts the row by lowercased email (3A-1's `beforeValidate`
 * lowercases and trims), the "my bookings" magic link looks it up, and the
 * stats are recomputed by the order hooks after every confirmation.
 *
 * `sessionVersion` is the "Sign out everywhere" counter (§H.10): the
 * customer cookie carries the version it was minted with, every read
 * compares, and the admin action bumps the number — which is why it is a
 * system field here and not a button on the cookie.
 *
 * Access follows §J: admins may edit and delete; the front desk may correct
 * the phone number and keep notes; only the checkout creates rows.
 */
export const Customers: CollectionConfig = {
  slug: "customers",
  labels: { singular: "Customer", plural: "Customers" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName", "phone", "lastOrderAt"],
    description: "Everyone who has booked, by email address. Created by the checkout; names come from the booking form.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["email", "firstName", "lastName", "phone"],
  },
  defaultSort: "-lastOrderAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: { beforeValidate: [lowercaseEmail] },
  fields: lockExcept(
    [
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
        unique: true,
        index: true,
        admin: { description: "Stored lowercased; one customer per address." },
      },
      {
        type: "row",
        fields: [
          { name: "firstName", type: "text", label: "First name", maxLength: 60, admin: { width: "50%" } },
          { name: "lastName", type: "text", label: "Last name", maxLength: 60, admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "phone", type: "text", label: "Phone", maxLength: 32, admin: { width: "50%" } },
          {
            name: "marketingOptIn",
            type: "checkbox",
            label: "Agreed to marketing emails",
            defaultValue: false,
            admin: { width: "50%", description: "Ticked by the customer at checkout. Not a staff decision." },
          },
        ],
      },
      {
        name: "notes",
        type: "textarea",
        label: "Notes (staff only)",
        maxLength: 2000,
        admin: { description: "Accessibility needs, preferences, anything the next booking should know. Never shown to the customer." },
      },
      {
        type: "group",
        name: "stats",
        label: "Totals",
        admin: { description: "Recomputed by the booking system after every confirmed order." },
        fields: [
          {
            type: "row",
            fields: [
              systemField({ name: "ordersCount", type: "number", label: "Orders", defaultValue: 0, min: 0, admin: { width: "33%", step: 1 } }),
              systemField({ name: "ticketsCount", type: "number", label: "Tickets", defaultValue: 0, min: 0, admin: { width: "33%", step: 1 } }),
              systemField(money("lifetimeFils", { label: "Lifetime spend", defaultValue: 0, admin: { width: "33%" } })),
            ],
          },
        ],
      },
      {
        name: "orders",
        type: "join",
        collection: "orders",
        on: "customer",
        label: "Orders",
        admin: { allowCreate: false, defaultColumns: ["reference", "status", "channel", "createdAt"] },
      },
      systemDate("lastOrderAt", "Last order", { sidebar: true, index: true }),
      systemDate("lastMagicLinkIssuedAt", "Last “my bookings” link sent", {
        sidebar: true,
        description: "Each link works once; a newer request replaces the previous one.",
      }),
      systemField({
        name: "sessionVersion",
        type: "number",
        label: "Session version",
        required: true,
        defaultValue: 1,
        min: 1,
        admin: {
          position: "sidebar",
          step: 1,
          description: "Bumped by “Sign out everywhere”: every “my bookings” session minted before the bump stops working.",
        },
      }),
    ],
    {
      // §J: admin edits anything a person typed; the front desk corrects the phone and keeps notes.
      email: isAdminField,
      firstName: isAdminField,
      lastName: isAdminField,
      marketingOptIn: isAdminField,
      phone: () => true,
      notes: () => true,
    },
  ),
};
