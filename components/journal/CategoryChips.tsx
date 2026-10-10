import Link from "next/link";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { JOURNAL_PATH, type JournalCategory } from "@/lib/cms/journalShared";
import { cn } from "@/lib/utils";

/**
 * The filter row: "All" and one pill per category that has a story in it.
 *
 * PLAIN LINKS, SO IT WORKS BEFORE AND WITHOUT JAVASCRIPT. Each pill is the
 * address of that category's own page (/journal/category/{slug}, which
 * the CMS prerenders and purges on publish); "All" is /journal. The
 * active one is the only filled pill and carries `aria-current`, so a
 * screen reader hears which filter is on without a colour.
 *
 * On a phone the row scrolls sideways inside the gutter rather than
 * wrapping into four lines of pills above the grid: `-mx-gutter px-gutter`
 * lets the first pill sit on the page's own margin and the last one run
 * off the edge, which is what says "there is more".
 */
export function CategoryChips({
  categories,
  active,
  className,
}: {
  categories: readonly JournalCategory[];
  /** The slug of the category being filtered by; nothing for "All". */
  active?: string | null;
  className?: string;
}) {
  const shown = categories.filter((category) => category.postCount > 0);
  if (shown.length === 0) return null;

  return (
    <nav
      aria-label="Journal categories"
      className={cn(
        "-mx-gutter overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <ul className="flex w-max min-w-full items-center gap-2.5 py-1">
        <Chip href={JOURNAL_PATH} current={!active}>
          {JOURNAL_COPY.allChip}
        </Chip>
        {shown.map((category) => (
          <Chip
            key={category.slug}
            href={category.href}
            current={active === category.slug}
          >
            {category.name}
          </Chip>
        ))}
      </ul>
    </nav>
  );
}

function Chip({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "press-in inline-flex min-h-[2.5rem] items-center rounded-pill px-4 py-2 text-label font-semibold uppercase tracking-eyebrow",
          "transition-colors duration-300 ease-soft",
          current
            ? "bg-text text-cream"
            : "plate bg-surface text-text hover:bg-cream focus-visible:bg-cream",
        )}
      >
        {children}
      </Link>
    </li>
  );
}
