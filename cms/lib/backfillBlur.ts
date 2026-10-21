import fs from "node:fs";
import path from "node:path";

import type { Payload } from "payload";

import { BLURRABLE, blurPlaceholder } from "@/cms/lib/blurPlaceholder";
import { MEDIA_DIR } from "@/cms/lib/paths";

type Row = { id: string | number; filename?: string | null; mimeType?: string | null; blurDataURL?: string | null };

/**
 * Give every picture in the library that has no blurred stand-in yet one
 * (cms/lib/blurPlaceholder.ts) — files uploaded before the field existed.
 *
 * The bytes come from this server's media/ folder; with `origin`, a file
 * that is not on this disk is fetched from that site's public file URL
 * instead (how cms/scripts/backfill-blur.ts fills the shared database from a
 * developer machine). Written straight to the row — no hooks, no
 * revalidation, nothing else about the document changes.
 *
 * A picture with transparency gets an empty string: "looked, none wanted",
 * so it is not decoded again on every start. Only rows still `null` are
 * looked at, which makes this cheap to run each time a server comes up.
 */
export async function backfillBlur(payload: Payload, opts: { origin?: string; dryRun?: boolean } = {}) {
  const rows: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection: "media", limit: 200, page, depth: 0, overrideAccess: true, pagination: true });
    rows.push(...(res.docs as unknown as Row[]));
    if (!res.hasNextPage) break;
  }

  let made = 0;
  let none = 0;
  const missing: string[] = [];
  for (const row of rows) {
    if (row.blurDataURL != null || !row.filename || !row.mimeType || !BLURRABLE.has(row.mimeType)) continue;

    const local = path.join(MEDIA_DIR, row.filename);
    let source: Buffer | string | undefined = fs.existsSync(local) ? local : undefined;
    if (!source && opts.origin) {
      const res = await fetch(new URL(`/api/media/file/${encodeURIComponent(row.filename)}`, opts.origin)).catch(() => null);
      if (res?.ok) source = Buffer.from(await res.arrayBuffer());
    }
    if (!source) {
      missing.push(row.filename);
      continue;
    }

    const blur = (await blurPlaceholder(source).catch(() => null)) ?? "";
    if (blur) made++;
    else none++;
    if (!opts.dryRun) {
      await payload.db.updateOne({ collection: "media", id: row.id, data: { blurDataURL: blur }, returning: false });
    }
  }
  return { total: rows.length, made, none, missing };
}
