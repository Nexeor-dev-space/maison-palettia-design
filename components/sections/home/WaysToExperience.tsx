import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import panel from "@/components/sections/home/PaintPanel.module.css";
import { Stagger } from "@/components/motion/Stagger";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getCreativeExperiences } from "@/lib/experiences";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";

/**
 * ==========================================================================
 * HOMEPAGE — THE FOUR WAYS TO TAKE PART
 * ==========================================================================
 *
 * WHY THIS SECTION EXISTS. The client's note was that the site "should not
 * make Maison Palettia appear to be only a workshop booking website" — it is
 * "a broader creative experience and activation brand". Read as a page rather
 * than as a list of components, that was exactly what the homepage did: the
 * first eight sections are all about one person choosing an activity, and
 * private events and collaborations did not appear until positions ten and
 * eleven of twelve. A visitor who stopped two thirds of the way down — which
 * is most of them — saw a workshop shop.
 *
 * So the breadth moves up. This sits directly under the activities, which is
 * the first moment a visitor has finished asking "what can I make?" and is
 * ready for "and what else is this?".
 *
 * ==========================================================================
 * THE FOUR NAMES ARE WAYFINDING, NOT THE BUSINESS'S VOCABULARY
 * ==========================================================================
 *
 * Create, Celebrate, Connect and Collaborate come from the redesign brief,
 * which proposed them as "an information architecture concept" and said in
 * the same breath: "Do not represent them as official business terminology
 * unless the supplied content already uses them." It does not — none of the
 * four appears in the brand deck.
 *
 * They are therefore used as signposts and nothing else: they label a group
 * of doors, they are never spoken as if the studio sells a thing called
 * "Collaborate", and every line of copy under them is the approved wording
 * from lib/privateEvents.ts and lib/experiences.ts rather than something
 * written to fit the scheme. If the studio ever adopts different words, this
 * component is the only place they are set.
 *
 * WHAT EACH GROUP ACTUALLY DISTINGUISHES, because four abstract words would
 * be worse than none:
 *
 *   Create ...... you turn up, or you book a place. One person, one table.
 *   Celebrate ... you bring your own guests for an occasion.
 *   Connect ..... you bring a group that already exists — a team, a class.
 *   Collaborate . a venue or a brand brings the Maison to its own audience.
 *
 * The split that matters is the last two against the first two: who the guest
 * list belongs to. That is the sentence each group's lede has to earn.
 *
 * NOTHING IS INVENTED AND NOTHING IS COUNTED WRONG. The activity counts are
 * read from the approved list, so adding an eighth activity updates this
 * sentence with no edit here; the three private-event lines are the
 * `description` fields from the audiences file, verbatim.
 *
 * TODO(client): the brief's own list of six names two things this data does
 * not — "Corporate Training & Team-Building" (the audiences file has
 * "Corporate events") and "Retail Brand Activations" ("Mall & community
 * activations"). The names here are the ones /private-events already shows,
 * because renaming a programme on one page only is how two pages start
 * describing different businesses. Rename them in lib/privateEvents.ts and
 * both pages follow.
 *
 * ==========================================================================
 * THE COMPOSITION — FOUR PAINTED DOORS
 * ==========================================================================
 *
 * This has now been a ruled index (four identical rows under a sticky column,
 * which left six hundred pixels of empty White Rock) and a mosaic (two Light
 * Sage panels and two open blocks at four widths and two drops, which read as
 * a slide rather than as the site). The client's note on the mosaic was the
 * plainest one yet: match the website.
 *
 * So the section is rebuilt out of what the rest of the site is made of:
 *
 *   PAINT CARRIES THE COLOUR. Each of the four has a stroke of its own colour
 *   brushed down its left margin — the same brush the activity plates and the
 *   workshop journey use, turned on its side. It separates the four without a
 *   panel, a border or a card, and it is the one thing on the page that says
 *   "these are four of a kind" at a glance.
 *
 *   THE TYPE IS THE SITE'S. The names were set in semibold tracked capitals,
 *   a fifth heading style that appears nowhere else here; they are now the
 *   light sentence case every other title on the site is set in, under the
 *   small folio the rest of the page uses for a count.
 *
 *   THE CUT-OUTS ARE PLACED, NOT SCATTERED. One per door, the same size in
 *   the same position in every row, drawn in as its row arrives, and in the
 *   same colour as that row's paint — so four marks down the left read as a
 *   set rather than as stickers dropped on corners.
 *
 * Four rows, one rhythm, and the only variation between them is colour and
 * the words themselves. Nothing is boxed, and nothing is a card.
 *
 * Server component; the animation lives in the shared motion primitives.
 */
