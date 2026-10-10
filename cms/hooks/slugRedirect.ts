import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { REDIRECT_FROM } from "@/cms/collections/content/Redirects";
import { routeFor } from "@/cms/lib/publicUrl";

import { findLiveRow, isLive, latestIsLive } from "./formatSlug";

/**
 * ==========================================================================
 * slugRedirect — an old address keeps working after a rename (SPEC §D.2)
 * ==========================================================================
 *
 * When a PUBLISHED page, experience, session, programme or policy goes live
 * under a new slug, a `redirects` row `{ from: old route, to: new route,
 * permanent: true, source: "auto" }` is upserted, and the redirects
 * collection's own hook revalidates the old path. The site consults that
 * list only on its way to a 404 (`lib/cms/redirects.ts::redirectOr404`), so
 * the redirect can never shadow a live page.
 *
 * WHY TWO HOOKS. The address that was live is not in `afterChange`'s
 * `previousDoc`: that is the latest VERSION, and with autosave every 1.5 s
 * the editor's draft already carries the new slug by the time they press
 * Publish. The live address is the main-table row, which a draft save never
 * writes (cms/hooks/formatSlug.ts explains). So `beforeChange` reads it on
 * the way into a publish and parks it on `req.context`; `afterChange` — in
 * the same transaction, after the row is written — compares and writes the
 * redirect. A publish that rolls back takes its redirect with it.
 *
 * CHAINS. A → B then B → C would leave A pointing at a page that now
 * redirects again. Rows whose `to` is the old address are re-pointed at the
 * new one, so every redirect stays one hop. A row whose `from` IS the new
 * address (renaming back to an earlier name) is removed: the page lives
 * there again, and leaving it would create a loop the day the page is
 * unpublished.
 */

const stashKey = (collection: string, id: unknown) => `slugRedirect:${collection}:${String(id)}`;

const slugOf = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);

/** beforeChange: remember the live slug of a document that is about to be published. */
export const captureLiveSlug: CollectionBeforeChangeHook = async ({ collection, data, operation, originalDoc, req }) => {
  if (operation !== "update" || !originalDoc?.id) return data;
  const hasDrafts = Boolean(collection.versions && typeof collection.versions === "object" && collection.versions.drafts);
  if (hasDrafts && (data as { _status?: unknown })._status !== "published") return data;
  const live = latestIsLive(originalDoc) ? (originalDoc as Record<string, unknown>) : await findLiveRow(req, collection.slug, originalDoc.id);
  const liveSlug = slugOf(live?.slug);
  if (liveSlug && isLive(live)) req.context[stashKey(collection.slug, originalDoc.id)] = liveSlug;
  return data;
};

/** afterChange: the document is now live at `doc.slug`; redirect from where it was. */
export const upsertSlugRedirect: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  const key = stashKey(collection.slug, doc?.id);
  const oldSlug = slugOf(req.context[key]);
  delete req.context[key];
  if (!oldSlug) return doc;
  if (doc?._status !== undefined && doc._status !== "published") return doc;
  const newSlug = slugOf(doc?.slug);
  if (!newSlug || newSlug === oldSlug) return doc;

  const from = routeFor(collection.slug, { slug: oldSlug });
  const to = routeFor(collection.slug, { slug: newSlug });
  if (from === to || !REDIRECT_FROM.test(from)) return doc;

  // Not caught: inside a Postgres transaction a failed statement aborts
  // everything after it, so swallowing the error would only turn a clear
  // failure into a confusing one at commit. A publish whose redirect
  // cannot be written is rolled back and reported.
  await writeRedirect(req, from, to);
  return doc;
};

/** One upsert, run inside the publishing request's transaction. */
export async function writeRedirect(req: PayloadRequest, from: string, to: string): Promise<void> {
  const { payload } = req;

  // The new address is a live page again: no redirect may leave it.
  await payload.delete({ collection: "redirects", where: { from: { equals: to } }, overrideAccess: true, req });

  // Keep every chain one hop long.
  await payload.update({
    collection: "redirects",
    where: { to: { equals: from } },
    data: { to },
    overrideAccess: true,
    req,
  });

  const existing = await payload.find({
    collection: "redirects",
    where: { from: { equals: from } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const data = { from, to, permanent: true, source: "auto" as const };
  if (existing.docs[0]) {
    await payload.update({ collection: "redirects", id: existing.docs[0].id, data, overrideAccess: true, req });
  } else {
    await payload.create({ collection: "redirects", data, overrideAccess: true, req });
  }
}

/** Both halves, for spreading into a collection's `hooks`. */
export const slugRedirectHooks = {
  beforeChange: captureLiveSlug,
  afterChange: upsertSlugRedirect,
};
