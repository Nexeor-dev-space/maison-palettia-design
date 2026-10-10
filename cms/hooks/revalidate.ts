import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";

import { sha256Hex } from "@/cms/lib/crypto";
import { publicUrlSync } from "@/cms/lib/publicUrl";
import { sign } from "@/cms/lib/signing";
import { TAGS } from "@/lib/cms/cache";

import { findLiveRow, isLive, latestIsLive } from "./formatSlug";

/**
 * ==========================================================================
 * Revalidation — how an admin save reaches the live site without a rebuild
 * ==========================================================================
 *
 * The site is prerendered; Payload hooks purge what a change touched
 * (SPEC §G.4): `revalidateTag(tag, "max")` for every shared getter that read
 * the collection, `revalidatePath` for the concrete routes, and the layout
 * when header/footer data changed. The next visit re-renders — no build.
 *
 * WHY `after()`. In 3.90.2 both `afterChange` and `afterOperation` run
 * BEFORE Payload commits the transaction (collections/operations/
 * updateByID.js:215 vs :226, verified). A purge fired there opens a window
 * in which a visitor's request re-renders from the OLD row and caches it —
 * "I published but the site did not change". Next 16's `after()` defers the
 * purge until the response has been sent, and Payload only sends it after
 * committing. `"max"` adds stale-while-revalidate on top, so any residual
 * stale render is replaced on the following request. `updateTag` is Server-
 * Action-only and throws from route handlers — never use it in a hook.
 *
 * NO REQUEST SCOPE. Jobs (scheduled publishing among them) and the CLI have
 * no response to defer behind, so `after()` throws; the fallback POSTs a
 * signed request to the site's own `/api/site/revalidate` on the loopback
 * interface (app/(site)/api/site/revalidate/route.ts, which runs `purge`
 * below). Inventory updates set `context.skipRevalidate`, so in practice
 * only scheduled publishing gets here.
 *
 * DRAFTS — DECIDED FROM THE LIVE ROW. Autosave fires `afterChange` every
 * 1.5 s, and `previousDoc` there is the latest VERSION — usually the
 * previous autosave, not what visitors see. Deciding from it got both ends
 * wrong: unpublishing after an autosave looked like draft → draft and
 * purged nothing (the page kept serving the withdrawn copy until its ISR
 * window ran out), and the first autosave over a published document looked
 * like published → draft and purged for no reason. So `beforeChange` reads
 * the main-table row — the one the site serves, which a draft save never
 * writes (cms/hooks/formatSlug.ts) — and parks "was it live?" on
 * `req.context`; `afterChange` purges when the document is now published,
 * or when it was live and the save took it off (the main row is no longer
 * published). A draft save over a live document leaves the main row
 * published and purges nothing (SPEC §K "draft autosave triggers nothing").
 * Collections without drafts have no `_status` and always revalidate.
 */

type Doc = Record<string, unknown> & { _status?: string; id?: unknown };
export type PathsFor = (doc: Doc, previous?: Doc) => string[];

const skipped = (req: PayloadRequest) => req.context?.skipRevalidate === true || req.context?.disableRevalidate === true;

const hasDrafts = (collection: { versions?: unknown }) =>
  Boolean(collection.versions && typeof collection.versions === "object" && (collection.versions as { drafts?: unknown }).drafts);

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

/** Where `captureLiveState` parks the live row for one document of one collection. */
const liveKey = (collection: string, id: unknown) => `revalidate:live:${collection}:${String(id)}`;

/**
 * beforeChange: remember whether the document is live right now (see DRAFTS
 * above). Nothing to remember for a create, a collection without drafts, or
 * a publish — a publish purges whatever was there before. When the latest
 * version is itself published it IS the live row, so the common first
 * autosave costs no query; later autosaves cost one primary-key read.
 */
export const captureLiveState: CollectionBeforeChangeHook = async ({ collection, data, operation, originalDoc, req }) => {
  if (skipped(req) || operation !== "update" || !originalDoc?.id || !hasDrafts(collection)) return data;
  if ((data as Doc)._status === "published") return data;
  const live = latestIsLive(originalDoc) ? (originalDoc as Doc) : await findLiveRow(req, collection.slug, originalDoc.id);
  if (isLive(live)) req.context[liveKey(collection.slug, originalDoc.id)] = live;
  return data;
};

/**
 * afterChange for a collection: `paths(doc, previous)` names the routes
 * (SPEC §G.4 mapping), `tags` the shared getters. Pass `layout: true` when
 * the collection feeds the header or footer (policies → the legal row).
 * `previous` is the row that was live when there was one, so an unpublish
 * purges the address visitors actually had.
 */
