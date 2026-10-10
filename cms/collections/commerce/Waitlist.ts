import type { Access, CollectionConfig } from "payload";

import { isAdmin, isAdminField, isStaff, roleOf } from "@/cms/access/roles";

import { BOOKINGS_GROUP, lockExcept, sidebarFor, systemDate, systemField } from "./shared";
import { alertWaitlistJoined, lowercaseEmail } from "./hooks";

/**
 * ==========================================================================
 * waitlist — who wants a seat on a full session (SPEC §D.3, §H.11)
 * ==========================================================================
 *
 * One row per session + email. The public form posts to
 * `/api/site/waitlist`, which sets `context.viaWaitlistEndpoint` — the only
 * way an anonymous create passes `access.create`; the front desk may add a
 * caller directly. `position` is the system's (count of earlier `waiting`
 * rows + 1).
 *
 * When seats free up, `waitlist-notify` walks `waiting` rows first-come
 * first-served, sets `notified`, and emails a link carrying `token` —
 * which lets `startCheckout` book a `waitlist`-status session for 24 hours
 * (`tokenExpiresAt`). Seats are NOT reserved; the email says so. The token
 * is admin-only to read for the same reason magic links are redacted from
 * the notification log: a live token in a list view is a seat anyone at the
 * desk could take.
 *
 * `waiting → notified → converted` (the order confirmed; `convertedOrder`
 * set by `finalize-order`) | `expired` (token ran out; re-queued if seats
 * remain) | `cancelled` (session cancelled, or by request).
 */

export const WAITLIST_STATUSES = [
  { label: "Waiting", value: "waiting" },
  { label: "Notified — seat offered", value: "notified" },
  { label: "Converted — booked", value: "converted" },
  { label: "Expired — did not book in time", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
] as const;

/** Our endpoint (flagged on the request context) or bookings staff; never generic REST. */
const createViaEndpointOrStaff: Access = ({ req }) => req.context?.viaWaitlistEndpoint === true || ["admin", "front-desk"].includes(roleOf(req) ?? "");

export const Waitlist: CollectionConfig = {
  slug: "waitlist",
  labels: { singular: "Waitlist entry", plural: "Waitlist" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "email",
    defaultColumns: ["session", "name", "email", "qty", "status", "position", "notifiedAt"],
    description: "People waiting for a seat on a full session. They are emailed in order when seats free up; seats are not held for them.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["email", "name", "phone"],
  },
  defaultSort: "position",
  access: {
    read: isStaff,
    create: createViaEndpointOrStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: { beforeValidate: [lowercaseEmail], afterChange: [alertWaitlistJoined] },
  fields: lockExcept(
    [
      { name: "session", type: "relationship", relationTo: "sessions", label: "Session", required: true, index: true },
      {
        type: "row",
        fields: [
          { name: "name", type: "text", label: "Name", required: true, maxLength: 120, admin: { width: "40%" } },
          { name: "email", type: "email", label: "Email", required: true, index: true, admin: { width: "35%" } },
          { name: "phone", type: "text", label: "Phone", maxLength: 32, admin: { width: "25%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "qty", type: "number", label: "Seats wanted", required: true, defaultValue: 1, min: 1, max: 12, admin: { width: "34%", step: 1 } },
          {
            name: "status",
            type: "select",
            label: "Status",
            required: true,
            hasMany: false,
            defaultValue: "waiting",
            index: true,
            options: [...WAITLIST_STATUSES],
            admin: { width: "33%" },
          },
          systemField({ name: "position", type: "number", label: "Position", min: 1, admin: { width: "33%", step: 1, description: "Place in the queue when they joined." } }),
        ],
      },
      {
        type: "collapsible",
        label: "Offer",
        admin: { initCollapsed: true },
        fields: [
          systemDate("notifiedAt", "Seat offered", { index: true }),
          {
            type: "row",
            fields: [
              systemField({
                name: "token",
                type: "text",
                label: "Booking token",
                index: true,
                maxLength: 32,
                access: { read: isAdminField },
                admin: { width: "50%", description: "Admin only: the link in the offer email carries it." },
              }),
              systemDate("tokenExpiresAt", "Token expires", { index: true }),
            ],
          },
          systemField({ name: "convertedOrder", type: "relationship", relationTo: "orders", label: "Booked as", index: true }),
        ],
      },
      {
        type: "group",
        name: "meta",
        label: "Request details",
        admin: { description: "From the public form; blank when added by staff." },
        fields: [
          systemField({ name: "ipHash", type: "text", label: "IP (hashed)", maxLength: 64 }),
          systemField({ name: "userAgent", type: "text", label: "Browser", maxLength: 300 }),
        ],
      },
    ],
    {
      // §J: admin CRUD · front-desk C R U:status
      status: () => true,
      name: isAdminField,
      email: isAdminField,
      phone: isAdminField,
      qty: isAdminField,
      session: isAdminField,
    },
  ),
};
