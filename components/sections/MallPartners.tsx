import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { VenueMap } from "@/components/sections/VenueMap";
import { RuledLink } from "@/components/ui/Action";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { getMallPartners } from "@/lib/partners";
import { cn } from "@/lib/utils";
import type { MallPartner } from "@/types";

/**
 * The statement, in authored lines. <SectionHead> owns the arrangement now —
 * block from `md`, inline and flowing below it — and its own comment explains
 * why, having been generalised out of this file.
 */
const STATEMENT = ["Creative experiences,", "brought into the heart", "of the community."];

/**
 * The section's real content.
 *
 * A visitor who reads nothing else should come away understanding the model —
 * no fixed address, an agreement with each centre, the studio brought inside
 * for a run of dates — because that model is the thing the client wants
 * understood, by customers and by the next mall alike.
 */
const STANDFIRST =
  "Maison Palettia keeps no fixed address. It partners with established centres — an " +
  "agreement with each one — and brings the studio inside for a run of dates, so a morning " +
  "at the table happens somewhere you were already going.";

/**
 * The one hairline in this section, and the reason it is not `border-line`.
 *
 * `--color-line` is White Rock darkened, drawn for the page ground. This
 * section sits *on* White Rock, where that value is very nearly the ground
 * itself and the rule disappears — which is the same trap as the cream plate
 * this redesign removes, in one pixel instead of four hundred. globals.css
 * already says it: a section on a saturated ground draws its rule from the ink
 * instead. Charcoal at 25% is the weight the redesign settled on for a rule
 * that separates rather than states, so the page has one of these rather than
 * a scale of them.
 *
 * It is decoration and not structure — the destinations are a list, each with
 * its own heading, and a screen reader is told so without it — so it is not
 * held to the 3:1 a meaningful graphical object owes. It is here to say where
 * a measure begins and ends, which is the only job a border has on this site.
 *
 * Spelled out in full as one literal, never assembled: Tailwind's scanner
 * reads source text, so a class built from fragments is simply never
 * generated and fails with no error anywhere.
 */
const RULED_TOP = "border-t border-text/25 pt-7 md:pt-8";

/**
 * Where the Maison creates — the centres it has agreements with, each beside a
 * map of itself.
 *
 * NOT A LOGO WALL, and built so it cannot drift into one. A logo wall answers
 * "who vouches for us"; this answers "how does this business work", which is
 * the question a visitor, a mall's leasing team and a prospective partner all
 * arrive with. So the destination is set as an editorial entry — name, city,
 * one factual line, a way to find it — rather than as a mark in a row of
 * marks, and the section carries no count, no years, no footfall and no
 * "trusted by". There are no statistics here because the studio has supplied
 * none, and a credibility section that invents its own numbers is the opposite
 * of credible.
 *
 * WHAT CHANGED IN THIS PASS.
 *
 * The client asked for maps showing where events happen, so every destination
 * that can be found on one now carries its own — see <VenueMap> for the
 * mechanism, why it is a search rather than a pin, and why it does not load
 * until it is asked for.
 *
 * The ground moved to White Rock, which took the entry's plate with it. The
 * entry used to be a `bg-cream` card, and a White Rock card on a White Rock
 * field is a box nobody can see. Its replacement is the hairline above and the
 * space around, which is how the rest of this page makes hierarchy now — there
 * are no cards left on the homepage.
 *
 * THE MASTHEAD RUNS FULL WIDTH, not down the left of the composition, and that
 * is a deliberate departure from the sketch this section was drawn from.
 * <SectionHead> is the page's one head and it lays itself out on the site's
 * twelve columns; nested inside a five-column cell those twelve columns
 * subdivide the five, and the longest authored line breaks in two — the one
 * thing authored lines exist to prevent. Hand-setting a heading here instead
 * would put a thirteenth size on a page whose whole point this round is that
 * it has one. The head runs across the top; the five-and-seven split starts at
 * the destinations, where the content it describes actually is.
 *
 * ONE PARTNER READS AS ONE PARTNER. The client has confirmed a single
 * agreement, and the composition is a run of rows rather than a grid precisely
 * so that is not a problem: one destination is a full row of the page — text
 * on the left, its map on the right, the rest of the row empty — which is an
 * object in its own right rather than the first of three empty cells. A second
 * and a third extend the run downward, each still beside its own map, so no
 * reader ever has to work out which frame belongs to which name. Adding one is
 * appending to lib/partners.ts — see the note there — and nothing in this file
 * counts, measures or lays out against a number it expects.
 *
 * WHAT IT RENDERS AROUND. Nothing here draws, traces or approximates a
 * partner's identity: a supplied `logo` is drawn and nothing stands in for one
 * that has not arrived — with no mark the name is set as type, which is the
 * honest version of the same thing. `image` is no longer drawn at all, and
 * that is the map's doing rather than an oversight: the destination now has a
 * visual, and a photograph of the same centre beside it would be two pictures
 * competing to be the one. The field stays on {@link MallPartner} for the
 * surfaces that have no map.
 *
 * TODO(client): THE HOMEPAGE NOW SHOWS THREE MALL NAMES AND ONLY ONE OF THEM
 * IS A PARTNERSHIP. Mall of the Emirates and City Centre Mirdif come from the
 * placeholder sessions in lib/workshops.ts, which is flagged in capitals at
 * the top of that file; Times Square Center is the confirmed agreement listed
 * here. A visitor reading the events listing and then this section cannot tell
 * which is which. The long TODO(client) in lib/partners.ts sets out the whole
 * discrepancy and names the fix — pointing the placeholder venues at the
 * confirmed destination — which is a change to the session data and out of
 * this section's scope. Read it before touching either file.
 *
 * Server component. <VenueMap> is the one client island inside it, which is
 * why the map is a file of its own. Awaited in place rather than suspended,
 * for the reason set out in <UpcomingEvents>.
 */
