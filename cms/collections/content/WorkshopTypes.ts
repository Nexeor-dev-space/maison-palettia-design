import { APIError, ValidationError, type CollectionBeforeDeleteHook, type CollectionBeforeValidateHook, type CollectionConfig, type Where } from "payload";

import { slug } from "@/cms/fields";
import { guardSlugChange } from "@/cms/hooks/formatSlug";
import { imageryPublishGate } from "@/cms/hooks/publishGate";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, image, orderField, paragraphs, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * workshop-types — the formats a Create Together experience is run in
 * ==========================================================================
 *
 * The client's "Scheduled Workshops Update" (Oct 2026) split both booked
 * experiences into formats of their own, each with its own dates, times
 * and price: Candle Making runs monthly THEMES (the Cheesecake Collection,
 * Sculptural Forms), Crocheting runs skill LEVELS a customer progresses
 * through (Beginners, Beginner Basics, Returning Learners, Beginner
 * Project). A customer picks the format first, then a date within it.
 *
 * So a workshop type sits between the experience and its sessions:
 *
 *   experience ........ the door: Candle Making, Crocheting
 *   workshop type ..... one format of it: a theme, a level — this collection
 *   session ........... one dated sitting of a format, with its price and seats
 *
 * WHAT A TYPE CARRIES, AND WHAT IT DOES NOT. A name, a one-line
 * description, a level label, the long copy and a photograph: the things
 * that are true of every sitting. Price, duration, venue and seats stay on
 * the session, where they always were, because the client's own schedule
 * prices each sitting ("depending on the session and its content") and
 * Repeat weekly copies them from date to date. Nothing here is a counter.
 *
 * THE PROGRESSION is two fields: `recommendedAfter` (which type a customer
 * is best coming from) and the free-text note the type page prints beside
 * its name ("Start here", "After Beginners"). Order is the editor's `order`,
 * so the Crochet ladder reads top to bottom as the studio means it.
 *
 * THE MONTHLY THEMES need no redesign: a new theme is a new row, its dates
 * are sessions that point at it, and retiring one is unpublishing it. The
 * experience page lists whatever is published and has dates ahead.
 *
 * Address: /events/{slug} — the same route the experiences and sessions
 * use, resolved by lib/eventDetail.ts, which answers a type slug with the
 * type's own page (its dates). A renamed live slug leaves a redirect behind.
 */

/**
 * beforeDelete: a type with sessions behind it stays, for the same reason an
 * experience with sessions does (Experiences.ts) — those dates would lose
 * their format and their address. The seed passes `context.system`.
 */
const refuseDeleteWithSessions: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.context?.system === true) return;
  const { totalDocs } = await req.payload.count({ collection: "sessions", where: { workshopType: { equals: id } }, overrideAccess: true, req });
  if (totalDocs > 0) {
    throw new APIError(
      `${totalDocs} ${totalDocs === 1 ? "session belongs" : "sessions belong"} to this workshop type. Delete or move ${totalDocs === 1 ? "it" : "them"} first, or unpublish the type instead.`,
      409,
      undefined,
      true,
    );
  }
};

/**
 * beforeValidate: the type's address must not be an experience's or a
 * session's. All three share /events/{slug}, and lib/eventDetail.ts answers
 * a session first, then a type, then an experience — so a type named
 * "candle-making" would silently take over the experience's own page.
 * Runs after the slug field has derived its value from the name.
 */
const refuseSharedSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const slug = (data as { slug?: unknown } | undefined)?.slug ?? (originalDoc as { slug?: unknown } | undefined)?.slug;
  if (typeof slug !== "string" || !slug) return data;
  const [experiences, sessions] = await Promise.all([
    req.payload.count({ collection: "experiences", where: { slug: { equals: slug } }, overrideAccess: true, req }),
    req.payload.count({ collection: "sessions", where: { slug: { equals: slug } }, overrideAccess: true, req }),
  ]);
  if (experiences.totalDocs > 0 || sessions.totalDocs > 0) {
    const owner = experiences.totalDocs > 0 ? "an experience" : "a session";
    throw new ValidationError(
      { collection: "workshop-types", errors: [{ path: "slug", message: `“${slug}” is already the address of ${owner}. Give the type its own, e.g. “${slug}-theme”.` }] },
      req.t,
    );
  }
  return data;
};

