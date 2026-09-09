import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

interface WorkshopPhotoProps {
  image: ImageAsset;
  /** The plate's proportion, e.g. "aspect-[3/2]". Varied on purpose per entry. */
  aspect: string;
  /** Rendered width at each breakpoint, so the browser fetches one size only. */
  sizes: string;
  className?: string;
}

/**
 * A workshop photograph, set as artwork rather than as the top of a card:
 * square edges, no border, no shadow, nothing laid over it.
 *
 * Square corners are not an omission — the hero triptych and the brand
 * statement's plate are both hard-edged, and the collection reads as part of
 * the same page because of it.
 *
 * The reveal and the hover scale are separate transforms on separate elements:
 * the wrapper animates once on entry and stops, the image itself carries the
 * slow, small lift under the pointer. Both sit inside the crop, so nothing
 * moves outside its frame.
 */
export function WorkshopPhoto({ image, aspect, sizes, className }: WorkshopPhotoProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-surface-alt", aspect, className)}>
      <Reveal variant="imageReveal" className="absolute inset-0">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          style={{ objectPosition: image.position ?? "50% 50%" }}
          className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-within:scale-[1.035]"
        />
      </Reveal>
    </div>
  );
}
