import { cn } from "@/lib/utils";

/**
 * The map plate for <MallPartners>.
 *
 * IT NOW SHOWS THE MAP. The previous version held the frame behind a press —
 * a plate reading "Open the map", on the argument that a Google embed is a
 * cross-site request this site has no consent record for, and that a homepage
 * should not make that request on a visitor's behalf unasked. The client has
 * looked at that plate and asked for a map in its place, so it is a map. The
 * trade is real and it is worth writing down rather than quietly losing: every
 * homepage view now contacts Google, and the section that used to cost nothing
 * until it was wanted costs a frame's worth of tiles, script and fonts.
 *
 * TWO THINGS KEEP THAT COST DOWN, AND NEITHER NEEDED A DECISION FROM ANYONE.
 * `loading="lazy"` defers the request until the plate is near the viewport,
 * which on this page is four sections down — a reader who does not reach it
 * never pays for it. And the frame is still granted nothing: see the `allow`
 * note below.
 *
 * WHY THIS IS NO LONGER A CLIENT COMPONENT. The press was the only state it
 * had. With the frame rendered outright there is no ref, no effect and no
 * focus to manage, so it is a server component again and ships no JavaScript.
 *
 * WHY IT IS STILL NOT <LocationMap>. That component renders the same keyless
 * embed and app/events/[slug] mounts it. The two stay separate because this
 * one is sized for a homepage half and framed to match the card it sits in,
 * and folding them together would mean a component with a flag for every
 * difference between two pages.
 */
interface MallMapProps {
  /**
   * The finished embed URL, built on the server.
   *
   * A string rather than the partner object, for the reason <SessionCarousel>
   * takes formatted strings: `lib/partners.ts` is where the destinations live
   * and importing it here to build one URL would put the whole array in the
   * browser bundle. This component knows how to frame a map and nothing about
   * who the Maison works with.
   */
  src: string;
  /** "Times Square Center, Dubai" — the frame's accessible name. */
  place: string;
  className?: string;
}

export function MallMap({ src, place, className }: MallMapProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-sm border border-line bg-surface",
        /*
          A map is only worth showing at a size you can read a street from, so
          this is the tallest plate in the section at every width. 4:5 on a
          phone — a portrait window shows the blocks around the centre, where a
          letterbox shows the car park. 16:10 once there is room for the type
          beside it. 4:3 from `lg`.
        */
        "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/3]",
        className,
      )}
    >
      <iframe
        /*
          Titled for the place, not the vendor. An iframe is announced by its
          title, and "Google Maps" would tell a screen-reader user which
          company drew the tiles rather than which centre they are looking at.

          NO `allow` ATTRIBUTE, DELIBERATELY. Powerful features default to a
          `self` allowlist, so a cross-origin frame gets none of them unless
          they are granted here. Nothing is granted — which matters most for
          the one a map would obviously want, since this frame cannot ask the
          reader for their location.

          `referrerPolicy` sends the origin alone. The default would do the
          same in current browsers, but stating it means the frame does not
          start leaking the full URL if that default ever moves.
        */
        title={`Map of ${place}`}
        src={src}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
