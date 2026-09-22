import Link from "next/link";
import type { ReactNode } from "react";

import styles from "@/components/ui/BlobButton.module.css";
import { cn } from "@/lib/utils";

/**
 * The gooey filter the blobs are drawn through, once for the document.
 *
 * It lives in the root layout rather than beside a button because two things
 * on two different pages now reference it, and an SVG filter is reachable by
 * id from anywhere in the document. Zero-size rather than `display: none`,
 * which some browsers treat as no filter at all.
 */
export function BlobGooFilter() {
  return (
    <svg aria-hidden focusable="false" width="0" height="0" className="absolute">
      <defs>
        <filter id="blob-goo">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  );
}

interface BlobButtonProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  /**
   * Which ground the button is standing on, not which colour it fancies.
   *
   *   sage .... Deep Lilac flooded with LIGHT SAGE — the brand's own hover,
   *             and the right answer on every ground except one. White Rock
   *             sections, the near-white megamenu panels, a photograph.
   *   cream ... for a button ON Deep Lilac, where a lilac one is invisible.
   *             White Rock, flooded with Soft Lavender.
   *   lilac ... the default, and the exception: for a button standing on the
   *             Light Sage sheets themselves, where a Light Sage flood is the
   *             ground exactly and the button does not change colour on hover
   *             so much as disappear. Deep Lilac deepening to CHARCOAL SLATE.
   *
   * MEASURE THIS WITH dE, NOT WITH A CONTRAST RATIO. WCAG contrast is
   * luminance only, and it gets this question wrong in both directions: Light
   * Sage on White Rock scores 1.01:1 and looks completely fine, because they
   * are different hues at nearly the same lightness (dE 15.9). Trusting the
   * ratio is what briefly turned every one of these buttons charcoal, when
   * only the two on Light Sage paper needed it. Sampled dE of the Light Sage
   * flood against the real composited ground: 1.1 on the Light Sage sheets
   * (invisible), 15.6-15.9 on White Rock, 17.2-17.7 on the panels.
   */
  tone?: "lilac" | "cream" | "sage" | "deep";
  /** Sizing and any extra layout; the colour and the flood are the component's. */
  className?: string;
}

/**
 * The site's primary action: Deep Lilac, flooded with Light Sage on hover —
 * except where it stands on Light Sage itself, which takes the default
 * `lilac` and deepens to Charcoal Slate instead. See `tone` above.
 *
 * A pill, at the client's ask — the one exception to the site's 8px radius,
 * and now the shape of this action wherever it appears, so the banner's
 * button and the Experiences menu's are the same object rather than two
 * things that happen to be lilac.
 *
 * The arrow is part of the component for the same reason: it travels on hover
 * in both places, or in neither.
 */
export function BlobButton({ href, children, onClick, tone = "lilac", className }: BlobButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        styles.button,
        tone === "cream" ? styles.cream : null,
        tone === "deep" ? styles.deep : null,
        tone === "sage" ? styles.sage : null,
        // The press is the site's, the flood is this component's: one answers
        // the finger, the other the pointer.
        "press-in group inline-flex items-center gap-3 rounded-[900px] text-action font-semibold uppercase tracking-eyebrow",
        className,
      )}
    >
      {/* The fill, and the blobs that flood it — see ./BlobButton.module.css. */}
      <span aria-hidden className={styles.fill}>
        <span className={styles.blobs}>
          <span className={styles.blob} />
          <span className={styles.blob} />
          <span className={styles.blob} />
          <span className={styles.blob} />
        </span>
        {/* Last, so it settles over the blobs rather than under them. */}
        <span className={styles.flood} />
      </span>
      {children}
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
