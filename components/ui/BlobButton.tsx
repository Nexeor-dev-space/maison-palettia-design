import Link from "next/link";

import { PaintStroke } from "@/components/layout/PaintStroke";
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
  /**
   * `painted` IS THE SITE'S SECONDARY ACTION NOW, at the client's ask. It is
   * not a pill: the label sits on a dragged brushstroke (see `shape="sweep"`
   * in PaintStroke.module.css), and under the pointer a second colour is drawn
   * across it as bristle hairs.
   *
   * WHY IT REPLACED THE OUTLINE. `secondary` and `secondaryInverse` are a ring
   * and a word, and a 1.5px ring is the first thing a photograph or a busy
   * ground takes — which is what the client reported on the banner. A field is
   * what makes a control visible, and the one filled pill a pair can afford is
   * already spent on the primary, so the second gets paint instead.
   *
   * The two old tones are kept for anything that still wants a ring; nothing
   * ships with them today.
   */
  tone?:
    | "lilac"
    | "cream"
    | "sage"
    | "deep"
    | "painted"
    | "secondary"
    | "secondaryInverse";
  /** The painted tone's paint. Soft Lavender unless a ground needs otherwise. */
  paint?: string;
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
  paint = "var(--color-lavender)",
  className,
}: BlobButtonProps) {
  const painted = tone === "painted";

  const shell = cn(
    painted ? null : styles.button,
    tone === "cream" ? styles.cream : null,
    tone === "deep" ? styles.deep : null,
    tone === "sage" ? styles.sage : null,
    tone === "secondary" ? styles.secondary : null,
    tone === "secondaryInverse" ? styles.secondaryInverse : null,
    // The press is the site's, the flood is this component's: one answers
    // the finger, the other the pointer.
    "press-in group inline-flex items-center gap-3 text-action font-medium uppercase tracking-eyebrow",
    painted
      ? /*
           `group/paint` is what the sweep keys off. The stroke's own hover
           rules answer `group/nav` and `group/link` and also drop `--wet` to
           0.46 — a translucency a button standing on a photograph cannot have
           — so the painted tone gets a group of its own. `isolate` is
           load-bearing: the stroke sits at `z-index: -1` and without a
           stacking context here it escapes to the nearest ancestor that has
           one and paints behind the section instead of behind the word.
        */
        "group/paint relative isolate justify-center text-text [--swell:1] [--wet:1]"
      : "rounded-[900px]",
    disabled ? "cursor-not-allowed opacity-55" : null,
    className,
  );

  /* The painted tone has no pill to flood, so it skips the blobs entirely and
     puts the brushstroke behind the label instead. */
  const inner = painted ? (
    <>
      <PaintStroke paint={paint} shape="sweep" />
      <span className="relative">{children}</span>
      {arrow ? (
        <span
          aria-hidden
          className="relative transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      ) : null}
    </>
  ) : (
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
