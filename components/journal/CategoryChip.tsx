import Link from "next/link";

import {
  JOURNAL_CHIP_TOKENS,
  type JournalCategoryRef,
} from "@/lib/cms/journalShared";
import { cn } from "@/lib/utils";

/**
 * A category's label — a soft pill in the category's own brand ink.
 *
 * The ink and its text colour are the pairs lib/cms/journalShared.ts
 * measured (lilac takes the near-white `on-primary`, terracotta the warm
 * Ink, the three light grounds Charcoal), so an editor picking a colour in
 * the admin can never pick an unreadable one.
 *
 * A link when `href` is given (the filter row, the card's corner, the
 * article's breadcrumb line) and a plain span otherwise — a chip inside
 * something that is already a link must not be a second one.
 */
export function CategoryChip({
  category,
  href,
  size = "sm",
  className,
}: {
  category: JournalCategoryRef;
  /** Omit inside a link; pass `category.href` to make the chip the way into the category. */
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const tokens =
    JOURNAL_CHIP_TOKENS[category.colour] ?? JOURNAL_CHIP_TOKENS.lilac;
  const classes = cn(
    "inline-flex items-center whitespace-nowrap rounded-pill font-semibold uppercase tracking-eyebrow",
    size === "md"
      ? "px-4 py-2 text-label"
      : "px-3 py-1.5 text-[0.7rem] leading-[1.3]",
    href
      ? "press-in transition-[filter] duration-300 ease-soft hover:brightness-95 focus-visible:brightness-95"
      : null,
    className,
  );
  const style = {
    backgroundColor: tokens.bg,
    color: tokens.fg,
  } as React.CSSProperties;
  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {category.name}
      </Link>
    );
  }
  return (
    <span className={classes} style={style}>
      {category.name}
    </span>
  );
}
