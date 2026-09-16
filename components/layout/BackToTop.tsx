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
        // `text-current`, so this follows whatever ground it is dropped on —
        // which is the footer, and the footer is Ink now.
        "group relative inline-flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-current",
        "transition-colors duration-300 ease-soft hover:text-sage",
        // The label is 11px and sets a 21px box. Extended to a comfortable
        // target with a pseudo-element rather than padding, so the footer's
        // baseline grid is untouched — same device as the links beside it.
        "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
        className,
      )}
    >
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-y-1"
      >
        &#8593;
      </span>
      <span className="border-b border-current/40 pb-1 transition-colors duration-300 ease-soft group-hover:border-sage">
        Back to top
      </span>
    </button>
  );
}
