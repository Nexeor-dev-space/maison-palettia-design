import { type CollectionBeforeValidateHook, type CollectionConfig, ValidationError } from "payload";

import { isAdmin, isAdminField, isEditor } from "@/cms/access/roles";
import { findVariables, findVariablesInString } from "@/cms/email/render";
import { variableNamesFor } from "@/cms/email/variables";
import type { TemplateKey } from "@/cms/lib/contracts";

/**
 * ==========================================================================
 * email-templates — the wording of every email the system sends (§D.5, §H.8)
 * ==========================================================================
 *
 * One document per `key`. The LIST of keys is the code's (`TemplateKey` in
 * cms/lib/contracts.ts — the mailer calls `sendTemplated({ key })` and a
 * key with no document would be a silent lost email), so `key` is a select
 * and `onInit` seeds every key with house copy. The layout shell (logo,
 * colours, footer) is code in cms/email/layout.ts; editors own the subject,
 * the preheader and the body, with `{{variables}}` interpolated and
 * HTML-escaped at send time.
 *
 * WHY EDITORS CANNOT TOUCH `key`, `enabled` OR THE ATTACHMENT SWITCHES.
 * Transactional email is security-relevant, not content: turning off
 * `payment_failed` or attaching the invoice to the wrong template changes
 * what customers receive about money. Those four fields are `isAdminField`
 * (§J); editors read everything and update the three text fields.
 *
 * The **Variables** list (sidebar) and **Preview / Send me this** (under
 * the body) are `ui` fields backed by cms/components/email/*: the list comes
 * from the code map in cms/email/variables.ts, the preview renders the
 * UNSAVED form through `POST /api/actions/email-templates/preview`.
 *
 * UNKNOWN VARIABLES ARE REFUSED ON SAVE. A `{{name}}` that is not on this
 * email's list would render as nothing in front of a customer, so
 * `beforeValidate` rejects the save and names the typo (subject, preview
 * text and body alike, link URLs included).
 */

const refuseUnknownVariables: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const key = (data?.key ?? originalDoc?.key) as TemplateKey | undefined;
  if (!key) return data;
  const allowed = variableNamesFor(key);
  const check = (path: string, used: Set<string>) => {
    const unknown = [...used].filter((name) => !allowed.has(name));
    if (!unknown.length) return;
    throw new ValidationError(
      {
        collection: "email-templates",
        errors: [
          {
            path,
            message: `${unknown.map((name) => `{{${name}}}`).join(", ")} ${unknown.length > 1 ? "are not variables" : "is not a variable"} of this email. See the Variables list.`,
          },
        ],
        req,
      },
      req.t,
    );
  };
  const subject = data?.subject ?? originalDoc?.subject;
  const preheader = data?.preheader ?? originalDoc?.preheader;
  const body = data?.body ?? originalDoc?.body;
  check("subject", findVariablesInString(subject));
  check("preheader", findVariablesInString(preheader));
  check("body", findVariables(body));
  return data;
};

/** Every key the mailer knows, with the wording staff see in the picker. Order: customer emails, then staff, then test. */
export const TEMPLATE_KEYS = [
  { label: "Customer · Order confirmation (invoice + tickets)", value: "order_confirmation" },
  { label: "Customer · Payment failed", value: "payment_failed" },
  { label: "Customer · Reminder 24 hours before", value: "ticket_reminder_24h" },
  { label: "Customer · Order refunded", value: "order_refunded" },
  { label: "Customer · Order cancelled", value: "order_cancelled" },
  { label: "Customer · Booking moved to another session", value: "order_moved" },
  { label: "Customer · Session rescheduled", value: "session_rescheduled" },
  { label: "Customer · Session cancelled", value: "session_cancelled" },
  { label: "Customer · Paid after the hold expired", value: "post_expiry_payment" },
  { label: "Customer · “My bookings” link", value: "magic_link" },
  { label: "Customer · Enquiry received (auto-reply)", value: "enquiry_received" },
  { label: "Customer · Joined the waitlist", value: "waitlist_joined" },
  { label: "Customer · Waitlist seat available", value: "waitlist_seat_available" },
  { label: "Staff · Login / set-password link", value: "staff_login_link" },
  { label: "Staff · New order", value: "admin_new_order" },
  { label: "Staff · Failed payment", value: "admin_failed_payment" },
  { label: "Staff · Refund requested", value: "admin_refund_requested" },
  { label: "Staff · Refund processed", value: "admin_refund" },
  { label: "Staff · Dispute opened", value: "admin_dispute" },
  { label: "Staff · New enquiry", value: "admin_new_enquiry" },
  { label: "Staff · Someone joined a waitlist", value: "admin_waitlist_joined" },
  { label: "Staff · Background task failed", value: "admin_job_failed" },
  { label: "Staff · Few seats left", value: "admin_low_seats" },
  { label: "Staff · A setting was changed", value: "admin_settings_changed" },
  { label: "Staff · Unverified webhook spike", value: "admin_webhook_unverified_spike" },
  { label: "Staff · Daily digest", value: "admin_daily_digest" },
  { label: "Test email", value: "test" },
] as const satisfies ReadonlyArray<{ label: string; value: TemplateKey }>;

