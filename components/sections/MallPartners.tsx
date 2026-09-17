import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { MallMap } from "@/components/sections/MallMap";
import { Container } from "@/components/ui/Container";
import { getMallPartners } from "@/lib/partners";
import type { MallPartner } from "@/types";

/**
 * The statement — the client's own words, and short enough to need no help.
 *
 * Four words hold one line at every width the left half is ever given, which
 * is why there is no authored-line array here and why the type can be the size
 * a section heading should be.
 */
const STATEMENT = "Meet us at the mall.";

/**
 * The two halves of a row, spelled out once.
 *
 * SIX AND SIX, which is the reference's own split: its Exhibitions and Fairs
 * rows are 694px of text beside 694px of image inside a 1400px measure. At
 * 1440 this grid resolves to 680 and 680 with a 40px gap, and at `lg` (1024)
 * to 478 each — where the uppercase statement still sets on one line, which a
 * five-column left half did not.
 *
 * Tailwind reads source literally, so these are complete strings rather than
 * anything assembled from a column count.
 */
const ROW = "grid grid-cols-12 items-start gap-x-6 gap-y-10 lg:gap-x-10";
const TEXT_HALF = "col-span-12 lg:col-span-6";
const MAP_HALF = "col-span-12 lg:col-span-6 lg:col-start-7";

/**
 * What the map is asked to find, and the one rule this whole section obeys.
 *
 * A SEARCH, NEVER A COORDINATE. Nothing in this project stores a latitude, a
 * longitude or a street address — see the note at the head of lib/partners.ts,
 * which keeps its own link as a Maps search by name for exactly this reason. A
 * pin we placed ourselves would be a guess rendered as a fact, and a visitor
 * navigating to a wrong pin is worse off than one reading a correct name. So
 * the centre's name is handed to the map and the map resolves it.
 *
 * `mapQuery` overrides the default for the case where the signposted name is
 * not what finds the place.
 *
 * Returns `undefined` when there is nothing to ask for, so the caller can
 * render the text entry and no frame. An empty query would resolve to a map of
 * nowhere, which is the one thing worse than no map.
 */
function mapQueryFor(partner: MallPartner): string | undefined {
  const raw =
    partner.mapQuery ??
    [partner.name, partner.locality].filter(Boolean).join(", ");
  const query = raw.trim();
  return query.length > 0 ? query : undefined;
}

/**
 * NO API KEY, AND NONE NEEDED.
 *
 * Google's Maps Embed API wants a key; this is the keyless `output=embed`
 * form, which takes a plain query and returns an interactive map with a pin
 * the map placed itself. No key in the bundle, no key in the environment, no
 * dependency added and no backend stood up for one section.
 *
 * Opening this URL at the top level answers "must be used in an iframe". That
 * is the documented behaviour of the embed endpoint and not a broken link.
 */
