/**
 * `navigation` — "Menus & footer" (SPEC §C.3 row 2; fields from
 * docs/cms/research/01-content-inventory.md §3.2).
 *
 * ONE LIST FEEDS FOUR SURFACES. Today `MAIN_NAV` in lib/constants.ts drives
 * the desktop bar, the phone's bottom bar, the phone's About sheet and the
 * footer through per-item flags, and that is the model kept here: a single
 * `primary` array whose rows say where they appear (`mobileSurface`,
 * `secondary`, `utility`). Four separate lists would let the surfaces drift
 * apart — the exact bug a shared source exists to rule out.
 *
 * Mega-menu *contents* (the experiences, the programmes) are not here; they
 * come from the Experiences and Programmes collections. This global holds the
 * fixed words around them: group headings, door labels, preview buttons.
 *
 * Link destinations use the shared `link()` field (§E), so the structure the
 * seed writes (§F.6, `cms/seed/strings/navigation.ts`) is the one the
 * mappers read. Defaults here cover the copy strings, plus the one link that
 * sits in an always-present group (the Experiences accent door, see
 * `doorFields`); the link rows inside arrays are seeded, because their shape
 * belongs to `cms/fields/link.ts`.
 */

import type { GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { link, type LinkValue } from "@/cms/fields/link";
import { TAGS } from "@/lib/cms/cache";

import { choice, copy, fold, prose, rows, section, toggle, type RowsValidate } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const NAVIGATION_SLUG = "navigation" as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Cross-row rules on the main menu                                           */
/* ────────────────────────────────────────────────────────────────────────── */

interface PrimaryRow {
  label?: string;
  menu?: string;
  mobileSurface?: string;
  mobileShortLabel?: string;
}

/**
 * The phone's bottom bar has room for three tabs plus the fixed Contact/Book
 * ones, and each mega menu can hang under one item only. Both are rules
 * across rows, so they live on the array rather than on any one row.
 */
const validatePrimary: RowsValidate = (value) => {
  const items = (Array.isArray(value) ? value : []) as PrimaryRow[];
  if (items.length > 7) return "Keep the main menu to seven items or fewer.";

  const barItems = items.filter((row) => row.mobileSurface === "bar");
  if (barItems.length > 3) return "At most three items can sit in the phone's bottom bar (plus Contact and Book).";

  const tooLongForBar = barItems.find((row) => (row.mobileShortLabel || row.label || "").length > 10);
  if (tooLongForBar) {
    return `“${tooLongForBar.label}” needs a short label of 10 characters or fewer for the bottom bar.`;
  }

  const seen = new Set<string>();
  for (const row of items) {
    if (!row.menu || row.menu === "none") continue;
    if (seen.has(row.menu)) return `Only one menu item can open the “${row.menu}” panel.`;
    seen.add(row.menu);
  }
  return true;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Reusable row shapes                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

interface DoorDefaults {
  title: string;
  sub: string;
  link: LinkValue;
}

/**
 * Door rows inside arrays need no defaults (an absent row is not validated).
 * The one door that is a plain group — the Experiences panel's accent door —
 * is always present in the data, so its required `title` MUST carry a
 * default or a blind `{}` save fails validation: the boot seed could never
 * create the `navigation` row, and an editor's first save of a footer
 * heading would be refused for a field on another tab.
 */
const doorFields = (nameMax: number, subMax: number, defaults?: DoorDefaults) => [
  copy("title", "Title", { max: nameMax, required: true, defaultValue: defaults?.title }),
  copy("sub", "Line under the title", { max: subMax, defaultValue: defaults?.sub }),
  link({ name: "link", label: "Destination", defaultValue: defaults?.link }),
];

export const Navigation: GlobalConfig = {
  slug: NAVIGATION_SLUG,
  label: "Menus & footer",
  admin: {
    group: "Settings",
    description: "One list feeds the desktop bar, mobile bar, mobile sheet and footer. Order here is order everywhere.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    afterChange: [settingsAfterChange({ slug: NAVIGATION_SLUG, revalidateTag: TAGS.nav })],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Main menu",
          fields: [
            rows(
              "primary",
              "Main navigation",
              [
                copy("label", "Label", {
                  description: "Up to 16 characters on the desktop bar.",
                  max: 16,
                  required: true,
                }),
                link({ name: "link", label: "Destination" }),
                {
                  type: "row",
                  fields: [
                    choice(
                      "menu",
                      "Opens a mega menu",
                      [
                        { label: "None", value: "none" },
                        { label: "Experiences panel", value: "experiences" },
                        { label: "Private events panel", value: "private-events" },
                        { label: "About panel", value: "about" },
                      ],
                      {
                        description:
                          "Which panel drops under this item on desktop. The panels' contents come from Experiences, Programmes and the About doors below.",
                        defaultValue: "none",
                        lock: true,
                        admin: { width: "50%" },
                      },
                    ),
                    choice(
                      "mobileSurface",
                      "On phones, show in",
                      [
                        { label: "Bottom bar (always visible, max 3)", value: "bar" },
                        { label: "Sheet (behind the About tab)", value: "sheet" },
                        { label: "Nowhere", value: "none" },
                      ],
                      { defaultValue: "sheet", required: true, admin: { width: "50%" } },
                    ),
                  ],
                },
                copy("mobileShortLabel", "Short label for the bottom bar", {
                  description: "Falls back to the label. Up to 10 characters.",
                  max: 10,
                }),
                {
                  type: "row",
                  fields: [
                    toggle("secondary", "Hide from the desktop bar", {
                      description: "Still shown in the footer and on phones.",
                      admin: { width: "50%" },
                    }),
                    toggle("utility", "Show on the right, beside search", {
                      lock: true,
                      admin: { width: "50%" },
                    }),
                  ],
                },
              ],
              {
                description: "Three to seven items. Drag to reorder.",
                maxRows: 7,
                validate: validatePrimary,
              },
            ),
            section(
              "primaryCta",
              "Primary action button",
              [
                copy("label", "Label", { max: 18, required: true, defaultValue: "Book a session" }),
                link({ name: "link", label: "Destination" }),
              ],
              { description: "The one booking button in the header and the phone's Book tab." },
            ),
            section(
              "bottomBar",
              "Bottom bar fixed tabs",
              [
                {
                  type: "row",
                  fields: [
                    copy("contactLabel", "Contact tab", { max: 8, defaultValue: "Contact", admin: { width: "33%" } }),
                    copy("aboutLabel", "About tab", { max: 8, defaultValue: "About", admin: { width: "33%" } }),
                    copy("bookLabel", "Book tab", { max: 8, defaultValue: "Book", admin: { width: "33%" } }),
                  ],
                },
              ],
              { description: "The three tabs every phone shows regardless of the list above." },
            ),
            section(
              "bookSheet",
              "Phone “Book” sheet",
              [
                copy("heading", "Heading", { max: 60, defaultValue: "What would you like to create?" }),
                copy("lead", "Lead", {
                  max: 120,
                  defaultValue: "Choose a scheduled experience to start your booking.",
                }),
                copy("anytimeNote", "Walk-in note", { max: 40, defaultValue: "Prefer to come anytime?" }),
                copy("anytimeLinkLabel", "Walk-in link label", { max: 30, defaultValue: "Browse all experiences" }),
              ],
              {
                description:
                  "The options list itself is built from scheduled experiences and open sessions; only the words around it live here.",
              },
            ),
            copy("skipLink", "Skip link (accessibility)", {
              description: "The first link keyboard users reach; it jumps past the header.",
              max: 24,
              defaultValue: "Skip to content",
              lock: true,
            }),
          ],
        },
        {
          label: "Mega menus",
          fields: [
            section(
              "experiencesMenu",
              "Experiences panel",
              [
                rows(
                  "groups",
                  "Group headings",
                  [
                    choice(
                      "kind",
                      "Kind",
                      [
                        { label: "Create Anytime (walk-in)", value: "diy" },
                        { label: "Create Together (scheduled)", value: "scheduled" },
                      ],
                      { required: true },
                    ),
                    copy("title", "Title", { max: 20, required: true }),
                    copy("note", "Note", { max: 60 }),
                  ],
                  {
                    description: "Rows under each heading come from Experiences by kind.",
                    maxRows: 2,
                    defaultValue: [
                      { kind: "diy", title: "Create Anytime", note: "No booking needed. Create at your own pace." },
                      { kind: "scheduled", title: "Create Together", note: "Scheduled workshops, booked online." },
                    ],
                  },
                ),
                section(
                  "door",
                  "Accent door",
                  // Today's values, from WorkshopsMenu.tsx via the inventory §3.2.
                  doorFields(20, 40, {
                    title: "Upcoming dates",
                    sub: "Guided sessions you can book.",
                    link: { type: "internal", url: "/events", anchor: "scheduled" },
                  }),
                  { description: "The highlighted door at the end of the panel (today: Upcoming dates)." },
                ),
                {
                  type: "row",
                  fields: [
                    copy("previewActionDiy", "Preview button — walk-in", {
                      max: 20,
                      defaultValue: "See the activity",
                      admin: { width: "50%" },
                    }),
                    copy("previewActionScheduled", "Preview button — scheduled", {
                      max: 20,
                      defaultValue: "See the session",
                      admin: { width: "50%" },
                    }),
                  ],
                },
              ],
            ),
            section(
              "privateEventsMenu",
              "Private events panel",
              [
                copy("railTitle", "Rail heading", { max: 32, defaultValue: "Made for Your Kind of Crowd" }),
                copy("railNote", "Rail note", {
                  max: 90,
                  defaultValue: "Don’t see yours? That’s probably a conversation worth having.",
                }),
                {
                  type: "row",
                  fields: [
                    copy("previewEyebrow", "Preview eyebrow", {
                      max: 20,
                      defaultValue: "Private events",
                      admin: { width: "50%" },
                    }),
                    copy("previewAction", "Preview button", {
                      max: 20,
                      defaultValue: "See this programme",
                      admin: { width: "50%" },
                    }),
                  ],
                },
                rows(
                  "doors",
                  "Doors",
                  [...doorFields(24, 40), toggle("accent", "Highlight this door")],
                  { description: "Two doors: all programmes, and the enquiry form.", maxRows: 2 },
                ),
              ],
              { description: "Rows in the rail are the Programmes with “Show in menu” ticked." },
            ),
            section(
              "aboutMenu",
              "About panel",
              [
                rows(
                  "doors",
                  "Four doors",
                  [
                    copy("name", "Name", { max: 20, required: true }),
                    copy("sub", "Line under the name", { max: 24 }),
                    link({ name: "link", label: "Destination" }),
                    choice(
                      "mark",
                      "Doodle",
                      ["splash", "coral", "starleaf", "bow", "zigzag", "cutout", "starburst", "wave", "bean", "slabCoral", "dot"].map(
                        (value) => ({ label: value, value }),
                      ),
                      { description: "The cut-out shape drawn on the door." },
                    ),
                  ],
                  { maxRows: 4 },
                ),
              ],
            ),
            section("mobile", "Phone slide-out", [
              copy("privateEventsCta", "Private events button", { max: 24, defaultValue: "Book a private event" }),
            ]),
          ],
        },
        {
          label: "Footer",
          fields: [
            section(
              "footer",
              "Footer",
              [
                rows(
                  "groups",
                  "Link columns",
                  [
                    copy("title", "Column title", { max: 14, required: true }),
                    rows(
                      "items",
                      "Links",
                      [copy("label", "Label", { max: 24, required: true }), link({ name: "link", label: "Destination" })],
                      { maxRows: 6 },
                    ),
                  ],
                  { description: "Three columns look best; the grid takes one to four.", maxRows: 4 },
                ),
                fold("Small headings", [
                  {
                    type: "row",
                    fields: [
                      copy("findUsHeading", "Find us", { max: 16, defaultValue: "Find us", admin: { width: "33%" } }),
                      copy("studioHeading", "The studio", { max: 16, defaultValue: "The studio", admin: { width: "33%" } }),
                      copy("whyHeading", "Why we do it", { max: 16, defaultValue: "Why we do it", admin: { width: "33%" } }),
                    ],
                  },
                  {
                    type: "row",
                    fields: [
                      copy("followHeading", "Follow", { max: 16, defaultValue: "Follow", admin: { width: "33%" } }),
                      copy("policiesHeading", "Policies", { max: 16, defaultValue: "Policies", admin: { width: "33%" } }),
                      copy("directionsLabel", "Directions link", {
                        max: 20,
                        defaultValue: "Get directions",
                        admin: { width: "33%" },
                      }),
                    ],
                  },
                ]),
                prose("policiesBlurb", "Policies blurb", {
                  max: 120,
                  defaultValue: "How sessions run, what we ask of visitors, and what happens if plans change.",
                }),
                copy("backToTop", "Back-to-top label", { max: 16, defaultValue: "Back to top" }),
              ],
              { description: "The “Why we do it” text is Brand wording → Mission; it is not repeated here." },
            ),
            rows(
              "legal",
              "Legal links (footer bottom row)",
              [copy("label", "Label", { max: 24, required: true }), link({ name: "link", label: "Destination" })],
              {
                description:
                  "Add Privacy / Terms here once those policies exist — usually a link to a Policy marked “Show in legal row”.",
                maxRows: 4,
              },
            ),
            section("utilityBar", "“More from…” bar", [
              copy("heading", "Heading", { max: 32, defaultValue: "More from Maison Palettia" }),
            ]),
          ],
        },
        {
          label: "Search",
          fields: [
            section(
              "search",
              "Search panel",
              [
                copy("triggerLabel", "Search button label", { max: 48, defaultValue: "Search experiences" }),
                copy("heading", "Panel heading", { max: 48, defaultValue: "Search Maison Palettia" }),
                copy("placeholderWide", "Placeholder (wide screens)", {
                  max: 48,
                  defaultValue: "Search events by name, type or location",
                }),
                copy("placeholderNarrow", "Placeholder (phones)", {
                  max: 48,
                  defaultValue: "Search by name, type or place",
                }),
                copy("popularHeading", "Popular searches heading", { max: 48, defaultValue: "Popular searches" }),
                copy("sessionsHeading", "Results heading — sessions", { max: 48, defaultValue: "Sessions with dates" }),
                copy("activitiesHeading", "Results heading — activities", { max: 48, defaultValue: "Activities" }),
                copy("viewAllLabel", "View all link", { max: 48, defaultValue: "View all events" }),
                copy("noResultsTitle", "No results — title", { max: 48, defaultValue: "No events found" }),
                copy("noResultsBody", "No results — body", {
                  max: 120,
                  defaultValue: "Try searching for another event, location, or activity.",
                }),
              ],
              {
                description:
                  "The popular-search chips are derived from categories, kinds and localities; only the words around them live here.",
              },
            ),
          ],
        },
      ],
    },
  ],
};
