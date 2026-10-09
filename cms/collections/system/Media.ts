import { stat } from "node:fs/promises";
import path from "node:path";

import type { CollectionConfig, UploadConfig } from "payload";

import { anyone, isAdmin, isEditor, isEditorField } from "@/cms/access/roles";
import {
  refuseDeleteWhileReferenced,
  requireAltOrDecorative,
  revalidateOnMediaChange,
  revalidateOnMediaDelete,
} from "@/cms/hooks/mediaGuards";
import { MEDIA_DIR } from "@/cms/lib/paths";

/**
 * ==========================================================================
 * media — every picture, film and font the site or its PDFs use (SPEC §D.1)
 * ==========================================================================
 *
 * FILES LIVE ON DISK, at `<repo>/media/`, gitignored and backed up with the
 * database. The path is absolute and comes from cms/lib/paths.ts, which is
 * the only place that knows how to find the checkout from inside each of
 * the three ways the CMS runs. Neither `process.cwd()` nor a path relative
 * to this file is safe on its own: the standalone server chdirs into
 * `.next/standalone` AND resolves `import.meta.url` there, so both answers
 * would quietly start a second media folder inside the build output, to be
 * deleted by the next release (docs/cms/research/00-spike.md, G12). Files
 * are served same-origin at `/api/media/file/<filename>`, so `next/image`
 * needs no `remotePatterns`. Replacing a file removes the old name: links
 * to it then answer 404 (`missingFileIs404` below), never the new file.
 *
 * SIZES. Six renditions per image, named for where the site uses them —
 * `thumb` 96² (menus), `menu` 192², `card` 640 wide, `plate` 1200 wide,
 * `hero` 2000 wide, `og` 1200×630 — all WebP except `og`, which keeps the
 * source format because some social crawlers still refuse WebP.
 * `withoutEnlargement` on the three wide sizes: a 900 px photo stays 900 px
 * and the mappers fall back to the original rather than ship a blurry
 * upscale. The focal point is set by clicking the subject in the admin; the
 * cropped sizes keep it in frame.
 *
 * MIME ALLOWLIST, no wildcards: images, MP4 for the studio film, and TTF/OTF
 * because the invoice and ticket PDFs load their brand fonts from this
 * collection (Settings → Invoices & VAT → PDF fonts). 3.90.2 already rejects
 * scripted SVGs and serves XML types with `script-src 'none'`.
 *
 * STAFF-ONLY FIELDS. `credit`, `provenance`, `licence` and `consent` are
 * editorial bookkeeping, not public metadata: field-level `read` access
 * keeps them out of anonymous `GET /api/media` (and Payload refuses `where`
 * filters on unreadable fields, so there is no oracle either).
 *
 * The hooks' reasoning is in cms/hooks/mediaGuards.ts.
 */

const WEBP = { format: "webp", options: { quality: 82 } } as const;

export const MEDIA_TAGS = [
  "experience-hero",
  "experience-gallery",
  "programme",
  "venue",
  "gallery-make",
  "gallery-making",
  "gallery-keep",
  "logo",
  "og",
  "hero",
  "seasonal",
  "kids",
  "film",
  "font",
] as const;

/**
 * What an editor reads for each tag. The stored values above stay the
 * code's (the gallery block filters by them, and a select's values are a
 * database enum); only the wording in the admin is theirs.
 */
export const MEDIA_TAG_LABELS: Record<(typeof MEDIA_TAGS)[number], string> = {
  "experience-hero": "Experience — main photograph",
  "experience-gallery": "Experience — gallery",
  programme: "Private-event programme",
  venue: "Venue",
  "gallery-make": "Gallery — What you make",
  "gallery-making": "Gallery — In the making",
  "gallery-keep": "Gallery — What you keep",
  logo: "Logo",
  og: "Share image (social links)",
  hero: "Large page-top photograph",
  seasonal: "Seasonal",
  kids: "Children’s sessions",
  film: "Studio film",
  font: "PDF font",
};

export const MEDIA_TAG_OPTIONS = MEDIA_TAGS.map((value) => ({ value, label: MEDIA_TAG_LABELS[value] }));

/**
 * A file that is not on disk answers 404, not 500.
 *
 * Replacing a photograph in the admin writes a new file and removes the old
 * one, so a cached page, a shared link or an email that still points at
 * `/api/media/file/<old name>` asks for a file that is gone — and Payload's
 * own handler answers that with a 500 "Something went wrong." This runs
 * first: the same containment check Payload makes (the name may not climb
 * out of the media folder), then a `stat`. A file that exists falls through
 * to Payload's handler, which streams it with its usual headers.
 */
