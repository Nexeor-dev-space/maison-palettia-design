/**
 * `invoice-settings` — "Invoices & VAT" (SPEC §C.3 row 9). Admin only.
 *
 * The seller block of every invoice and credit note: legal name, trade
 * licence, TRN, address, VAT rate, numbering prefixes, footer note, logo and
 * the fonts the PDFs are set in.
 *
 * ITS OWN LEGAL NAME. Site details also has one (the footer © line), and
 * this one defaults from it on the first save — but it is a separate field
 * because an invoice must snapshot a *stable* legal name (§N): the footer can
 * follow a rebrand the same afternoon, the invoice numbering series cannot.
 *
 * VAT IN BASIS POINTS. `vatRateBps = 500` is 5 %. Money in this system is
 * integer fils (§D), and a rate stored as `5` or `0.05` would put a float
 * into every VAT split; basis points keep the arithmetic in integers. The
 * label spells out the conversion so nobody types "5".
 *
 * TRN OPTIONAL UNTIL REGISTERED. Without it the PDF is titled "Receipt" and
 * prints no VAT line; with it, "Tax Invoice". Prices are VAT-inclusive by
 * default, as the site displays them.
 *
 * Numbering is gapless per year (§H.7) and the prefixes are therefore locked
 * to admins; changing one mid-year starts a visibly different series.
 */

import type { GlobalBeforeChangeHook, GlobalConfig } from "payload";

import { isAdmin } from "@/cms/access/roles";

import { copy, count, fold, matches, panel, rows, section, toggle } from "./copyFields";
import { readGlobal, settingsAfterChange, type SiteSettingsLike } from "./settingsHooks";

export const INVOICE_SETTINGS_SLUG = "invoice-settings" as const;

/** First save with an empty legal name copies the one from Site details. */
const defaultLegalNameFromSite: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const incoming = data?.legalName;
  const stored = originalDoc?.legalName;
  if ((incoming !== undefined && incoming !== null && incoming !== "") || (incoming === undefined && stored)) {
    return data;
  }
  const site = await readGlobal<SiteSettingsLike>(req, "site-settings");
  if (site.legalName) data.legalName = site.legalName;
  return data;
};

const FONT_TYPES = ["font/ttf", "font/otf", "application/x-font-ttf", "application/font-sfnt"];

export const InvoiceSettings: GlobalConfig = {
  slug: INVOICE_SETTINGS_SLUG,
  label: "Invoices & VAT",
  admin: {
    group: "Settings (admin)",
    description: "Legal name, TRN, VAT rate, numbering, PDF logo and fonts.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [defaultLegalNameFromSite],
    afterChange: [
      settingsAfterChange({
        slug: INVOICE_SETTINGS_SLUG,
        watch: [{ path: "trn" }, { path: "vatRateBps" }, { path: "invoicePrefix" }, { path: "creditNotePrefix" }],
      }),
    ],
  },
  // Panels, not named groups: §C.3 names these fields at the top level
  // (`invoice-settings.vatRateBps`, `.invoicePrefix`…) and 3C's PDF renderer
  // reads them there.
  fields: [
    panel("Seller", [
      copy("legalName", "Legal name on invoices", {
        description: "Defaults to Site details → Legal entity name on first save, then stays put.",
        max: 80,
      }),
      {
        type: "row",
        fields: [
          copy("tradeLicenceNumber", "Trade licence number", { max: 40, admin: { width: "50%" } }),
          copy("trn", "TRN (VAT registration)", {
            description:
              "15 digits. Leave empty until registered: without it the PDF is a Receipt, with it a Tax Invoice.",
            max: 15,
            validate: matches(/^\d{15}$/, "A UAE TRN is exactly 15 digits."),
            admin: { width: "50%" },
          }),
        ],
      },
      rows("addressLines", "Registered address", [copy("line", "Line", { max: 80, required: true })], {
        description: "One line per row, as it should print under the legal name.",
        maxRows: 6,
      }),
      {
        type: "row",
        fields: [
          { name: "issuerEmail", type: "email", label: "Invoice email", admin: { width: "50%" } },
          copy("issuerPhone", "Invoice phone", { max: 24, admin: { width: "50%" } }),
        ],
      },
    ]),
    panel("VAT", [
      {
        type: "row",
        fields: [
          count("vatRateBps", "VAT rate (basis points)", {
            description: "500 = 5 %, the UAE standard rate. 0 switches VAT lines off.",
            min: 0,
            max: 10000,
            defaultValue: 500,
            required: true,
            admin: { width: "50%" },
          }),
          toggle("pricesIncludeVat", "Prices shown include VAT", {
            description: "On: AED 240 on the site means AED 240 paid, VAT carved out inside it.",
            defaultValue: true,
            admin: { width: "50%" },
          }),
        ],
      },
    ]),
    panel("Numbering", [
      {
        type: "row",
        fields: [
          copy("invoicePrefix", "Invoice prefix", {
            description: "Numbers run gapless per year: MP-INV-2026-000123.",
            max: 12,
            defaultValue: "MP-INV",
            lock: true,
            validate: matches(/^[A-Z0-9-]{2,12}$/, "Capital letters, digits and hyphens only."),
            admin: { width: "50%" },
          }),
          copy("creditNotePrefix", "Credit note prefix", {
            max: 12,
            defaultValue: "MP-CN",
            lock: true,
            validate: matches(/^[A-Z0-9-]{2,12}$/, "Capital letters, digits and hyphens only."),
            admin: { width: "50%" },
          }),
        ],
      },
    ]),
    {
      name: "footerNote",
      type: "richText",
      label: "Footer note",
      admin: { description: "Printed at the foot of every invoice: refund summary, thanks, bank details if any." },
    },
    fold(
      "PDF appearance",
      [
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
          label: "Logo",
          filterOptions: { mimeType: { in: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"] } },
          admin: { description: "Leave empty to use Site details → Logo (dark cut)." },
        },
        section(
          "pdfFonts",
          "Fonts",
          [
            {
              type: "row",
              fields: [
                {
                  name: "regular",
                  type: "upload",
                  relationTo: "media",
                  label: "Regular",
                  filterOptions: { mimeType: { in: FONT_TYPES } },
                  admin: { width: "50%" },
                },
                {
                  name: "bold",
                  type: "upload",
                  relationTo: "media",
                  label: "Bold",
                  filterOptions: { mimeType: { in: FONT_TYPES } },
                  admin: { width: "50%" },
                },
              ],
            },
          ],
          {
            description:
              "TTF or OTF uploaded to Media. Used for invoice and ticket PDFs; Inter is the fallback when empty. No redeploy needed.",
          },
        ),
      ],
      { initCollapsed: true },
    ),
  ],
};
