import Image from "next/image";

import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

interface WorkshopPhotoProps {
  image: ImageAsset;
  /** The plate's proportion, e.g. "aspect-[3/2]". */
  aspect: string;
  /** Rendered width at each breakpoint, so the browser fetches one size only. */
  sizes: string;
  className?: string;
}

/**
 * A session photograph, set as artwork rather than as the top of a card:
 * square edges, no border, no shadow, nothing laid over it.
 *
 * Square corners are not an omission — the hero triptych and the brand
 * statement's plate are both hard-edged, and the section reads as part of the
 * same page because of it.
 *
 * NO SCROLL REVEAL, AND THAT IS DELIBERATE.
 *
 * This used to be wrapped in <Reveal variant="imageReveal">, which renders
 * `opacity: 0` on the server and waits for an IntersectionObserver to raise it
 * to 1. The observer watched an `absolute inset-0` element inside an
 * `overflow: hidden` crop, and on the booking blocks it did not reliably fire
 * — leaving the photograph permanently invisible over a White Rock placeholder
 * that happens to be the same colour as the panel beside it. The result read
 * as a deliberately empty half, not as a broken image, which is why it went
 * unnoticed twice.
 *
 * An entry animation is a nicety. The photograph is the content of a section
 * whose job is to sell a seat, and content must not be contingent on an
 * observer firing. The hover lift stays — it is pure CSS, it enhances rather
 * than reveals, and it cannot hide anything if it never runs.
 *
 * The surrounding text still animates: the panel's own <Reveal>s are
 * unaffected, so the section keeps the page's motion language where failure
 * would only cost a flourish.
 */
export function WorkshopPhoto({ image, aspect, sizes, className }: WorkshopPhotoProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-surface-alt", aspect, className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        style={{ objectPosition: image.position ?? "50% 50%" }}
        className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-within:scale-[1.035]"
      />
    </div>
  );
}
