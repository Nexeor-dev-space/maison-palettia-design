import type { CollectionConfig, FieldHook, NumberFieldSingleValidation, SelectField } from "payload";

import { isEditorField, isStaffField, neverField } from "@/cms/access/roles";
import { money, priceVirtual, slug } from "@/cms/fields";
import { guardSlugChange } from "@/cms/hooks/formatSlug";
import { imageryPublishGate } from "@/cms/hooks/publishGate";
import { sessionSlug } from "@/cms/hooks/sessionSlug";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidationHooks } from "./revalidation";
import {
  addSeatVirtuals,
  capacityFloor,
  ensureInventoryRow,
  refuseDeleteWithSeats,
  removeInventoryRow,
  requireRescheduleOnceSold,
} from "./sessionInventory.hooks";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, gallery, image, paragraphs, previewFor } from "./shared";

/**
 * ==========================================================================
 * sessions — one bookable date of a scheduled experience (SPEC §D.2; 01 §4.4)
 * ==========================================================================
 *
 * The thing a visitor books: an experience, a start time in studio time
 * (Asia/Dubai — `timezone: true` stores the zone beside the instant), a
 * venue, a price in fils and a number of seats. Title, photograph and About
 * default to the experience's and may be overridden per date.
 *
 * SEAT COUNTERS ARE NOT ON THIS DOCUMENT. Payload writes the whole row on
 * every save and publishing copies a version snapshot over the live row, so
 * a counter kept here would be clobbered by any editor save (TOCTOU). Sold
 * and held seats live in `session-inventory`, one row per session, written
 * only by SQL (§H.3); this collection reaches them through the `inventory`
 * join and exposes four VIRTUAL fields — `seatsAvailable` and
 * `isFullyBooked` for everyone, `seatsSold`/`seatsHeld` for staff — which
 * the collection `afterRead` computes from the counter row
 * (./sessionInventory.hooks.ts, which also owns the row's lifecycle, the
 * capacity floor and the Reschedule guard).
 *
 * The other hooks §D.2 lists: the `{experience}-{yyyy-mm-dd}-{HHmm}` slug and
 * default title (cms/hooks/sessionSlug.ts), the publish gate on the
 * photographs, admin-only renames of a live address with a redirect from
 * the old one, and revalidation of /, /events and the session's pages.
 * Payload's Duplicate stays on: the copy gets a fresh slug and none of the
 * system stamps (`beforeDuplicate` below); counters are not on the
 * document, so there is nothing to zero.
 */

const QUARTER_HOURS: NumberFieldSingleValidation = (value, { required }) => {
  if (value === undefined || value === null) return required ? "Enter a duration." : true;
  if (typeof value !== "number" || value < 15 || value > 480) return "Between 15 minutes and 8 hours.";
  if (value % 15 !== 0) return "In steps of 15 minutes.";
  return true;
};

export const BOOKING_STATUSES = [
  { label: "Open — seats can be booked", value: "open" },
  { label: "Waitlist only", value: "waitlist" },
  { label: "Closed — no bookings, no waitlist", value: "closed" },
] as const;

/** Duplicate: the copy starts without this value. */
const blankOnDuplicate: FieldHook = () => undefined;

/** A date the system stamps; staff read it, nobody types it. */
const systemDate = (name: string, label: string, description?: string) => ({
  name,
  type: "date" as const,
  label,
  access: { create: neverField, update: neverField },
  hooks: { beforeDuplicate: [blankOnDuplicate] },
  admin: { position: "sidebar" as const, readOnly: true, description, date: { displayFormat: "d MMM yyyy, HH:mm" } },
});

/**
 * `timezone` on the two dates: Payload adds a `<name>_tz` dropdown beside
 * each and labels it "<label> Tz". Only Dubai is offered
 * (payload.config.ts `admin.timezones`), so the dropdown keeps its value
 * and gets a plain label.
 */
const STUDIO_TIME_ZONE = {
  override: ({ baseField }: { baseField: SelectField }): SelectField => ({ ...baseField, label: "Time zone" }),
};

const revalidate = revalidationHooks("sessions");