const revalidate = revalidationHooks("workshop-types");

export const WorkshopTypes: CollectionConfig = {
  slug: "workshop-types",
  labels: { singular: "Workshop type", plural: "Workshop types" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "experience", "level", "order", "_status", "updatedAt"],
    description: "The formats a Create Together experience runs in — a candle theme, a crochet level. Sessions are the dates of a type.",
    listSearchableFields: ["name", "description", "slug", "level"],
    components: {
      beforeListTable: [
        {
          path: "@/cms/components/admin/ListIntro#ListIntro",
          clientProps: {
            icon: "star",
            heading: "No workshop types yet",
            body: "A workshop type is one format of a Create Together experience: a monthly candle theme, or a crochet level customers progress through. Add the type, then add Sessions that point at it — the experience page lists every type with dates ahead, and each type has its own page of dates.",
            actions: [
              { label: "Add a workshop type", href: "/collections/workshop-types/create", primary: true },
              { label: "See the sessions", href: "/collections/sessions" },
            ],
          },
        },
      ],
    },
    preview: previewFor("workshop-types"),
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [refuseSharedSlug, imageryPublishGate([{ field: "image", noun: "The photograph" }])],
    beforeChange: [guardSlugChange({ noun: "workshop type" }), slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    beforeDelete: [refuseDeleteWithSessions],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      name: "experience",
      type: "relationship",
      relationTo: "experiences",
      label: "Experience",
      required: true,
      filterOptions: { kind: { equals: "scheduled" } },
      admin: { description: "The Create Together experience this is a format of." },
    },
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Name",
          required: true,
          maxLength: 40,
          admin: { width: "60%", description: "e.g. “The Cheesecake Collection”, “Crochet — Beginners”. It is the title of every session of this type unless a session overrides it." },
        },
        {
          name: "level",
          type: "text",
          label: "Level",
          maxLength: 24,
          admin: { width: "40%", description: "Optional, e.g. “Beginner”, “Returning”. Printed as a chip; leave empty for a theme." },
        },
      ],
    },
    slug({ from: "name", admin: { position: "sidebar", description: "The address: /events/{slug}. Keep it distinct from the experience's own slug." } }),
    {
      name: "description",
      type: "text",
      label: "One-line description",
      maxLength: 160,
      admin: { description: "Under the name on the experience page and at the top of the type's own page. Leave empty until the concept is final." },
    },
    paragraphs("about", "About (long)", {
      description: "One row per paragraph. What customers make and how the format runs — price, duration and dates live on the sessions.",
    }),
    image("image", "Photograph", "Optional. Falls back to the experience's main photograph on cards and the page."),
    {
      name: "progression",
      type: "group",
      label: "Learning progression",
      admin: { description: "For formats customers move through in order. Leave both empty for a theme." },
      fields: [
        {
          name: "recommendedAfter",
          type: "relationship",
          relationTo: "workshop-types",
          label: "Recommended after",
          filterOptions: ({ siblingData, id }): Where => {
            const experience = (siblingData as { experience?: string | { id?: string } } | undefined)?.experience;
            const experienceId = typeof experience === "string" ? experience : experience?.id;
            const clauses: Where[] = [];
            if (experienceId) clauses.push({ experience: { equals: experienceId } });
            if (id) clauses.push({ id: { not_equals: id } });
            return clauses.length ? { and: clauses } : {};
          },
          admin: { description: "The type customers are best coming from, e.g. Beginner Basics after Beginners." },
        },
        {
          name: "note",
          type: "text",
          label: "Progression note",
          maxLength: 80,
          admin: { description: "Printed beside the name, e.g. “Start here” or “Once you have the basic stitches”." },
        },
      ],
    },
    {
      name: "status",
      type: "text",
      label: "Status flag",
      maxLength: 20,
      admin: { position: "sidebar", description: "Shown verbatim, e.g. “New this month”. Leave blank when nothing needs saying." },
    },
    orderField("Position on the experience page and in the progression: lower numbers come first."),
  ]),
};
