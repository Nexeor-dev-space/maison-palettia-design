/**
 * `email-settings` — "Email sending" (SPEC §C.3 row 8). Admin only.
 *
 * How messages leave the server: not at all (`log-only`), through an SMTP
 * relay, or through Resend. The *wording* of each message is a document in
 * Emails → Templates; the text printed on tickets is under Booking & checkout
 * wording. This global is the transport and the sender line, nothing else.
 *
 * `log-only` IS THE HONEST DEFAULT. Nothing leaves the server, every send
 * still writes a `notification-log` row, and the dashboard carries an amber
 * banner until a real provider is verified — because an email setting that
 * looks configured but is not would mean customers paying and never getting
 * their tickets. "Bookings open" (Booking & checkout wording) reads
 * `lastVerify.ok` and refuses until **Verify connection** has succeeded.
 *
 * Secrets (`smtp.password`, `resendApiKey`) are `encryptedText` (§C.2). The
 * "required when…" rules for them live in a global `beforeValidate` rather
 * than a field validator, because the value the validator would see is the
 * mask when the secret is already saved — presence is `…SetAt` plus "not
 * cleared in this save".
 *
 * Phase 3C wires `EmailActions` (Verify connection · Send test to…) through
 * `admin.components.elements.beforeDocumentControls` and the `afterChange`
 * that drops the cached transport.
 */

import type { EmailFieldValidation, GlobalBeforeValidateHook, GlobalConfig } from "payload";
import { email as validateEmail } from "payload/shared";

import { isAdmin } from "@/cms/access/roles";
import { encryptedText } from "@/cms/fields/encryptedText";

import { choice, copy, count, section, toggle, type TextValidate } from "./copyFields";
import { settingsAfterChange, settingsError } from "./settingsHooks";

export const EMAIL_SETTINGS_SLUG = "email-settings" as const;

export type EmailProvider = "log-only" | "smtp" | "resend";

/* ────────────────────────────────────────────────────────────────────────── */
/* "Required when a real provider is chosen"                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const providerOf = (data: unknown): EmailProvider =>
  ((data as { provider?: EmailProvider } | undefined)?.provider ?? "log-only") as EmailProvider;

/** Text required for any provider other than log-only. */
const requiredWhenSending =
  (message: string): TextValidate =>
  (value, { data }) =>
    providerOf(data) !== "log-only" && !value ? message : true;

/** Text required when the given provider is selected. */
const requiredFor =
  (provider: EmailProvider, message: string): TextValidate =>
  (value, { data }) =>
    providerOf(data) === provider && !value ? message : true;

/** The From address: a valid email, and present whenever anything is actually sent. */
const validateFromAddress: EmailFieldValidation = (value, options) => {
  if (providerOf(options.data) !== "log-only" && !value) return "Enter the address emails come from.";
  return validateEmail(value, options);
};

/**
 * A secret counts as present when the incoming value is non-empty (a new
 * key, or the mask for an untouched one) or, when the field was left out of
 * the save entirely, when a stored value exists. `null` is the SecretField's
 * explicit "Clear" and counts as absent.
 */
const hasSecret = (incoming: unknown, storedSetAt: unknown): boolean => {
  if (incoming === null) return false;
  if (incoming !== undefined) return Boolean(incoming);
  return Boolean(storedSetAt);
};

const requireProviderSecrets: GlobalBeforeValidateHook = ({ data, originalDoc, req }) => {
  const provider = providerOf({ ...originalDoc, ...data });
  const refuse = (path: string, message: string) => settingsError(req, EMAIL_SETTINGS_SLUG, path, message);

  if (provider === "smtp" && !hasSecret(data?.smtp?.password, originalDoc?.smtp?.passwordSetAt)) {
    throw refuse("smtp.password", "Enter the SMTP password.");
  }
  if (provider === "resend" && !hasSecret(data?.resendApiKey, originalDoc?.resendApiKeySetAt)) {
    throw refuse("resendApiKey", "Enter the Resend API key.");
  }
  return data;
};

export const EmailSettings: GlobalConfig = {
  slug: EMAIL_SETTINGS_SLUG,
  label: "Email sending",
  admin: {
    group: "Settings (admin)",
    description:
      "How messages leave the server. The wording of each message is under Emails → Templates; the text printed on tickets is under Booking & checkout wording.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeValidate: [requireProviderSecrets],
    afterChange: [
      settingsAfterChange({
        slug: EMAIL_SETTINGS_SLUG,
        watch: [
          { path: "provider" },
          { path: "fromAddress" },
          { path: "smtp.password", secret: true },
          { path: "resendApiKey", secret: true },
        ],
      }),
    ],
  },
  fields: [
    choice(
      "provider",
      "Provider",
      [
        { label: "Log only — nothing leaves the server", value: "log-only" },
        { label: "SMTP", value: "smtp" },
        { label: "Resend", value: "resend" },
      ],
      {
        description:
          "Log only writes every message to the notification log and sends nothing. Customers will not receive confirmations, tickets or invoices, and staff cannot reset passwords, until a real provider is verified.",
        defaultValue: "log-only",
        required: true,
        lock: true,
      },
    ),
    {
      type: "group",
      label: "Sender",
      fields: [
        {
          type: "row",
          fields: [
            copy("fromName", "From name", {
              description: "e.g. Maison Palettia",
              max: 60,
              defaultValue: "Maison Palettia",
              validate: requiredWhenSending("Enter the name emails come from."),
              admin: { width: "50%" },
            }),
            {
              name: "fromAddress",
              type: "email",
              label: "From address",
              validate: validateFromAddress,
              admin: { width: "50%", description: "Must be a sender the provider has verified." },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "replyTo",
              type: "email",
              label: "Reply-to",
              admin: { width: "50%", description: "Where a customer's reply lands. Defaults to the From address." },
            },
            {
              name: "bcc",
              type: "email",
              label: "Archive copy (BCC)",
              admin: { width: "50%", description: "Optional. Every outgoing email is copied here." },
            },
          ],
        },
      ],
    },
    section(
      "smtp",
      "SMTP",
      [
        {
          type: "row",
          fields: [
            copy("host", "Host", {
              max: 200,
              validate: requiredFor("smtp", "Enter the SMTP host."),
              admin: { width: "60%" },
            }),
            count("port", "Port", {
              min: 1,
              max: 65535,
              defaultValue: 587,
              admin: { width: "20%" },
            }),
            toggle("secure", "TLS from the start", {
              description: "On for port 465. Off uses STARTTLS on 587.",
              admin: { width: "20%" },
            }),
          ],
        },
        copy("user", "Username", { max: 200, validate: requiredFor("smtp", "Enter the SMTP username.") }),
        ...encryptedText("password", { label: "Password", verify: "smtp" }),
      ],
      { admin: { condition: (data) => providerOf(data) === "smtp" } },
    ),
    ...encryptedText("resendApiKey", {
      label: "Resend API key",
      description: "From resend.com → API Keys. Sending permission is enough.",
      verify: "resend",
      condition: (data) => providerOf(data) === "resend",
    }),
    {
      name: "lastVerify",
      type: "json",
      label: "Last verification",
      admin: {
        readOnly: true,
        description: "{ ok, at, provider, message } from the last Verify connection. Bookings cannot open until ok is true.",
      },
    },
  ],
};