export const Sessions: CollectionConfig = {
  slug: "sessions",
  labels: { singular: "Session", plural: "Sessions" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "venue", "seatsAvailable", "bookingStatus", "_status"],
    description: "Dated, bookable sessions of the Create Together experiences. Seats sold and held are counted by the booking system.",
    listSearchableFields: ["title", "category", "slug"],
    preview: previewFor("sessions"),
    components: {
      edit: {
        // SessionActions (Repeat / Reschedule / Cancel / Attendees) joins this list in Phase 3.
        beforeDocumentControls: ["@/cms/components/sessions/SessionQuickStats#SessionQuickStats"],
      },
    },
  },
  defaultSort: "startsAt",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [
      sessionSlug,
      capacityFloor,
      imageryPublishGate([
        { field: "image", noun: "The photograph override" },
        { field: "gallery", noun: "The gallery image" },
      ]),
    ],
    beforeChange: [guardSlugChange({ noun: "session" }), requireRescheduleOnceSold, slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [ensureInventoryRow, slugRedirectHooks.afterChange, ...revalidate.afterChange],
    afterRead: [addSeatVirtuals],
    beforeDelete: [refuseDeleteWithSeats],
    afterDelete: [removeInventoryRow, ...revalidate.afterDelete],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Session",
          fields: [
            {
              name: "experience",
              type: "relationship",
              relationTo: "experiences",
              label: "Experience",
              required: true,
              filterOptions: { kind: { equals: "scheduled" } },
              admin: { description: "A Create Together experience. The session inherits its name, photograph and About unless overridden below." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Title",
                  maxLength: 40,
                  admin: { width: "60%", description: "Leave empty to use the experience's name." },
                },
                {
                  name: "category",
                  type: "text",
                  label: "Category",
                  required: true,
                  maxLength: 20,
                  admin: { width: "40%", description: "Free text, e.g. Craft. Becomes a filter option on the Experiences page." },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "startsAt",
                  type: "date",
                  label: "Starts",
                  required: true,
                  timezone: STUDIO_TIME_ZONE,
                  admin: {
                    width: "50%",
                    description: "Studio time (Gulf Standard). Booking closes at the start time unless a sales close is set.",
                    date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
                  },
                },
                {
                  name: "durationMinutes",
                  type: "number",
                  label: "Duration (minutes)",
                  required: true,
                  defaultValue: 120,
                  min: 15,
                  max: 480,
                  validate: QUARTER_HOURS,
                  admin: { width: "50%", step: 15, description: "15 to 480, in steps of 15." },
                },
              ],
            },
            {
              name: "venue",
              type: "relationship",
              relationTo: "venues",
              label: "Venue",
              admin: { description: "Where this date runs. Printed as the “Where” fact; omitted cleanly when empty." },
            },
            {
              type: "row",
              fields: [
                money("priceFils", { label: "Price per person", required: true, admin: { width: "50%" } }),
                {
                  name: "seatsTotal",
                  type: "number",
                  label: "Seats",
                  required: true,
                  min: 1,
                  defaultValue: 12,
                  admin: { width: "50%", step: 1, description: "Capacity. Cannot go below the seats already sold or held." },
                },
              ],
            },
            priceVirtual("priceFils", "price"),
            {
              name: "excerpt",
              type: "textarea",
              label: "Short description",
              maxLength: 160,
              admin: { description: "One or two sentences: the card line, the page lead and the search snippet." },
            },
            image("image", "Photograph override", "Leave empty to use the experience's main photograph."),
            gallery("gallery", "Extra photographs of this date", 6, "Shown on the session page only when there is something here."),
            paragraphs("about", "About override", { description: "Leave empty to print the experience's About." }),
            {
              name: "includes",
              type: "textarea",
              label: "What's included / what to bring",
              maxLength: 300,
              admin: { description: "Printed with the facts and on the ticket." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "minAge",
                  type: "number",
                  label: "Minimum age",
                  min: 0,
                  max: 99,
                  admin: { width: "50%", step: 1, description: "Leave empty for no age line." },
                },
                {
                  name: "instructor",
                  type: "text",
                  label: "Host / instructor",
                  maxLength: 60,
                  access: { read: isEditorField },
                  admin: { width: "50%", description: "Staff only — not printed on the site yet." },
                },
              ],
            },
          ],
        },
        {
          label: "Booking",
          fields: [
            {
              name: "bookingStatus",
              type: "select",
              label: "Booking status",
              required: true,
              defaultValue: "open",
              options: [...BOOKING_STATUSES],
              admin: { description: "A session with no seats left shows the waitlist form automatically; this switch is for closing it by hand." },
            },
            {
              name: "salesCloseAt",
              type: "date",
              label: "Sales close",
              timezone: STUDIO_TIME_ZONE,
              admin: {
                description: "Optional. Online booking stops at this time instead of at the start time.",
                date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
              },
            },
            {
              name: "checkInWindow",
              type: "group",
              label: "Check-in window",
              admin: { description: "How early and how late a ticket may be scanned around the start time." },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "beforeMinutes", type: "number", label: "Minutes before", defaultValue: 60, min: 0, max: 1440, admin: { width: "50%", step: 5 } },
                    { name: "afterMinutes", type: "number", label: "Minutes after", defaultValue: 30, min: 0, max: 1440, admin: { width: "50%", step: 5 } },
                  ],
                },
              ],
            },
            {
              name: "inventory",
              type: "join",
              collection: "session-inventory",
              on: "session",
              label: "Seat counters",
              access: { read: isStaffField },
              admin: { allowCreate: false, defaultColumns: ["seatsSold", "seatsHeld", "updatedAt"], description: "Written by the booking system only." },
            },
            {
              name: "internalNotes",
              type: "textarea",
              label: "Internal notes",
              access: { read: isEditorField },
              admin: { description: "Staff only. Never printed." },
            },
          ],
        },
        {
          // 3E's attendee list (mark arrived, undo, print, CSV). A `ui` field:
          // no column; the component hides itself from editors and on unsaved docs.
          label: "Attendees",
          fields: [
            {
              name: "attendees",
              type: "ui",
              admin: { components: { Field: "@/cms/components/sessions/AttendeeList#AttendeeList" } },
            },
          ],
        },
      ],
    },
    slug({
      // `from: "slug"` = never derive from another field: cms/hooks/sessionSlug.ts generates it.
      from: "slug",
      hooks: { beforeDuplicate: [blankOnDuplicate] },
      admin: {
        position: "sidebar",
        description: "Generated as experience-date-time (e.g. candle-making-2026-10-11-1530). Editable until published; a later change creates a redirect.",
      },
    }),
    // Virtual: computed by 2A-1's afterRead from the joined inventory row. No column, nothing to migrate.
    {
      name: "seatsAvailable",
      type: "number",
      label: "Seats available",
      virtual: true,
      access: { create: neverField, update: neverField },
      admin: { position: "sidebar", readOnly: true, description: "Seats minus sold minus held." },
    },
    {
      name: "isFullyBooked",
      type: "checkbox",
      label: "Fully booked",
      virtual: true,
      access: { create: neverField, update: neverField },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "seatsSold",
      type: "number",
      label: "Seats sold",
      virtual: true,
      access: { read: isStaffField, create: neverField, update: neverField },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "seatsHeld",
      type: "number",
      label: "Seats held",
      virtual: true,
      access: { read: isStaffField, create: neverField, update: neverField },
      admin: { position: "sidebar", readOnly: true, description: "In baskets right now, awaiting payment." },
    },
    systemDate("reminderSentAt", "Reminder sent", "Stamped when the 24-hour reminder emails go out."),
    systemDate("cancelledAt", "Cancelled", "Set by “Cancel session & refund all”."),
    {
      name: "cancelReason",
      type: "text",
      label: "Cancellation reason",
      maxLength: 200,
      access: { create: neverField, update: neverField },
      hooks: { beforeDuplicate: [blankOnDuplicate] },
      admin: { position: "sidebar", readOnly: true, condition: (data) => Boolean(data?.cancelledAt) },
    },
  ],
};
