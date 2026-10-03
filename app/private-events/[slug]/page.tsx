import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { ActivityPlate } from "@/components/private-events/ActivityPlate";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getCreativeExperiences } from "@/lib/experiences";
import {
  PRIVATE_EVENT_AUDIENCES,
  PRIVATE_EVENT_ENQUIRY_HREF,
  PRIVATE_EVENT_STEPS,
  type PrivateEventAudience,
} from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * ONE PAGE PER PROGRAMME — and what it is allowed to say
 * ==========================================================================
 *
 * The four programmes had one anchor each on /private-events. The client
 * asked for a page each, so this is that page, generated for all four.
 *
 * ==========================================================================
 * WHAT IS UNIQUE PER PAGE IS ONE SENTENCE, AND THAT IS NOT AN OVERSIGHT
 * ==========================================================================
 *
 * lib/privateEvents.ts holds a name, one line and (for three of the four) a
 * photograph. That is the whole of the approved material, and the file is
 * explicit about why there is no more: "invent no prices, no packages, no
 * guest counts, no venues, no guaranteed services, no corporate clients and
 * no testimonials", and the signed proposal says the corporate and school
 * pages get their content "when ready".
 *
 * So each page is its programme's own sentence and its own colour, carried by
 * material that is approved and shared: the studio's real activity list from
 * lib/experiences.ts, the client's own three steps, and the one enquiry flow.
 * There is no pricing block, no "up to N guests", no sample schedule and no
 * quote — not blank ones either, because a component built to hold a number
 * is a component that will eventually be given an invented one. That is this
 * project's own rule and it is the reason these pages look the way they do.
 *
 * TODO(client): a paragraph per programme — what a session actually involves
 * and who it suits — turns the lede into a real opening with no other change.
 *
 * ==========================================================================
 * THE PHOTOGRAPHS ARE STAND-INS AND NOTHING HERE CLAIMS OTHERWISE
 * ==========================================================================
 *
 * Nothing in the project photographs a birthday, a company gathering or a
 * school group. The three images are the studio's own frames whose CONTENTS
 * come closest, their alt text describes what is in the frame, and no caption
 * on this page asserts the occasion. The fourth programme has no photograph
 * at all and takes its brand cut-out instead, which claims nothing.
 */

/*
  THE MASTHEAD'S PAIRING — and the only tone this page still has.

  ==========================================================================
  THERE WAS ONE PER PROGRAMME AND THERE IS NO LONGER A SURFACE FOR IT
  ==========================================================================

  `PAGE_TONES` gave each of the four programmes a masthead ground, the ink
  that survived on it, two mark colours and a button tone: lavender for the
  birthdays, charcoal for the corporate page, sage for the schools, lilac for
  the activations. Every one of those four fields went when the client asked
  for all four pages to open on the site's own paper, and the ink, eyebrow and
  button went with them — written out in <Masthead> because on Light Sage
  there is one right answer for each and no reason to look it up.

  What was left of the tone was a single mark over the picture. The client has
  now asked this opening to read like /private-events', which draws that mark
  in Terracotta, so it is pinned there too — see the note beside the four of
  them. Nothing read the table after that, so it is gone rather than sitting
  here looking load-bearing.

  THE COLOURS WERE NEVER FREE ANYWAY, which is worth knowing before anyone
  reinstates it: on Light Sage only Deep Lilac (3.95:1) and Terracotta (2.52)
  can be seen at a cut-out's opacity. Soft Lavender and White Rock — the pair
  the corporate and activations tones carried — measure 1.3 and 1.1 on it and
  would have been invisible marks, which is why the ground shapes were already
  pinned to the light pairing while the table still existed.

  The programme's colour is not lost: /private-events still assigns one per
  card in its own AUDIENCE_TONES, and that is the object to edit.
*/
interface PageTone {
  /** The masthead ground. */
  field: string;
  /** Which pairing <Eyebrow> and <DisplayHeading> resolve against. */
  ground: "light" | "lilac" | "dark";
  /** Body ink on the masthead. */
  ink: string;
  /** The supporting line, one step down. */
  muted: string;
  /** The two cut-out colours that can be seen on this ground. */
  marks: readonly [string, string];
  /** The one button tone that reads on it. */
  button: "lilac" | "cream" | "sage" | "deep";
}

