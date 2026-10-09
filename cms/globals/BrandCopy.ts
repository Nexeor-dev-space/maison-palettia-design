/**
 * `brand-copy` — "Brand wording" (SPEC §C.3 row 3; fields from
 * docs/cms/research/01-content-inventory.md §3.3 and the shared strings in §7).
 *
 * SENTENCES THAT APPEAR ON SEVERAL PAGES. The tagline is the About title, the
 * footer's script line and the homepage closing eyebrow; the "find us" line is
 * on the FAQ, the Locations page and two homepage sections. Today each of
 * those is re-typed in code and has already drifted once (the hero carries
 * its own three-line copy of the tagline). Kept in one global, a sentence is
 * edited once and every page follows — which is also why page-builder blocks
 * (§E) offer a "use Brand wording" switch instead of their own copy of it.
 *
 * Defaults are the current wording from lib/brand.ts, so the site reads the
 * same the moment the global exists (SPEC §F.0 ensures it with defaults).
 * Page-specific prose does not belong here; it lives in the page's blocks.
 */

import type { GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { TAGS } from "@/lib/cms/cache";

import { copy, fold, prose, rows, section } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const BRAND_COPY_SLUG = "brand-copy" as const;

/** `slug` on list rows is a stable key the renderers switch on; admins only. */
const stableKey = (description: string) =>
  copy("slug", "Key", {
    description,
    max: 40,
    lock: true,
    validate: (value) =>
      value === null || value === undefined || value === "" || (typeof value === "string" && /^[a-z0-9-]+$/.test(value))
        ? true
        : "Lower-case letters, digits and hyphens only.",
  });

export const BrandCopy: GlobalConfig = {
  slug: BRAND_COPY_SLUG,
  label: "Brand wording",
  admin: {
    group: "Settings",
    description:
      "Sentences reused across pages (tagline, story, find-us line). Edit once, changes everywhere they appear.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    afterChange: [settingsAfterChange({ slug: BRAND_COPY_SLUG, revalidateTag: TAGS.brand })],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Core",
          fields: [
            copy("tagline", "Script tagline", {
              description:
                "Set in the script face; keep it to one short line. Changes the About title, the footer and the homepage closing eyebrow together.",
              max: 40,
              required: true,
              defaultValue: "A Palette of Creativity for Everyone",
            }),
            rows("brandStory", "Brand story", [prose("paragraph", "Paragraph", { max: 400, required: true })], {
              description: "One row per paragraph. The first sentence is also the About page's search description.",
              maxRows: 3,
              defaultValue: [
                {
                  paragraph:
                    "Maison Palettia is a creative space built for slowing down, switching off and getting your hands busy. Through hands-on experiences and shared creative moments, we bring people together to explore their creativity, unwind and make something of their own.",
                },
                {
                  paragraph:
                    "We believe creativity doesn’t need to be perfect, productive or complicated. Sometimes, it just needs a little time, a little colour and a place to begin.",
                },
              ],
            }),
            section(
              "openingStatement",
              "“What this is” statement",
              [
                // 40, like the other script-face slots (`tagline`, `closer`):
                // the live line is 34 characters, and the inventory's "≤ 32" was
                // measured against a shorter earlier draft. A default longer
                // than its own maxLength can never be saved — not by the boot
                // seed, not by an editor who touched a different field.
                copy("heading", "Heading (script)", {
                  max: 40,
                  defaultValue: "A Little Space for Big Creativity.",
                }),
                prose("body", "Body", {
                  max: 300,
                  defaultValue:
                    "Maison Palettia is a place to make, experiment and unwind. Pick a palette, get your hands busy and turn a little bit of imagination into something that’s yours.",
                }),
                copy("closer", "Closer", { max: 40, defaultValue: "Come curious. Leave creative." }),
                section("panel", "Lilac panel", [
                  copy("heading", "Heading", { max: 24, defaultValue: "Create your Way." }),
                  prose("body", "Body", {
                    max: 240,
                    defaultValue:
                      "Pick an activity, bring your people or come on your own. There’s no right way to be creative here, just your palette, your hands and whatever you feel like making.",
                  }),
                  copy("signOff", "Sign-off", { max: 32, defaultValue: "Welcome to Maison Palettia." }),
                ]),
              ],
              { description: "Homepage section 02 and the Gallery page opening." },
            ),
            section(
              "closing",
              "Closing invitation",
              [
                copy("heading", "Heading", { max: 36, defaultValue: "Let’s Craft a Community Together." }),
                prose("body", "Body", {
                  max: 160,
                  defaultValue:
                    "Maison Palettia is ready to bring art, creativity, and meaningful engagement.",
                }),
              ],
              { description: "Printed at the foot of the homepage and of About." },
            ),
          ],
        },
        {
          label: "Purpose & community",
          fields: [
            prose("mission", "Mission", {
              description:
                "About page Purpose card and the footer's “Why we do it”. The deck labels Mission/Vision the other way round; the brief's assignment is used.",
              max: 160,
              defaultValue: "To bring people together, one creative moment at a time.",
            }),
            prose("vision", "Vision", {
              max: 200,
              defaultValue:
                "We curate inspiring experiences where imagination, craftsmanship, and community come to life.",
            }),
            section("purposeLabels", "Purpose card labels", [
              {
                type: "row",
                fields: [
                  copy("mission", "Mission card", { max: 16, defaultValue: "Our Mission", admin: { width: "50%" } }),
                  copy("vision", "Vision card", { max: 16, defaultValue: "Our Vision", admin: { width: "50%" } }),
                ],
              },
            ]),
            section("community", "Community statement", [
              copy("heading", "Heading", { max: 40, defaultValue: "Creating Community Through Creativity" }),
              prose("body", "Body", {
                max: 400,
                defaultValue:
                  "Maison Palettia is a space to slow down, switch off and make something. Through hands-on creative experiences, workshops and seasonal activities, we bring people together to explore creativity, try something new and enjoy time away from their screens.",
              }),
              prose("closer", "Closer", {
                max: 120,
                defaultValue:
                  "More than something to do, it’s a reason to pause, connect and come back for something new.",
              }),
            ]),
            rows(
              "journey",
              "How people experience the Maison",
              [
                stableKey("Keep the first two as “walk-in-diy” and “scheduled-sessions”: the Experiences page quotes their descriptions."),
                copy("name", "Name", { max: 14, required: true }),
                prose("description", "Description", { max: 200, required: true }),
              ],
              {
                description:
                  "Three to six steps on About. The first two also feed the two doors on the Experiences page.",
                maxRows: 6,
                defaultValue: [
                  {
                    slug: "walk-in-diy",
                    name: "Create",
                    description:
                      "Drop in, choose an experience and create at your own pace. No experience needed, just pick a project and make it yours.",
                  },
                  {
                    slug: "scheduled-sessions",
                    name: "Together",
                    description:
                      "Join a guided workshop, learn something new and create alongside others. Because making is always better with good company around the table.",
                  },
                  {
                    slug: "family-bonding",
                    name: "Connect",
                    description:
                      "From friends and families to colleagues and communities, Maison Palettia gives people a reason to spend time together, away from the usual routine.",
                  },
                  {
                    slug: "monthly-refresh",
                    name: "Refresh",
                    description:
                      "Rotating themes, seasonal activities and fresh creative experiences keep the Maison feeling new, giving you a reason to come back and try something different.",
                  },
                  {
                    slug: "digital-detox",
                    name: "Unplug",
                    description:
                      "Put the phone down, pick something up and give yourself a chance to slow down. Maison Palettia creates space to focus, relax and simply enjoy making.",
                  },
                ],
              },
            ),
            rows(
              "whatSetsUsApart",
              "What sets us apart",
              [
                stableKey("A stable key for the card; renderers use it, visitors never see it."),
                copy("name", "Card title", { description: "Set in capitals; keep it to 22 characters.", max: 22, required: true }),
                prose("description", "Description", { max: 160, required: true }),
              ],
              {
                description: "Four cards in a 2×2 grid on About.",
                maxRows: 4,
                defaultValue: [
                  {
                    slug: "unique-concept",
                    name: "For Everyone",
                    description:
                      "Creative experiences designed for adults, families, friends, teams and anyone who simply wants to make something.",
                  },
                  {
                    slug: "all-ages",
                    name: "Make & Connect",
                    description:
                      "A space where creativity becomes a way to spend time together, meet people and create shared moments.",
                  },
                  {
                    slug: "sustainability",
                    name: "Create Responsibly",
                    description:
                      "Sustainability is part of how we create, from reusable materials and upcycling to finding thoughtful ways to reduce waste.",
                  },
                  {
                    slug: "trend-responsive",
                    name: "Always Something New",
                    description:
                      "Rotating themes, seasonal experiences and fresh workshop ideas mean there’s always another reason to visit.",
                  },
                ],
              },
            ),
          ],
        },
        {
          label: "Shared lines",
          fields: [
            copy("findUsHeading", "“Find us” heading", {
              description: "Homepage, Experiences page, programme pages and event pages.",
              max: 40,
              defaultValue: "Your Next Creative Stop.",
            }),
            prose("findUsLine", "“Find us” line", {
              description: "FAQ, Locations page and two homepage sections. One sentence.",
              max: 200,
              defaultValue:
                "Find Maison Palettia in the places you already love to visit — and come make something while you’re there.",
            }),
            copy("makeItYourWay", "“Make it your way” heading", {
              description: "Experiences page and the homepage's two-roads section.",
              max: 40,
              defaultValue: "Make It Your Way.",
            }),
            prose("privateEventInvite", "Private-event invitation", {
              description: "Private events page, programme pages, the enquiry form and the FAQ.",
              max: 240,
              defaultValue:
                "Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.",
            }),
            copy("programmesNote", "Programmes note", {
              description: "Under the programme list and in the Private events menu.",
              max: 120,
              defaultValue: "Don’t see yours? That’s probably a conversation worth having.",
            }),
            prose("everythingProvided", "“Everything provided” promise", {
              description:
                "Printed on the FAQ and event pages. The DIY policy says premium materials may cost extra — keep the two in step.",
              max: 200,
              defaultValue:
                "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.",
            }),
            rows(
              "privateEventSteps",
              "Private event — how it works",
              [copy("title", "Step title", { max: 40, required: true }), prose("detail", "Detail", { max: 200 })],
              {
                description: "Used by any “Steps” section set to “Brand wording — private event steps”.",
                maxRows: 6,
              },
            ),
          ],
        },
        {
          label: "Reserved",
          admin: {
            description: "Wording for sections that exist in code but are not on any page today. Safe to leave as is.",
          },
          fields: [
            fold(
              "Seasonal",
              [
                prose("seasonalIntro", "Seasonal intro", {
                  max: 300,
                  defaultValue:
                    "Maison Palettia delivers seasonal workshops inspired by celebrations such as Valentine’s Day, Ramadan, Mother’s Day, Christmas, and more. Limited-time experiences worth coming back for.",
                }),
                rows(
                  "seasonalMoments",
                  "Seasonal examples",
                  [
                    copy("occasion", "Occasion", { max: 40, required: true }),
                    copy("experience", "Experience", { max: 80 }),
                    { name: "image", type: "upload", relationTo: "media", label: "Image" },
                  ],
                  { description: "Examples of past seasons, not a calendar.", maxRows: 6 },
                ),
              ],
              { initCollapsed: true },
            ),
            fold(
              "Kids, collaborations, track record",
              [
                rows(
                  "littleCreators",
                  "Kids activities",
                  [copy("name", "Name", { max: 40, required: true }), { name: "image", type: "upload", relationTo: "media", label: "Image" }],
                  { maxRows: 6 },
                ),
                rows(
                  "collaborations",
                  "Collaboration models",
                  [copy("name", "Name", { max: 60, required: true }), prose("description", "Description", { max: 160 })],
                  { maxRows: 6 },
                ),
                prose("experienceStatement", "Track-record statement", { max: 400 }),
                rows("ourApproach", "Our approach", [copy("line", "Line", { max: 120, required: true })], { maxRows: 6 }),
                prose("notes", "Archive notes", {
                  description: "Anything from the brand deck worth keeping on record but not printing.",
                  max: 2000,
                }),
              ],
              { initCollapsed: true },
            ),
          ],
        },
      ],
    },
  ],
};
