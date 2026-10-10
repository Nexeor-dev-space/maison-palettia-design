import type { CollectionConfig } from "payload";

import { slug } from "@/cms/fields";
import { guardSlugChange } from "@/cms/hooks/formatSlug";
import { imageryPublishGate } from "@/cms/hooks/publishGate";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, image, orderField, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * programmes — the private-event audiences (SPEC §D.2; fields from 01 §4.5)
 * ==========================================================================
 *
 * Birthday Parties, Corporate Events, School Programmes, Mall & Community
 * Activations: the kinds of private booking the studio offers, each with a
 * card on /private-events, a page at /private-events/{slug} and a place in
 * the Private events menu. Two lines per programme because the client wrote
 * two: the short one is read beside three neighbours, the longer one alone
 * on the programme's own page (lib/privateEvents.ts).
 *
 * `mark` is the brand cut-out drawn where there is no photograph; its colour
 * is one of the deck's inks by name, and the renderer owns the hex. `tone`
 * picks the card colours the page already has (today keyed by slug in
 * app/(site)/private-events/page.tsx `AUDIENCE_TONES`).
 *
 * Hooks: the photograph passes `publishGate`; a published slug is changed
 * by admins only and redirects; publishing purges /, /private-events, the
 * programme's page and the enquiry page (./revalidation.ts).
 */

/** Shape words from components/sections/hero/doodles.ts `WEIGHT`. */
export const DOODLE_NAMES = ["splash", "coral", "starleaf", "bow", "zigzag", "cutout", "starburst", "wave", "bean", "slabCoral", "dot"] as const;

/** What an editor reads for each shape; the stored value stays the code's name. */
const DOODLE_LABELS: Record<(typeof DOODLE_NAMES)[number], string> = {
  splash: "Paint splash",
  coral: "Coral sprig",
  starleaf: "Star-shaped leaf",
  bow: "Bow",
  zigzag: "Zigzag",
  cutout: "Paper cut-out",
  starburst: "Starburst",
  wave: "Wave",
  bean: "Bean",
  slabCoral: "Coral block",
  dot: "Dot",
};

/** The doodle dropdown, shared by the programme mark and the About menu (cms/globals/Navigation.ts). */
export const DOODLE_OPTIONS = DOODLE_NAMES.map((value) => ({ label: DOODLE_LABELS[value], value }));

/** The inks a mark may be drawn in (lib/privateEvents.ts `INK_MARK`). */
export const MARK_INKS = [
  { label: "Deep Lilac", value: "lilac" },
  { label: "Soft Lavender", value: "lavender" },
  { label: "Warm Terracotta", value: "terracotta" },
  { label: "White Rock (cream)", value: "cream" },
] as const;

export const PROGRAMME_TONES = [
  { label: "Cream plate on lavender", value: "lavender" },
  { label: "Charcoal, set in reverse", value: "charcoal" },
  { label: "Cream plate on sage", value: "sage" },
  { label: "Lilac, the brand's lead colour", value: "lilac" },
  { label: "Default (cream on surface)", value: "default" },
] as const;

const revalidate = revalidationHooks("programmes");

export const Programmes: CollectionConfig = {
  slug: "programmes",
  labels: { singular: "Programme", plural: "Programmes" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "inPrivateEventsMenu", "order", "_status", "updatedAt"],
    description: "Who private events are for. Each programme has a card, a page and a place in the Private events menu.",
    listSearchableFields: ["name", "description", "slug"],
    preview: previewFor("programmes"),
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [imageryPublishGate([{ field: "image", noun: "The photograph" }])],
    beforeChange: [guardSlugChange({ noun: "programme" }), slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      name: "name",
      type: "text",
      label: "Programme name",
      required: true,
      maxLength: 32,
      admin: { description: "A script-face title. The share image shrinks its type over 16 characters." },
    },
    slug({
      from: "name",
      admin: { position: "sidebar", description: "The address: /private-events/{slug}. A spelling in an existing address stays as it is." },
    }),
    {
      name: "description",
      type: "textarea",
      label: "Short line (cards)",
      required: true,
      maxLength: 140,
      admin: { description: "Read beside three neighbours; keep it parallel with theirs." },
    },
    {
      name: "lead",
      type: "textarea",
      label: "Longer line (programme page)",
      maxLength: 220,
      admin: { description: "The standfirst on the programme's own page. Falls back to the short line." },
    },
    image("image", "Photograph", "3:2 crops well everywhere: the card, the masthead, the menu thumb and the share image."),
    {
      name: "mark",
      type: "group",
      label: "Brand cut-out (fallback)",
      admin: { description: "Drawn when there is no photograph." },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              type: "select",
              label: "Shape",
              options: DOODLE_OPTIONS,
              admin: { width: "50%" },
            },
            { name: "color", type: "select", label: "Ink", options: [...MARK_INKS], admin: { width: "50%" } },
          ],
        },
      ],
    },
    {
      name: "inPrivateEventsMenu",
      type: "checkbox",
      label: "Show in Private events menu",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "tone",
      type: "select",
      label: "Card colour",
      defaultValue: "default",
      options: [...PROGRAMME_TONES],
      admin: { position: "sidebar", description: "Presentation only: one of the card palettes the page already has." },
    },
    orderField(),
  ]),
};
