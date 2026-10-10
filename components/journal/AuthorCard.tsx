import Image from "next/image";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { PeelNote } from "@/components/ui/PeelNote";
import {
  JOURNAL_PATH,
  formatJournalDate,
  type JournalPost,
} from "@/lib/cms/journalShared";

/**
 * Who wrote it, at the foot of the column: the portrait (or initial), the
 * name and role, the date — and the way back to every other story. A
 * White Rock plate, as the facts on the event page are.
 */
export function AuthorCard({ post }: { post: JournalPost }) {
  const { author } = post;
  return (
    <aside
      aria-label={JOURNAL_COPY.writtenBy}
      className="plate mt-14 flex flex-col gap-6 rounded-[1.5rem] bg-cream p-6 sm:flex-row sm:items-center sm:justify-between md:p-8"
    >
      <div className="flex items-center gap-5">
        {author.photo ? (
          <span className="plate relative block h-16 w-16 shrink-0 overflow-clip rounded-pill bg-surface md:h-20 md:w-20">
            <Image
              src={author.photo.src}
              alt=""
              fill
              sizes="80px"
              style={{ objectPosition: author.photo.position ?? "50% 50%" }}
              className="object-cover"
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="heading-script flex h-16 w-16 shrink-0 items-center justify-center rounded-pill bg-primary text-[2rem] leading-none text-on-primary md:h-20 md:w-20 md:text-[2.4rem]"
          >
            {author.name.trim().charAt(0).toUpperCase() || "M"}
          </span>
        )}
        <div>
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
            {JOURNAL_COPY.writtenBy}
          </p>
          <p className="mt-1 text-h4 font-semibold text-text">{author.name}</p>
          <p className="mt-1 text-fine text-text/75">
            {author.role ? (
              <>
                {author.role}
                <span
                  aria-hidden
                  className="mx-2 inline-block h-1 w-1 translate-y-[-0.2em] rounded-pill bg-terracotta"
                />
              </>
            ) : null}
            <time dateTime={post.publishedAt}>
              {formatJournalDate(post.publishedAt)}
            </time>
          </p>
        </div>
      </div>
      <PeelNote
        href={JOURNAL_PATH}
        className="min-h-[3.25rem] self-start px-6 sm:self-auto"
      >
        {JOURNAL_COPY.backToJournal}
      </PeelNote>
    </aside>
  );
}