type FileHandler = NonNullable<UploadConfig["handlers"]>[number];

const missingFileIs404 = async (_req: Parameters<FileHandler>[0], { params }: Parameters<FileHandler>[1]): Promise<Response | undefined> => {
  const root = path.resolve(MEDIA_DIR);
  const file = path.resolve(root, params.filename ?? "");
  if (!file.startsWith(root + path.sep)) return undefined; // Payload refuses it with its own 400
  try {
    await stat(file);
    return undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") return undefined;
    return Response.json({ errors: [{ message: "Not found." }] }, { status: 404 });
  }
};

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Media file", plural: "Media" },
  admin: {
    group: "Content",
    useAsTitle: "filename",
    defaultColumns: ["filename", "alt", "provenance", "tags", "updatedAt"],
    description: "Photographs, the studio film, logos and PDF fonts. A file that is still used somewhere cannot be deleted.",
    listSearchableFields: ["filename", "alt", "caption", "credit"],
  },
  folders: true,
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [requireAltOrDecorative],
    beforeDelete: [refuseDeleteWhileReferenced],
    afterChange: [revalidateOnMediaChange],
    afterDelete: [revalidateOnMediaDelete],
  },
  upload: {
    staticDir: MEDIA_DIR,
    // Payload types a handler as "a Response or nothing", not "maybe a Response"; the cast says the same thing.
    handlers: [missingFileIs404 as FileHandler],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "font/ttf",
      "font/otf",
      "application/x-font-ttf",
      "application/font-sfnt",
    ],
    allowRestrictedFileTypes: false,
    focalPoint: true,
    imageSizes: [
      { name: "thumb", width: 96, height: 96, position: "centre", formatOptions: WEBP },
      { name: "menu", width: 192, height: 192, position: "centre", formatOptions: WEBP },
      { name: "card", width: 640, withoutEnlargement: true, formatOptions: WEBP },
      { name: "plate", width: 1200, withoutEnlargement: true, formatOptions: WEBP },
      { name: "hero", width: 2000, withoutEnlargement: true, formatOptions: WEBP },
      { name: "og", width: 1200, height: 630, position: "attention" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "textarea",
      label: "Alt text",
      maxLength: 300,
      admin: {
        description: "Describe what is IN the frame — never an occasion the photo does not show. Required unless the file is decorative.",
      },
    },
    {
      name: "decorative",
      type: "checkbox",
      label: "Decorative only",
      defaultValue: false,
      admin: { description: "Tick for textures and backgrounds that carry no meaning. Alt text is then not required." },
    },
    {
      name: "caption",
      type: "text",
      label: "Caption",
      maxLength: 80,
    },
    {
      name: "credit",
      type: "text",
      label: "Photographer / source credit",
      access: { read: isEditorField },
    },
    {
      name: "provenance",
      type: "select",
      label: "Where it came from",
      required: true,
      defaultValue: "studio",
      options: [
        { label: "Studio — our own photograph", value: "studio" },
        { label: "Client-supplied", value: "client-supplied" },
        { label: "Stock", value: "stock" },
        { label: "AI-generated", value: "ai-generated" },
        { label: "Unknown", value: "unknown" },
      ],
      access: { read: isEditorField },
      admin: {
        description:
          "AI-generated and Unknown pictures cannot be published in hero or card slots unless Settings → Site details → Advanced allows it.",
      },
    },
    {
      name: "licence",
      type: "text",
      label: "Licence / purchase reference",
      maxLength: 200,
      access: { read: isEditorField },
      admin: {
        condition: (data) => data?.provenance === "stock",
        description: "Optional — where the stock licence is filed.",
      },
    },
    {
      name: "consent",
      type: "checkbox",
      label: "Model/parent consent on file",
      defaultValue: false,
      access: { read: isEditorField },
      admin: { description: "Required before a photo of an identifiable child is published (brand rule)." },
    },
    {
      name: "tags",
      type: "select",
      label: "Where it may be used",
      hasMany: true,
      options: MEDIA_TAG_OPTIONS,
    },
    {
      // Virtual: computed on read from `width`, shown only when it applies,
      // so an editor sees the warning on the file instead of on the page.
      name: "sizeNotice",
      type: "text",
      label: "Size notice",
      virtual: true,
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        condition: (data) => typeof data?.width === "number" && data.width < 1000,
      },
      hooks: {
        afterRead: [
          ({ data }) => {
            const width = (data as { width?: unknown } | undefined)?.width;
            return typeof width === "number" && width < 1000 ? "Under 1000 px wide — may look soft in hero slots" : null;
          },
        ],
      },
    },
  ],
};
