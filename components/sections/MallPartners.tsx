import { LocationMap } from "@/components/sections/LocationMap";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { getCreativeExperiences, type CreativeExperience } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";

/*
 * The two column labels, set exactly as the section's own eyebrow above them
 * ("Where we create") — same size, same weight, same tracking, same ink.
 * They do the same job at a different level, and a label that is one step
 * smaller and one step fainter than the one it sits under reads as a mistake
 * rather than a hierarchy.
 */
const TERM = "text-action font-medium uppercase tracking-eyebrow text-text";

/**
 * The statement — the client's own words, and short enough to need no help.
 *
 * It replaced a three-line one that had to be set two steps smaller than the
 * column wanted just to keep its longest line from breaking in the wrong
 * place. Four words hold one line at every width, which is why there is no
 * authored-line array here any more and why the type can be the size a section
 * heading should be.
 */
const STATEMENT = "Meet us at the mall.";

/**
 * Where the Maison creates — the centres it works inside, and the map to one.
 *
 * ONE LOCATION OBJECT, NOT TWO. This carried a partner plate — mark, name,
 * city, a line, a link — above a map that then captioned itself with the same
 * name, the same city and a second link to the same place. With one confirmed
 * centre that is the whole section said twice, and it is precisely the
 * `[MAP CARD][LOCATION CARD]` arrangement the brief asks this not to be. The
 * map is the destination now: the plate is gone, its descriptor moved into the
 * caption, and there is one way to open the location rather than two competing
 * for the same press.
 *
 * SO THE SPREAD IS TWO ARGUMENTS, NOT AN ARGUMENT AND AN OBJECT. The left says
 * how the business works; the right says what actually happens inside the
 * mall, which is the thing a reader must not conclude is an address. Then the
 * map, at the full measure, because a map you cannot read a street from is
 * decoration.
 *
 * NOT A LOGO WALL, and built so it cannot drift into one. A logo wall answers
 * "who vouches for us"; this answers "where does this happen and how does it
 * work". There is no count, no years, no footfall and no "trusted by" — no
 * statistics at all, because the studio has supplied none and a credibility
 * section that invents its own numbers is the opposite of credible.
 *
 * ONE PARTNER READS AS ONE PARTNER. The client has confirmed a single
 * agreement. Nothing here counts or lays out against a number it expects: a
 * second confirmed centre is one append to lib/partners.ts, and <LocationMap>
 * grows to a pair of plates on its own.
 *
 * Server component. Awaited in place rather than suspended, for the reason set
 * out in <UpcomingEvents>.
 */
export async function MallPartners() {
  const [partners, experiences] = await Promise.all([
    getMallPartners(),
    getCreativeExperiences(),
  ]);

  // Nothing to say and nothing said. The same contract <CreativeExperiences>
  // and <LocationDiscovery> keep: a section with no content does not render a
  // heading over an empty space.
  if (partners.length === 0) return null;

  return (
    <Container
      as="section"
      aria-labelledby="mall-partners"
      className="py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-12 lg:gap-x-12">
        <Masthead />
        <div className="col-span-12 lg:col-span-5 lg:col-start-8">
          <Reveal variant="fadeIn" delay={0.1}>
            <InRealPlaces experiences={experiences} />
          </Reveal>
        </div>
      </div>

      {/*
        The ground itself, closing the section rather than opening one of its
        own — see the note at the top of <LocationMap> for why the map is not a
        section. It is the last thing in the "where" argument and the widest
        thing in it: the spread above says how the business works and what
        happens inside, and this is the street it is on.
      */}
      <LocationMap partners={partners} className="mt-16 md:mt-20 lg:mt-24" />

      {/*
        The honest version of "and many more". It says the list will grow
        without claiming it already has, and it is the same sentence the events
        listing uses about dates — one voice for one situation.
      */}
      <Reveal variant="fadeIn">
        <p className="mt-8 text-body leading-[1.85] text-text/75 md:mt-10">
          More destinations are announced as each partnership is confirmed.
        </p>
      </Reveal>
    </Container>
  );
}

/**
 * The left half: what this is, and where to find it.
 *
 * Three lines and no more. The client asked for this not to become a corporate
 * locations explanation, and the model — no fixed address, an agreement with
 * each centre — is now carried by the map and its caption rather than argued
 * for in a paragraph above them.
 */