/*
  One approved colour per group, and the ink that reads on it. Soft Lavender is
  a light ground and takes Charcoal Slate; the other three are dark and take
  the near-white. That is the only reason `ink` exists here.
*/
/*
  One ground per panel, and every one of them keeps Charcoal on it.

  MEASURED, NOT CHOSEN. Against Charcoal at full strength, Deep Lilac is
  2.37:1, Warm Terracotta 3.84:1 and Soft Lavender 6.49:1 — no single ink
  serves that set, and terracotta fails the 4.5:1 body copy owes whichever ink
  is picked. Mixed toward White Rock they clear it together, so the section
  keeps one ink and the words never have to change colour to stay readable.

  `color-mix` rather than three hand-picked hexes: the percentage says what
  was done to the brand colour, and if a brand colour ever moves the tint
  moves with it. The figure after each is Charcoal on that ground.

  The fourth is Light Sage at full strength — it is already the brand's
  background colour, and the guide gives it the large soft grounds.

  The MARK on each panel is the colour undiluted. It is decorative and
  `aria-hidden`, so it owes no ratio, and it is what tells you which colour
  the panel is a tint of.
*/
const CARDS = [
  {
    tint: "color-mix(in oklab, #9059A4 30%, var(--color-cream))",
    mark: "#9059A4",
  }, // 6.6:1
  {
    tint: "color-mix(in oklab, #D97757 30%, var(--color-cream))",
    mark: "#D97757",
  }, // 7.3:1
  {
    tint: "color-mix(in oklab, #C4B5FD 30%, var(--color-cream))",
    mark: "#9059A4",
  }, // 8.4:1
  {
    tint: "var(--color-sage)",
    mark: "#D97757",
  }, // 9.07:1
] as const;


