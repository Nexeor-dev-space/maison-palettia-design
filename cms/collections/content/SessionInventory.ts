import type { CollectionConfig } from "payload";

import { isStaff, never, roleOf, systemOnly } from "@/cms/access/roles";

/**
 * ==========================================================================
 * session-inventory — seats sold and held, one row per session (SPEC §D.2)
 * ==========================================================================
 *
 * The counters that `sessions` deliberately does not carry. Payload writes
 * the FULL row on every update (`@payloadcms/drizzle/upsertRow`) and
 * publishing copies the version snapshot into the main table, so a counter
 * on the session document would be overwritten by any editor save that
 * raced a checkout. Keeping the counters on their own row means editor
 * saves and inventory SQL touch different rows, and the only writer of
 * `seats_sold` / `seats_held` is the atomic SQL in cms/lib/inventory.ts
 * (§H.3): `update: never` for everyone, including admins, including the
 * Local API. The row is created by the session's `afterChange` and removed
 * by its `afterDelete` (2A-1), both with `context.system`.
 *
 * No drafts, no versions — a counter has no draft state. Staff may read it
 * (the session's "Seat counters" join and the quick stats); it is hidden
 * from the sidebar for everyone but admins and grouped with Bookings.
 */
export const SessionInventory: CollectionConfig = {
  slug: "session-inventory",
  labels: { singular: "Seat counter", plural: "Seat counters" },
  admin: {
    group: "Bookings",
    useAsTitle: "id",
    defaultColumns: ["session", "seatsSold", "seatsHeld", "updatedAt"],
    description: "Seats sold and held per session. Maintained by the booking system; read-only here.",
    hidden: ({ user }) => roleOf({ user } as never) !== "admin",
    listSearchableFields: [],
  },
  access: {
    read: isStaff,
    create: systemOnly,
    update: never,
    delete: systemOnly,
  },
  fields: [
    {
      name: "session",
      type: "relationship",
      relationTo: "sessions",
      label: "Session",
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "seatsSold",
          type: "number",
          label: "Seats sold",
          required: true,
          defaultValue: 0,
          min: 0,
          admin: { width: "50%", step: 1, readOnly: true, description: "Paid or desk-confirmed seats." },
        },
        {
          name: "seatsHeld",
          type: "number",
          label: "Seats held",
          required: true,
          defaultValue: 0,
          min: 0,
          admin: { width: "50%", step: 1, readOnly: true, description: "In baskets awaiting payment; released when the hold expires." },
        },
      ],
    },
  ],
};
