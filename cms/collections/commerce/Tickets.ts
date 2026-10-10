import type { CollectionConfig } from "payload";

import { isAdminField, isStaff, never, systemOnly } from "@/cms/access/roles";

import { BOOKINGS_GROUP, lockExcept, sidebarFor, systemDate, systemField } from "./shared";
import { mintTicketCode } from "./hooks";

/**
 * ==========================================================================
 * tickets — one row per seat, with its QR code (SPEC §D.3, §H.7)
 * ==========================================================================
 *
 * Issued by `issue-tickets` when an order confirms: one ticket per seat on
 * every session line (`lineIndex`, `seatNo` 1..qty). `code` is `MPT-` plus
 * eight characters; `qr` is `mp1.<code>.<qrSig>` and is what the PDF's QR
 * image encodes.
 *
 * VERIFICATION IS BY LOOKUP, NOT BY SIGNATURE CHECK. `qrSig` is computed
 * once at issue and STORED; the check-in endpoint finds the ticket by `code`
 * and compares the presented signature to the stored one in constant time.
 * The database is the authority, so rotating `PAYLOAD_SECRET` never
 * invalidates a printed ticket — the signature only stops someone guessing
 * codes. `qrSig` is admin-only to read so a list export cannot be turned
 * into a stack of valid QR codes.
 *
 * `valid → checked_in` (scanner or Mark as arrived), `valid → void`
 * (refund, cancel, move), `checked_in → void` only by an admin with a note.
 * `checkInForced` records that `wrong_day` or `already_checked_in` was
 * overridden by staff; those appear in the ops section of Analytics.
 *
 * Staff may correct `holderName`; everything else is the system's.
 */

export const TICKET_STATUSES = [
  { label: "Valid", value: "valid" },
  { label: "Checked in", value: "checked_in" },
  { label: "Void", value: "void" },
  { label: "Refunded", value: "refunded" },
] as const;

export const CHECK_IN_DEVICES = [
  { label: "Camera scan", value: "camera" },
  { label: "Code typed", value: "manual" },
  { label: "Attendee list", value: "list" },
] as const;

export const Tickets: CollectionConfig = {
  slug: "tickets",
  labels: { singular: "Ticket", plural: "Tickets" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "code",
    defaultColumns: ["code", "session", "holderName", "seatNo", "status", "checkedInAt"],
    description: "One ticket per seat, each with its own QR code. Check in from /admin/check-in or the session's attendee list.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["code", "holderName"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "ticket", heading: "No tickets yet", body: "One ticket per seat is issued the moment an order is confirmed, each with its own QR code. Scan them at the door from Check-in, or mark people as arrived from the session's attendee list.", actions: [{ label: "Open check-in", href: "/check-in" }] } },
      ],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: isStaff,
    delete: never,
  },
  hooks: { beforeValidate: [mintTicketCode] },
  fields: lockExcept(
    [
      {
        type: "row",
        fields: [
          systemField({ name: "code", type: "text", label: "Code", required: true, unique: true, index: true, maxLength: 12, admin: { width: "40%" } }),
          systemField({
            name: "status",
            type: "select",
            label: "Status",
            required: true,
            hasMany: false,
            defaultValue: "valid",
            index: true,
            options: [...TICKET_STATUSES],
            admin: {
              width: "60%",
              description: "Changed by check-in, refunds and cancellations — not by hand.",
              components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: Object.fromEntries(TICKET_STATUSES.map((o) => [o.value, o.label])), tones: { valid: "lilac", checked_in: "ok", void: "muted", refunded: "warn" } } } },
            },
          }),
        ],
      },
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
          { name: "holderName", type: "text", label: "Holder", maxLength: 120, admin: { width: "50%", description: "Printed on the ticket. Defaults to the booker's name." } },
          systemField({ name: "lineIndex", type: "number", label: "Order line", required: true, min: 0, admin: { width: "25%", step: 1 } }),
          systemField({ name: "seatNo", type: "number", label: "Seat n°", required: true, min: 1, admin: { width: "25%", step: 1, description: "n of the seats on that line." } }),
        ],
      },
      {
        type: "collapsible",
        label: "Check-in",
        fields: [
          {
            type: "row",
            fields: [
              systemDate("checkedInAt", "Checked in", { index: true }),
              systemField({ name: "checkedInBy", type: "relationship", relationTo: "users", label: "By", admin: { width: "50%" } }),
            ],
          },
          {
            type: "row",
            fields: [
              systemField({ name: "checkInDevice", type: "select", label: "How", hasMany: false, options: [...CHECK_IN_DEVICES], admin: { width: "50%" } }),
              systemField({
                name: "checkInForced",
                type: "checkbox",
                label: "Forced",
                defaultValue: false,
                admin: { width: "50%", description: "Staff overrode a “wrong day” or “already checked in” verdict." },
              }),
            ],
          },
        ],
      },
      {
        type: "collapsible",
        label: "QR code (admin only)",
        admin: { initCollapsed: true },
        fields: [
          systemField({ name: "qr", type: "text", label: "QR payload", maxLength: 60, access: { read: isAdminField }, admin: { description: "mp1.<code>.<signature> — what the QR image encodes." } }),
          systemField({ name: "qrSig", type: "text", label: "Stored signature", maxLength: 32, access: { read: isAdminField }, admin: { description: "Compared in constant time at check-in. Never shown to the front desk." } }),
        ],
      },
      systemDate("reminderSentAt", "Reminder sent", { sidebar: true, description: "The 24-hour reminder email." }),
    ],
    {
      // §J: admin R U · front-desk R U:holderName
      holderName: () => true,
    },
  ),
};
