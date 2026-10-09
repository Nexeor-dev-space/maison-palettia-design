/**
 * `payment-settings` — "Payments (Mamo Pay)" (SPEC §C.3 row 7). Admin only.
 *
 * Test/Live keys, webhook, checkout options. The whole reason the owner has
 * no `.env` beyond three keys: Mamo credentials are pasted here, sealed at
 * rest by `encryptedText` (§C.2), and read back only by the gateway client
 * with `context.internalRead` — the admin UI never sees a key again after
 * the save, only `••••••••` and the date it was set.
 *
 * TWO SETS OF CREDENTIALS, ONE SWITCH. Sandbox and live are separate Mamo
 * accounts with separate keys and separate webhooks, so each has its own
 * group and its own read-only "connection details". `mode` picks which one
 * the checkout uses. Switching to **Live** is refused until the live key has
 * passed Test connection, the live webhook points at the current site
 * address and that address is https — the same checks the `ModeField`
 * dialog shows before the admin confirms, enforced again here because a
 * dialog is a courtesy and a hook is a guarantee. `mock` is a built-in fake
 * gateway for development and the E2E suite; its option is hidden and its
 * value refused when `NODE_ENV=production`.
 *
 * WEBHOOK SECRETS ARE GENERATED, NOT TYPED. Register/Update webhook (Phase
 * 3B) mints `webhookAuthHeader`, hands it to Mamo, and keeps the previous
 * one valid for ten minutes so in-flight deliveries still verify. Those
 * fields are read-only here; the `[set]` entries in the audit log are the
 * admin's record of a rotation.
 *
 * Phase 3B wires the action buttons (`PaymentActions`:
 * `admin.components.elements.beforeDocumentControls`) and adds the
 * `afterChange` that drops the cached gateway client. They are not referenced
 * here because `generate:importmap` would fail on components that do not
 * exist yet.
 */

import type { GlobalBeforeValidateHook, GlobalConfig, RadioFieldValidation } from "payload";
import { radio as validateRadio } from "payload/shared";

import { isAdmin, isAdminField } from "@/cms/access/roles";
import { encryptedText } from "@/cms/fields/encryptedText";

import { choice, copy, count, fold, prose, section, toggle } from "./copyFields";
import {
  gatewayReadiness,
  isProduction,
  PUBLIC_URL_RE,
  readGlobal,
  settingsAfterChange,
  settingsError,
  type PaymentSettingsLike,
  type SiteSettingsLike,
} from "./settingsHooks";

export const PAYMENT_SETTINGS_SLUG = "payment-settings" as const;

export type PaymentMode = "test" | "live" | "mock";

