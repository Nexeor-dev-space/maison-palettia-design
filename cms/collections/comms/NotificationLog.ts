import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdminField, isStaff, roleOf, systemOnly } from "@/cms/access/roles";
import { redactVariables } from "@/cms/email/render";
import type { TemplateKey } from "@/cms/lib/contracts";

import { EMAILS_GROUP, TEMPLATE_KEYS } from "./EmailTemplates";

/**
 * ==========================================================================
 * notification-log — every email the system tried to send (SPEC §D.5, §H.8)
 * ==========================================================================
 *
 * `sendTemplated` renders the message NOW — subject, HTML, plain text — and
 * writes this row as `queued`; the `send-email` job (queue `email`, five
 * retries) then delivers from the stored rendering and stamps `sent` or
 * `failed`. `skipped` is a template that is disabled, or `log-only` email
 * settings. **Resend** on a row re-sends the stored HTML as it was.
 *
 * WHAT IS REDACTED, AND WHY. `variables` is kept for diagnosis, but with
 * every key matching /^(links?|token|url|magic)/i replaced by "[redacted]"
 * before the row is written (§D.5) — so a front-desk user reading the log
 * can never copy a live "my bookings" magic link or a waitlist token. The
 * rendered `html` and `text` are admin-only for the same reason: they
 * contain the links in clear. `purge-retention` clears `variables`, `html`
 * and `text` after 30 days, after which Resend is disabled on the row.
 *
 * Append-only for people: created and updated by the mailer and the job.
 * The mailer redacts before it writes; the `beforeChange` below redacts
 * again on every write, so no other code path (a job, a script, a future
 * caller of the Local API) can store a live link here by accident.
 *
 * **Resend** (sidebar, admin only) is cms/components/notifications/
 * ResendButton.tsx → `POST /api/actions/notifications/{id}/resend`; it is
 * disabled once the 30-day purge has cleared the stored HTML.
 */

const redactOnWrite: CollectionBeforeChangeHook = ({ data }) => {
  if (data && data.variables !== undefined && data.variables !== null) data.variables = redactVariables(data.variables);
  return data;
};

export const NOTIFICATION_STATUSES = [
  { label: "Queued", value: "queued" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
] as const;

export const NOTIFICATION_PROVIDERS = [
  { label: "SMTP", value: "smtp" },
  { label: "Resend", value: "resend" },
  { label: "Log only (nothing sent)", value: "log" },
] as const;

/** The same keys as the templates; the log records which one was used. */
const TEMPLATE_KEY_OPTIONS: ReadonlyArray<{ label: string; value: TemplateKey }> = TEMPLATE_KEYS;

export const NotificationLog: CollectionConfig = {
  slug: "notification-log",
  labels: { singular: "Sent email", plural: "Sent emails" },
  admin: {
    group: EMAILS_GROUP,
    useAsTitle: "subject",
    defaultColumns: ["createdAt", "to", "templateKey", "status", "attempts", "sentAt"],
    description: "Every email the site has sent or tried to send, with its outcome. Resend from here; wording lives under Email templates.",
    hidden: ({ user }) => roleOf({ user } as never) === "editor" || roleOf({ user } as never) === undefined,
    listSearchableFields: ["to", "subject", "templateKey", "providerMessageId"],
  },
  defaultSort: "-createdAt",
  hooks: {
    beforeChange: [redactOnWrite],
  },
  access: {
    read: isStaff,
    create: systemOnly,
    update: systemOnly,
    delete: systemOnly,
  },
  fields: [
    {
      name: "resend",
      type: "ui",
      label: "Resend",
      admin: { position: "sidebar", components: { Field: "@/cms/components/notifications/ResendButton#ResendButton" } },
    },
    {
      type: "row",
      fields: [
        { name: "channel", type: "select", label: "Channel", required: true, hasMany: false, defaultValue: "email", options: [{ label: "Email", value: "email" }], admin: { width: "25%", readOnly: true } },
        { name: "to", type: "text", label: "To", required: true, index: true, maxLength: 320, admin: { width: "40%", readOnly: true } },
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "queued",
          index: true,
          options: [...NOTIFICATION_STATUSES],
          admin: { width: "35%", readOnly: true },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "templateKey", type: "select", label: "Template", hasMany: false, index: true, options: [...TEMPLATE_KEY_OPTIONS], admin: { width: "50%", readOnly: true } },
        { name: "subject", type: "text", label: "Subject", maxLength: 200, admin: { width: "50%", readOnly: true } },
      ],
    },
    {
      type: "collapsible",
      label: "Delivery",
      fields: [
        {
          type: "row",
          fields: [
            { name: "provider", type: "select", label: "Sent through", hasMany: false, options: [...NOTIFICATION_PROVIDERS], admin: { width: "34%", readOnly: true } },
            { name: "providerMessageId", type: "text", label: "Provider message id", maxLength: 200, admin: { width: "33%", readOnly: true } },
            { name: "attempts", type: "number", label: "Attempts", required: true, defaultValue: 0, min: 0, admin: { width: "33%", step: 1, readOnly: true } },
          ],
        },
        { name: "error", type: "textarea", label: "Last error", maxLength: 2000, admin: { readOnly: true } },
        { name: "sentAt", type: "date", label: "Sent", index: true, admin: { readOnly: true, date: { displayFormat: "d MMM yyyy, HH:mm" } } },
      ],
    },
    {
      type: "collapsible",
      label: "About",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "row",
          fields: [
            { name: "order", type: "relationship", relationTo: "orders", label: "Order", index: true, admin: { width: "50%", readOnly: true } },
            { name: "session", type: "relationship", relationTo: "sessions", label: "Session", index: true, admin: { width: "50%", readOnly: true } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "ticket", type: "relationship", relationTo: "tickets", label: "Ticket", admin: { width: "34%", readOnly: true } },
            { name: "refund", type: "relationship", relationTo: "refunds", label: "Refund", admin: { width: "33%", readOnly: true } },
            { name: "enquiry", type: "relationship", relationTo: "enquiries", label: "Enquiry", admin: { width: "33%", readOnly: true } },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Content (admin only)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "variables",
          type: "json",
          label: "Variables used",
          admin: { readOnly: true, description: "Links, tokens and URLs are replaced by “[redacted]” before this is stored." },
        },
        { name: "html", type: "code", label: "HTML as sent", access: { read: isAdminField }, admin: { readOnly: true, language: "html" } },
        { name: "text", type: "textarea", label: "Plain text as sent", access: { read: isAdminField }, admin: { readOnly: true } },
      ],
    },
  ],
};
