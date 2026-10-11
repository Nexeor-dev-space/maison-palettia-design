import type { Metadata } from "next";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { categoryPageHref, JournalListing } from "@/components/journal/JournalListing";
import { getCategoryBySlug, listCategories } from "@/lib/cms/journal";
import { journalCategoryHref, withJournalFeed } from "@/lib/cms/journalShared";
import { redirectOr404 } from "@/lib/cms/redirects";
import { getMetadata } from "@/lib/seo";

/**
 * /journal/category/{slug} — the listing, filtered to one category.
 *
 * The same page as /journal with the filter row's active pill moved; its
 * own address so a category can be linked, shared and found. A slug that
 * names no category falls through to the redirects table (a renamed
 * category leaves one behind — cms/hooks/slugRedirect.ts) and then to the
 * branded 404.
 */

type Params = Promise<{ slug: string }>;
type Search = Promise<{ page?: string | string[] }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.filter((category) => category.postCount > 0).map(({ slug }) => ({ slug }));
}

function pageOf(value: string | string[] | undefined): number {
  const n = Number.parseInt((Array.isArray(value) ? value[0] : value) ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10_000) : 1;
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const page = pageOf((await searchParams).page);
  return withJournalFeed(
    await getMetadata({
      title: page > 1 ? `${category.name} — Journal, page ${page}` : `${category.name} — Journal`,
      description: category.description || `${JOURNAL_COPY.standfirst} Filed under ${category.name}.`,
      path: categoryPageHref(category.href)(page),
    }),
  );
}

export default async function JournalCategoryPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return redirectOr404(journalCategoryHref(slug));
  return <JournalListing page={pageOf((await searchParams).page)} category={category} hrefFor={categoryPageHref(category.href)} />;
}
