import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";

import { readingLabel } from "@/components/journal/copy";
import styles from "@/components/journal/PostCard.module.css";
import { CategoryChip } from "@/components/journal/CategoryChip";
import { INK } from "@/components/sections/hero/composition";
import {
  JOURNAL_CHIP_TOKENS,
  formatJournalDate,
  type JournalPostCard,
} from "@/lib/cms/journalShared";
import { cn } from "@/lib/utils";

/**
 * One story, as a card: the cover in a tilted frame, the category's chip
 * on its corner, the date and the reading time, the title, and up to
 * three lines of the excerpt (clamped, so cards in a row stay level).
 *
 * ONE LINK. The whole card is a single anchor to the story — the frame,
 * the title and the excerpt are all inside it, so a screen reader meets
 * the story once and the title is its name. The chip is the ONE thing
 * outside the anchor: it is a second destination (the category's page),
 * so it is a sibling laid over the frame's corner rather than an anchor
 * nested in an anchor.
 *
 * THE ANGLE IS DERIVED, NEVER RANDOM — from `index`, as the experience
 * cards' is, so a row is stable between renders and identical on the
 * server and the client. The paint thrown over the foot of the photograph
 * on hover is the category's own ink; a story with no category cycles the
 * three brand paints by position.
 *
 * Dates and minutes are Montserrat (the script has no 7, 8 or 9).
 */
export function PostCard({
  post,
  index,
  sizes,
  as: Tag = "article",
  priority = false,
  headingLevel: Heading = "h3",
  className,
}: {
  post: JournalPostCard;
  /** Place in the row. Drives the angle and, without a category, the paint. */
  index: number;
  /** Rendered width per breakpoint, so the browser fetches one size only. */
  sizes: string;
  as?: ElementType;
  /** Above the fold on the listing's first row. */
  priority?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const paint = post.category
    ? JOURNAL_CHIP_TOKENS[post.category.colour].bg
    : WASH[index % WASH.length];
  const tilt = (index % 2 === 0 ? -1 : 1) * (0.7 + (index % 3) * 0.3);
  const date = formatJournalDate(post.publishedAt, "short");

  return (
    <Tag
      className={cn(styles.card, "group relative", className)}
      style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
    >
      <Link href={post.href} className="group/link block focus-visible:outline-none">
        <span
          className={cn(
            styles.frame,
            "plate aspect-[4/3] w-full rounded-[1.25rem] bg-cream",
            "group-focus-visible/link:ring-2 group-focus-visible/link:ring-primary group-focus-visible/link:ring-offset-2 group-focus-visible/link:ring-offset-surface",
          )}
          data-paint
          style={{ "--paint": paint } as React.CSSProperties}
        >
          <Image
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            fill
            sizes={sizes}
            priority={priority}
            style={{ objectPosition: post.coverImage.position ?? "50% 50%" }}
            className={styles.photo}
          />
          <span aria-hidden className={styles.wash} />
        </span>

        <span className="mt-5 flex items-center gap-x-3 text-fine text-text/75">
          <time dateTime={post.publishedAt}>{date}</time>
          <span aria-hidden className="h-1 w-1 rounded-pill bg-terracotta" />
          <span>{readingLabel(post.readingTime)}</span>
        </span>

        <Heading className="mt-2 text-h4 font-semibold text-text [overflow-wrap:anywhere] transition-colors duration-300 ease-soft group-hover:text-primary">
          <span className="ink-rule">{post.title}</span>
        </Heading>

        <span className="mt-2.5 line-clamp-3 text-body text-text/80">
          {post.excerpt}
        </span>
      </Link>

      {post.category ? (
        <CategoryChip
          category={post.category}
          href={post.category.href}
          className="absolute left-4 top-4 z-10 shadow-[0_1px_8px_rgb(45_55_72/0.18)]"
        />
      ) : null}
    </Tag>
  );
}

/* The paints a story without a category cycles through; White Rock is the frame's own ground, so not among them. */
const WASH = [INK.lilac, INK.terracotta, INK.lavender] as const;