function Masthead() {
  return (
    <div className="col-span-12 lg:col-span-6">
      <Stagger>
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Where we create
          </p>
        </Reveal>

        <Reveal variant="subtleReveal">
          <h2
            id="mall-partners"
            // Caps, because every other section heading on this page is — the
            // listing, the strands, the teaser, the quotes, the invitation. A
            // sentence-case heading here would read as a different site.
            className="mt-8 text-[1.75rem] font-light uppercase leading-[1.1] tracking-[-0.02em] md:mt-10 md:text-[2.25rem] lg:text-[2.1rem] xl:text-[2.5rem]"
          >
            {STATEMENT}
          </h2>
        </Reveal>

        <Reveal>
          <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
            We bring hands-on creative experiences to the places you already love to visit. Find
            Maison Palettia at our partner locations and come create with us.
          </p>
        </Reveal>
      </Stagger>
    </div>
  );
}

/**
 * What actually happens inside the mall.
 *
 * THE ONE THING THIS SECTION HAS TO STOP A READER CONCLUDING is that the mall
 * is an address — an office, somewhere the business is registered. It is where
 * the making happens, and two short lists of the studio's own activities say
 * that faster than a paragraph about it could.
 *
 * DELIBERATELY SECONDARY, AND NOT A SECOND MENU. Names only: no photographs,
 * no descriptions, no link per entry. <CreativeExperiences> directly above is
 * the menu and gives each activity a picture and a line; repeating any of that
 * here would be the same section twice with the second one worse. What this
 * adds is the split — which of them you walk in and do, and which you book a
 * date for — read off the same `kind` the menu reads, so the two can never
 * disagree about which is which.
 */
function InRealPlaces({ experiences }: { experiences: CreativeExperience[] }) {
  const diy = experiences.filter((x) => x.kind === "diy");
  const scheduled = experiences.filter((x) => x.kind === "scheduled");
  if (diy.length === 0 && scheduled.length === 0) return null;

  return (
    <div className="border-t border-line pt-8 lg:border-t-0 lg:pt-0">
      <p className="max-w-[30rem] text-lead font-medium leading-[1.4] text-text">
        Creative experiences, in real places.
      </p>
      <p className="mt-4 max-w-[30rem] text-body leading-[1.85] text-text/75">
        From walk-in activities to sessions you book online, the Maison brings making into the
        heart of the mall.
      </p>

      {/*
        A grid rather than a flex row so the two lists start level. The labels
        are not the same length — "Scheduled · Book online" needs about a third
        more room than "DIY · Walk in" — and in the band just above `xs`, where
        the columns first sit side by side, the longer one turns to two lines
        and the list under it used to drop 14px below its neighbour. Subgrid
        puts both labels in one row and both lists in the next, so a label that
        wraps lengthens that row for both columns instead of only its own.
        Where subgrid is missing this degrades to the old behaviour.
      */}
      <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 xs:grid-cols-2 xs:grid-rows-[auto_auto] lg:gap-x-12">
        <ActivityList label="DIY · Walk in" items={diy} />
        <ActivityList label="Scheduled · Book online" items={scheduled} />
      </dl>
    </div>
  );
}

/** One kind of thing, named and nothing more. */
function ActivityList({ label, items }: { label: string; items: CreativeExperience[] }) {
  if (items.length === 0) return null;

  return (
    <div className="min-w-0 xs:row-span-2 xs:grid xs:grid-rows-subgrid">
      <dt className={TERM}>{label}</dt>
      <dd>
        <ul className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <li
              key={item.slug}
              /*
                A wrapping flex row rather than a run of text, so the name and
                the flag each turn as a whole. At body size "Glass painting —
                Coming soon" outruns its column, and as plain text the only
                break points were inside it: it stranded "soon" on its own
                line, and pinning the flag together only moved the damage into
                the name ("Glass" / "painting — Coming soon"). As two flex
                items the turn lands between them. A name long enough to need
                it can still break internally, which nowrap would have stopped.
              */
              className="flex flex-wrap items-baseline gap-x-1.5 text-body leading-[1.6] text-text"
            >
              <span>{item.name}</span>
              {/*
                The studio's own flag, shown verbatim and never invented — see
                lib/experiences.ts. Held at /75 rather than fainter: the name is
                body size but still under 24px, so it owes the full 4.5:1 on
                this ground and anything below /75 stops clearing it.
              */}
              {item.status ? (
                <span className="whitespace-nowrap text-text/75">&#8212; {item.status}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
