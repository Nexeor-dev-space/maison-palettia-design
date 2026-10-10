import type { Where } from "payload";

import { TAGS } from "@/lib/cms/cache";
import type { JournalCategory, JournalPage, JournalPost, JournalPostCard } from "@/lib/cms/journalShared";
import { toJournalCategory, toJournalPost, toJournalPostCard } from "@/lib/cms/mappers";
import { getCms } from "@/lib/cms/payload";
import { contentReader } from "@/lib/cms/query";
import type { Post, PostCategory } from "@/payload-types";

export * from "@/lib/cms/journalShared";

/**
 * ==========================================================================
 * The Journal's getters — server only (SPEC §G.1 read path)
 * ==========================================================================
 *
 * Every function here goes through `contentReader` (lib/cms/query.ts):
 * draft mode reads the latest versions uncached (staff previewing a post),
 * everything else is `unstable_cache`d under `collection:posts` and
 * `collection:post-categories` — the tags the two collections' hooks purge
 * (cms/collections/content/revalidation.ts). Cards print the category's
 * name and colour, so every reader carries BOTH tags.
 *
 * NEVER FATAL, NEVER NULL FOR LISTS. When the CMS cannot answer (no
 * database during a build on another machine, a migration not yet run) a
 * list getter resolves to an empty list and a single-document getter to
 * `null`; the Journal then renders its empty state rather than an error.
 *
 * Shapes and client-safe helpers (routes, chip colours, `headingId`,
 * `formatJournalDate`) come from ./journalShared.ts and are re-exported
 * here, so a server page needs one import. Client components import
 * ./journalShared.ts directly — this module reaches the Payload config.
 *
 * Covers: grid cards use the `card` rendition (640 px), the featured post
 * and `getPostBySlug` the `plate` (1200 px), `JournalPost.heroImage` the
 * `hero` (2000 px); each carries the editor's focal point as `position`.
 */

const TAGS_JOURNAL = [TAGS.posts, TAGS.postCategories];

const PUBLISHED: Where = { _status: { equals: "published" } };

/** The public sees published posts only; draft mode sees the latest version of every post. */
const scoped = (draft: boolean, ...clauses: Array<Where | undefined>): Where | undefined => {
  const all = [...clauses, draft ? undefined : PUBLISHED].filter((clause): clause is Where => Boolean(clause));
  return all.length === 0 ? undefined : all.length === 1 ? all[0] : { and: all };
};

/** Cards never need the body, the manual "read next" list or the SEO group. */
const CARD_SELECT = { body: false, relatedPosts: false, meta: false } as const;

const NEWEST_FIRST = ["-publishedAt", "-createdAt"];

async function findCards(draft: boolean, where: Where | undefined, limit: number, size: "card" | "plate" = "card"): Promise<JournalPostCard[]> {
  if (limit <= 0) return [];
  const payload = await getCms();
  const result = await payload.find({
    collection: "posts",
    where: scoped(draft, where),
    sort: NEWEST_FIRST,
    limit,
    depth: 1,
    select: CARD_SELECT,
    draft,
    overrideAccess: draft,
  });
  return (result.docs as Post[]).map((doc) => toJournalPostCard(doc, size));
}

const notIn = (slugs: readonly string[] | undefined): Where | undefined => (slugs && slugs.length ? { slug: { not_in: [...slugs] } } : undefined);