/* Only `marks` is read from it, by <mastheadShapes>. */
const LIGHT_TONE: PageTone = {
  field: "bg-surface",
  ground: "light",
  ink: "text-text",
  muted: "text-text/80",
  marks: [INK.lilac, INK.terracotta],
  button: "lilac",
};

/*
  The three steps' papers, in the order they are read.

  Light Sage is the ground they sit on now, so it is not among them, and
  White Rock is 1.03:1 against it — which is the case `plate` exists for and
  it already carries one. The ink is the one that clears each: Charcoal on
  the two light papers, and the near-white on Deep Lilac at 4.90:1, at full
  strength because that pairing has no headroom for an alpha.
*/
const STEP_STOCK: readonly {
  field: string;
  ink: string;
  muted: string;
  numeral: string;
  mark: DoodleName;
  markInk: string;
}[] = [
  {
    field: "bg-lavender",
    ink: "text-text",
    muted: "text-text/85",
    numeral: "text-text/45",
    mark: "bow",
    markInk: INK.lilac,
  },
  {
    field: "bg-cream",
    ink: "text-text",
    muted: "text-text/85",
    numeral: "text-text/45",
    mark: "starburst",
    markInk: INK.terracotta,
  },
  {
    field: "bg-primary",
    ink: "text-surface",
    muted: "text-surface",
    numeral: "text-surface/55",
    mark: "splash",
    markInk: INK.whiteRock,
  },
];

/*
  The masthead's ground marks.

  ==========================================================================
  TWO, LOW AND LEFT — THE ARRANGEMENT /private-events OPENS ON
  ==========================================================================

  There were seven, spread across the whole band: two at the right edge, one
  at each top corner, three along the foot. The client has pointed at the
  opening of /private-events and asked for this one to read like it, and the
  difference between the two was never the photograph — it was this. Seven
  pale cut-outs at 16–24% over Light Sage are not a decorated page, they are
  specks on it, which is the note this file has already taken twice ("no wavy
  lines, nothing scattered").

  So this is `INTRO_SHAPES` from that page, to the percent: a lilac splash cut
  by the section's own bottom-left corner, and a terracotta starburst a third
  of the way along the foot. A mark that breaks an edge is placed; the same
  mark in open space is a smudge — and the right half of the band is a
  photograph, where a ground mark is a mark nobody sees.

  The tone still chooses the two inks, so a programme whose pair is Deep Lilac
  and Terracotta gets exactly what /private-events draws; `LIGHT_TONE` is what
  the masthead passes and that is the pair it holds.
*/
function mastheadShapes(tone: PageTone): readonly ShapePlan[] {
  const [a, b] = tone.marks;
  return [
    {
      name: "splash",
      color: a,
      width: "13%",
      left: "-3%",
      bottom: "-8%",
      rotate: -12,
      drift: 22,
      opacity: 0.22,
      float: 13,
      desktopOnly: true,
    },
    {
      name: "starburst",
      color: b,
      width: "6%",
      left: "33%",
      bottom: "8%",
      rotate: 12,
      drift: 18,
      opacity: 0.22,
      float: 11,
      floatDelay: 0.6,
      desktopOnly: true,
    },
  ];
}

function audienceFor(slug: string): PrivateEventAudience | undefined {
  return PRIVATE_EVENT_AUDIENCES.find((a) => a.slug === slug);
}

