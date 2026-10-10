import {
  APIError,
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionSlug,
  type PayloadRequest,
} from "payload";

import { roleOf } from "@/cms/access/roles";

export { formatSlug, slugify, SLUG_PATTERN, SLUG_RULE } from "@/cms/fields/slug";

/**
 * ==========================================================================
 * Slug guards — what may happen to an address once it is on the site
 * ==========================================================================
 *
 * The field half of "slugs" lives in cms/fields/slug.ts: `formatSlug`
 * normalises what was typed, or derives the slug from the title/name when
 * it is empty (re-exported here so the hooks folder names every slug rule
 * SPEC §A.3 lists). This file is the collection half — the rules that need
 * the document's published state and the user's role, which a field hook
 * cannot see (SPEC §D conventions, §D.2, §D.7):
 *
 *   · A PUBLISHED address is changed by admins only. Editors can still
 *     write any slug on a draft that has never been live; once visitors,
 *     search engines and printed flyers know the address, moving it is an
 *     admin decision — and `slugRedirect` then keeps the old one working.
 *   · The eleven FIXED pages (`FIXED_PAGE_SLUGS`) are never renamed and
 *     never deleted, by anyone: their routes are folders under
 *     app/(site)/, and the navigation points at them.
 *
 * "Published" means the LIVE row — the collection's main table — not the
 * latest version. Payload 3.90.2 writes a draft save to the versions table
 * only (collections/operations/utilities/update.js: `if (!isSavingDraft)
 * db.updateOne(…)`), so the main row is exactly what the site serves, and
 * `originalDoc` (the latest version, possibly an autosaved draft) is not.
 *
 * Calls without a signed-in user (seed, jobs, the reschedule action's
 * Local API call with `overrideAccess`) pass the role check: server code
 * is trusted to know what it is doing, people are asked to be admins.
 */

type Row = Record<string, unknown> & { id?: unknown; slug?: unknown; _status?: unknown };

/**
 * The collection's main-table row — the published state for collections
 * with drafts (or the creation snapshot of a never-published draft), the
 * document itself for collections without. Adapter-level read: no access,
 * no hooks, inside the request's transaction. `null` when there is none.
 * Errors propagate on purpose: inside a Postgres transaction a failed
 * statement aborts the rest, so a swallowed error would only resurface,
 * less legibly, at commit.
 */
export async function findLiveRow(req: PayloadRequest, collection: string, id: unknown): Promise<Row | null> {
  if (id === undefined || id === null || id === "") return null;
  return ((await req.payload.db.findOne({ collection: collection as CollectionSlug, req, where: { id: { equals: id } } })) as Row | null) ?? null;
}

/**
 * When the latest version is itself published, it IS the live row (a
 * publish writes both), so callers can skip the query. Only a draft saved
 * over a published document needs the main table.
 */
export const latestIsLive = (originalDoc: unknown): boolean => (originalDoc as Row | undefined)?._status === "published";

/** True when the live row is published (or the collection has no drafts and the row exists). */
export const isLive = (row: Row | null): boolean => Boolean(row) && (row?._status === undefined || row._status === "published");

const asSlug = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);

/**
 * beforeChange: refuse a slug change on a published document for anyone
 * but an admin, and on a fixed page for everyone. `fixedSlugs` is passed
 * by `pages` only (its `FIXED_PAGE_SLUGS`); importing the list here would
 * make this module depend on a collection file.
 */
export const guardSlugChange =
  (opts: { fixedSlugs?: readonly string[]; noun?: string } = {}): CollectionBeforeChangeHook =>
  async ({ collection, data, operation, originalDoc, req }) => {
    if (operation !== "update" || !originalDoc?.id) return data;
    const next = asSlug((data as Row).slug);
    if (!next) return data;

    const fixed = opts.fixedSlugs ?? [];
    // Admins and server code may rename anything that is not a fixed page: nothing to look up.
    const restricted = Boolean(req.user) && roleOf(req) !== "admin";
    if (fixed.length === 0 && !restricted) return data;
    // Unchanged against a published latest version = unchanged against the live row.
    if (latestIsLive(originalDoc) && next === asSlug((originalDoc as Row).slug)) return data;

    const live = await findLiveRow(req, collection.slug, originalDoc.id);
    const noun = opts.noun ?? "page";

    const lockedAt = [asSlug(live?.slug), asSlug((originalDoc as Row).slug)].find((value) => value && fixed.includes(value));
    if (lockedAt && next !== lockedAt) {
      throw new ValidationError(
        {
          collection: collection.slug,
          errors: [
            {
              path: "slug",
              message: `This page is part of the site structure and cannot be renamed. Its address stays "${lockedAt}".`,
            },
          ],
        },
        req.t,
      );
    }

    const liveSlug = asSlug(live?.slug);
    if (restricted && isLive(live) && liveSlug && next !== liveSlug) {
      throw new ValidationError(
        {
          collection: collection.slug,
          errors: [
            {
              path: "slug",
              message: `This ${noun} is live at "${liveSlug}". Only an admin can change a published address (the old one then redirects to the new one).`,
            },
          ],
        },
        req.t,
      );
    }
    return data;
  };

/**
 * beforeDelete for `pages`: the fixed pages cannot be deleted, whatever the
 * role (SPEC §D.2). Server code that genuinely needs to (a development
 * `--reset` of the seed, refused in production by the seed itself) passes
 * `context.system`.
 */
export const refuseFixedPageDelete =
  (fixedSlugs: readonly string[]): CollectionBeforeDeleteHook =>
  async ({ collection, id, req }) => {
    if (req.context?.system === true) return;
    const row = await findLiveRow(req, collection.slug, id);
    const slug = asSlug(row?.slug);
    if (slug && fixedSlugs.includes(slug)) {
      throw new APIError(
        `"${slug}" is part of the site structure and cannot be deleted. Edit its sections instead.`,
        403,
        undefined,
        true,
      );
    }
  };
