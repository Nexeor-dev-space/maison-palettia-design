import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { cn } from "@/lib/utils";
import type { MallPartner } from "@/types";

/** The two custom properties `@utility dab` reads. */
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/**
 * What the map is asked to find.
 *
 * A SEARCH, NOT A COORDINATE, and that is the whole design of this component.
 * Nothing in this project stores latitude and longitude — see the note in
 * <LocationDiscovery>, which refused to draw pins for the same reason — so
 * this hands the centre's name to the map and lets the map resolve it. A pin
 * we placed ourselves would be a guess rendered as a fact, and a visitor
 * navigating by a wrong pin is worse off than one reading a correct name.
 *
 * `mapQuery` overrides it for the case where the signposted name is not what
 * finds the place.
 */
export function mapSearch(partner: MallPartner): string {
  return partner.mapQuery ?? `${partner.name}, ${partner.locality}`;
}

/**
 * NO API KEY, AND NONE NEEDED.
 *
 * Google's Maps Embed API wants a key; this is the keyless `output=embed`
 * form, which takes a plain query and returns an interactive map — pan, zoom,
 * and a pin the map placed itself. So there is no key in the client bundle,
 * no key in the environment, no new dependency in package.json and no backend
 * added for one section, which is what the brief asked for.
 *
 * It is `loading="lazy"`, so a homepage visitor who never scrolls this far
 * never makes the request.
 */
