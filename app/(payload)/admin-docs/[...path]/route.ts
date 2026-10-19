import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import sharp from "sharp";

import { roleOf } from "@/cms/access/roles";
import { GUIDE_PDF_NAME, IMAGE_TYPES, imagesDir, pdfPath, SAFE_IMAGE } from "@/cms/lib/docs/files";
import { searchIndex } from "@/cms/lib/docs/guide";
import { getCms } from "@/lib/cms/payload";

/**
 * ==========================================================================
 * GET /admin-docs/… — the guide's screenshots, PDF and search index (staff only)
 * ==========================================================================
 *
 *   /admin-docs/images/<file>.webp      a screenshot from docs/admin-guide/images
 *   /admin-docs/Maison-Palettia-Admin-Guide.pdf   the printed guide (dist/)
 *   /admin-docs/search-index.json       the Docs tab's search index
 *
 * The guide shows the admin's inner workings, so none of it is public: the
 * admin's `payload-token` cookie is read with `payload.auth` (same process,
 * same origin, as /preview does) and anyone who is not a signed-in staff
 * member with a role — signed out, or switched off with "Can sign in"
 * unticked (roleOf fails closed) — gets a 401.
 *
 * `?format=jpeg` on a screenshot returns it re-encoded as JPEG (kept in
 * memory per file version): the print layout uses it because Chrome embeds
 * JPEG in a PDF as-is but stores WebP losslessly, which made the PDF ~60 MB.
 *
 * Caching is `private` (never a shared cache) with an ETag from the file's
 * size and date, so a re-shot screenshot is picked up on the next visit
 * while an unchanged one costs a 304.
 */

export const dynamic = "force-dynamic";

const unauthorised = () =>
  new Response("Sign in to the admin to read the guide.", {
    status: 401,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

const notFound = () => new Response("Not found.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

function fileResponse(request: Request, file: string, type: string, extra: Record<string, string> = {}): Response {
  let st: fs.Stats;
  try {
    st = fs.statSync(file);
    if (!st.isFile()) return notFound();
  } catch {
    return notFound();
  }
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers: Record<string, string> = {
    "content-type": type,
    "cache-control": "private, max-age=300, stale-while-revalidate=86400",
    etag,
    "last-modified": st.mtime.toUTCString(),
    "x-content-type-options": "nosniff",
    ...extra,
  };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  headers["content-length"] = String(st.size);
  const body = Readable.toWeb(fs.createReadStream(file)) as ReadableStream<Uint8Array>;
  return new Response(body, { status: 200, headers });
}

/** JPEG copies of screenshots for the print layout, keyed by file + size + mtime. */
const jpegCache = new Map<string, Buffer>();

async function jpegResponse(request: Request, file: string): Promise<Response> {
  let st: fs.Stats;
  try {
    st = fs.statSync(file);
    if (!st.isFile()) return notFound();
  } catch {
    return notFound();
  }
  const etag = `W/"j${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers: Record<string, string> = {
    "content-type": "image/jpeg",
    "cache-control": "private, max-age=300, stale-while-revalidate=86400",
    etag,
    "x-content-type-options": "nosniff",
  };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  const key = `${file}|${etag}`;
  let body = jpegCache.get(key);
  if (!body) {
    body = await sharp(file).flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    if (jpegCache.size > 200) jpegCache.clear();
    jpegCache.set(key, body);
  }
  headers["content-length"] = String(body.length);
  return new Response(new Uint8Array(body), { status: 200, headers });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const payload = await getCms();
  const { user } = await payload.auth({ headers: request.headers });
  if (!roleOf({ user } as Parameters<typeof roleOf>[0])) return unauthorised();

  const segments = (await params).path ?? [];

  if (segments.length === 2 && segments[0] === "images") {
    const name = segments[1];
    if (!SAFE_IMAGE.test(name)) return notFound();
    const ext = name.split(".").pop()!.toLowerCase();
    const file = path.join(imagesDir(), name);
    if (new URL(request.url).searchParams.get("format") === "jpeg") return jpegResponse(request, file);
    return fileResponse(request, file, IMAGE_TYPES[ext]);
  }

  if (segments.length === 1 && segments[0] === GUIDE_PDF_NAME) {
    const download = new URL(request.url).searchParams.has("download");
    return fileResponse(request, pdfPath(), "application/pdf", {
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${GUIDE_PDF_NAME}"`,
    });
  }

  if (segments.length === 1 && segments[0] === "search-index.json") {
    return new Response(JSON.stringify(searchIndex()), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, max-age=300" },
    });
  }

  return notFound();
}
