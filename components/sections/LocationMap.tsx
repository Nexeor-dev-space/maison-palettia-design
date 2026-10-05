import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { BlobButton } from "@/components/ui/BlobButton";
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
  /**
   * The map frame's shape, as Tailwind aspect utilities.
   *
   * THE DEFAULT ASSUMES THE FULL MEASURE and stops being right the moment a
   * caller puts the map in a column. `/locations` now sets it beside the
   * page's heading rather than under it, and the default's `lg:aspect-[2/1]`
   * in half the width is a letterbox about 290px tall — a map you cannot read
   * a street from, which is the one thing this component exists to avoid.
   *
   * So the shape is the caller's, because the caller is the only one that
   * knows how wide the map will be. Omit it and nothing changes: the string
   * below is exactly what was hard-wired here before, count-aware branch and
   * all, so the event pages render the same frame they always did.
   */
  aspect?: string;
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
export function LocationMap({ partners, className, caption = true, aspect }: LocationMapProps) {
  if (partners.length === 0) return null;

  const single = partners.length === 1;

  return (
    <div className={cn("grid gap-x-6 gap-y-14 lg:gap-x-8", single ? "" : "md:grid-cols-2", className)}>
      {partners.map((partner, i) => (
        <Reveal key={partner.slug} variant="fadeIn" delay={i * 0.08}>
          <figure className="relative">
            {/*
              A WRAPPER AROUND THE FRAME, FOR ONE REASON: the mark has to hang
              off the map's own edge, and neither the frame nor the figure can
              hold it there.

              Not the frame, because the frame is `overflow-hidden` for its own
              rounded corner, so all that showed was the sliver of the mark
              that fell inside the box.

              Not the figure either, which is what this used to be. The figure
              is the map PLUS the caption plate under it, so "the map's bottom"
              is not an edge it has — the mark was pinned with
              `top: calc(56.25% - 2.5rem)`, 56.25% being 9/16, i.e. the frame's
              own height written out by hand. That held exactly as long as the
              frame stayed 16:9. `aspect` above now lets a caller change it,
              and on the first such caller the mark landed in the middle of the
              tiles.

              A box that is the frame and nothing else has the edge, at every
              aspect, with no arithmetic. The mark still cannot sit over the
              tiles or catch a drag.

              THE LEFT EDGE AT MID-HEIGHT, AND NOT A CORNER. Google puts its
              own furniture in three of the four: the place card top-left, the
              satellite thumbnail bottom-left, the attribution and the
              fullscreen control bottom-right. A cut-out on the bottom-left
              corner landed squarely on the thumbnail and read as a smear
              across the map rather than as a shape laid over its edge. The
              middle of the left edge is the one stretch of frame that is
              only ever tiles. `top` as a percentage so it stays there at
              whatever aspect the caller asks for.

              `-left-5` is the offset this always had, and it stays: on a
              full-width map the frame's left edge IS the page gutter, so
              every extra pixel of hang is a pixel the section clips away.
              Only the vertical position needed fixing.
            */}
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute -left-5 top-[54%] z-10 hidden w-[4rem] rotate-[12deg] md:block md:w-[5rem]"
              >
                <DoodleMark name="bean" color={INK.terracotta} treatment="stamp" delay={320} />
              </span>
              <div
                /*
                  `plate` AND A WIDER RADIUS, at the client's ask: "this
                  doesn't need to be SO big, or maybe give it a border cuz it
                  blends with the background".

                  It had a hairline in `--color-line`, which is Light Sage
                  with a little Soft Lavender — a rule drawn to disappear into
                  this site's pale grounds, which is exactly what it did
                  against a map whose own tiles are pale grey. `plate` is the
                  device this project already uses for an object that cannot
                  be seen against its ground: a 10% Charcoal ring and the
                  shared veil under it. The radius matches <PartnerPlate>
                  beside it, so the map and the destination read as a pair.

                  The other half of the note — the size — is the caller's:
                  `aspect` is a prop, and /locations passes a shorter one.
                */
                className={cn(
                  "plate relative w-full overflow-hidden rounded-[1.25rem] border border-line bg-surface-alt",
                  aspect ??
                    cn("aspect-[4/5] sm:aspect-[16/9]", single ? "lg:aspect-[2/1]" : "lg:aspect-[16/10]"),
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
 * It keeps `<figcaption>`'s job without its element: the name is a heading,
 * because a destination with a name, a city and a description is a heading
 * with content under it whatever box it sits in. WHICH heading is the
 * caller's to say — see `headingLevel`.
 */
export function PartnerPlate({
  partner,
  className,
  tone = "cream",
  headingLevel = "h3",
}: {
  partner: MallPartner;
  className?: string;
  /**
   * THE LEVEL THE DESTINATION'S NAME TAKES, because the plate cannot know it
   * and the two pages that draw it do not agree:
   *
   *   /events/[slug] ... h1 title, then an h2 over the location section, and
   *                      the plate inside it. h3 — the default.
   *   /locations ....... the plate sits directly under the page's h1, in the
   *                      column beside the "Find us now" h2. An h3 there is
   *                      a level skipped, and a screen-reader user tabbing
   *                      the heading list is told there is a missing rung.
   *
   * It was hard-coded h3 and /locations went h1 -> h3 -> h2 because of it.
   */
  headingLevel?: "h2" | "h3";
  /**
   * Which of the two neutral grounds the plate is cut from.
   *
   *   cream ... White Rock. The default, and what the event page needs: its
   *             own ground is Light Sage, and a sage plate on it is 1.0:1 —
   *             not a card, a patch of the same paper.
   *   sage .... Light Sage, for a plate laid on White Rock. Nothing passes it
   *             today: /locations took it while its masthead was the cream
   *             one, and that section is Light Sage again, so the plate is
   *             back on the default. The tone stays because the pairing is
   *             the point — whichever of the two neutrals the section is,
   *             the plate is the other.
   *
   * IT IS A PROP RATHER THAN A `className`, and that is not fussiness: `cn`
   * here is plain concatenation, so a `bg-sage` handed in through className
   * does not override the `bg-cream` below — the two are the same kind of
   * utility and the stylesheet's own order decides which wins, whatever order
   * the caller wrote them in. <DisplayHeading> carries the same note for the
   * same reason.
   *
   * Charcoal reads on both: 9.07:1 on Light Sage, 10.6:1 on White Rock, so
   * nothing inside has to change with the ground.
   */
  tone?: "cream" | "sage";
}) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "plate relative flex flex-col gap-5 rounded-[1.25rem] px-6 pb-7 pt-6",
        tone === "sage" ? "bg-sage" : "bg-cream",
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
        {/* Level from the caller, size from the plate — the two are
            independent, which is the whole reason the prop exists. */}
        <Heading className="mt-5 text-h4 font-bold uppercase tracking-[0.015em] text-text [font-family:var(--font-deck)] [font-synthesis:none]">
          {partner.name}
        </Heading>
        <p className="mt-2 text-label font-medium uppercase tracking-eyebrow text-text/75">
          {partner.locality}
        </p>
        <p className="mt-4 max-w-[34rem] text-lead text-text/90">
          {partner.descriptor}
        </p>
      </div>

      {/* A SECONDARY BUTTON. This was a word with a terracotta rule under it
          — the client's note about underlined links standing in for buttons,
          and the clearest case of it on the site: it is the only action on
          the plate. It is also OUTBOUND, which is why <BlobButton> grew an
          `external` prop rather than this staying a bare <a>: the component
          could not express the link, so the link could not have the
          component's shape. */}
      {partner.locationHref ? (
        <BlobButton
          href={partner.locationHref}
          external
          tone="painted"
          className="shrink-0 min-h-[3rem] px-6 sm:mt-6"
        >
          View location
          <span className="sr-only"> (opens in a new tab)</span>
        </BlobButton>
      ) : null}
    </div>
  );
}
