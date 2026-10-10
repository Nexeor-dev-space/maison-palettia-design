/**
 * `site-settings` — "Site details" (SPEC §C.3 row 1; fields from
 * docs/cms/research/01-content-inventory.md §3.1).
 *
 * Name, logos, contact details, social links, newsletter. Read by the site
 * layout (header, footer, metadata, OG images) through `lib/cms`, so a save
 * revalidates the layout. Editors may change everything except the
 * **Advanced (admin only)** section, whose fields are both hidden from them
 * (`admin.condition`) and locked (`access.update: isAdminField`) — the lock is
 * the guarantee, the condition is the courtesy.
 *
 * THE ADDRESS OF THE SITE LIVES HERE, NOT IN `.env`. `publicUrl` is read by
 * canonicals, the sitemap, email links and the Mamo Pay return/webhook URLs
 * (`cms/lib/publicUrl.ts`). `NEXT_PUBLIC_SERVER_URL` is only the fallback
 * before the first admin save. The first *admin* save of this global that
 * carries `publicUrl` stamps
 * `system-state.publicUrlConfirmedAt`; until then `isPlaceholderPublicUrl()`
 * is true and the Payments "Register webhook" action refuses, because a
 * webhook registered against a guessed domain is worse than none.
 *
 * NO FAVICON FIELDS. `/favicon.ico`, `/icon.png`, `/apple-icon.png` are
 * static files in `app/` that Next serves itself (§A.2 rule 1); an upload
 * here would do nothing, so the Logos section says who changes them instead.
 */

import path from "node:path";

import type { GlobalAfterChangeHook, GlobalBeforeChangeHook, GlobalBeforeOperationHook, GlobalConfig } from "payload";
import sharp from "sharp";

import { anyone, isEditor, roleOf } from "@/cms/access/roles";
import { TAGS } from "@/lib/cms/cache";

import { choice, copy, fold, httpsUrl, matches, pathList, prose, rows, section, toggle } from "./copyFields";
import {
  adminOnlyCondition,
  isAcceptablePublicUrl,
  readGlobal,
  settingsAfterChange,
} from "./settingsHooks";

export const SITE_SETTINGS_SLUG = "site-settings" as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Logo ink box (sharp alpha bounding box)                                    */
/* ────────────────────────────────────────────────────────────────────────── */

interface InkBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const idOf = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return String((value as { id?: unknown }).id ?? "");
  return String(value);
};

/**
 * Where the lettering sits inside the logo file, as shares of its box.
 *
 * The hero intro draws the mark from its vector (whose box is the ink alone)
 * and flies it onto the raster logo; without these ratios the flight lands
 * the letters on the file's transparent margin (`lib/constants.ts BRAND_LOGO.ink`
 * explains the original hand measurement). Recomputed from the alpha channel
 * whenever the file changes, so an editor can swap the logo without anyone
 * opening an image editor to re-measure it.
 *
 * Downscaled to ≤1200 px before scanning: the ratios are scale-invariant and
 * a 2000×2000 PNG would otherwise cost 16 MB of raw pixels per save.
 */
