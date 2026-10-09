
import { Reveal } from "@/components/motion/Reveal";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";

import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { WaysTrail } from "@/components/sections/home/WaysTrail";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { getCreativeExperiences } from "@/lib/experiences";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";
import { WAYS_SPOTS } from "@/components/sections/home/homeSpots";

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
/*
  ==========================================================================
  EACH WAY IN NOW OPENS WITH A PHOTOGRAPH
  ==========================================================================

  The client's note was that every other section on the page is visual and
  this one is not — and it was right. Four tinted panels of running copy is
  the most text-dense thing on the homepage, sitting between a photographic
  carousel above it and a photographic split below, and a reader scrolling
  past met a wall of words exactly where the page should have been showing
  them what the four ways look like.

  So each panel opens with a picture of the thing it is describing, and the
  copy follows underneath. Nothing was cut: the numeral, the name, the lede
  and both doors are all still here, they simply stop being the first thing.

  THE PICTURES ARE THE STUDIO'S OWN AND ALREADY ON THE SITE. Create takes a
  ceramic table, Celebrate the glitter keepsakes from the birthday page,
  Connect the community table the corporate rows already use, and Collaborate
  the National Day cards from a real activation. No stock, and nothing chosen
  that the Maison has not actually run.

  `alt=""`: each one sits directly above the name of its own group, so a
  screen reader is about to be told what it is. Describing it twice is noise.
*/
/*
  THE FOUR TINTS ARE NAMED NOW, so the CMS can pick one per group
  (`waysToTakePart.groups[].tint`). The names are the brand colours each
  panel is a tint of; the order is the order the launch page deals them.
*/
export type WaysTint = "lilac" | "terracotta" | "lavender" | "sage";
const TINT_ORDER: readonly WaysTint[] = ["lilac", "terracotta", "lavender", "sage"];

const CARDS = [
  {
    tint: "color-mix(in oklab, #9059A4 30%, var(--color-cream))",
    mark: "#9059A4",
    trail: "coral" as const,
    photo: "/images/experiences/CERAMIC_PAINTING.jpg",
  }, // 6.6:1
  {
    tint: "color-mix(in oklab, #D97757 30%, var(--color-cream))",
    mark: "#D97757",
    trail: "starleaf" as const,
    photo: "/images/events/glitter-keepsakes.jpg",
  }, // 7.3:1
  {
    tint: "color-mix(in oklab, #C4B5FD 30%, var(--color-cream))",
    mark: "#9059A4",
    trail: "bow" as const,
    photo: "/images/experience/community-table.jpg",
  }, // 8.4:1
  {
    tint: "var(--color-sage)",
    mark: "#D97757",
    trail: "zigzag" as const,
    photo: "/images/events/national-day-cards.jpg",
  }, // 9.07:1
] as const;

/*
  WHAT THE CMS SUPPLIES (the `waysToTakePart` block,
  components/blocks/WaysToTakePart.tsx): the eyebrow, the heading, the lead
  and the groups — each group's name, lede, photograph, tint and doors. Left
  out, each falls back to the launch wording below; the marks, the trail
  and the tint recipes stay here.
*/
export interface WaysGroup {
  name: string;
  lede: string;
  /** The cut-out for this way in; by position when absent. */
  mark?: DoodleName;
  /** `undefined` keeps the launch photograph for this position; `null` shows none. */
  photo?: string | null;
  tint?: WaysTint;
  doors: Door[];
}