/** The admin-facing wording for each mode; `ModeField` renders the same list. */
export const PAYMENT_MODE_OPTIONS: Array<{ label: string; value: PaymentMode; hint: string }> = [
  { label: "Test", value: "test", hint: "Mamo sandbox. Cards are test cards and no money moves." },
  { label: "Live", value: "live", hint: "Real payments with the live key. Switching runs a checklist first." },
  { label: "Mock", value: "mock", hint: "A built-in fake gateway for development. Never available in production." },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * One set of Mamo credentials (`test` or `live`): the key, the generated
 * webhook header and its grace copy, and the read-only facts the actions
 * record. Data shape is `test.*` / `live.*` exactly as §C.3 names it.
 */
const credentials = (name: "test" | "live", label: string, keyHelp: string) =>
  section(name, label, [
    ...encryptedText("apiKey", { label: `${name === "test" ? "Sandbox" : "Live"} API key`, description: keyHelp, verify: "mamo" }),
    ...encryptedText("webhookAuthHeader", {
      label: "Webhook auth header (generated)",
      description:
        "Created by Register/Update webhook and Rotate webhook secret. Mamo sends it with every delivery so we can tell its calls from anyone else's.",
      readOnly: true,
    }),
    ...encryptedText("previousWebhookAuthHeader", { label: "Previous webhook auth header", hidden: true }),
    { name: "previousValidUntil", type: "date", label: "Previous header valid until", admin: { hidden: true } },
    fold(
      "Connection details (read-only)",
      [
        {
          type: "row",
          fields: [
            copy("webhookId", "Webhook ID", { admin: { readOnly: true, width: "50%" } }),
            {
              name: "webhookRegisteredAt",
              type: "date",
              label: "Webhook registered",
              admin: { readOnly: true, width: "50%", date: { pickerAppearance: "dayAndTime" } },
            },
          ],
        },
        copy("webhookUrl", "Webhook URL", {
          description:
            "Must start with the current site address. The dashboard flags “Webhook points at an old address” when it does not.",
          admin: { readOnly: true },
        }),
        {
          name: "lastConnectionCheck",
          type: "json",
          label: "Last connection check",
          admin: { readOnly: true, description: "{ ok, at, message } from the last Test connection." },
        },
        copy("observedAuthHeaderName", "Observed auth header name", {
          description: "Which request header Mamo actually used on the first verified delivery.",
          admin: { readOnly: true },
        }),
      ],
      { initCollapsed: true },
    ),
  ]);

/* ────────────────────────────────────────────────────────────────────────── */
/* Mode                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * `mock` keeps its option in the schema in every environment (so the Postgres
 * enum and the generated types are the same everywhere) and is refused by
 * value in production — on top of `ModeField` hiding the option there.
 */
const validateMode: RadioFieldValidation = (value, options) => {
  if (value === "mock" && isProduction()) return "Mock mode is not available in production. Choose Test or Live.";
  return validateRadio(value, options);
};

/**
 * The checklist behind the Live switch, in the order the confirm dialog lists
 * it. Credentials are checked on the *incoming* data merged over the stored
 * document, so a key pasted and verified in the same session counts.
 */
const refuseLiveUntilReady: GlobalBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (data?.mode !== "live" || originalDoc?.mode === "live") return data;

  const merged: PaymentSettingsLike = {
    ...originalDoc,
    ...data,
    live: { ...originalDoc?.live, ...data?.live },
  };
  const site = await readGlobal<SiteSettingsLike>(req, "site-settings");
  const refuse = (message: string) => settingsError(req, PAYMENT_SETTINGS_SLUG, "mode", message);

  const { keyVerified, webhookRegistered } = gatewayReadiness(merged, "live", site.publicUrl);
  if (!keyVerified) throw refuse("Save and verify the live API key first (Live credentials → Test connection).");
  if (!webhookRegistered) throw refuse("Register the live webhook first (Register/Update webhook, with the live key verified).");
  if (typeof site.publicUrl !== "string" || !PUBLIC_URL_RE.test(site.publicUrl)) {
    throw refuse("The site address must be https before going live (Settings → Site details → Advanced).");
  }
  return data;
};

