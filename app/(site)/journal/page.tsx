import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { JournalListing, journalPageHref } from "@/components/journal/JournalListing";
import { journalCategoryHref, withJournalFeed } from "@/lib/cms/journalShared";
import { getMetadata } from "@/lib/seo";

/**
 * ==========================================================================
 * /journal — every story, newest first
 * ==========================================================================
 *
 * The listing reads `?page=` (and, for an address somebody typed by hand,
 * `?category=`, which is sent on to the category's own page so one story
 * has one address). Reading the query makes the route render per request;
 * the data behind it is the cached Journal getters (lib/cms/journal.ts),
 * purged when a post or category is published, so the cost is the render
 * and never a database read per visitor.
 */

type Search = Promise<{ page?: string | string[]; category?: string | string[] }>;

const SLUG = /^[a-z0-9-]{1,64}$/;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/** `?page=n` → a whole number from 1; anything else is page 1. */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number.parseInt(first(value) ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10_000) : 1;
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const page = pageParam((await searchParams).page);
  return withJournalFeed(
    await getMetadata({
      title: page > 1 ? `Journal — page ${page}` : "Journal",
      description: JOURNAL_COPY.standfirst,
      path: journalPageHref(page),
    }),
  );
}

export default async function JournalPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const category = first(params.category);
  if (category && SLUG.test(category)) {
    const page = pageParam(params.page);
    permanentRedirect(page > 1 ? `${journalCategoryHref(category)}?page=${page}` : journalCategoryHref(category));
  }
  return <JournalListing page={pageParam(params.page)} hrefFor={journalPageHref} />;
}
