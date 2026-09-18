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
  /** Sizing and any extra layout; the colour and the flood are the component's. */
  className?: string;
}

/**
 * The site's primary action: Deep Lilac, flooded with Light Sage on hover.
 *
 * A pill, at the client's ask — the one exception to the site's 8px radius,
 * and now the shape of this action wherever it appears, so the banner's
 * button and the Experiences menu's are the same object rather than two
 * things that happen to be lilac.
 *
 * The arrow is part of the component for the same reason: it travels on hover
 * in both places, or in neither.
 */
export function BlobButton({ href, children, onClick, className }: BlobButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        styles.button,
        "group inline-flex items-center gap-3 rounded-[900px] text-action font-semibold uppercase tracking-eyebrow",
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
