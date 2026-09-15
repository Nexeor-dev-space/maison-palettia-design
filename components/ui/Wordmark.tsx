import Image from "next/image";
import Link from "next/link";

import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

/** Intrinsic size of public/images/logo.png — kept here to reserve the space. */
const LOGO = { src: "/images/logo.png", width: 1015, height: 438 } as const;

/**
 * The brand mark, linking home. One form, because there is one logo.
 *
 * This component used to offer a second, "text" variant that set SITE.name in
 * the brand script — a logo made out of type, which the guidelines do not
 * allow. It is gone; the only Maison Palettia mark on this site is the
 * supplied file.
 *
 * KNOWN CONSTRAINT: the artwork is Light Sage on transparency (sampled: 93% of
 * its ink is #d1e7be), so it reads on a dark ground and disappears on a light
 * one — against the footer's sage it measures 1.00:1. Until the client
 * supplies a dark-on-light cut, this can only be used on Charcoal Slate,
 * where it measures 9.07:1.
 *
 * The link carries the accessible name, so the image itself is decorative
 * (`alt=""`) — otherwise a screen reader announces the brand twice.
 */
export function Wordmark({ className }: WordmarkProps) {
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
        src={LOGO.src}
        alt=""
        width={LOGO.width}
        height={LOGO.height}
        priority
        /*
          Sized against the bar rather than against itself, and re-struck
          when the bar grew.

          At 56px in a 104px bar the mark filled 54% of the row and left
          24px of air above and below — which reads as compressed rather
          than as prominent, and is a large part of why the header felt
          small despite already being tall. The bar now rests at 120px on a
          desktop and the mark takes 52 of it: 43%, with 34px of air on
          each side. The mark is larger in absolute terms than it was and
          the row around it is calmer, which is the whole trade.

          The aspect is the file's own; only the height is set, so the
          artwork cannot distort.
        */
        className="h-11 w-auto md:h-13"
      />
    </Link>
  );
}