export async function MallPartners() {
  const partners = await getMallPartners();
  // Nothing to say and nothing said. The same contract <CreativeExperiences>
  // and <LocationDiscovery> keep: a section with no content does not render a
  // heading over an empty space.
  if (partners.length === 0) return null;

  return (
    <Section id="mall-partners" ground="cream">
      <SectionHead
        id="mall-partners"
        eyebrow="Where we create"
        title={STATEMENT}
        standfirst={STANDFIRST}
        ground="cream"
      />

      <div className="mt-section-gap">
        <ul className="flex flex-col gap-16 md:gap-20">
          {partners.map((partner) => (
            <Destination key={partner.slug} partner={partner} />
          ))}
        </ul>

        {/*
          The honest version of "and many more". It says the list will grow
          without claiming it already has, and it is the same sentence the
          events listing uses about dates — one voice for one situation.

          It closes the run with the same rule the entries open with, held to
          the same five columns, so the list reads as a list that has ended
          rather than as one that ran out.
        */}
        <div className="mt-16 grid grid-cols-12 gap-x-6 md:mt-20 lg:gap-x-10">
          <Reveal
            variant="fadeIn"
            className={cn("col-span-12 lg:col-span-5", RULED_TOP)}
          >
            <p className="max-w-[30rem] text-fine leading-[1.8] text-text/75">
              More destinations are announced as each partnership is confirmed.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/**
 * One destination: the entry, and the map of it.
 *
 * Five columns of type against seven of map, which is the treatment the large
 * editorial rows on this page use — a compact block at the top of one half and
 * one big thing filling the other. Everything under the text is empty space,
 * and that is the composition rather than a gap in it.
 *
 * THE MAP IS CONDITIONAL ON TWO THINGS, and neither is a style decision.
 *
 * A blank name is not a query: there is nothing to search for, so there is
 * nothing to show. And a partner with no `locationHref` does not get a frame
 * either, which is the less obvious of the two — that field is the only signal
 * in the data that this place has been found on Maps at all. Without it the
 * name is a string nobody has checked, and a frame built from an unchecked
 * string can land anywhere. The entry renders either way; only the map is
 * withheld, and a destination with no map still carries its name, its city and
 * what it is.
 *
 * The name is an `<h3>` whether or not a mark is showing, so the document
 * outline is the same at every stage of the data — and a supplied logo is
 * `alt=""` rather than alt-texted with the name, because the name is set in
 * type directly underneath it and reading it twice helps nobody.
 */
function Destination({ partner }: { partner: MallPartner }) {
  /*
    Name and city, joined two ways. A space for Maps, a comma for the
    announcement. Filtered rather than interpolated so a partner that arrives
    with no locality does not get a trailing comma read out to it.
  */
  const parts = [partner.name, partner.locality].map((part) => part.trim()).filter(Boolean);
  const query = parts.join(" ");
  const label = parts.join(", ");
  const mapped = Boolean(partner.locationHref) && query.length > 0;

  return (
    <li className="grid grid-cols-12 items-start gap-x-6 gap-y-9 lg:gap-x-10">
      <Reveal className={cn("col-span-12 lg:col-span-5", RULED_TOP)}>
        {partner.logo ? (
          // Held in a box and contained rather than sized directly: a partner's
          // mark arrives at whatever proportion it arrives at, and the one
          // thing this must never do is stretch somebody's logo to fit.
          <div className="relative h-8 w-40 md:h-9 md:w-44">
            <Image src={partner.logo.src} alt="" fill className="object-contain object-left" />
          </div>
        ) : (
          // The slot a supplied mark would take, saying the one thing the name
          // alone does not: that this centre is an agreement, not just a place
          // the studio has been.
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
            Mall partner
          </p>
        )}

        <h3 className="mt-4 text-h3 font-medium text-text">{partner.name}</h3>

        {partner.locality ? (
          <p className="mt-2 text-fine text-text/75">{partner.locality}</p>
        ) : null}

        <p className="mt-5 max-w-[30rem] text-body leading-[1.8] text-text/80">
          {partner.descriptor}
        </p>

        {/*
          The only link in this section, and the only thing here that works
          with scripting off — which is why the map's control being inert
          without it is survivable. `external` carries the corner arrow, the
          new tab and the announcement that says so, all from one prop.
        */}
        {partner.locationHref ? (
          <RuledLink
            label="Get directions"
            href={partner.locationHref}
            external
            className="mt-7"
          />
        ) : null}
      </Reveal>

      {mapped ? (
        <Reveal variant="fadeIn" className="col-span-12 lg:col-span-7">
          <VenueMap query={query} label={label} />
        </Reveal>
      ) : null}
    </li>
  );
}