function embedSrc(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/**
 * Where the Maison creates — the model, the destinations, and a map to each.
 *
 * THE ONE FACT THIS SECTION EXISTS TO CONVEY is that the studio keeps no fixed
 * address. It signs with a shopping centre and brings the room inside for a
 * run of dates. A reader who takes nothing else from the homepage should take
 * that, so it is said in the lead paragraph in plain words rather than implied
 * by a list of places.
 *
 * THE COMPOSITION, AND WHERE IT COMES FROM. Two patterns from the reference,
 * combined:
 *
 *   - Its footer locations band gives the entry: name in weight 500, the lines
 *     that place it underneath, then a directions link. Plain type set on the
 *     page ground. No card, no plate, no mark, no rule around it.
 *   - Its Exhibitions and Fairs rows give the shape: a compact text block at
 *     the TOP of one half, one very large visual filling the other, and the
 *     space below the text left empty. The emptiness is the effect, not a gap
 *     waiting to be filled.
 *
 * So each destination is a row — quiet type left, a large map right — and the
 * masthead rides in the first row's text half rather than sitting above the
 * grid. Placed above it, the masthead would leave roughly 680x220 of dead
 * ground at the top right before the first map began; riding in the row, the
 * map starts level with the eyebrow and the emptiness lands where the
 * reference puts it — under the type, not over it.
 *
 * WHAT WAS REMOVED, AND WHY. This carried a second column listing the studio's
 * activities split into walk-in and bookable. It was a menu, <CreativeExperiences>
 * directly above is the menu, and it filled the exact space this composition
 * needs to leave empty. Removing it also takes `getCreativeExperiences` out of
 * a section about *where*, which is the only question it should answer.
 *
 * NOT A LOGO WALL, and built so it cannot drift into one. A logo wall answers
 * "who vouches for us"; this answers "where does this happen and how does it
 * work". No mark is drawn, traced or approximated — there is no approved
 * partner asset in this project and the name set as type is the honest version
 * of the same thing. No photograph stands in for a centre either. And there is
 * no count, no footfall and no "trusted by": the studio has supplied no
 * statistics, and a section about real partnerships that invents its own
 * numbers is the opposite of credible.
 *
 * ONE PARTNER READS AS ONE PARTNER. The client has confirmed a single
 * agreement, so one row renders and nothing counts, numbers or lays out
 * against a figure it expected. A second and a third are an append to
 * lib/partners.ts: rows stack, each keeps its own map beside its own name, and
 * nothing in this file changes.
 *
 * Server component. It resolves the embed URLs and hands <MallMap> finished
 * strings, so the destination data never reaches the browser bundle. Awaited
 * in place rather than suspended, for the reason set out in <UpcomingEvents>.
 */
export async function MallPartners() {
  const partners = await getMallPartners();

  // Nothing to say and nothing said. The same contract the rest of the page
  // keeps: a section with no content does not render a heading over an empty
  // space.
  if (partners.length === 0) return null;

  return (
    <Container
      as="section"
      aria-labelledby="mall-partners"
      className="py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      {/*
        THE CARD, WHICH THE CLIENT ASKED FOR AND WHICH REPLACES THE OPPOSITE
        DECISION. This section used to sit directly on the page's own pale
        green with nothing drawn under it, on the reference's argument that its
        Exhibitions rows are separated by space alone. Space alone stopped
        working once the film band went in above: two unbounded stretches of
        type in a row read as one long section, and the card gives this one an
        edge to start at.

        THE GROUND IS WHITE ROCK ON THE PAGE'S PALE GREEN — `bg-surface-alt` on
        `--color-surface`, both of them existing tokens. The section brief is
        explicit that this part of the page uses the approved palette and
        introduces nothing, so the card is made out of the two grounds the
        site already has rather than out of a new one, and the warm/cool
        difference between them is what separates it from the page.

        `rounded-md` — 14px — RATHER THAN THE 8px THE IMAGES AND BUTTONS TAKE.
        A radius reads against the size of the thing carrying it: 8px on a
        1100px-wide panel is a corner that has been nicked rather than turned,
        and at this scale 14px is the same apparent softness that 8px gives a
        plate. The map inside keeps its 8px, so the two nest instead of
        competing.

        No dividers between the rows inside it — that part of the reference
        still holds.
      */}
      <div className="rounded-md border border-line bg-surface-alt px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-16">
        <div className="flex flex-col gap-y-14 lg:gap-y-16">
          {partners.map((partner, i) => {
            const query = mapQueryFor(partner);
            const place = [partner.name, partner.locality]
              .filter(Boolean)
              .join(", ");

            return (
              <div key={partner.slug} className={ROW}>
                <div className={TEXT_HALF}>
                  {/* The masthead rides in the first row and nowhere else. */}
                  {i === 0 ? <Masthead /> : null}
                  <Destination
                    partner={partner}
                    className={i === 0 ? "mt-14 md:mt-16 lg:mt-20" : ""}
                  />
                </div>

                <div className={MAP_HALF}>
                  {/*
                  Render nothing rather than a broken frame. A destination with
                  no queryable name and no override has nothing to ask a map
                  for, so it keeps its text entry and the half stays empty —
                  which reads as the composition it already is.
                */}
                  {query ? (
                    <Reveal variant="fadeIn" delay={0.1}>
                      <MallMap src={embedSrc(query)} place={place} />
                    </Reveal>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/*
        The honest version of "and many more". It says the list will grow
        without claiming it already has, and it is the same sentence the events
        listing uses about dates — one voice for one situation.
      */}
        <Reveal variant="fadeIn">
          <p className="mt-12 max-w-[34rem] text-body leading-[1.85] text-text/75 md:mt-14">
            More destinations are announced as each partnership is confirmed.
          </p>
        </Reveal>
      </div>
    </Container>
  );
}

/**
 * The section head: what this is, and the model in one paragraph.
 *
 * Top left, which is where the reference sets every section head on the page.
 * It is not given a row of its own — see the composition note above — so the
 * first map runs up beside it and the section opens with type and a map rather
 * than with type and 680px of nothing.
 *
 * The paragraph is held to 32rem inside a half that is 680px at 1440, so the
 * measure stays readable and the right of the left half stays empty. That is
 * the same proportion the reference keeps by setting a 694px half in two 337px
 * columns: the text never fills its own half.
 */
function Masthead() {
  return (
    <Stagger>
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span
            aria-hidden
            className="h-px w-9 shrink-0 bg-terracotta md:w-12"
          />
          Where we create
        </p>
      </Reveal>

      <Reveal variant="subtleReveal">
        <h2
          id="mall-partners"
          // Caps and light, because every other section heading on this page
          // is. The reference sets its heads at weight 500; adopting that here
          // alone would make this one section read as a different site, so the
          // weight 500 borrowed from the reference is spent where it belongs —
          // on the destination name below, which is the element the footer
          // locations band actually sets that way.
          className="mt-8 text-[1.75rem] font-light uppercase leading-[1.1] tracking-[-0.02em] md:mt-10 md:text-[2.25rem] lg:text-[2.1rem] xl:text-[2.5rem]"
        >
          {STATEMENT}
        </h2>
      </Reveal>

      <Reveal>
        <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
          The Maison keeps no premises of its own. It partners with a shopping
          centre and brings the studio inside for a run of fixed dates,
          materials included &#8212; so where to find us is a date as much as it
          is a place.
        </p>
      </Reveal>
    </Stagger>
  );
}

/**
 * One destination, set the way the reference's footer locations band sets one.
 *
 * NAME, THEN THE LINES THAT PLACE IT, THEN THE WAY THERE. That is the band's
 * whole anatomy and it is reproduced here with nothing added: no card, no
 * ground, no hairline around it, no mark. Plain type on the page's own green,
 * which is what makes the map beside it the only object in the row.
 *
 * THE NAME IS WEIGHT 500, which is the band's own value, at `lead` rather than
 * its 16px. The band is a footer — three cities at 16/500 with nothing above
 * them to compete. Here the name sits under a 40px heading and is the payload
 * of the section, and at body size it disappeared into the paragraph above it.
 * `lead` is 18px on a phone and 20px from ~860px, one step up and no more: the
 * `h3` token starts at 24px, which turns the entry into a second headline and
 * starts an argument with the `h2` it sits under.
 *
 * The locality keeps the tracked uppercase label this codebase uses for a
 * district under a name, so it cannot be mistaken for the descriptor line
 * below it. Charcoal at /75 on the page surface, comfortably past 4.5:1 — /70
 * is safe on this ground too (4.70), but the entry is the block of type the
 * whole section is built around and the extra headroom costs nothing.
 */
function Destination({
  partner,
  className,
}: {
  partner: MallPartner;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <h3 className="text-lead font-medium leading-[1.3] text-text">
        {partner.name}
      </h3>

      <p className="mt-2 text-fine font-medium uppercase tracking-eyebrow text-text/75">
        {partner.locality}
      </p>

      {/* The centre's own line, as the studio wrote it and no longer. */}
      <p className="mt-4 max-w-[30rem] text-body leading-[1.8] text-text/80">
        {partner.descriptor}
      </p>

      {/*
        The band's third element. Absent rather than disabled when there is no
        link: an entry with nowhere to send you shows no control, which is
        better than one that goes to the wrong door.
      */}
      {partner.locationHref ? (
        <a
          href={partner.locationHref}
          target="_blank"
          rel="noopener noreferrer"
          /*
            THE HIT AREA IS A PSEUDO-ELEMENT, NOT PADDING, which is this
            codebase's idiom — padding here would move the type and re-space an
            entry that is measured against the map beside it. The label is a
            14.4px line box carrying 6px under it for its rule, so the link
            stands about 20px high; `-inset-y-4` takes the target past 50px,
            clear of the 44px minimum. The 24px of margin above leaves 8px
            between the area and the descriptor, so it never swallows text.
          */
          className="group relative mt-6 inline-flex items-center gap-3 text-action font-medium uppercase tracking-eyebrow text-text after:absolute after:inset-x-0 after:-inset-y-4 after:content-['']"
        >
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta group-focus-visible:border-terracotta">
            Get directions
          </span>
          {/*
            The corner arrow, and Charcoal rather than Warm Terracotta: the
            glyph carries meaning — this one leaves the site — and the accent
            measures 3.02:1 on this ground, which is the floor for a graphical
            mark with nothing to spare. The rule under the label is where the
            accent is spent instead, because an underline is decoration sitting
            on type that is already legible.
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
    </Reveal>
  );
}