export function embedSrc(partner: MallPartner): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapSearch(partner))}&output=embed`;
}

interface LocationMapProps {
  partners: MallPartner[];
  className?: string;
  /**
   * Whether the plate naming each centre is drawn under its map.
   *
   * On `/locations` it is, because the map is the whole point of the page and
   * the plate is its label. An event page wants the same plate beside its
   * heading instead — a caption under a map that is already under a heading
   * puts the destination's name below the fold — so it turns this off and
   * renders {@link PartnerPlate} itself.
   */
  caption?: boolean;
}

/**
 * Where the Maison actually is — the map, at the width of the measure.
 *
 * WHY IT IS HERE AND NOT IN A SECTION OF ITS OWN. The page already answers
 * "where" once, in <MallPartners> directly above: the model (no fixed address,
 * an agreement per centre), the destination, and what it is. A second section
 * with its own heading would ask the same question twice and answer it twice,
 * and the brief's own warning — that the map must not read as an unrelated
 * footer element — is exactly what happens when a map is given its own
 * territory. So it closes that section instead. The reader gets the argument,
 * then the destination, then the ground it stands on.
 *
 * THE FRAME CARRIES THE BRAND, NOT THE MAP. Restyling map tiles into the
 * palette needs the JS API and a key, and tinting them from outside — a wash
 * over the top — would cost the legibility that is the only reason a map is
 * here. So the tiles stay as they are and everything around them is the
 * Maison's: White Rock ground, a hairline in the brand's own mix, the
 * section's eyebrow type under it, and the same ruled terracotta link the rest
 * of the site uses. The map reads as a plate set into the page rather than a
 * widget dropped onto it.
 *
 * SHAPES. A map is only useful at a size you can read a street from, so this
 * is deliberately the tallest plate on the homepage at every width: 4:5 on a
 * phone, where a portrait window shows more of the surrounding blocks than a
 * letterbox would; 16:9 from `md`; 2:1 at `lg`, where the measure is wide
 * enough that anything taller would push the caption off the screen.
 *
 * COUNT-AWARE, NOT HARD-WIRED TO ONE. A second confirmed centre extends this
 * to a pair of half-width plates with no edit here — the grid switches on the
 * length of the array, the same contract <MallPartners> keeps.
 *
 * Server component: an iframe, two links and no state.
 */
export function LocationMap({ partners, className, caption = true }: LocationMapProps) {
  if (partners.length === 0) return null;

  const single = partners.length === 1;

  return (
    <div className={cn("grid gap-x-6 gap-y-14 lg:gap-x-8", single ? "" : "md:grid-cols-2", className)}>
      {partners.map((partner, i) => (
        <Reveal key={partner.slug} variant="fadeIn" delay={i * 0.08}>
          <figure className="relative">
            {/*
              ON THE FIGURE, NOT IN THE MAP FRAME. This sat inside the frame
              and the frame is `overflow-hidden` for its own rounded corner, so
              all that showed was the sliver of it that fell inside the box.
              Hung off the figure instead, it breaks the map's bottom-left edge
              the way it was meant to, and it still cannot sit over the tiles
              or catch a drag.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-5 z-10 hidden w-[4rem] rotate-[12deg] md:block md:w-[5rem]"
              style={{ top: "calc(56.25% - 2.5rem)" }}
            >
              <DoodleMark name="bean" color={INK.terracotta} treatment="stamp" delay={320} />
            </span>
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-sm border border-line bg-surface-alt",
                "aspect-[4/5] sm:aspect-[16/9]",
                single ? "lg:aspect-[2/1]" : "lg:aspect-[16/10]",
              )}
            >
              <iframe
                /*
                  Titled, because an iframe is announced by its title and
                  "Google Maps" would tell a screen-reader user the vendor
                  rather than the place. `loading="lazy"` keeps the request
                  off the initial page load.

                  `strict-origin-when-cross-origin`, NOT
                  `no-referrer-when-downgrade`, and the difference is a real
                  leak rather than a preference. That value was here with a
                  comment claiming it "sends the origin and not the full URL",
                  which is the opposite of what it does: on an https-to-https
                  request it sends the full URL, path and query included. So
                  every event page handed Google its own address the moment
                  this map loaded. This value is what the comment described,
                  and is also the modern browser default.
                */
                title={`Map showing ${partner.name}, ${partner.locality}`}
                src={embedSrc(partner)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>

            {caption ? <PartnerPlate partner={partner} className="mt-6" /> : null}
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * A destination, as a plate: the dab, the name, the city, the studio's own
 * line about it, and the way out to a real map.
 *
 * ==========================================================================
 * WHY IT IS ITS OWN COMPONENT
 * ==========================================================================
 *
 * It was a `<figcaption>` inside <LocationMap>, which is the right place for
 * it on `/locations` — the map is the page and this is its label. An event
 * page wants it somewhere else: beside the section's heading, where a visitor
 * reads the destination's name at the same moment as "Where the Maison sets
 * up", rather than several hundred pixels below a map that is itself below
 * the heading.
 *
 * Two callers, one object. <LocationMap caption={false}> turns the built-in
 * one off and the page renders this where it wants it, so the plate cannot
 * drift into two versions of itself.
 *
 * It keeps `<figcaption>`'s job without its element: the name is an <h3>,
 * because a destination with a name, a city and a description is a heading
 * with content under it whatever box it sits in.
 */
export function PartnerPlate({
  partner,
  className,
}: {
  partner: MallPartner;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "plate relative flex flex-col gap-5 rounded-[1.25rem] bg-cream px-6 pb-7 pt-6",
        "sm:flex-row sm:items-start sm:justify-between sm:gap-10 md:px-7 md:pb-8 md:pt-7",
        className,
      )}
    >
      {/*
        One cut-out breaking the plate's BOTTOM-right corner. The deck puts its
        shapes on an edge and never in clear space. The top-right is taken —
        "View location" sits there, and the first placement put a 5.5rem
        lavender shape straight over it.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-4 w-[4.5rem] rotate-[-10deg] md:w-[5.5rem]"
      >
        <DoodleMark name="coral" color={INK.lavender} treatment="stamp" delay={240} />
      </span>

      <div className="min-w-0">
        <span
          aria-hidden
          className="dab h-9 w-[3.5rem] md:h-10 md:w-[4.25rem]"
          style={{ "--paint": INK.terracotta, "--tilt": "-2deg" } as CSSVars}
        />
        <h3 className="mt-5 text-[1.0625rem] font-bold uppercase leading-[1.12] tracking-[0.015em] text-text [font-family:var(--font-deck)] [font-synthesis:none] md:text-[1.25rem]">
          {partner.name}
        </h3>
        <p className="mt-2 text-fine font-medium uppercase tracking-eyebrow text-text/75">
          {partner.locality}
        </p>
        <p className="mt-4 max-w-[34rem] text-body leading-[1.8] text-text/80">
          {partner.descriptor}
        </p>
      </div>

      {partner.locationHref ? (
        <a
          href={partner.locationHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group -my-1.5 inline-flex shrink-0 items-center gap-3 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text sm:mt-6"
        >
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            View location
          </span>
          {/* Charcoal rather than Warm Terracotta: this glyph says "this one
              leaves", and the accent measures 2.44:1 on White Rock, under the
              3:1 a meaningful glyph owes. */}
          <span
            aria-hidden
            className="text-text/75 transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-y-0.5"
          >
            &#8599;
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}