export function generateStaticParams() {
  return PRIVATE_EVENT_AUDIENCES.map((audience) => ({ slug: audience.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const audience = audienceFor(slug);
  if (!audience) {
    return buildMetadata({
      title: "Private events",
      description: "Private creative sessions at Maison Palettia.",
      path: "/private-events",
    });
  }

  return buildMetadata({
    title: audience.name,
    description: audience.description,
    path: `/private-events/${audience.slug}`,
    image: audience.image?.src,
  });
}

export default async function PrivateEventProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const audience = audienceFor(slug);
  if (!audience) notFound();

  const experiences = await getCreativeExperiences();

  return (
    <>
      <Masthead audience={audience} />
      <Activities experiences={experiences} />
      <HowItWorks />
      <Enquiry />
    </>
  );
}

/**
 * The masthead: the programme's name, its one approved line, and its picture.
 *
 * `overflow-clip` rather than `hidden` — `hidden` makes this a scroll
 * container, and a scroll container is what stops every <DoodleMark> inside it
 * ever filling, because the view timeline it draws on resolves against the
 * nearest scrollport and reports as permanently out of view.
 *
 * NO `tone`. It took one, for the single mark over the picture that carried
 * the programme's colour; the band is pinned to the pairing /private-events
 * opens on now, and every other thing on it was already `LIGHT_TONE`. That
 * mark was the last reader of `PAGE_TONES` — see the note above `PageTone`
 * for what went with it and why reinstating it is not a one-line change.
 */
function Masthead({ audience }: { audience: PrivateEventAudience }) {
  return (
    <section
      aria-labelledby="programme-title"
      /*
        ==================================================================
        THE SAME OPENING AS /about, ON THE PAGE'S OWN PAPER
        ==================================================================

        Each of these four pages opened on its programme's colour — a
        lavender, sage, charcoal or lilac field the width of the window —
        with the photograph in a rounded plate beside the words. The client
        has asked for the opening of all four to read like /about's: the
        pale green the whole site is printed on, and the picture cut out
        rather than framed.

        WHICH TAKES THE INK WITH IT. The tone's ink, eyebrow pairing and
        button were chosen against a coloured field; on Light Sage taken
        30% into white they are all wrong at once — `text-surface` on it is
        1.1:1. So the masthead is pinned to the light pairing and the
        programme's colour stays where it still works: the marks around the
        picture, and every section below.
      */
      className="relative isolate overflow-clip bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={mastheadShapes(LIGHT_TONE)} />

      {/*
        THE BAND IS AS DEEP AS WHAT IS IN IT, and what is in it has changed.

        It carried 9.5rem over the words and 9rem under them around a 4:5
        picture — a 936px opening for five short lines and a button, and the
        client's word for it was empty. The answer then was to spend less
        padding around the same oversized picture: 3.25/4.25/5.5rem, on the
        Container rather than the section.

        The picture is now the one /private-events opens on, which is 220px
        shorter, so the padding can be that section's too — `py-section-lg`
        over and under, on the SECTION, which is where that page spends it and
        which leaves the ground marks running the full bleed either way.
        Measured at 1440: 759px before, 651 after, and 651 is what the page
        this was asked to match is.
      */}
      <Container className="relative">
        {/*
          SIX AND SIX, TOUCHING. The picture started at column 8 and the
          words ended at 6, so column 7 — a hundred-odd pixels at 1440 — was
          held open between them on top of a 3rem gutter, and the two halves
          read as two unrelated things. /about's split is 6 / 6 from column
          7 with a 2.5rem gutter, and that is this now.
        */}
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-12">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              {/* The way back, and the only crumb that earns its place: this
                  page has exactly one parent. */}
              <Link
                href="/private-events"
                className="group inline-flex items-center gap-2 text-action font-medium uppercase tracking-eyebrow text-text opacity-70 transition-opacity duration-300 ease-soft hover:opacity-100"
              >
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
                >
                  &#8592;
                </span>
                Private events
              </Link>
            </Reveal>

            <Reveal delay={0.08}>
              <Eyebrow ground="light" className="mt-9">
                Who it is for
              </Eyebrow>
            </Reveal>

            <DisplayHeading
              id="programme-title"
              as="h1"
              ground="light"
              size="section"
              className="mt-8 md:mt-10"
              lines={[audience.name]}
            />

            <Reveal delay={0.16}>
              {/* `script-lede`, not a margin: Hapsha's descenders hang into
                  the gap under a script heading, so the step is a token. */}
              <p className="script-lede max-w-[46ch] text-body leading-[1.9] text-text/80">
                {audience.description}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                {/* `deep`, not `lilac`. The lilac tone is the outlined variant and read
                    as a hairline rather than as this site's button. On Light Sage a
                    cream pill is 1.03:1 and cannot be seen at all; Deep Lilac is
                    3.83 against the ground, over the 3:1 a control owes, and carries
                    `on-primary` at 4.90. */}
                <BlobButton
                  href={PRIVATE_EVENT_ENQUIRY_HREF}
                  tone="deep"
                  className="min-h-[3.25rem] px-8"
                >
                  Enquire about a session
                </BlobButton>

                {/*
                  The words stop four lines short of the picture's foot and
                  that corner was the emptiest part of the band. A mark on
                  the button's own line fills it without adding a sentence
                  nobody asked for — and it is in the flex row rather than
                  absolutely placed so it simply wraps away when there is no
                  room for it.
                */}
                <span aria-hidden className="pointer-events-none hidden w-[3.25rem] sm:block">
                  <DoodleMark name="starleaf" color={INK.terracotta} treatment="draw" delay={580} />
                </span>
              </div>
            </Reveal>
          </div>

          {/*
            THE PICTURE, OR THE MARK WHERE THERE IS NO PICTURE.

            Three programmes carry a stand-in photograph whose alt describes
            the frame and never the occasion; the fourth has none anywhere in
            the project and takes its brand cut-out on the field instead. Both
            fill the same box, so all four pages have one anatomy.
          */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Reveal variant="fadeIn" delay={0.2}>
              {/*
                CUT OUT, NOT FRAMED, and with the marks over its edges — the
                object /about opens on. A plate with a hard radius is the
                shape every other card on the site takes; a cutting is the
                one the brand's own deck uses for a photograph, and it is
                what the client pointed at.

                The programme's two colours do the marks, so each page still
                reads as itself without the ground having to shout it.
              */}
              {/*
                THE OBJECT /private-events OPENS ON, to the figure.

                It filled its six columns at every width above `lg` and stood
                7:6, which at 1440 is 680x583 — 220px taller than that page's
                picture and the whole reason the two sections do not read as
                one family. It is now that page's own box: 34rem at most,
                centred in the columns, cut 3:2.

                3:2 ON A PORTRAIT SOURCE, which is a crop and is the reason
                the birthday photograph carries a `position`. Three of the
                four pictures are landscape or near it and lose a strip of
                background; `glitter-keepsakes.jpg` is 480x640, so the 3:2
                window is 320 of its 640 rows and has to be aimed — see the
                note beside it in lib/privateEvents.ts. All four keepsakes
                stay in frame.
              */}
              <div className="relative mx-auto w-full max-w-[34rem]">
                {audience.image ? (
                  <span
                    className="blob relative block aspect-[3/2] w-full overflow-clip"
                    style={{ "--blob": "42% 30% 38% 34% / 34% 40% 30% 38%" } as React.CSSProperties}
                  >
                    <Image
                      src={audience.image.src}
                      alt={audience.image.alt}
                      fill
                      priority
                      sizes="(min-width: 1024px) 544px, 92vw"
                      className="object-cover"
                      style={
                        audience.image.position
                          ? { objectPosition: audience.image.position }
                          : undefined
                      }
                    />
                  </span>
                ) : audience.mark ? (
                  <div
                    aria-hidden
                    className="blob grid aspect-[3/2] w-full place-items-center overflow-clip bg-cream"
                    style={{ "--blob": "42% 30% 38% 34% / 34% 40% 30% 38%" } as React.CSSProperties}
                  >
                    {/*
                      THE DATA'S COLOUR IS NOT USED HERE, and that is a bug
                      fix rather than a liberty. `mark.color` is White Rock,
                      chosen when this masthead was a Deep Lilac field; the
                      cutting it stands in for is White Rock now, so the mark
                      was drawn in the colour of the paper it was on and the
                      page showed an empty blob. Deep Lilac is 3.95:1 against
                      White Rock, which a cut-out at this size can carry.
                    */}
                    {/*
                      34%, NOT 46%. The share was set against a 4:5 box, where
                      46% of the width was about 37% of the height. The box is
                      3:2 now, so the same share drew the mark at nearly 70% of
                      its height and the field read as a blob with a border.
                      34% of 544 is 185px, which is half the box's height —
                      the proportion the figure had before.
                    */}
                    <span className="block w-[34%]">
                      <DoodleMark
                        name={audience.mark.name}
                        color={INK.lilac}
                        treatment="draw"
                        delay={200}
                      />
                    </span>
                  </div>
                ) : null}

                {/*
                  THE FOUR MARKS /private-events PUTS ROUND ITS PICTURE, in
                  its colours, in its places.

                  There were five here and they were arranged for the bigger
                  box: the slab at the top right pulled in to `lg:right-2`,
                  the wave at the bottom RIGHT, and two extra — a coral and a
                  dot — added to cross the inside edge because a 680px picture
                  left the gutter looking empty. A 544px picture does not, so
                  the two come out with it and the wave goes back to the left,
                  which is where the section being matched hangs it.

                  THE COLOURS ARE FIXED NOW, NOT THE TONE'S, and that is not a
                  loss of the programme's identity — it is the only way these
                  two pages can draw the same mark. In this brand's sheet the
                  COLOUR picks the drawing and the shape word only picks loose
                  or slab (`resolveIcon`, components/sections/hero/doodles.ts),
                  so `starburst` in the tone's Deep Lilac is a lilac leaf tile
                  and the same word in Terracotta is the cut tile that page
                  opens with. Pinning the pair is what makes them match. The
                  programme's own colour still runs every section below.
                */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-5 -top-8 w-[5rem] md:w-[6.5rem]"
                >
                  <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={240} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-4 top-[28%] w-[2.25rem] md:w-[2.75rem]"
                >
                  <DoodleMark name="bow" color={INK.lilac} treatment="draw" delay={380} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-7 -left-6 w-[8.5rem] md:w-[10.5rem]"
                >
                  <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={460} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 bottom-[18%] w-[2.75rem] md:w-[3.5rem]"
                >
                  <DoodleMark name="splash" color={INK.lilac} treatment="draw" delay={540} />
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * What a session can be built around — the studio's real activity list.
 *
 * Read from lib/experiences.ts rather than written here, which is the same
 * decision /private-events made: two lists of the same thing is how two pages
 * start describing different businesses. An activity added, renamed or
 * photographed there appears on all four of these pages with no edit.
 *
 * The heading says "can be built around", not "we have run" — the studio has
 * not confirmed which activities any particular group has done.
 */
function Activities({
  experiences,
}: {
  experiences: Awaited<ReturnType<typeof getCreativeExperiences>>;
}) {
  if (experiences.length === 0) return null;

  return (
    <section
      aria-labelledby="programme-activities"
      className="relative isolate overflow-clip bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>The making</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="programme-activities"
              size="section"
              className="mt-8 md:mt-10"
              lines={["What a Session", "Is Built Around."]}
            />
          </div>

          <Reveal delay={0.18} className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
              The studio&rsquo;s activities, any of which a session can be shaped around. We will
              help choose the one that fits the group.
            </p>
          </Reveal>
        </div>

        {/*
          THE PAINTED PLATE, THE SAME ONE /private-events USES — at the
          client's ask, whose word for what was here was "old". It was a
          photograph over a flat panel of near-white; the plate throws the
          activity's own paint up over the foot of the picture and sets the
          words on the colour it lands in. One component for both pages now:
          see <ActivityPlate>.

          THE ROW HEIGHT IS SET HERE, because the plate fills what it is
          given — the picture takes whatever the caption leaves. Without a
          row height the photograph has none at all.
        */}
        <ul
          className={cn(
            "mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-6",
            "auto-rows-[clamp(17rem,70vw,21rem)] sm:auto-rows-[clamp(16rem,30vw,19rem)] lg:auto-rows-[clamp(17rem,21vw,21rem)]",
          )}
        >
          {experiences.map((experience, i) => (
            <li key={experience.slug}>
              <Reveal variant="fadeIn" delay={Math.min(i, 5) * 0.05} className="h-full">
                <ActivityPlate
                  experience={experience}
                  className="h-full"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  paint={i}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * The client's own three steps, in the client's own order and words.
 *
 * Nothing is added to them — no "within 24 hours", no "dedicated
 * coordinator" — because each of those is a commitment somebody at the studio
 * would have to keep. See lib/privateEvents.ts.
 */
function HowItWorks() {
  return (
    <section
      aria-labelledby="programme-how"
      /* LIGHT SAGE, at the client's ask. It was the page's own near-white,
         which left three near-white cards on a near-white ground with nothing
         to see but their hairlines. */
      className="relative isolate overflow-clip bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
        </Reveal>

        <DisplayHeading
          id="programme-how"
          size="section"
          className="mt-8 md:mt-10"
          lines={["Three Steps,", "Start to Finish."]}
        />

        <ol className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3 lg:gap-8">
          {PRIVATE_EVENT_STEPS.map((step, i) => (
            <li key={step.number}>
              <Reveal variant="fadeIn" delay={i * 0.08} className="h-full">
                {/* THE CARD THE PROGRAMME LINKS WERE, at the client's ask: a
                    colour each, the brand's own, with a cut-out over the
                    corner. Three that can be seen on Light Sage — sage
                    itself is not among them, for the obvious reason. */}
                <div
                  className={cn(
                    "plate group relative flex h-full flex-col overflow-clip rounded-[1.25rem] p-7 md:rounded-[1.5rem] md:p-8",
                    STEP_STOCK[i % STEP_STOCK.length].field,
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-4 block w-14 rotate-[10deg]"
                  >
                    <DoodleMark
                      name={STEP_STOCK[i % STEP_STOCK.length].mark}
                      color={STEP_STOCK[i % STEP_STOCK.length].markInk}
                      treatment="stamp"
                      depth={0}
                    />
                  </span>

                  {/* The numeral is set in the condensed face for the reason
                      every numeral on this site is: the brand's script has no
                      usable 7, 8 or 9. */}
                  <span
                    className={cn(
                      "font-sans text-h4 font-light tabular-nums",
                      STEP_STOCK[i % STEP_STOCK.length].numeral,
                    )}
                  >
                    {step.number}
                  </span>
                  <h3
                    className={cn(
                      "mt-5 text-h4 font-medium tracking-[-0.015em]",
                      STEP_STOCK[i % STEP_STOCK.length].ink,
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 text-body leading-[1.75]",
                      STEP_STOCK[i % STEP_STOCK.length].muted,
                    )}
                  >
                    {step.detail}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/*
  ==========================================================================
  (REMOVED) ALSO FOR — OTHER GROUPS WE SET UP FOR
  ==========================================================================

  The other three programmes stood here as a row of coloured cards, so a
  visitor on the wrong page could cross over. The client has asked for the
  section to go; the cards themselves are not lost — their treatment is what
  <HowItWorks> above now draws its three steps in.

  THE WAY ACROSS IS STILL THERE: the masthead opens with "Private events"
  back to the index, which lists all four, and the header's own menu carries
  them at every width.
*/

/**
 * The door, as a band of colour — the close /about and /locations both use.
 *
 * Deep Lilac on all four pages rather than the programme's own field: see
 * the note on the section. It takes no `tone` for that reason.
 */
function Enquiry() {
  return (
    <section
      aria-label="Enquire about a private event"
      /* DEEP LILAC ON ALL FOUR, at the client's ask. It used to take the
         programme's own field, which put the last word of the Corporate page
         on Charcoal Slate — the one ground on this site that reads as a
         different brand. Lilac is the colour every other page on the site
         closes on. */
      className="relative isolate overflow-clip bg-primary"
    >
      <Container className="relative py-[4.5rem] text-center md:py-section lg:py-[6.5rem]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[5%] top-10 hidden w-[5rem] rotate-[-10deg] md:block"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={280} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[6%] hidden w-[4.5rem] rotate-[8deg] md:block"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={400} />
        </span>

        <Reveal>
          <p className="mx-auto max-w-[30ch] text-statement font-light leading-[1.35] tracking-[-0.01em] text-surface">
            Tell us about your group and your date, and we will shape a session around it.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-10 flex justify-center">
            {/* `cream`, because a lilac button on a Deep Lilac field cannot
                be seen at all. See <BlobButton>. */}
            <BlobButton
              href={PRIVATE_EVENT_ENQUIRY_HREF}
              tone="cream"
              className="min-h-[3.25rem] px-8"
            >
              Start an enquiry
            </BlobButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
