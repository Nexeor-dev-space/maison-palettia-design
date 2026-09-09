"use client";

import { scrollToTop } from "@/lib/scroll";
import { cn } from "@/lib/utils";

interface BackToTopProps {
  className?: string;
}

/**
 * The footer's one utility, set as an editorial mark rather than a button.
 *
 * A real <button>, because it performs an action rather than going somewhere —
 * an anchor to `#top` would put a fragment in the address bar and offer the
 * browser's jump, which is the thing being replaced. It carries its own
 * hover rule and moves the arrow, not the label, so the row it sits in does
 * not reflow on hover.
 *
 * The scroll itself is handed to {@link scrollToTop}, which knows whether
 * Lenis is driving and what a reader asking for reduced motion should get.
 */
export function BackToTop({ className }: BackToTopProps) {
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={cn(
        "group inline-flex items-center gap-2.5 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text",
        "transition-colors duration-300 ease-soft hover:text-primary",
        className,
      )}
    >
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-y-1"
      >
        &#8593;
      </span>
      <span className="border-b border-text/25 pb-1 transition-colors duration-300 ease-soft group-hover:border-primary">
        Back to top
      </span>
    </button>
  );
}