/** Published posts per category id (drafts too in draft mode). */
async function countByCategory(draft: boolean): Promise<Map<string, number>> {
  const payload = await getCms();
  const result = await payload.find({
    collection: "posts",
    where: scoped(draft),
    select: { category: true },
    depth: 0,
    pagination: false,
    draft,
    overrideAccess: draft,
  });
  const counts = new Map<string, number>();
  for (const doc of result.docs as Array<Pick<Post, "category">>) {
    const id = typeof doc.category === "string" ? doc.category : doc.category?.id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function findCategories(draft: boolean, where?: Where): Promise<JournalCategory[]> {
  const payload = await getCms();
  const [result, counts] = await Promise.all([
    payload.find({ collection: "post-categories", where, sort: ["order", "name"], pagination: false, depth: 0, overrideAccess: draft }),
    countByCategory(draft),
  ]);
  return (result.docs as PostCategory[]).map((doc) => toJournalCategory(doc, counts.get(doc.id) ?? 0));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Readers (module level: one cache entry per argument set)                   */
/* ────────────────────────────────────────────────────────────────────────── */

type PageArgs = { page: number; perPage: number; category?: string; exclude?: string[] };

const readPage = contentReader("journal:page", TAGS_JOURNAL, async (draft, { page, perPage, category, exclude }: PageArgs): Promise<JournalPage> => {
  const empty: JournalPage = { posts: [], page, perPage, totalDocs: 0, totalPages: 0, hasPrevPage: page > 1, hasNextPage: false };
  let filter: JournalCategory | undefined;
  if (category) {
    [filter] = await findCategories(draft, { slug: { equals: category } });
    if (!filter) return empty;
  }
  const payload = await getCms();
  const result = await payload.find({
    collection: "posts",
    where: scoped(draft, filter ? { "category.slug": { equals: filter.slug } } : undefined, notIn(exclude)),
    sort: NEWEST_FIRST,
    page,
    limit: perPage,
    depth: 1,
    select: CARD_SELECT,
    draft,
    overrideAccess: draft,
  });
  return {
    posts: (result.docs as Post[]).map((doc) => toJournalPostCard(doc)),
    page: result.page ?? page,
    perPage,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    ...(filter ? { category: filter } : {}),
  };
});

const readFeatured = contentReader("journal:featured", TAGS_JOURNAL, async (draft) => (await findCards(draft, { featured: { equals: true } }, 1, "plate"))[0] ?? null);

const readLatest = contentReader("journal:latest", TAGS_JOURNAL, (draft, limit: number, exclude: string[]) => findCards(draft, notIn(exclude), limit));

const readPost = contentReader("journal:post", TAGS_JOURNAL, async (draft, slug: string): Promise<JournalPost | null> => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "posts",
    where: scoped(draft, { slug: { equals: slug } }),
    limit: 1,
    depth: 1,
    select: { relatedPosts: false },
    draft,
    overrideAccess: draft,
  });
  const doc = result.docs[0] as Post | undefined;
  return doc ? toJournalPost(doc) : null;
});

const readRelated = contentReader("journal:related", TAGS_JOURNAL, async (draft, slug: string, limit: number): Promise<JournalPostCard[]> => {
  const payload = await getCms();
  const self = (
    await payload.find({
      collection: "posts",
      where: scoped(draft, { slug: { equals: slug } }),
      limit: 1,
      depth: 0,
      select: { slug: true, category: true, relatedPosts: true },
      draft,
      overrideAccess: draft,
    })
  ).docs[0] as Pick<Post, "id" | "slug" | "category" | "relatedPosts"> | undefined;
  if (!self) return [];

  const chosen: JournalPostCard[] = [];
  const taken = () => [self.slug, ...chosen.map((post) => post.slug)];

  // 1. The editor's own picks, in their order (unpublished ones drop out).
  const manual = (self.relatedPosts ?? []).map((ref) => (typeof ref === "string" ? ref : ref.id)).filter(Boolean);
  if (manual.length) {
    const picked = await findCards(draft, { id: { in: manual } }, manual.length);
    chosen.push(...manual.map((id) => picked.find((post) => post.id === id)).filter((post): post is JournalPostCard => Boolean(post)));
  }
  // 2. The newest in the same category.
  const categoryId = typeof self.category === "string" ? self.category : self.category?.id;
  if (chosen.length < limit && categoryId) {
    chosen.push(...(await findCards(draft, { and: [{ category: { equals: categoryId } }, notIn(taken())!] }, limit - chosen.length)));
  }
  // 3. The newest anywhere, so "Read next" is never empty while other posts exist.
  if (chosen.length < limit) chosen.push(...(await findCards(draft, notIn(taken()), limit - chosen.length)));
  return chosen.slice(0, limit);
});

