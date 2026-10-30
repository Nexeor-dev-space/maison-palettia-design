import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import type { CollectionBeforeChangeHook, CollectionConfig, UploadConfig } from "payload";

import { anyone, isAdmin, isEditor, isEditorField } from "@/cms/access/roles";
import {
  refuseDeleteWhileReferenced,
  requireAltOrDecorative,
  revalidateOnMediaChange,
  revalidateOnMediaDelete,
} from "@/cms/hooks/mediaGuards";
import { BLURRABLE, blurPlaceholder } from "@/cms/lib/blurPlaceholder";
import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import { STORAGE_ENABLED } from "@/cms/lib/storage";
import { storedFilename } from "@/cms/seed/media";
import { MEDIA } from "@/cms/seed/strings/media";
import { seededMediaSource } from "@/cms/lib/seededMedia";

/**
 * ==========================================================================
 * media — every picture, film and font the site or its PDFs use (SPEC §D.1)
 * ==========================================================================
 *
 * FILES LIVE IN THE MINIO BUCKET (cms/lib/storage.ts) under `media/`, when the
 * storage credentials are set; otherwise on disk, as described next. The rest
 * of this note is the disk layout, which is also the fallback and what the
 * migration script copies from. On disk: `<repo>/media/`, gitignored and
 * backed up with the database. The path is absolute and comes from cms/lib/paths.ts, which is
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
 * Missing seeded files fall back to their committed public/ source.
 *
 * If a file is missing, this checks the requested path stays inside the media
 * folder, then serves its seeded source when available. Missing unseeded
 * uploads answer 404 rather than Payload's 500; existing files fall through
 * to Payload's normal handler.
 */
type FileHandler = NonNullable<UploadConfig["handlers"]>[number];

const missingFileIs404 = async (_req: Parameters<FileHandler>[0], { params }: Parameters<FileHandler>[1]): Promise<Response | undefined> => {
  const root = path.resolve(MEDIA_DIR);
  const filename = params.filename ?? "";
  const file = path.resolve(root, filename);
  if (!file.startsWith(root + path.sep)) return undefined; // Payload refuses it with its own 400
  try {
    await stat(file);
    return undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") return undefined;
    const original = await seededOriginal(filename);
    if (original) return original;
  }

  const source = seededMediaSource(filename);
  if (!source) return Response.json({ errors: [{ message: "Not found." }] }, { status: 404 });

  const publicRoot = path.resolve(PROJECT_ROOT, "public");
  const publicFile = path.resolve(publicRoot, source);
  if (!publicFile.startsWith(publicRoot + path.sep)) return undefined;
  try {
    await stat(publicFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ errors: [{ message: "Not found." }] }, { status: 404 });
    }
    throw error;
  }

  const mimeTypes: Record<string, string> = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".mp4": "video/mp4",
    ".otf": "font/otf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
  };
  const contentType = mimeTypes[path.extname(publicFile).toLowerCase()];
  if (!contentType) return Response.json({ errors: [{ message: "Not found." }] }, { status: 404 });

  const fileStream = createReadStream(publicFile);
  const iterator = fileStream[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await iterator.next();
        if (chunk.done) controller.close();
        else controller.enqueue(new Uint8Array(chunk.value));
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": contentType,
    },
  });
};

/*
  ==========================================================================
  A MISSING SEEDED PHOTO IS SERVED FROM ITS ORIGINAL IN GIT
  ==========================================================================

  The media library is rows in Postgres and files on the server's disk. A
  server that starts on an empty `media/` folder — a PR preview, a new box, a
  lost volume — has every row and none of the files, so every picture on the
  site answered 404 and `/_next/image` 400 (PR #78's preview, Oct 2026).
  `restore-media` rebuilds those files on start, but only where the start
  command runs it and the folder is writable.

  This is the safety net under it: when the file asked for is missing and it
  is one of the photographs the seed imported, the original under `public/`
  is served instead — the base name for the file itself, and for a generated
  size (`<name>-640x427.webp`) too, since `/_next/image` resizes whatever it
  is handed. A photo uploaded through the admin has no original in git and
  still answers 404, which is correct: that one has to come from a backup.
*/
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const ORIGINALS = new Map(
  MEDIA.map((seed) => [storedFilename(seed.path).replace(/\.[^.]+$/, ""), seed.path] as const),
);
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

async function seededOriginal(filename: string): Promise<Response | undefined> {
  const stem = filename.replace(/\.[^.]+$/, "");
  const source = ORIGINALS.get(stem) ?? ORIGINALS.get(stem.replace(/-\d+x\d+$/, ""));
  if (!source) return undefined;
  const file = path.resolve(PUBLIC_DIR, source);
  if (!file.startsWith(path.resolve(PUBLIC_DIR) + path.sep)) return undefined;
  try {
    const bytes = await readFile(file);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        // Short: the real file may be restored at any moment, and should then win.
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return undefined;
  }
}

/**
 * The blurred stand-in for a new upload (see cms/lib/blurPlaceholder.ts).
 * Only when a file is actually arriving: an edit to the alt text keeps the
 * one already stored. A file that cannot be read for it simply gets none —
 * an upload is never refused over a placeholder.
 */
const makeBlurPlaceholder: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file as { data?: Buffer; tempFilePath?: string; mimetype?: string } | undefined;
  if (!file) return data;
  const source = file.data?.length ? file.data : file.tempFilePath;
  // "" = looked, none wanted (transparency) — see cms/lib/backfillBlur.ts.
  data.blurDataURL =
    source && file.mimetype && BLURRABLE.has(file.mimetype)
      ? ((await blurPlaceholder(source).catch(() => null)) ?? "")
      : null;
  return data;
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
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "image", heading: "No photos yet", body: "Upload photographs here, then pick them on pages, experiences and sessions. Replacing a file or changing its alt text updates the live site straight away. A photo that is still in use cannot be deleted — the message tells you where it is used.", actions: [{ label: "Upload a photo", href: "/collections/media/create", primary: true }] } },
      ],
    },
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
    beforeChange: [makeBlurPlaceholder],
    beforeDelete: [refuseDeleteWhileReferenced],
    afterChange: [revalidateOnMediaChange],
    afterDelete: [revalidateOnMediaDelete],
  },
  upload: {
    staticDir: MEDIA_DIR,
    // Payload types a handler as "a Response or nothing", not "maybe a Response"; the cast says the same thing.
    // With object storage on, the storage plugin's own handler serves (and 404s)
    // the file; this disk-and-git fallback would answer 404 before it ran.
    handlers: STORAGE_ENABLED ? [] : [missingFileIs404 as FileHandler],
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
      // The blurred stand-in drawn while the photograph loads — made from the
      // file, never typed. See cms/lib/blurPlaceholder.ts.
      name: "blurDataURL",
      type: "text",
      admin: { hidden: true },
    },
    // 4B review: where this photo is used, before anyone tries to delete it.
    { name: "usedOn", type: "ui", label: "Used on", admin: { position: "sidebar", components: { Field: "@/cms/components/fields/MediaUsage#MediaUsage" } } },
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
