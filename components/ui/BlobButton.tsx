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
  /**
   * Where it goes. Omit it and this renders a <button> instead of a link —
   * which is what every form on the site needs, and the reason the primary
   * action could not be one object before: half the site's calls to action
   * submit something rather than navigate, so they were all hand-built
   * rectangles with a colour fade while the homepage had the pill and the
   * flood.
   */
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  /** Button mode only. `submit` is the common case; that is why it defaults. */
  type?: "button" | "submit";
  /** Button mode only. A disabled control owes no contrast ratio, so this is
   *  simply dimmed and the flood is left alone — it cannot be hovered. */
  disabled?: boolean;
  /**
   * The travelling arrow. On by default, because an action that goes
   * somewhere says so. Turned off where the label already ends in its own
   * glyph or a pending spinner takes the slot.
   */
  arrow?: boolean;
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
export function BlobButton({
  href,
  children,
  onClick,
  type = "submit",
  disabled,
  arrow = true,
  tone = "lilac",
  className,
}: BlobButtonProps) {
  const shell = cn(
    styles.button,
    tone === "cream" ? styles.cream : null,
    tone === "deep" ? styles.deep : null,
    tone === "sage" ? styles.sage : null,
    // The press is the site's, the flood is this component's: one answers
    // the finger, the other the pointer.
    "press-in group inline-flex items-center gap-3 rounded-[900px] text-action font-semibold uppercase tracking-eyebrow",
    disabled ? "cursor-not-allowed opacity-55" : null,
    className,
  );

  /* The fill, and the blobs that flood it — see ./BlobButton.module.css. */
  const inner = (
    <>
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
      {arrow ? (
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      ) : null}
    </>
  );

  if (href === undefined) {
    return (
      <button type={type} onClick={onClick} disabled={disabled} className={shell}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={shell}>
      {inner}
    </Link>
  );
}
