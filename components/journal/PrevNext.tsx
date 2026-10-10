import Link from "next/link";

import { JOURNAL_COPY } from "@/components/journal/copy";
import type { JournalPostCard } from "@/lib/cms/journalShared";
import { cn } from "@/lib/utils";

/**
 * The story before and the story after, by date — the two ends of the
 * column. Each is one plate; a missing neighbour leaves its half empty
 * rather than pointing anywhere else.
 */
export function PrevNext({
  previous,
  next,
}: {
  previous: JournalPostCard | null;
  next: JournalPostCard | null;
}) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="Previous and next stories"
      className="mt-10 grid gap-4 sm:grid-cols-2"
    >
      <Neighbour
        post={previous}
        label={JOURNAL_COPY.previousStory}
        arrow="&#8592;"
        align="start"
      />
      <Neighbour
        post={next}
        label={JOURNAL_COPY.nextStory}
        arrow="&#8594;"
        align="end"
      />
    </nav>
  );
}

function Neighbour({
  post,
  label,
  arrow,
  align,
}: {
  post: JournalPostCard | null;
  label: string;
  arrow: string;
  align: "start" | "end";
}) {
  if (!post) return <span aria-hidden className="hidden sm:block" />;
  return (
    <Link
      href={post.href}
      rel={align === "start" ? "prev" : "next"}
      className={cn(
        "press-in plate group flex min-w-0 flex-col gap-2 rounded-[1.25rem] bg-surface p-5 transition-colors duration-300 ease-soft hover:bg-cream focus-visible:bg-cream",
        align === "end" ? "sm:items-end sm:text-right" : null,
      )}
    >
      <span className="flex items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-text/75">
        {align === "start" ? (
          <span aria-hidden dangerouslySetInnerHTML={{ __html: arrow }} />
        ) : null}
        {label}
        {align === "end" ? (
          <span aria-hidden dangerouslySetInnerHTML={{ __html: arrow }} />
        ) : null}
      </span>
      <span className="text-h4 font-semibold text-text [overflow-wrap:anywhere] transition-colors duration-300 ease-soft group-hover:text-primary">
        {post.title}
      </span>
    </Link>
  );
}