export async function WaysToExperience({
  eyebrow = "Ways to take part",
  lines = ["There Is More", "Than One Way In."],
  lead = "Maison Palettia is a place to make, gather and create \u2014 whether you\u2019re joining us at the Maison or bringing the experience to your own space.",
  groups: given,
}: {
  eyebrow?: string | null;
  lines?: readonly string[] | null;
  lead?: string | null;
  groups?: WaysGroup[];
} = {}) {
  const groups = given ?? (await launchGroups());

  return (
    <section
      aria-labelledby="ways-to-experience"
      /* `overflow-x-clip`, not `hidden`: `hidden` would make this a scroll
         container and a scroll container is what stops <DoodleMark>'s draw
         ever filling for a mark inside it. The x-axis only, so the page still
         scrolls normally — the same rule every other section on this site
         that moves something sideways follows. */
      className="relative isolate overflow-x-clip bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      {/* The section's doodles, on the section itself so they can use its top
          and bottom padding. The trail draws its own marks down the middle.
          See homeSpots.ts. */}
      <SectionShapes plan={WAYS_SPOTS} />
      <Container>
        {/* The question, asked once across the whole measure. */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            {eyebrow ? (
              <Reveal>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
            ) : null}
            <DisplayHeading
              id="ways-to-experience"
              className="mt-8 md:mt-10"
              lines={lines ?? []}
            />
          </div>

          <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pb-3">
            {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
            {lead ? <p className="text-lead text-text/85">{lead}</p> : null}
          </Reveal>
        </div>

        {/*
          ==================================================================
          A TRAIL, NOT A ROW OF FOUR — the client's ask for this section
          ==================================================================

          It has now been three shapes. Four full-measure rows, which was the
          "messy to scroll" the client first called out; then four cards
          across, which fixed the height and made the section a grid of
          articles; and now a path with the four ways hanging off it, which is
          what the client asked for in so many words: "each card comes within
          a path", "the path colours fill when you scroll".

          NOTHING WAS CUT TO DO IT. All four groups, all eight doors, every
          photograph and every line of approved copy are the ones that were
          here — the same `groups` array below feeds it, and the tints are the
          measured ones in CARDS with their ratios still recorded beside them.
          What changed is the arrangement and the way it arrives.

          See <WaysTrail> for how the path stays right at every width without
          measuring the DOM.
        */}

        <WaysTrail
          items={groups.map((group, i) => {
            const at = group.tint ? TINT_ORDER.indexOf(group.tint) : -1;
            const card = CARDS[(at >= 0 ? at : i) % CARDS.length];
            return {
              name: group.name,
              lede: group.lede,
              doors: group.doors.map((door) => ({
                label: door.label,
                href: door.href,
                mode: door.mode,
              })),
              mark: group.mark ?? MARKS[i % MARKS.length],
              /* A SECOND, SMALLER SHAPE per way in — it is the node on the
                 trail and the mark at the foot of the text box, so the line
                 and the card are marked with the same cut-out.

                 ALL FOUR ARE "LOOSE" SHAPES, and that is not a preference.
                 The icon set splits into loose cut-outs and SLABS — a shape
                 sitting on a coloured tile — and a slab used as a node reads
                 as a small cropped square pinned to the line rather than as a
                 mark. See WEIGHT in sections/hero/doodles.ts for which is
                 which; coral, starleaf, bow and zigzag are loose. */
              trailMark: card.trail,
              tint: card.tint,
              paint: card.mark,
              photo: group.photo === undefined ? CARDS[i % CARDS.length].photo : group.photo,
            };
          })}
        />
      </Container>
    </section>
  );
}

export interface Door {
  label: string;
  note?: string;
  href: string;
  /** Only the two creating modes carry the shared walk-in / scheduled mark. */
  mode?: "diy" | "scheduled";
}

/** Each way in's cut-out, by position — the order the launch page set them. */
const MARKS: readonly DoodleName[] = ["splash", "starburst", "starleaf", "bow"];

/** The four groups as the launch page set them, with the live activity counts. */
async function launchGroups(): Promise<WaysGroup[]> {
  const experiences = await getCreativeExperiences();
  const walkIn = experiences.filter((e) => e.kind === "diy").length;
  const scheduled = experiences.filter((e) => e.kind === "scheduled").length;

  const audience = (slug: string) => PRIVATE_EVENT_AUDIENCES.find((a) => a.slug === slug);
  const birthdays = audience("birthday-parties");
  const corporate = audience("corporate-events");
  const schools = audience("school-programs");
  const activations = audience("mall-and-community-activations");

  return [
    {
      mark: "splash",
      name: "Create",
      lede:
        "Pick your project, pick your colours, and make something of your own. Drop in when you feel like creating or book a session for a little more time at the table.",
      doors: [
        /* EACH DOOR LANDS ON ITS OWN HALF OF /events, not on the top of the
           page. Both pointed at the bare listing, so the two labels the card
           works to tell apart — turn up, or book a seat — delivered a visitor
           to the identical place and left them to find the difference again.
           `#walk-in` and `#scheduled` are the two sections' own anchors. */
        {
          label: "Create Anytime",
          note: `${walkIn} activities, no booking`,
          href: "/events#create-anytime",
          mode: "diy",
        },
        {
          label: "Create Together",
          note: `${scheduled} guided sessions`,
          href: "/events#scheduled",
          mode: "scheduled",
        },
      ],
    },
    {
      mark: "starburst",
      name: "Celebrate",
      lede:
        "Make your next celebration a little more hands-on. Bring your people, and we\u2019ll bring the creative setup, materials and activities.",
      /*
        A PROGRAMME'S OWN PAGE, NOT AN ANCHOR ON THE OVERVIEW — and this was a real
        bug, not a tidy-up. The overview lays the four programmes out as a GRID:
        one column on a phone, two from `sm`, FOUR from `lg`. Every card in a row
        shares a `top`, so `#corporate-events` and `#birthday-parties` scroll to the
        same pixel and the visitor lands looking at the first card in the row.

        Measured on /private-events#corporate-events:

          1440 (4 across) ... all four anchors at y1153 ... lands on birthday
           900 (2 across) ... birthday+corporate at 1327 ... lands on birthday
           390 (1 column) ... all four distinct ............ lands on corporate

        Which is exactly the "sometimes" in the report: it is wrong on a desktop and
        a tablet and right on a phone. No amount of `scroll-mt` fixes it, because
        the two elements genuinely occupy the same y.

        Each programme has had its own route at /private-events/[slug] since the
        detail pages were built — `generateStaticParams` covers all four — so the
        link goes there. The note in <PrivateEventsMenu> anticipated exactly this:
        "when the routes exist this becomes one href per programme".
      */
      doors: [
        {
          label: birthdays?.name ?? "Birthday parties",
          note: birthdays?.description,
          href: "/private-events/birthday-parties",
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
      lede:
        "Good things happen around a table. Bring your team, class or community together for a creative experience designed to get people making, talking and connecting.",
      doors: [
        {
          label: corporate?.name ?? "Corporate events",
          note: corporate?.description,
          href: "/private-events/corporate-events",
        },
        {
          label: schools?.name ?? "School programmes",
          note: schools?.description,
          href: "/private-events/school-programs",
        },
      ],
    },
    {
      mark: "bow",
      name: "Collaborate",
      lede:
        "Take the Maison beyond our walls. We work with malls, brands and communities to create workshops, activations and creative experiences made for their audience and space.",
      doors: [
        {
          label: activations?.name ?? "Mall & community activations",
          note: activations?.description,
          href: "/private-events/mall-and-community-activations",
        },
        {
          label: "Retail & brand partnerships",
          note: "Co-branded workshops, and activations built around a campaign.",
          href: "/contact",
        },
      ],
    },
  ];
}
