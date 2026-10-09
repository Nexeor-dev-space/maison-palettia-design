import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from "payload";

import { slug } from "@/cms/fields";
import { guardSlugChange } from "@/cms/hooks/formatSlug";
import { imageryPublishGate } from "@/cms/hooks/publishGate";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, gallery, image, orderField, paragraphs, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * experiences — the activities (SPEC §D.2; fields from 01 §4.2)
 * ==========================================================================
 *
 * The seven things the studio does — Tote Bag Painting, Ceramic Painting,
 * Bedazzling… — each sold one of two ways: `diy` (Create Anytime: walk in)
 * or `scheduled` (Create Together: a `sessions` row per date). An experience
 * is the door; a session is one date behind it. Every list on the site reads
 * this collection: /events, the menus, the Book sheet, the homepage carousel,
 * the private-events grids, the gallery.
 *
 * Name and description are short on purpose: the name is a script-face H1
 * and a 48 px menu thumb's caption; the one-liner sits under it everywhere.
 * `about[]` is the long copy and is craft only — price, age, duration and
 * group size are facts on the session and the policies (01 §4.2).
 *
 * Publishing an experience whose photographs are AI-generated or of unknown
 * origin is refused by `publishGate` unless Site details allows it. A
 * published slug is changed by admins only and the old address redirects;
 * publishing purges /, /events, /events/{slug}, /gallery and the private
 * events pages (./revalidation.ts).
 */
export const EXPERIENCE_KINDS = [
  { label: "Create Anytime — walk in, no booking", value: "diy" },
  { label: "Create Together — booked for a date", value: "scheduled" },
] as const;

/**
 * beforeDelete: an experience with sessions behind it stays. Deleting it
 * would leave those dates without a name, photograph or page to hang off
 * (the relationship is required on the session); the editor deletes or
 * moves the sessions first. Server code (a seed reset) passes `context.system`.
 */
const refuseDeleteWithSessions: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.context?.system === true) return;
  const { totalDocs } = await req.payload.count({ collection: "sessions", where: { experience: { equals: id } }, overrideAccess: true, req });
  if (totalDocs > 0) {
    throw new APIError(
      `${totalDocs} ${totalDocs === 1 ? "session belongs" : "sessions belong"} to this experience. Delete or move ${totalDocs === 1 ? "it" : "them"} first, or unpublish the experience instead.`,
      409,
      undefined,
      true,
    );
  }
};

const revalidate = revalidationHooks("experiences");

export const Experiences: CollectionConfig = {
  slug: "experiences",
  labels: { singular: "Experience", plural: "Experiences" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "kind", "status", "order", "_status", "updatedAt"],
    description: "The creative activities. Scheduled dates for an experience are Sessions.",
    listSearchableFields: ["name", "description", "slug"],
    preview: previewFor("experiences"),
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [
      imageryPublishGate([
        { field: "image", noun: "The hero image" },
        { field: "gallery", noun: "The gallery image" },
      ]),
    ],
    beforeChange: [guardSlugChange({ noun: "experience" }), slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    beforeDelete: [refuseDeleteWithSessions],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Name",
          required: true,
          maxLength: 24,
          admin: { width: "50%", description: "Up to 24 characters: it is a script-face title and a menu caption." },
        },
        {
          name: "kind",
          type: "select",
          label: "How it is sold",
          required: true,
          defaultValue: "diy",
          options: [...EXPERIENCE_KINDS],
          admin: { width: "50%", description: "Only Create Together experiences can have Sessions." },
        },
      ],
    },
    slug({ from: "name", admin: { position: "sidebar", description: "The address: /events/{slug}. Sessions take their slugs from it." } }),
    {
      name: "description",
      type: "text",
      label: "One-line description",
      required: true,
      maxLength: 60,
      admin: { description: "Printed under the name in menus, cards and the Book sheet." },
    },
    paragraphs("about", "About (long)", {
      description: "One row per paragraph; two is the house length. Craft only — no price, age, duration or group size here.",
    }),
    image("image", "Main photograph", "Square works best: menu thumbs are 48 px squares and cards are near-square. At least 1000 px."),
    gallery("gallery", "Gallery (up to 3)", 3, "Fanned beside the About section on the experience page. Must not repeat the main photograph."),
    {
      name: "status",
      type: "text",
      label: "Status flag",
      maxLength: 20,
      admin: {
        position: "sidebar",
        description: "Shown verbatim instead of “Any time” / “Scheduled”, e.g. Coming soon. Leave blank when live.",
      },
    },
    {
      name: "vibes",
      type: "relationship",
      relationTo: "vibes",
      hasMany: true,
      label: "Vibes",
      admin: { position: "sidebar", description: "Tag the mood. The “Find your vibe” filter appears once anything is tagged." },
    },
    {
      name: "ageGuidance",
      type: "text",
      label: "Age guidance",
      maxLength: 120,
      admin: { description: "e.g. “Age 12 and over.” Printed in the policy pages' age tables." },
    },
    {
      name: "privateEventEligible",
      type: "checkbox",
      label: "Offer for private events",
      defaultValue: true,
      admin: { position: "sidebar", description: "Listed on the programme pages and in the enquiry form." },
    },
    orderField(),
  ]),
};