export const revalidateCollection =
  (paths: PathsFor, tags: string[], opts: { layout?: boolean } = {}): CollectionAfterChangeHook =>
  async ({ collection, doc, previousDoc, req }) => {
    if (skipped(req)) return doc;
    const key = liveKey(collection.slug, (doc as Doc)?.id);
    const wasLive = req.context[key] as Doc | undefined;
    delete req.context[key];

    const status = (doc as Doc)?._status;
    if (status !== undefined && status !== "published") {
      // A draft. It only matters if it took a live document off the site,
      // which shows as the main row no longer being published.
      if (!wasLive) return doc;
      if (isLive(await findLiveRow(req, collection.slug, (doc as Doc).id))) return doc;
    }
    safeRevalidate(req, tags, paths(doc as Doc, wasLive ?? (previousDoc as Doc | undefined)), opts.layout);
    return doc;
  };

/** afterDelete twin: a deleted draft purged nothing; a deleted published doc purges its routes. */
export const revalidateCollectionDelete =
  (paths: PathsFor, tags: string[], opts: { layout?: boolean } = {}): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    if (skipped(req)) return doc;
    const status = (doc as Doc)?._status;
    if (status !== undefined && status !== "published") return doc;
    safeRevalidate(req, tags, paths(doc as Doc), opts.layout);
    return doc;
  };

/** afterChange for a global: the content globals all feed the layout, so `layout` defaults to true. */
export const revalidateGlobal =
  (tags: string[], paths: string[] = [], layout = true): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    if (skipped(req)) return doc;
    safeRevalidate(req, tags, paths, layout);
    return doc;
  };

/**
 * The purge itself, for a request scope: the hooks run it inside `after()`,
 * the signed loopback route (app/(site)/api/site/revalidate/route.ts) runs
 * it directly. Throws whatever Next throws; callers decide how to report.
 */
export function purge(tags: readonly string[], paths: readonly string[], layout = false): void {
  tags.forEach((tag) => revalidateTag(tag, "max"));
  paths.forEach((path) => revalidatePath(path));
  if (layout) revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}

export function safeRevalidate(req: PayloadRequest, tags: string[], paths: string[], layout = false): void {
  const tagList = unique(tags);
  const pathList = unique(paths);
  const run = () => {
    try {
      purge(tagList, pathList, layout);
    } catch (error) {
      req.payload.logger.warn({ err: error }, "revalidate: purge failed");
    }
  };
  try {
    after(run); // request scope (REST, admin server functions): runs after the response, i.e. after commit
  } catch {
    void postSignedRevalidate(req, { tags: tagList, paths: pathList, layout }); // jobs, CLI: no request scope
  }
}

/**
 * Everything, in one cheap call: every tag plus the layout. Used when a
 * media file changes (its URL can appear anywhere) and after a deploy.
 */
export function revalidateAllContent(req: PayloadRequest): void {
  safeRevalidate(req, Object.values(TAGS), [], true);
}

/**
 * The loopback fallback. `Authorization: Bearer <unix>.<sha256(body)>.<hmac>`
 * with `hmac = sign("revalidate-v1", "<unix>.<sha256>")`; the handler
 * accepts ±60 s and rejects a replayed (unix, hash) pair (SPEC §G.4). Sent
 * to 127.0.0.1 on the port this process listens on, with the public Host so
 * the handler's own URL checks pass — the request never leaves the box.
 */
export async function postSignedRevalidate(
  req: PayloadRequest,
  body: { tags: string[]; paths: string[]; layout: boolean },
): Promise<void> {
  const json = JSON.stringify(body);
  const unix = Math.floor(Date.now() / 1000);
  const hash = sha256Hex(json);
  const token = `${unix}.${hash}.${sign("revalidate-v1", `${unix}.${hash}`)}`;

  let host: string | undefined;
  let port = process.env.PORT;
  try {
    const url = new URL(publicUrlSync(req));
    host = url.host;
    port ??= url.port || undefined;
  } catch {
    /* no public URL yet: loopback without a Host override */
  }

  // Next sets PORT at server start, so a running server always has one. No
  // port at all means this is a CLI (`payload run`, a seed, a reseal) with no
  // server to notify — say so and stop. Never guess: 3000 is another
  // project's port on the dev machine (DECISIONS.md #4), and a wrong guess in
  // production would post a signed body at whatever listens there.
  if (!port) {
    req.payload.logger.info("revalidate: no PORT and no port in the public URL — not a server process, loopback call skipped");
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/site/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(host ? { host } : {}) },
      body: json,
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) req.payload.logger.warn(`revalidate: loopback call returned ${response.status}`);
  } catch (error) {
    req.payload.logger.warn({ err: error }, "revalidate: loopback call failed");
  }
}
