import type { Access, CollectionConfig } from "payload";

import { isAdmin, isEditorField, isSignedIn, neverField } from "@/cms/access/roles";
import { ENQUIRY_TOPICS } from "@/lib/enquiry";

import { advanceStatus, announceEnquiry } from "./hooks";

/**
 * ==========================================================================
 * enquiries — what the contact and private-event forms send (SPEC §D.4)
 * ==========================================================================
 *
 * The Inbox. Both public forms post to `/api/site/enquiries` (3G), which
 * validates, rate-limits, checks the honeypot and sets
 * `context.viaEnquiryEndpoint` — the ONLY way `access.create` passes, so
 * generic REST can never file an enquiry. Every enquiry is stored even when
 * nobody is subscribed to `new_enquiry`; the dashboard warns about that,
 * and the forms are gated on `site-settings.enquiriesEnabled` alone.
 *
 * `topic` reuses the five values of lib/enquiry.ts (`ENQUIRY_TOPICS`) so the
 * site's form and the admin's filter are the same list. `details[]` is the
 * structured answers a particular form collected (guests, date, budget…),
 * printed under the message without the collection knowing what they mean
 * — the same shape as `EnquiryRequest.details`.
 *
 * WHO EDITS WHAT (§J). What the visitor wrote is read-only for everyone;
 * editors and the front desk work the status, the assignee and
 * `repliedAt`; `internalNotes` are the editors' (and admins'). **Reply by
 * email** (a `mailto:` with the reference in the subject, stamping
 * `repliedAt` through an endpoint) is 3G's UI component. `afterChange` on
 * create → `notifyStaff("new_enquiry")` and the optional auto-reply (3G).
 *
 * 3G ON TOP (SPEC §D.4, §I "Enquiries"). Nothing below adds a column — the
 * schema is 3A-0's — only behaviour and admin UI:
 *   · the **Reply by email** panel (`ui` field, cms/components/inbox/
 *     ReplyByEmail.tsx): reference, spam warning, the page it came from,
 *     and the `mailto:` that stamps `repliedAt` via
 *     `POST /api/actions/enquiries/{id}/replied`;
 *   · status chips above the list (New · In progress · Closed · Possible
 *     spam, with counts — the "status board" as one-click filters) and a
 *     coloured status cell; `groupBy` lets anyone group the list by status;
 *   · the assignee picker offers active colleagues only (`filterOptions`,
 *     which Payload also enforces on save);
 *   · hooks (./hooks.ts): `new` → `in_progress` once assigned or replied,
 *     and the staff alert / auto-reply after the create commits.
 */

export const ENQUIRY_SOURCES = [
  { label: "Contact form", value: "contact" },
  { label: "Private events form", value: "private-event" },
] as const;

export const ENQUIRY_STATUSES = [
  { label: "New", value: "new" },
  { label: "In progress", value: "in_progress" },
  { label: "Closed", value: "closed" },
] as const;

export const INBOX_GROUP = "Inbox";