const readCategories = contentReader("journal:categories", TAGS_JOURNAL, (draft) => findCategories(draft));

const readCategory = contentReader("journal:category", TAGS_JOURNAL, async (draft, slug: string) => (await findCategories(draft, { slug: { equals: slug } }))[0] ?? null);

/** Published only, whatever the mode: these feed generateStaticParams and the sitemap. */
const readSlugs = contentReader("journal:slugs", TAGS_JOURNAL, async () => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "posts",
    where: PUBLISHED,
    sort: NEWEST_FIRST,
    select: { slug: true, updatedAt: true, meta: { noindex: true } },
    depth: 0,
    pagination: false,
    overrideAccess: false,
  });
  return (result.docs as Array<Pick<Post, "slug" | "updatedAt" | "meta">>).map(({ slug, updatedAt, meta }) => ({ slug, updatedAt, noindex: meta?.noindex === true }));
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Public API                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const JOURNAL_PER_PAGE = 12;

const wholeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

/**
 * One page of the listing, newest first. `category` is a category SLUG; an
 * unknown one yields an empty page without `category` (check
 * `getCategoryBySlug` first to 404). `exclude` drops slugs — pass the
 * featured post's slug so it is not repeated in the grid.
 */
export async function listPosts(opts: { page?: number; perPage?: number; category?: string; exclude?: string[] } = {}): Promise<JournalPage> {
  const args: PageArgs = {
    page: wholeNumber(opts.page, 1, 1, 10_000),
    perPage: wholeNumber(opts.perPage, JOURNAL_PER_PAGE, 1, 48),
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.exclude?.length ? { exclude: [...opts.exclude].sort() } : {}),
  };
  return (await readPage(args)) ?? { posts: [], page: args.page, perPage: args.perPage, totalDocs: 0, totalPages: 0, hasPrevPage: args.page > 1, hasNextPage: false };
}

/** A published post by slug (latest draft in draft mode), or `null` → `redirectOr404`. */
export async function getPostBySlug(slug: string): Promise<JournalPost | null> {
  return (await readPost(slug)) ?? null;
}

/** The newest post with "Feature at the top of the Journal" ticked, or `null` when none is. Cover in `plate` size. */
export async function getFeaturedPost(): Promise<JournalPostCard | null> {
  return (await readFeatured()) ?? null;
}

/** Up to `limit` posts to read next: the editor's picks, then the same category, then the newest. Never includes `slug`. */
export async function getRelatedPosts(slug: string, limit = 3): Promise<JournalPostCard[]> {
  return (await readRelated(slug, wholeNumber(limit, 3, 1, 12))) ?? [];
}

/** Every category in display order, each with its published-post count (hide chips at 0). */
export async function listCategories(): Promise<JournalCategory[]> {
  return (await readCategories()) ?? [];
}

/** One category by slug, or `null` → 404. */
export async function getCategoryBySlug(slug: string): Promise<JournalCategory | null> {
  return (await readCategory(slug)) ?? null;
}

/** The newest `n` posts (e.g. a "From the Journal" strip), minus `exclude` slugs. */
export async function getLatestPosts(n = 3, opts: { exclude?: string[] } = {}): Promise<JournalPostCard[]> {
  return (await readLatest(wholeNumber(n, 3, 1, 24), [...(opts.exclude ?? [])].sort())) ?? [];
}

/**
 * Every published post's slug, last change and whether its SEO tab asks
 * for `noindex` — for `generateStaticParams` (every post), and the sitemap
 * and the feed (which leave the noindexed ones out).
 */
export async function listPostSlugs(): Promise<Array<{ slug: string; updatedAt: string; noindex: boolean }>> {
  return (await readSlugs()) ?? [];
}