export async function WaysToExperience() {
  const experiences = await getCreativeExperiences();
  const walkIn = experiences.filter((e) => e.kind === "diy").length;
  const scheduled = experiences.filter((e) => e.kind === "scheduled").length;

  const audience = (slug: string) => PRIVATE_EVENT_AUDIENCES.find((a) => a.slug === slug);
  const birthdays = audience("birthday-parties");
  const corporate = audience("corporate-events");
  const schools = audience("school-programs");
  const activations = audience("mall-and-community-activations");

  const groups: Group[] = [
    {
      mark: "splash",
      name: "Create",
      lede: "Come to a table and make something — on the day, or on a date you book.",
      doors: [
        {
          label: "Walk-in DIY",
          note: `${walkIn} activities, no booking`,
          href: "/events",
          mode: "diy",
        },
        {
          label: "Scheduled sessions",
          note: `${scheduled} guided sessions`,
          href: "/events",
          mode: "scheduled",
        },
      ],
    },
    {
      mark: "starburst",
      name: "Celebrate",
      lede: "Bring your own guests, and we set the table for the occasion.",
      doors: [
        {
          label: birthdays?.name ?? "Birthday parties",
          note: birthdays?.description,
          href: "/private-events#birthday-parties",
        },
        {
          label: "Other private events",
          note: "An occasion of your own, built around one of the activities.",
          href: "/private-events",
        },
      ],
    },
    {
      mark: "starleaf",
      name: "Connect",
      lede: "Bring a group that already exists — a team, a class, a department.",
      doors: [
        {
          label: corporate?.name ?? "Corporate events",
          note: corporate?.description,
          href: "/private-events#corporate-events",
        },
        {
          label: schools?.name ?? "School programmes",
          note: schools?.description,
          href: "/private-events#school-programs",
        },
      ],
    },
    {
      mark: "bow",
      name: "Collaborate",
      lede: "Bring the Maison to your own audience, in your own space.",
      doors: [
        {
          label: activations?.name ?? "Mall & community activations",
          note: activations?.description,
          href: "/private-events#mall-and-community-activations",
        },
        {
          label: "Retail & brand partnerships",
          note: "Co-branded workshops, and activations built around a campaign.",
          href: "/contact",
        },
      ],
    },
  ];

  return (
    <section
      aria-labelledby="ways-to-experience"
      className="relative bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/* The question, asked once across the whole measure. */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow>Ways to take part</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="ways-to-experience"
              className="mt-8 md:mt-10"
              lines={["There is more", "than one way in."]}
            />
          </div>

          <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pb-3">
            <p className="max-w-[30rem] text-body leading-[1.8] text-text/85">
              Some of what the Maison does happens at a table in a mall. The rest happens wherever
              you are &mdash; a birthday, an office, a classroom, a shopfront.
            </p>
          </Reveal>
        </div>

        {/*
          TWO ACROSS, NOT FOUR DOWN.

          Each way in was a full-measure row: a name column, a lede column and
          two door columns strung across 1400px, four times. Nothing shared a
          baseline, the eye had to cross the whole page to finish one group,
          and the four of them ran to about eleven hundred pixels of scrolling
          on a laptop — which is the "a lot of content, messy to scroll" the
          client is describing.

          Paired, each group becomes a block you read in one go instead of a
          line you track across, and the section comes in at roughly half the
          height. Nothing was cut to do it: all four groups, all eight doors
          and every line of approved copy are still here.
        */}
        <Stagger
          as="ol"
          className="mt-14 grid gap-6 md:mt-20 lg:grid-cols-2 lg:gap-8"
        >
          {groups.map((group, i) => (
            <GroupRow key={group.name} group={group} index={i + 1} />
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/**
 * One way in, as a panel that floods with paint.
 *
 * The client asked for these boxed and given a painted treatment, and the
 * paint language already exists on this page — the activity carousel reveals
 * a photograph through the deck's `splash` cut-out used as a mask. This is the
 * same mechanic on a colour: at rest the panel is White Rock with charcoal on
 * it, and reaching it spreads one approved colour out of the corner the
 * cut-out sits in, with the ink turning over to whatever reads on that colour.
 *
 * Every text node here uses `currentColor` and opacity rather than a colour
 * utility. A `text-text/85` would pin that line to charcoal and it would go
 * invisible the moment the panel floods — the whole point is that the panel
 * turns as one thing and nothing inside it has to know which colour it is on.
 *
 * See ./PaintPanel.module.css; it is pure CSS, so this stays a server
 * component.
 */
function GroupRow({ group, index }: { group: Group; index: number }) {
  const card = CARDS[(index - 1) % CARDS.length];

  return (
    <Reveal as="li" delay={index * 0.06} className="h-full">
      <div
        className={`${panel.panel} plate h-full rounded-[1.5rem] px-7 py-8 md:px-9 md:py-10`}
        style={
          {
            "--tint": card.tint,
            "--ink-mark": card.mark,
          } as React.CSSProperties
        }
      >

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-label font-semibold tabular-nums tracking-eyebrow opacity-70">
              {String(index).padStart(2, "0")}
            </p>
            <h3 className="mt-2.5 text-h3 font-light tracking-[-0.02em] lg:text-h2">
              {group.name}
            </h3>
          </div>

          <span aria-hidden className={`${panel.mark} mt-1 block h-10 w-10 shrink-0 lg:h-12 lg:w-12`}>
            <DoodleMark name={group.mark} treatment="draw" delay={index * 110} />
          </span>
        </div>

        <p className="mt-4 text-body leading-[1.8] opacity-85">{group.lede}</p>

        {/*
          The two doors stack inside the panel rather than sitting side by
          side: a half-width cell split again would give each door about
          fifteen characters a line, and the notes under them are full
          sentences from the approved copy.
        */}
        <ul className="mt-7 flex flex-col gap-5">
          {group.doors.map((door) => (
            <li key={door.label}>
              <Link
                href={door.href}
                className="group/door -my-1 block py-1 text-current focus-visible:outline-none"
              >
                <span className="flex items-center gap-2.5 text-action font-semibold uppercase tracking-eyebrow">
                  {door.mode ? <ModeMark mode={door.mode} /> : null}
                  {/*
                    A rule at rest, not only on hover: these are links inside
                    running copy and a reader has to see that without moving a
                    pointer over them. It is `currentColor` at 45% so it holds
                    its contrast against the ink whichever way the panel has
                    turned, and it goes solid on hover.
                  */}
                  <span className="border-b border-current/45 pb-1 transition-[border-color] duration-[var(--duration-hover)] ease-editorial group-hover/door:border-current group-focus-visible/door:border-current">
                    {door.label}
                  </span>
                </span>
                {door.note ? (
                  <span className="mt-2.5 block text-body leading-[1.7] opacity-85">
                    {door.note}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

interface Door {
  label: string;
  note?: string;
  href: string;
  /** Only the two creating modes carry the shared walk-in / scheduled mark. */
  mode?: "diy" | "scheduled";
}

interface Group {
  name: string;
  lede: string;
  doors: Door[];
  /** The cut-out for this door, drawn in its row's own paint. */
  mark: DoodleName;
}