export const PaymentSettings: GlobalConfig = {
  slug: PAYMENT_SETTINGS_SLUG,
  label: "Payments (Mamo Pay)",
  admin: {
    group: "Settings (admin)",
    description: "Test/Live keys, webhook, checkout options.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeValidate: [refuseLiveUntilReady],
    afterChange: [
      settingsAfterChange({
        slug: PAYMENT_SETTINGS_SLUG,
        watch: [
          { path: "mode", notify: true },
          { path: "test.apiKey", secret: true },
          { path: "live.apiKey", secret: true },
          { path: "test.webhookAuthHeader", secret: true },
          { path: "live.webhookAuthHeader", secret: true },
          { path: "checkout.holdMinutes" },
          { path: "reconciliation.enabled" },
        ],
      }),
    ],
  },
  fields: [
    {
      type: "group",
      label: "Mode",
      fields: [
        {
          name: "mode",
          type: "radio",
          label: "Mode",
          required: true,
          defaultValue: "test",
          options: PAYMENT_MODE_OPTIONS.map(({ label, value }) => ({ label, value })),
          validate: validateMode,
          access: { update: isAdminField },
          admin: {
            layout: "vertical",
            description:
              "Test: Mamo sandbox, no real charges. Live: real payments. Switching to Live opens a checklist and is refused until every line passes.",
            components: { Field: "@/cms/components/fields/ModeField#ModeField" },
          },
        },
        choice("provider", "Provider", [{ label: "Mamo Pay", value: "mamo" }], {
          defaultValue: "mamo",
          admin: { readOnly: true },
        }),
      ],
    },
    credentials("test", "Sandbox credentials", "Mamo Dashboard → Developer → Keys, in the sandbox account."),
    credentials("live", "Live credentials", "Mamo Dashboard → Developer → Keys, in the live account."),
    section(
      "checkout",
      "Checkout options",
      [
        {
          type: "row",
          fields: [
            choice(
              "linkType",
              "Payment page",
              [
                { label: "Mamo's hosted page (standalone)", value: "standalone" },
                { label: "Embedded on our checkout (inline)", value: "inline" },
              ],
              { defaultValue: "standalone", admin: { width: "50%" } },
            ),
            choice(
              "paymentMethods",
              "Payment methods",
              [
                { label: "Card", value: "card" },
                { label: "Apple Pay / Google Pay", value: "wallet" },
              ],
              { multiple: true, defaultValue: ["card", "wallet"], admin: { width: "50%" } },
            ),
          ],
        },
        {
          type: "row",
          fields: [
            toggle("enableTabby", "Offer Tabby (buy now, pay later)", { admin: { width: "33%" } }),
            toggle("sendMamoReceipt", "Let Mamo email its own receipt", {
              description: "Off: customers get our confirmation, invoice and tickets only.",
              admin: { width: "33%" },
            }),
            toggle("requireTerms", "Require accepting the terms before paying", {
              defaultValue: true,
              admin: { width: "33%" },
            }),
          ],
        },
        {
          type: "row",
          fields: [
            count("holdMinutes", "Hold seats for (minutes)", {
              description: "How long a basket keeps its seats while the customer pays. 3DS and wallets finish in minutes.",
              min: 5,
              max: 60,
              defaultValue: 15,
              admin: { width: "50%" },
            }),
            copy("titlePrefix", "Payment title prefix", {
              description: "Shown on Mamo's page and the card statement, before the session name.",
              max: 30,
              defaultValue: "Maison Palettia",
              admin: { width: "50%" },
            }),
          ],
        },
        prose("captureNote", "Line under the Pay button", {
          max: 200,
          defaultValue: "You will be taken to Mamo Pay to complete payment securely.",
        }),
      ],
    ),
    section(
      "reconciliation",
      "Automatic checks",
      [
        {
          type: "row",
          fields: [
            toggle("enabled", "Re-check pending payments with Mamo", {
              description: "Catches a payment whose webhook never arrived.",
              defaultValue: true,
              admin: { width: "50%" },
            }),
            count("everyMinutes", "Every (minutes)", {
              description: "The checker wakes every minute and runs when this long has passed since the last run.",
              min: 1,
              max: 60,
              defaultValue: 5,
              admin: { width: "50%" },
            }),
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "lastRunAt",
              type: "date",
              label: "Last run",
              admin: { readOnly: true, width: "50%", date: { pickerAppearance: "dayAndTime" } },
            },
            { name: "lastRunSummary", type: "json", label: "Last run summary", admin: { readOnly: true, width: "50%" } },
          ],
        },
      ],
    ),
    fold(
      "Apple Pay domain file",
      [
        prose("appleDomainAssociation", "Domain association file contents", {
          description:
            "Only if Mamo asks for it for Apple Pay on hosted links. Served as plain text at /.well-known/apple-developer-merchantid-domain-association. Leave empty otherwise.",
          max: 4096,
        }),
      ],
      { initCollapsed: true },
    ),
  ],
};
