import type { CollectionConfig } from "payload";

import { isAdmin, never, systemOnly } from "@/cms/access/roles";

import { sidebarFor, systemDate, systemField } from "./shared";

/**
 * ==========================================================================
 * seat-holds — one row per order per session while the customer pays (§D.3)
 * ==========================================================================
 *
 * The audit trail behind `session-inventory.seatsHeld`: the counter says HOW
 * MANY seats are held, this collection says BY WHOM and UNTIL WHEN. The
 * checkout creates a row per session line with `expiresAt = now +
 * holdMinutes`; `expire-holds` (every minute) releases the rows past their
 * time and `releaseSeats` the counter; a capture marks them `consumed`.
 *
 * Admin read-only, hidden from everyone else: it exists to answer "why does
 * this session show three seats held?", not to be edited.
 */

export const SEAT_HOLD_STATUSES = [
  { label: "Held", value: "held" },
  { label: "Released", value: "released" },
  { label: "Consumed — paid", value: "consumed" },
] as const;

export const SeatHolds: CollectionConfig = {
  slug: "seat-holds",
  labels: { singular: "Seat hold", plural: "Seat holds" },
  admin: {
    // 4B review: internal bookkeeping lives in the admin-only "System" group, last in the sidebar.
    group: "System",
    useAsTitle: "id",
    defaultColumns: ["order", "session", "qty", "status", "expiresAt"],
    description: "Seats reserved by baskets awaiting payment. Released automatically when the hold runs out.",
    hidden: sidebarFor("admin"),
    listSearchableFields: [],
  },
  defaultSort: "-expiresAt",
  access: {
    read: isAdmin,
    create: systemOnly,
    update: systemOnly,
    delete: never,
  },
  fields: [
    {
      type: "row",
      fields: [
        systemField({ name: "order", type: "relationship", relationTo: "orders", label: "Order", required: true, index: true, admin: { width: "50%" } }),
        systemField({ name: "session", type: "relationship", relationTo: "sessions", label: "Session", required: true, index: true, admin: { width: "50%" } }),
      ],
    },
    {
      type: "row",
      fields: [
        systemField({ name: "qty", type: "number", label: "Seats", required: true, min: 1, admin: { width: "33%", step: 1 } }),
        systemField({
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "held",
          index: true,
          options: [...SEAT_HOLD_STATUSES],
          admin: { width: "33%" },
        }),
      ],
    },
    systemDate("expiresAt", "Expires", { index: true }),
  ],
};
