import { notFound, permanentRedirect, redirect } from "next/navigation";

import { TAGS } from "@/lib/cms/cache";
import { contentReader, findDocs } from "@/lib/cms/query";

/**
 * ==========================================================================
 * redirectOr404 — what a route does when its slug is not (or no longer) there
 * ==========================================================================
 *
 * SPEC §D.2 / §G.2. Renaming a published slug writes a `redirects` row
 * (source "auto", 2A-1's slugRedirect hook), and editors add their own
 * (source "manual"). Every route that resolves a slug — `/events/[slug]`,
 * `/policies/[slug]`, `/private-events/[slug]`, the `[...slug]` catch-all —
 * calls this when its getter comes back empty:
 *
 *     const policy = await getPolicyBySlug(slug);
 *     if (!policy) await redirectOr404(`/policies/${slug}`);
 *
 * It never returns: a matching row redirects (308 when `permanent`, 307
 * otherwise), anything else is the branded 404 (`notFound()`).
 *
 * The whole table is read at once and cached under `collection:redirects`
 * (redirects are few, and a 404 should not cost a query per miss); the
 * redirects hook purges that tag on every change. Chains (A → B after B → C)
 * are followed a few hops so an old link lands on the current address in one
 * response; a loop, which the collection's validation should already have
 * refused, ends in the 404 rather than the browser's redirect limit. When the
 * CMS cannot be read at all, there is nothing to redirect to: 404.
 *
 * `hits` is not incremented here. Counting would turn every render of a
 * prerendered 404 into a database write; the field is for a later analytics
 * pass, not for this.
 */

interface RedirectRule {
  to: string;
  permanent: boolean;
}

const MAX_HOPS = 5;

const readRedirects = contentReader("redirects", [TAGS.redirects], async (draft) => {
  const docs = await findDocs("redirects", draft, { drafts: false, depth: 0 });
  return Object.fromEntries(docs.map((doc) => [doc.from, { to: doc.to, permanent: doc.permanent !== false }])) as Record<
    string,
    RedirectRule
  >;
});

/** "/Events/Old-Slug/" → "/events/old-slug": the form `redirects.from` is stored in. */
function normalise(pathname: string): string {
  const path = pathname.split(/[?#]/)[0].toLowerCase();
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Where `pathname` should go, or null. Follows chains; an off-site target
 * (an https:// address) ends the chain. Exported for callers that must not
 * throw — the sitemap, a link checker — and used by {@link redirectOr404}.
 */
export async function findRedirect(pathname: string): Promise<RedirectRule | null> {
  const table = await readRedirects();
  if (!table) return null;

  let current = normalise(pathname);
  let to: string | null = null;
  let permanent = true; // a chain is permanent only if every hop is
  const seen = new Set<string>([current]);

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const next: RedirectRule | undefined = table[current];
    if (!next) break;
    to = next.to;
    permanent = permanent && next.permanent;
    if (!next.to.startsWith("/")) break;
    const target = normalise(next.to);
    if (seen.has(target)) return null; // a loop — answer 404, not an endless redirect
    seen.add(target);
    current = target;
  }
  return to ? { to, permanent } : null;
}

/** Redirect to the current address of `pathname`, or answer the branded 404. Never returns. */
export async function redirectOr404(pathname: string): Promise<never> {
  const rule = await findRedirect(pathname);
  if (rule) {
    if (rule.permanent) permanentRedirect(rule.to);
    redirect(rule.to);
  }
  notFound();
}