export const EMAILS_GROUP = "Emails";

export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  labels: { singular: "Email template", plural: "Email templates" },
  admin: {
    group: EMAILS_GROUP,
    useAsTitle: "label",
    defaultColumns: ["label", "key", "subject", "enabled", "updatedAt"],
    description: "The wording of each email the site sends. Use {{variables}} from the list on each template; the logo and footer are added automatically.",
    listSearchableFields: ["label", "subject", "key"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "mail", heading: "Templates are being installed", body: "One template per email the site can send is created on first start. If this list stays empty, restart the server once." } },
      ],
    },
  },
  defaultSort: "label",
  hooks: {
    beforeValidate: [refuseUnknownVariables],
  },
  access: {
    read: isEditor,
    create: isAdmin,
    update: isEditor,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "key",
          type: "select",
          label: "Which email",
          required: true,
          unique: true,
          index: true,
          hasMany: false,
          options: [...TEMPLATE_KEYS],
          access: { create: isAdminField, update: isAdminField },
          admin: { width: "50%", description: "Fixed by the system — one template per email it can send." },
        },
        {
          name: "label",
          type: "text",
          label: "Name",
          required: true,
          maxLength: 80,
          admin: { width: "50%", description: "How it appears in this list." },
        },
      ],
    },
    {
      name: "subject",
      type: "text",
      label: "Subject line",
      required: true,
      maxLength: 150,
      admin: { description: "Variables work here too, e.g. “Your booking {{order.reference}} is confirmed”." },
    },
    {
      name: "preheader",
      type: "text",
      label: "Preview text",
      maxLength: 150,
      admin: { description: "The line inbox apps show under the subject. Optional." },
    },
    {
      name: "body",
      type: "richText",
      label: "Message",
      required: true,
      admin: { description: "Write as you would to one customer. Lines, links and bold are kept; the brand header and footer are added for you." },
    },
    {
      name: "preview",
      type: "ui",
      label: "Preview",
      admin: { components: { Field: "@/cms/components/email/TemplatePreview#TemplatePreview" } },
    },
    {
      type: "row",
      fields: [
        {
          name: "attachInvoice",
          type: "checkbox",
          label: "Attach the invoice PDF",
          defaultValue: false,
          access: { create: isAdminField, update: isAdminField },
          admin: { width: "50%", description: "Only meaningful on order emails." },
        },
        {
          name: "attachTickets",
          type: "checkbox",
          label: "Attach the ticket PDFs",
          defaultValue: false,
          access: { create: isAdminField, update: isAdminField },
          admin: { width: "50%", description: "Only meaningful on order emails." },
        },
      ],
    },
    // ── sidebar ──
    {
      name: "enabled",
      type: "checkbox",
      label: "Enabled",
      defaultValue: true,
      access: { create: isAdminField, update: isAdminField },
      admin: { position: "sidebar", description: "Off: this email is logged as skipped instead of sent. Admin only." },
    },
    {
      name: "variablesList",
      type: "ui",
      label: "Variables",
      admin: { position: "sidebar", components: { Field: "@/cms/components/email/TemplateVariables#TemplateVariables" } },
    },
  ],
};
