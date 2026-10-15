import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";

/**
 * The four cut-outs drawn over the edges of a page's banner photograph — the
 * set /private-events/<slug> opened with, and the experience pages' banner
 * since Oct 2026, so the two families of detail page carry the same picture.
 *
 * SMALLER ON A PHONE (Oct 2026). Sized for a 800px photograph, the wave was
 * 136px — over a third of a phone's photograph — and the slab at the corner
 * 80px; the client found them far too big there. Below `md` each is about
 * 60% of its desktop size and tucks in closer, so it still breaks the edge
 * without reaching past the page's side margin.
 *
 * Absolutely placed: render it inside the photograph's own box, which must be
 * `relative`. The colours are fixed rather than taken from a tone, because in
 * this brand's sheet the COLOUR picks the drawing (`resolveIcon`) — pinning
 * them is what makes every banner draw the same four marks.
 */
export function BannerMarks() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute -right-3 -top-5 w-[3.25rem] md:-right-5 md:-top-8 md:w-[6.5rem]">
        <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={240} />
      </span>
      <span aria-hidden className="pointer-events-none absolute -left-3 top-[28%] w-[1.75rem] md:-left-4 md:w-[2.75rem]">
        <DoodleMark name="bow" color={INK.lilac} treatment="draw" delay={380} />
      </span>
      <span aria-hidden className="pointer-events-none absolute -bottom-4 -left-3 w-[5rem] md:-bottom-7 md:-left-6 md:w-[10.5rem]">
        <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={460} />
      </span>
      <span aria-hidden className="pointer-events-none absolute -right-2 bottom-[18%] w-[2rem] md:-right-3 md:w-[3.5rem]">
        <DoodleMark name="splash" color={INK.lilac} treatment="draw" delay={540} />
      </span>
    </>
  );
}
