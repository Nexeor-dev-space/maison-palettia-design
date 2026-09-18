import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { MallPartner } from "@/types";

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
export function LocationMap({ partners, className }: LocationMapProps) {
  if (partners.length === 0) return null;

  const single = partners.length === 1;

  return (
    <div className={cn("grid gap-x-6 gap-y-14 lg:gap-x-8", single ? "" : "md:grid-cols-2", className)}>
      {partners.map((partner, i) => (
        <Reveal key={partner.slug} variant="fadeIn" delay={i * 0.08}>
          <figure>
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

            {/*
              The wall label. Name and city on one side, the way out on the
              other — and on a phone they stack rather than squeezing onto one
              line, because a 360px row holding a name, a city and a link is
              three things fighting for the same 40 characters.
            */}
            <figcaption className="mt-6 flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <div className="min-w-0">
                {/*
                  An <h3>, not a paragraph that looks like one. The plate that
                  used to head this destination is gone — its name, its city
                  and its one line all live here now, so this is the heading
                  for the destination and the outline should say so.
                */}
                <h3 className="text-h3 font-light tracking-[-0.015em] text-text">
                  {partner.name}
                </h3>
                <p className="mt-2 text-fine font-medium uppercase tracking-eyebrow text-text/75">
                  {partner.locality}
                </p>
                {/* The centre's one line, carried down from the plate. */}
                <p className="mt-4 max-w-[34rem] text-body leading-[1.8] text-text/80">
                  {partner.descriptor}
                </p>
              </div>

              {partner.locationHref ? (
                <a
                  href={partner.locationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group -my-1.5 inline-flex shrink-0 items-center gap-3 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
                >
                  <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                    View location
                  </span>
                  {/*
                    The corner arrow, and Charcoal rather than Warm Terracotta
                    — the same two decisions <MallPartners> made for its own
                    outbound link, for the same two reasons: this glyph says
                    "this one leaves", and the accent measures 2.44:1 on White
                    Rock, under the 3:1 a meaningful glyph owes.
                  */}
                  <span
                    aria-hidden
                    className="text-text/75 transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-y-0.5"
                  >
                    &#8599;
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
