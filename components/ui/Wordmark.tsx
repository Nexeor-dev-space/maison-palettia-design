import Image from "next/image";
import Link from "next/link";

import { BRAND_LOGO, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /**
   * Set when the mark sits on a light ground, which swaps it for the Deep
   * Lilac cut. Named for the ground rather than for the file, so a caller
   * never has to know which artwork answers which surface.
   */
  onLight?: boolean;
}

/**
 * The brand mark, linking home. One form, because there is one logo.
 *
 * This component used to offer a second, "text" variant that set SITE.name in
 * the brand script — a logo made out of type, which the guidelines do not
 * allow. It is gone; the only Maison Palettia mark on this site is the
 * supplied file.
 *
 * TWO CUTS, ONE COMPONENT. The supplied artwork is Light Sage on transparency,
 * so it reads on a dark ground and vanishes on a light one. `onLight` swaps in
 * the Deep Lilac cut the client supplied for exactly that case — which is what
 * lets the header keep its mark when it takes a white ground on scroll.
 *
 * Measured: sage on Charcoal Slate 9.07:1, lilac on the white bar 5.06:1. Both
 * clear the 3:1 a logo owes as a graphical object, and each fails on the
 * other's ground, which is why this is a swap rather than a preference.
 *
 * The two files are not the same shape — 1015x438 against 1120x466 — so only
 * the height is ever set and each keeps its own aspect.
 *
 * The link carries the accessible name, so the image itself is decorative
 * (`alt=""`) — otherwise a screen reader announces the brand twice.
 */
export function Wordmark({ className, onLight = false }: WordmarkProps) {
  const art = onLight ? BRAND_LOGO.onLight : BRAND_LOGO;

  return (
    <Link
        href="/"
        aria-label={`${SITE.name} — home`}
        className={cn(
          "inline-flex items-center transition-opacity duration-200 hover:opacity-80",
          className,
        )}
      >
      <Image
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        priority
        /*
          Sized against the bar, and re-struck once the bar was actually the
          height it claimed to be.

          The note here used to reason about 36px in a 72px row. The row was
          never 72 — `md:h-header-lg` was not generating, so the desktop bar
          had been 64px and the mark was 36px in it. Both are fixed together,
          because sizing a mark against a bar that is the wrong height is how
          the proportion goes wrong in the first place.

          44px in 72px is 61%, with 14px of clearance above and below. That is
          more than the single-line sans wordmark on the compact reference the
          client pointed at takes, and it has to be: this mark is two stacked
          lines of script, so at 36px each line stood about 15px and read as
          thin rather than as small. The artwork cannot be cropped to win the
          space back — measured, it is already tight, with 3% transparent
          margin top and bottom.

          The aspect is each file's own; only the height is set, so neither cut
          can distort.
        */
        className="h-9 w-auto md:h-11"
      />
    </Link>
  );
}
