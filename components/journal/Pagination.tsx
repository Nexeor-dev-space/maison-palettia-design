import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Numbered pages, as links.
 *
 * URL-driven (`?page=n` on the listing or the category page), so it works
 * with no JavaScript, every page has an address somebody can send, and
 * the back button means what it says. `aria-current="page"` on the one
 * being read; "Previous" and "Next" are plain words with arrows rather
 * than icons alone. A window of pages around the current one with the
 * first and last always shown, so a long journal never prints thirty
 * pills. Nothing is drawn for a single page.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  className,
}: {
  page: number;
  totalPages: number;
  /** The address of a page number — the caller knows whether a category is in the path. */
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const items = windowOf(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      <Arrow href={page > 1 ? hrefFor(page - 1) : null} rel="prev">
        <span aria-hidden>&#8592;</span>
        <span className="sr-only sm:not-sr-only">Previous</span>
      </Arrow>

      <ol className="flex items-center gap-1.5">
        {items.map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-text/60">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  "press-in inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-pill px-3 text-action font-semibold tabular-nums",
                  "transition-colors duration-300 ease-soft",
                  item === page
                    ? "bg-primary text-on-primary"
                    : "plate bg-surface text-text hover:bg-cream focus-visible:bg-cream",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      <Arrow href={page < totalPages ? hrefFor(page + 1) : null} rel="next">
        <span className="sr-only sm:not-sr-only">Next</span>
        <span aria-hidden>&#8594;</span>
      </Arrow>
    </nav>
  );
}

function Arrow({
  href,
  rel,
  children,
}: {
  href: string | null;
  rel: "prev" | "next";
  children: React.ReactNode;
}) {
  const classes =
    "inline-flex min-h-[2.75rem] items-center gap-2 rounded-pill px-4 text-action font-semibold uppercase tracking-eyebrow transition-colors duration-300 ease-soft";
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(classes, "text-text/40")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      rel={rel}
      className={cn(
        classes,
        "press-in plate bg-surface text-text hover:bg-cream focus-visible:bg-cream",
      )}
    >
      {children}
    </Link>
  );
}

/** 1 … 4 [5] 6 … 12 — the first, the last, and the neighbours of the current page. */
function windowOf(page: number, total: number): Array<number | "gap"> {
  const pages = new Set<number>(
    [1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}