async function inkBoxOf(
  req: Parameters<GlobalBeforeChangeHook>[0]["req"],
  mediaId: string,
): Promise<InkBox | null> {
  const media = (await req.payload.findByID({
    collection: "media",
    id: mediaId,
    depth: 0,
    overrideAccess: true,
    req,
  })) as { filename?: string | null } | null;
  if (!media?.filename) return null;

  const upload = req.payload.collections.media?.config.upload;
  const staticDir = upload && typeof upload === "object" ? upload.staticDir : undefined;
  if (!staticDir) return null;

  const { data, info } = await sharp(path.join(staticDir, media.filename))
    .resize({ width: 1200, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const alphaOffset = channels - 1;
  const INK_THRESHOLD = 16; // of 255: anti-aliased fringe counts, JPEG noise does not
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      if (data[rowStart + x * channels + alphaOffset] > INK_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // fully transparent — nothing to measure

  return {
    left: minX / width,
    top: minY / height,
    width: (maxX - minX + 1) / width,
    height: (maxY - minY + 1) / height,
  };
}

/**
 * `beforeChange`, not `afterChange`: computing the box before the row is
 * written costs one write instead of two and cannot recurse into this hook.
 * A measurement failure (missing file, unreadable image) is logged and the
 * previous box kept — a logo swap must never be blocked by its own metadata.
 */
const measureLogoInk: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const next = idOf(data?.logoOnDark);
  const prev = idOf(originalDoc?.logoOnDark);
  const hasBox = Boolean(data?.logoOnDarkInk?.width ?? originalDoc?.logoOnDarkInk?.width);
  if (!next || (next === prev && hasBox)) return data;

  try {
    const box = await inkBoxOf(req, next);
    if (box) data.logoOnDarkInk = box;
  } catch (error) {
    req.payload.logger.warn({ msg: "site-settings: could not measure logo ink box", error });
  }
  return data;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* publicUrlConfirmedAt stamp                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** Context key set by `noteSubmittedPublicUrl`, read by `stampPublicUrlConfirmed`. */
const PUBLIC_URL_SUBMITTED = "siteSettingsPublicUrlSubmitted";

/**
 * `beforeOperation` is the only hook that sees the body AS SENT. Before any
 * other hook runs, the field-level beforeValidate fills every field missing
 * from the body with the stored value (fields/hooks/beforeValidate/promise.js,
 * so partial REST updates work), after which `data.publicUrl` is always
 * present and says nothing about what the saver submitted. The answer is
 * parked on `req.context` for the afterChange below; the admin form always
 * posts the whole document, so for a person in the admin this is simply
 * "an admin saved Site details".
 */
const noteSubmittedPublicUrl: GlobalBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === "update") {
    const body = (args as { data?: { publicUrl?: unknown } } | undefined)?.data;
    req.context[PUBLIC_URL_SUBMITTED] = typeof body?.publicUrl === "string" && body.publicUrl.length > 0;
  }
  return args;
};

/**
 * The first save by an ADMIN that submitted `publicUrl` confirms the site
 * address (§A.4 `isPlaceholderPublicUrl`). The role check is not redundant
 * with `req.user`: editors save this global too (wording, contact details),
 * and `publicUrl` is a field they cannot see or change — an editor fixing a
 * typo on day one must not certify a URL still equal to the `.env` seed. A
 * save that did not include the field (a partial REST update) does not
 * count either. Seeds and system writes have no `req.user` and never stamp
 * it. One read per save, one write ever.
 */
const stampPublicUrlConfirmed: GlobalAfterChangeHook = async ({ doc, req, context }) => {
  if (roleOf(req) !== "admin" || context?.system === true) return doc;
  if (context?.[PUBLIC_URL_SUBMITTED] !== true || !doc?.publicUrl) return doc;
  const state = await readGlobal<{ publicUrlConfirmedAt?: string | null }>(req, "system-state");
  if (state.publicUrlConfirmedAt) return doc;
  await req.payload.updateGlobal({
    slug: "system-state",
    data: { publicUrlConfirmedAt: new Date().toISOString() },
    depth: 0,
    overrideAccess: true,
    req,
  });
  return doc;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Fields                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const RASTER_LOGO_TYPES = ["image/png", "image/svg+xml", "image/webp"];

export const SiteSettings: GlobalConfig = {
  slug: SITE_SETTINGS_SLUG,
  label: "Site details",
  admin: {
    group: "Settings",
    description:
      "Name, logos, contact details, social links, newsletter. The Advanced section (site address, background tasks) is admin-only.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    beforeOperation: [noteSubmittedPublicUrl],
    beforeChange: [measureLogoInk],
    afterChange: [
      settingsAfterChange({
        slug: SITE_SETTINGS_SLUG,
        revalidateTag: TAGS.site,
        watch: [
          { path: "publicUrl", notify: true },
          { path: "enquiriesEnabled" },
          { path: "jobsEnabled", notify: true },
          { path: "allowAiImagery" },
        ],
      }),
      stampPublicUrlConfirmed,
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identity",
          fields: [
            copy("name", "Brand name", {
              description: "Appears in page titles, share cards and screen-reader labels.",
              max: 40,
              required: true,
              defaultValue: "Maison Palettia",
              validate: (value) =>
                typeof value === "string" && value.trim().length >= 2 ? true : "At least two characters.",
            }),
            copy("legalName", "Legal entity name", {
              description: "Printed after © in the footer. Invoices have their own copy under Invoices & VAT.",
              max: 80,
              required: true,
              defaultValue: "Maison Palettia Events L.L.C.",
            }),
            prose("tagline", "Search tagline", {
              description:
                "One plain sentence used as the default meta description. Not the script tagline — that is Brand wording → Script tagline.",
              max: 160,
              required: true,
              defaultValue: "Creative workshops and events in Dubai",
            }),
            fold(
              "Logos",
              [
                {
                  name: "logoOnDark",
                  type: "upload",
                  relationTo: "media",
                  label: "Logo — light cut (for dark backgrounds)",
                  filterOptions: { mimeType: { in: RASTER_LOGO_TYPES } },
                  admin: {
                    description:
                      "Transparent PNG or SVG, at least 1000 px wide. Used over the hero and in share images. The ink box below is measured automatically when this changes.",
                  },
                },
                section(
                  "logoOnDarkInk",
                  "Ink box (measured)",
                  [
                    {
                      type: "row",
                      fields: ["left", "top", "width", "height"].map((name) => ({
                        name,
                        type: "number" as const,
                        label: name[0].toUpperCase() + name.slice(1),
                        min: 0,
                        max: 1,
                        admin: { readOnly: true, width: "25%" },
                      })),
                    },
                  ],
                  {
                    description:
                      "Where the lettering sits inside the file, as shares of its width and height. Recomputed from the image's transparency each time the logo file changes; nothing to edit.",
                  },
                ),
                {
                  name: "logoOnLight",
                  type: "upload",
                  relationTo: "media",
                  label: "Logo — dark cut (for light backgrounds)",
                  filterOptions: { mimeType: { in: RASTER_LOGO_TYPES } },
                  admin: {
                    description: "The header once it turns white, the footer, and invoices unless they set their own.",
                  },
                },
                {
                  name: "monogram",
                  type: "upload",
                  relationTo: "media",
                  label: "P-mark monogram",
                  filterOptions: { mimeType: { in: RASTER_LOGO_TYPES } },
                  admin: { description: "Tiny square mark next to the copyright line. SVG or square PNG." },
                },
              ],
              {
                description:
                  "Browser-tab icons (favicon, home-screen icon) are static files set by Nexeor — ask them to swap those.",
              },
            ),
          ],
        },
        {
          label: "Contact",
          fields: [
            section(
              "contact",
              "Contact details",
              [
                rows(
                  "addressLines",
                  "Postal address lines",
                  [copy("line", "Line", { max: 60, required: true })],
                  {
                    description: "One line per row, as it should print on the contact page and footer.",
                    maxRows: 6,
                    defaultValue: [{ line: "Dubai" }, { line: "United Arab Emirates" }],
                  },
                ),
                {
                  name: "email",
                  type: "email",
                  label: "Public email",
                  admin: { description: "Shown on the contact page and in the footer when set." },
                },
                copy("phone", "Public phone", {
                  description: "Printed as typed; the call link strips spaces. Include the country code.",
                  max: 24,
                  validate: matches(/^\+?[\d\s()-]{7,22}$/, "Digits, spaces and a leading + only, e.g. +971 4 000 0000."),
                }),
                copy("whatsappNumber", "WhatsApp business number", {
                  description:
                    "Digits only, country code first (9715XXXXXXXX). Leave blank to keep WhatsApp off the site.",
                  max: 15,
                  validate: matches(/^\d{10,15}$/, "Digits only, country code first — 10 to 15 digits."),
                }),
                copy("whatsappGreeting", "WhatsApp pre-filled message", {
                  max: 200,
                  defaultValue: "Hello! I would like to ask about an upcoming event.",
                }),
                rows(
                  "hours",
                  "Opening hours",
                  [
                    {
                      type: "row",
                      fields: [
                        copy("days", "Days", { max: 40, required: true, admin: { width: "50%" } }),
                        copy("hours", "Hours", { max: 40, required: true, admin: { width: "50%" } }),
                      ],
                    },
                  ],
                  {
                    description:
                      "e.g. “Sat–Thu” / “10:00–22:00”. Reserved for the venue plate and footer; nothing prints it yet.",
                    maxRows: 7,
                  },
                ),
              ],
            ),
            rows(
              "socials",
              "Social profiles",
              [
                {
                  type: "row",
                  fields: [
                    choice(
                      "platform",
                      "Platform",
                      [
                        { label: "Instagram", value: "instagram" },
                        { label: "Facebook", value: "facebook" },
                        { label: "TikTok", value: "tiktok" },
                        { label: "Pinterest", value: "pinterest" },
                        { label: "YouTube", value: "youtube" },
                        { label: "X", value: "x" },
                        { label: "LinkedIn", value: "linkedin" },
                      ],
                      { required: true, admin: { width: "35%" } },
                    ),
                    copy("url", "Profile URL", {
                      max: 200,
                      validate: httpsUrl(),
                      admin: { width: "65%" },
                    }),
                  ],
                },
              ],
              {
                description:
                  "Only rows with a URL are shown, in the footer's Follow column and on the Contact page. Every platform here has its own icon.",
                maxRows: 7,
                defaultValue: [
                  { platform: "instagram", url: "https://www.instagram.com/maison.palettia/" },
                  { platform: "facebook", url: "https://www.facebook.com/profile.php?id=61594873157618" },
                  { platform: "tiktok", url: "https://www.tiktok.com/@maison.palettia" },
                  { platform: "pinterest", url: "https://www.pinterest.com/1fz0ruautd3l2gr85mxiksyx4z7ejo/" },
                  { platform: "linkedin", url: "https://www.linkedin.com/company/maison-palettia/" },
                ],
              },
            ),
          ],
        },
        {
          label: "Newsletter",
          fields: [
            section(
              "newsletter",
              "Newsletter sign-up",
              [
                toggle("enabled", "Show the newsletter box in the footer", {
                  description: "It only appears when this is on and a provider URL is set below.",
                }),
                copy("actionUrl", "Provider form endpoint", {
                  description:
                    "The URL a Mailchimp, Klaviyo or Buttondown embed form posts to. The footer renders a plain form at it — no script.",
                  max: 300,
                  validate: (value, options) => {
                    const enabled = Boolean((options.siblingData as { enabled?: boolean } | undefined)?.enabled);
                    if (enabled && !value) return "Enter the provider's form endpoint, or switch the sign-up off.";
                    return httpsUrl()(value, options);
                  },
                }),
                copy("fieldName", "Email field name", {
                  description: "What the provider calls the email field. Almost always “email”.",
                  max: 40,
                  defaultValue: "email",
                }),
                copy("heading", "Heading", { max: 40, defaultValue: "Newsletter" }),
                prose("description", "Description", {
                  description: "A promise about what gets sent — say what the studio will actually send.",
                  max: 200,
                  defaultValue: "New dates and new experiences, straight to your inbox.",
                }),
                copy("cta", "Button label", { max: 20, defaultValue: "Subscribe" }),
              ],
            ),
          ],
        },
        {
          label: "Advanced",
          admin: { description: "Admin-only. Site address, background tasks and content gates." },
          fields: [
            fold(
              "Advanced (admin only)",
              [
                copy("publicUrl", "Site address", {
                  description:
                    "The site's address, e.g. https://www.maisonpalettia.com — no path, no trailing slash. Changing it changes every canonical, sitemap URL, email link and Mamo Pay return URL, and the webhook must be re-registered under Payments.",
                  max: 200,
                  required: true,
                  lock: true,
                  validate: (value) =>
                    isAcceptablePublicUrl(value)
                      ? true
                      : "Use https://host (a port is allowed, a path or trailing slash is not).",
                }),
                choice("locale", "Open Graph locale", [{ label: "English (UAE) — en_AE", value: "en_AE" }], {
                  description: "Sent to social networks as the page's language and region.",
                  defaultValue: "en_AE",
                  lock: true,
                }),
                section(
                  "heroTheme",
                  "Header colour per route",
                  [
                    pathList("darkRoutes", "Routes with a dark header", {
                      description: "Pages whose hero is dark, so the header starts in light ink.",
                      lock: true,
                    }),
                    pathList("lightRoutes", "Routes with a light header", {
                      description: "Pages whose hero is light, so the header starts in dark ink.",
                      lock: true,
                      defaultValue: ["/"],
                    }),
                  ],
                  { lock: true },
                ),
                toggle("enquiriesEnabled", "Accept enquiries", {
                  description:
                    "Off hides the contact and private-event forms. Enquiries already received stay in the Inbox.",
                  defaultValue: true,
                  lock: true,
                }),
                toggle("jobsEnabled", "Run background tasks", {
                  description:
                    "Confirmation emails, seat-hold expiry, payment checks, reminders. Turn off only when Nexeor asks you to — the dashboard shows a red warning while this is off.",
                  defaultValue: true,
                  lock: true,
                }),
                toggle("allowAiImagery", "Allow AI-generated imagery in hero and card slots", {
                  description:
                    "Allow pictures marked AI-generated or Unknown origin in hero and card slots. Off blocks publishing an experience, session or programme whose main image is marked that way.",
                  defaultValue: false,
                  lock: true,
                }),
              ],
              { admin: { condition: adminOnlyCondition } },
            ),
          ],
        },
      ],
    },
  ],
};