/** Only our endpoint creates enquiries — it flags the request context. */
const createViaEndpoint: Access = ({ req }) => req.context?.viaEnquiryEndpoint === true;

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  labels: { singular: "Enquiry", plural: "Enquiries" },
  admin: {
    group: INBOX_GROUP,
    useAsTitle: "name",
    defaultColumns: ["createdAt", "name", "topic", "source", "status", "assignedTo"],
    description: "Messages from the contact and private-events forms. Work them by status; assign to a colleague; reply from your own email.",
    listSearchableFields: ["name", "email", "phone", "message"],
    // Group-by is Payload's list feature (beta in 3.90): "Group by → Status"
    // gives the New / In progress / Closed board §D.4 asks for, with no
    // custom view to maintain. The chips above the table are the one-click
    // version of the same filter.
    groupBy: true,
    components: {
      beforeListTable: ["@/cms/components/inbox/StatusChips#StatusChips"],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isSignedIn,
    create: createViaEndpoint,
    update: isSignedIn,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [advanceStatus],
    afterChange: [announceEnquiry],
  },
  fields: [
    {
      name: "replyByEmail",
      type: "ui",
      label: "Reply by email",
      admin: {
        components: {
          Field: {
            path: "@/cms/components/inbox/ReplyByEmail#ReplyByEmail",
            // Labels travel as props so the client bundle never imports lib/enquiry.ts.
            clientProps: { topics: ENQUIRY_TOPICS.map(({ label, value }) => ({ label, value })) },
          },
        },
        disableListColumn: true,
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "new",
          index: true,
          options: [...ENQUIRY_STATUSES],
          admin: { width: "34%", components: { Cell: "@/cms/components/inbox/StatusCell#StatusCell" } },
        },
        {
          name: "assignedTo",
          type: "relationship",
          relationTo: "users",
          label: "Assigned to",
          // Deactivated accounts stay readable for admins (users.read), so
          // the picker filters them out here; Payload validates the same
          // filter on save, so REST cannot assign a departed colleague either.
          filterOptions: { active: { equals: true } },
          admin: { width: "33%", description: "Active colleagues only. Assigning a new enquiry moves it to In progress." },
        },
        {
          name: "repliedAt",
          type: "date",
          label: "Replied",
          index: true,
          admin: { width: "33%", date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" }, description: "Set when you press Reply by email; or set it by hand. Moves a new enquiry to In progress." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "source", type: "select", label: "From", required: true, hasMany: false, index: true, options: [...ENQUIRY_SOURCES], access: { update: neverField }, admin: { width: "50%", readOnly: true } },
        {
          name: "topic",
          type: "select",
          label: "About",
          required: true,
          hasMany: false,
          index: true,
          options: ENQUIRY_TOPICS.map(({ label, value }) => ({ label, value })),
          access: { update: neverField },
          admin: { width: "50%", readOnly: true },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "name", type: "text", label: "Name", required: true, maxLength: 120, access: { update: neverField }, admin: { width: "40%", readOnly: true } },
        { name: "email", type: "email", label: "Email", required: true, index: true, access: { update: neverField }, admin: { width: "35%", readOnly: true } },
        { name: "phone", type: "text", label: "Phone", maxLength: 32, access: { update: neverField }, admin: { width: "25%", readOnly: true } },
      ],
    },
    { name: "message", type: "textarea", label: "Message", required: true, maxLength: 5000, access: { update: neverField }, admin: { readOnly: true } },
    {
      name: "details",
      type: "array",
      label: "Form answers",
      labels: { singular: "Answer", plural: "Answers" },
      access: { update: neverField },
      admin: { readOnly: true, description: "The extra questions that form asked (guests, preferred date…), in the order asked." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "label", type: "text", label: "Question", required: true, maxLength: 80, admin: { width: "40%" } },
            { name: "value", type: "text", label: "Answer", required: true, maxLength: 500, admin: { width: "60%" } },
          ],
        },
      ],
    },
    {
      name: "internalNotes",
      type: "textarea",
      label: "Internal notes",
      maxLength: 4000,
      access: { update: isEditorField },
      admin: { description: "For the team. Never sent to the enquirer." },
    },
    {
      type: "collapsible",
      label: "Request details",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "group",
          name: "meta",
          label: "Request",
          access: { update: neverField },
          fields: [
            {
              type: "row",
              fields: [
                { name: "ipHash", type: "text", label: "IP (hashed)", maxLength: 64, admin: { width: "50%", readOnly: true } },
                { name: "referer", type: "text", label: "Page", maxLength: 300, admin: { width: "50%", readOnly: true } },
              ],
            },
            { name: "userAgent", type: "text", label: "Browser", maxLength: 300, admin: { readOnly: true } },
            {
              name: "honeypotTripped",
              type: "checkbox",
              label: "Looked like a bot",
              defaultValue: false,
              index: true,
              admin: { readOnly: true, description: "The hidden form field was filled in. Stored, not notified." },
            },
          ],
        },
      ],
    },
  ],
};
