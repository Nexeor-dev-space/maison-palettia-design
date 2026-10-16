import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { MUSIC_DIR } from "@/cms/lib/paths";
import { buildCredit, licenceOf, MUSIC_LICENCES } from "@/lib/music";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, orderField, publicContentAccess } from "./shared";

/**
 * ==========================================================================
 * music-tracks — the site's background music, and who made it
 * ==========================================================================
 *
 * An upload collection of its own rather than more mime types on `media`:
 * a track has no alt text, focal point or image sizes, and it does have a
 * creator and a licence that the site is obliged to print. Files live in
 * `media/music/` (cms/lib/paths.ts), inside the folder the backup already
 * carries, and are served same-origin at `/api/music-tracks/file/<name>`
 * with byte ranges, which Safari needs before it will play audio at all.
 *
 * ATTRIBUTION IS THE POINT OF THE FIELDS. "Copyright-free" music is nearly
 * always licensed music: Creative Commons BY wants the title, the creator,
 * the source and the licence, plus a note if the file was edited. The
 * editor fills those in once; lib/music.ts turns them into the credit line
 * that the player shows while the track plays and /music-credits lists for
 * every active track (`credit` below shows it here, read-only, as a check).
 * When a source publishes the exact words it wants (Incompetech, Uppbeat,
 * Bensound do), "Exact credit line" replaces the built one.
 *
 * No drafts: a track is on the playlist or not (`active`). Every change
 * purges the layout, because the player sits in it, and /music-credits.
 */
const revalidate = revalidationHooks("music-tracks");

const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm"];

const httpsCheck = (value: unknown): true | string =>
  !value || (typeof value === "string" && /^https:\/\/[^\s]+$/i.test(value)) ? true : "Enter a full https:// address.";

const httpsOrEmpty: TextFieldSingleValidation = (value) => httpsCheck(value);

/** "Other" needs something a visitor can follow: the licence's link, or the source's own credit wording. */
const licenceUrlCheck: TextFieldSingleValidation = (value, { siblingData }) => {
  const url = httpsCheck(value);
  if (url !== true) return url;
  const sibling = siblingData as { licence?: string; creditOverride?: string | null };
  if (sibling?.licence === "other" && !value && !sibling.creditOverride?.trim()) {
    return "Give the licence link, or fill in the exact credit line below.";
  }
  return true;
};

export const MusicTracks: CollectionConfig = {
  slug: "music-tracks",
  labels: { singular: "Music track", plural: "Music" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "artist", "licence", "active", "order"],
    description:
      "Background music for the site's player. Visitors start it themselves — it never plays on its own. Turn the player on in Settings → Music.",
    listSearchableFields: ["title", "artist", "sourceName"],
    components: {
      beforeListTable: [
        {
          path: "@/cms/components/admin/ListIntro#ListIntro",
          clientProps: {
            icon: "star",
            heading: "No music yet",
            body: "Upload an MP3 and fill in who made it and under which licence — the site prints the credit beside the player and on the Music credits page. Do not use tracks marked NC (non-commercial): this is a business website.",
            actions: [{ label: "Add a track", href: "/collections/music-tracks/create", primary: true }],
          },
        },
      ],
    },
  },
  defaultSort: "order",
  access: publicContentAccess,
  hooks: {
    beforeChange: revalidate.beforeChange,
    afterChange: revalidate.afterChange,
    afterDelete: revalidate.afterDelete,
  },
  upload: {
    staticDir: MUSIC_DIR,
    mimeTypes: AUDIO_TYPES,
    allowRestrictedFileTypes: false,
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "title", type: "text", label: "Track title", required: true, maxLength: 120, admin: { width: "50%" } },
        {
          name: "artist",
          type: "text",
          label: "Creator",
          required: true,
          maxLength: 120,
          admin: { width: "50%", description: "The artist or composer, as the source credits them." },
        },
      ],
    },
    {
      name: "artistUrl",
      type: "text",
      label: "Creator’s page",
      validate: httpsOrEmpty,
      admin: { description: "Optional. Their profile on the source site, or their own site — the credit links their name to it." },
    },
    {
      type: "row",
      fields: [
        {
          name: "sourceName",
          type: "text",
          label: "Where it came from",
          maxLength: 80,
          admin: { width: "50%", description: "e.g. Pixabay, Free Music Archive, Incompetech." },
        },
        {
          name: "sourceUrl",
          type: "text",
          label: "Link to the track",
          validate: httpsOrEmpty,
          admin: { width: "50%", description: "The page you downloaded it from." },
        },
      ],
    },
    {
      name: "licence",
      type: "select",
      label: "Licence",
      required: true,
      defaultValue: "cc-by-4.0",
      options: MUSIC_LICENCES.map(({ value, label }) => ({ value, label })),
      admin: {
        description: "As stated on the download page. Non-commercial (NC) licences are not listed because they cannot be used here.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "licenceName",
          type: "text",
          label: "Licence name",
          maxLength: 80,
          admin: { width: "50%", condition: (_, sibling) => sibling?.licence === "other" },
        },
        {
          name: "licenceUrl",
          type: "text",
          label: "Licence link",
          validate: licenceUrlCheck,
          admin: { width: "50%", condition: (_, sibling) => sibling?.licence === "other" },
        },
      ],
    },
    {
      name: "modified",
      type: "checkbox",
      label: "I edited this track (trimmed, looped, faded or remixed)",
      defaultValue: false,
      admin: { description: "Creative Commons asks that changes are mentioned; the credit then ends “Edited for this site.”" },
    },
    {
      name: "creditOverride",
      type: "textarea",
      label: "Exact credit line (optional)",
      maxLength: 400,
      admin: {
        description:
          "Only when the source gives you wording to copy. It replaces the credit built from the fields above, word for word.",
      },
    },
    {
      // Virtual: the line the site will print, so the editor sees it before saving.
      name: "credit",
      type: "text",
      label: "Credit shown on the site",
      virtual: true,
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
      hooks: { afterRead: [({ data }) => (data ? buildCredit(data) : null)] },
    },
    {
      name: "attributionRequired",
      type: "checkbox",
      label: "Attribution required",
      virtual: true,
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Set by the licence. Every active track is credited either way.",
      },
      hooks: { afterRead: [({ data }) => licenceOf(data?.licence)?.attribution ?? true] },
    },
    {
      name: "active",
      type: "checkbox",
      label: "In the playlist",
      defaultValue: true,
      admin: { position: "sidebar", description: "Untick to take a track off the site without deleting it." },
    },
    orderField("Play order: lower numbers play first (unless Settings → Music shuffles)."),
  ],
};
