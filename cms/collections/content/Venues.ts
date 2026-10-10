import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { HTTPS_URL, slug } from "@/cms/fields";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, image, orderField, publicContentAccess } from "./shared";

/**
 * ==========================================================================
 * venues — the centres the Maison sets up in (SPEC §D.2; fields from 01 §4.3)
 * ==========================================================================
 *
 * The studio has no address of its own: it runs inside shopping centres, on
 * fixed dates. A venue is a standing relationship with one of them —
 * `current` is where to find the Maison now, `upcoming` is announced,
 * `past` is a track record and is never printed as somewhere to go. Sessions
 * point at a venue; the Locations page, the homepage map card and the
 * event pages print its name, locality and one of its two descriptors (two
 * because the client wrote one line per surface and a single string let a
 * change for one page rewrite the other — lib/partners.ts).
 *
 * COORDINATES ARE A GROUP OF TWO NUMBERS, NEVER A POINT FIELD. In
 * @payloadcms/drizzle 3.90.2 a point field flags `extensions.postgis` and
 * runs `CREATE EXTENSION IF NOT EXISTS "postgis"` on every connect, which
 * the host cannot satisfy (SPEC §A.5). Two plain columns do the job; the
 * `CoordinatesField` UI sits on top (paste a Google Maps link or "lat, lng"
 * and both numbers fill in). Leave both empty rather than guess — a pin at
 * a guessed position is worse than no pin.
 *
 * No drafts: a venue is a fact, not a page. Every save purges /,
 * /locations, /events and /private-events; the session pages at the venue
 * follow through the venues tag (./revalidation.ts).
 */

const optionalHttps: TextFieldSingleValidation = (value) =>
  value === null || value === undefined || value === "" || (typeof value === "string" && HTTPS_URL.test(value))
    ? true
    : "Enter a full https:// address.";

export const VENUE_STATUSES = [
  { label: "Current — where to find us now", value: "current" },
  { label: "Upcoming — announced, not yet open", value: "upcoming" },
  { label: "Past — where we have been", value: "past" },
] as const;

export const Venues: CollectionConfig = {
  slug: "venues",
  labels: { singular: "Venue", plural: "Venues" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "locality", "status", "order", "updatedAt"],
    description: "The centres the Maison sets up in. Only “Current” venues are shown as somewhere to find us.",
    listSearchableFields: ["name", "locality", "slug"],
  },
  defaultSort: "order",
  access: publicContentAccess,
  hooks: revalidationHooks("venues"),
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Venue name",
          required: true,
          maxLength: 40,
          admin: { width: "50%", description: "As it is signposted, e.g. Times Square Center." },
        },
        {
          name: "locality",
          type: "text",
          label: "City / district",
          required: true,
          maxLength: 32,
          admin: { width: "50%", description: "Printed under the name, e.g. Dubai." },
        },
      ],
    },
    slug({ from: "name", admin: { position: "sidebar", description: "Internal name — visitors never see it; not an address on the site." } }),
    {
      name: "status",
      type: "select",
      label: "Partnership status",
      required: true,
      defaultValue: "current",
      options: [...VENUE_STATUSES],
      admin: { position: "sidebar", description: "Past venues are never shown as somewhere to go." },
    },
    {
      name: "descriptor",
      type: "textarea",
      label: "Description (venue pages)",
      required: true,
      maxLength: 240,
      admin: { description: "The Locations page plate and the “Our home” card on Private events." },
    },
    {
      name: "eventDescriptor",
      type: "textarea",
      label: "Description (event pages)",
      maxLength: 240,
      admin: { description: "The Experiences page and every event page. Falls back to the description above when empty." },
    },
    {
      type: "row",
      fields: [
        {
          name: "locationHref",
          type: "text",
          label: "Directions link",
          validate: optionalHttps,
          admin: { width: "60%", description: "The centre's own page or a Google Maps link. Behind “View location” and “Get directions”." },
        },
        {
          name: "mapQuery",
          type: "text",
          label: "Map search override",
          maxLength: 120,
          admin: { width: "40%", description: "What the embedded map searches for. Leave empty to use “name, locality”." },
        },
      ],
    },
    {
      name: "coordinates",
      type: "group",
      label: "Pin (latitude / longitude)",
      admin: {
        description: "Optional. Leave empty rather than guess; the map falls back to a search.",
        components: { Field: "@/cms/components/fields/CoordinatesField#CoordinatesField" },
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "lat", type: "number", label: "Latitude", min: -90, max: 90, admin: { width: "50%", step: 0.000001 } },
            { name: "lng", type: "number", label: "Longitude", min: -180, max: 180, admin: { width: "50%", step: 0.000001 } },
          ],
        },
      ],
    },
    image("logo", "Centre logo", "Only the centre's own approved asset. Nothing is drawn or traced."),
    image("image", "Photograph", "A photograph of the destination, when the client supplies one."),
    {
      name: "address",
      type: "array",
      label: "Address",
      labels: { singular: "Line", plural: "Lines" },
      maxRows: 5,
      admin: { description: "Street, floor, unit — one row per line." },
      fields: [{ name: "line", type: "text", label: "Line", required: true, maxLength: 80 }],
    },
    {
      name: "hours",
      type: "array",
      label: "Opening hours at this venue",
      labels: { singular: "Row", plural: "Rows" },
      maxRows: 7,
      fields: [
        {
          type: "row",
          fields: [
            { name: "days", type: "text", label: "Days", required: true, maxLength: 32, admin: { width: "50%", placeholder: "Mon – Thu" } },
            { name: "hours", type: "text", label: "Hours", required: true, maxLength: 32, admin: { width: "50%", placeholder: "10:00 – 22:00" } },
          ],
        },
      ],
    },
    orderField(),
  ],
};
