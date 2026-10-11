import { notFound } from "next/navigation";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { CategoryChips } from "@/components/journal/CategoryChips";
import { EmptyState } from "@/components/journal/EmptyState";
import { FeaturedPost } from "@/components/journal/FeaturedPost";
import { JournalClose } from "@/components/journal/JournalClose";
import { Pagination } from "@/components/journal/Pagination";
import { PostCard } from "@/components/journal/PostCard";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { StatementHeader } from "@/components/sections/PageHeader";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeader";
import {
  JOURNAL_PER_PAGE,
  getFeaturedPost,
  listCategories,
  listPosts,
} from "@/lib/cms/journal";
import { JOURNAL_PATH, type JournalCategory } from "@/lib/cms/journalShared";

/**
 * ==========================================================================
 * /journal and /journal/category/{slug} — the same page, two doors in
 * ==========================================================================
 *
 * The masthead (eyebrow, a script line, the standfirst — the sub-page
 * masthead every other section of the site opens on), the featured story
 * as one plate, the filter row, the grid, the page numbers, and the close.
 *
 * THE FEATURED STORY IS SHOWN ONCE. On the unfiltered listing the grid
 * is asked for everything EXCEPT it (`exclude`) on EVERY page, and the
 * plate is drawn on page 1 only — so the page windows never shift by one
 * (a story repeated across a page boundary) and the page count and the
 * "N stories" total come from the same query on every page. A category
 * page shows it in its place in the grid like any other.
 *
 * A PAGE PAST THE LAST is a 404 (`notFound`), not an indexable empty page.
 *
 * THE CARDS ARE A LIST. `<ol>` because the order means something (newest
 * first), one `<li>` per story, released in sequence by <Stagger>.
 */
export async function JournalListing({
  page,
  category,
  hrefFor,
}: {
  page: number;
  /** The category being filtered by, already resolved by the route (so an unknown slug is a 404 there). */
  category?: JournalCategory | null;
  /** The address of page `n` of this listing. */
  hrefFor: (page: number) => string;
}) {
  const [featured, categories] = await Promise.all([
    category ? null : getFeaturedPost(),
    listCategories(),
  ]);
  const result = await listPosts({
    page,
    perPage: JOURNAL_PER_PAGE,
    ...(category ? { category: category.slug } : {}),
    ...(featured ? { exclude: [featured.slug] } : {}),
  });
  // Past the last page (or any page but the first of an empty listing).
  if (page > Math.max(1, result.totalPages)) notFound();

  const plate = page === 1 ? featured : null;
  const nothingAtAll = result.totalDocs === 0 && !featured;
  const count = result.totalDocs + (featured ? 1 : 0);

  return (
    <>
      <StatementHeader
        id="journal-title"
        eyebrow={JOURNAL_COPY.eyebrow}
        lines={JOURNAL_COPY.headingLines}
        standfirst={category?.description || JOURNAL_COPY.standfirst}
        mark="splash"
      />

      <div className="relative isolate bg-surface pb-[4rem] pt-[3rem] md:pb-section md:pt-[4rem]">
        {plate ? <FeaturedPost post={plate} /> : null}

        <Container
          as="section"
          aria-labelledby="journal-stories"
          className={plate ? "mt-16 md:mt-20" : undefined}
        >
          {nothingAtAll ? (
            <h2 id="journal-stories" className="sr-only">
              {JOURNAL_COPY.allStories}
            </h2>
          ) : (
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <Eyebrow as="h2" id="journal-stories">
                    {category ? category.name : JOURNAL_COPY.allStories}
                  </Eyebrow>
                  {count > 0 ? (
                    <span className="text-fine text-text/70">
                      {count} {count === 1 ? "story" : "stories"}
                    </span>
                  ) : null}
                </div>
                <CategoryChips
                  categories={categories}
                  active={category?.slug ?? null}
                  className="max-w-full"
                />
              </div>
            </Reveal>
          )}

          {nothingAtAll ? (
            <div className="mt-10">
              <EmptyState categoryName={category?.name ?? null} />
            </div>
          ) : result.posts.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                categoryName={category?.name ?? JOURNAL_COPY.allStories}
              />
            </div>
          ) : (
            <Stagger
              as="ol"
              className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 md:mt-12"
            >
              {result.posts.map((post, i) => (
                <Reveal as="li" key={post.slug} className="min-w-0">
                  <PostCard
                    post={post}
                    index={i}
                    priority={page === 1 && !plate && i < 3}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  />
                </Reveal>
              ))}
            </Stagger>
          )}

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            hrefFor={hrefFor}
            className="mt-14 md:mt-16"
          />
        </Container>
      </div>

      <JournalClose />
    </>
  );
}

/** `/journal?page=n` — page 1 is the bare address. */
export const journalPageHref = (page: number) =>
  page > 1 ? `${JOURNAL_PATH}?page=${page}` : JOURNAL_PATH;

/** `/journal/category/{slug}?page=n`. */
export const categoryPageHref = (href: string) => (page: number) =>
  page > 1 ? `${href}?page=${page}` : href;
