import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";
import { CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import type { ContactDetails, ImageAsset, SocialLink } from "@/types";


/*
  THE MARKS THIS PAGE HAD NONE OF.

  /contact rendered with no brand cut-out anywhere, at any width — the only
  page on the site that did. Three grounds, three plans, and the ink on each
  is the one the ground can carry:

    the sage head ..... Deep Lilac 3.83:1 and Charcoal 9.36 read on Light
                        Sage; Warm Terracotta is 2.36 and does not.
    the paper ......... the page surface takes all three warm colours.
    the lilac close ... White Rock 3.95 and Light Sage 3.83 read on Deep
                        Lilac; Charcoal is 2.37 and Soft Lavender 2.74.

  <SectionShapes> rather than bare <DoodleMark>s, and that is not only reuse:
  it draws its marks with `treatment="stamp"`, so it is immune to the
  `overflow-hidden` on two of these sections — a `draw` mark inside one never
  fills, which is the trap the rest of the codebase keeps warning about.
*/
const HEAD_SHAPES: readonly ShapePlan[] = groundShapes("sage");

const ENQUIRY_SHAPES: readonly ShapePlan[] = groundShapes("sage");



/* The page's banner line, in the brand's script — see `heading-script`. */
/* `script-section`, the size every other page title on the site is set at.
   `script-hero` is the HOME PAGE's step and this was the only other page
   using it, which put /contact's title at 81px beside 67.5px everywhere
   else — the same heading role at two sizes. */
const STATEMENT_LINE = "block heading-script text-script-section";

/**
 * Contact — an invitation, then a form, then the way back to the programme.
 *
 * The `contactIntro` block (SPEC §E.1): the invitation, the details, the form
 * column and the portrait, moved here from app/(site)/contact/page.tsx when
 * the page became CMS blocks; the way back to the programme is the shared
 * Deep Lilac close (components/sections/ClosingCta.tsx). The form itself
 * stays components/contact/ContactForm.tsx (Phase 3 wires it to the inbox).
 *
 * Built from the same parts as the rest of the site rather than from a contact
 * template: the statement is set in the About page's own display line, the
 * inputs are <Checkout>'s inputs, and the closing panel is the About page's
 * closing panel. Nothing here is a new idea about what this brand looks like.
 *
 * WHAT THIS PAGE MAY SAY IS LIMITED BY WHAT THE PROJECT KNOWS. `CONTACT.email`
 * and `CONTACT.phone` are both `null` in lib/constants.ts and every href in
 * `SOCIAL_LINKS` is `null` too, so this page has exactly one published detail
 * to offer — the city. The email, phone and social blocks are therefore not
 * rendered at all rather than rendered empty or filled with a plausible
 * address, and <Details> below drops out entirely if the city ever goes too.
 * Set the real values in lib/constants.ts and each block appears on its own.
 *
 * The composition answers that shortage rather than hiding it: with no column
 * of details to balance against, the form is the page, and it is given the
 * width and the air that a single column of contact lines would otherwise
 * have taken.
 */
/**
 * What the `contactIntro` block supplies (components/blocks/ContactIntro.tsx).
 * Every word defaults to the launch wording; `contact` and `social` are Site
 * settings' details, defaulting to lib/constants.ts.
 */
export interface ContactWords {
  eyebrow?: string | null;
  lines?: readonly string[];
  lead?: string | null;
  findUsHeading?: string | null;
  whereTerm?: string;
  emailTerm?: string;
  phoneTerm?: string;
  followTerm?: string;
  venuesLinkLabel?: string | null;
  venuesLink?: string;
  formHeading?: string | null;
  formLead?: string | null;
  portrait?: ImageAsset | null;
  contact?: ContactDetails;
  social?: SocialLink[];
}

export function ContactIntro(words: ContactWords = {}) {
  return (
    <>
      {/*
        ONE PAPER, THEN ONE FIELD. This page used to sit on the body's
        near-white `surface` with a Charcoal Slate block at the foot, which is
        the older site's arrangement: a page with no ground of its own and a
        dark bar at the end. The homepage is Light Sage from top to bottom and
        closes on a colour, so the invitation and the form share the paper and
        the last beat is the one field.
      */}
      {/*
        NO BOTTOM PADDING ANY MORE. This band used to end on 5.5–9rem of Light
        Sage because <Invitation>'s photograph was in the MIDDLE of the page
        and the form closed it — the padding was the rest after the last block
        of type. Now that <Portrait> is last, that padding sat between a
        full-bleed photograph and the events field below it as a stripe of
        sage belonging to neither. The picture runs to the join instead.
      */}
      <div className="relative isolate overflow-hidden bg-sage">
        <SectionShapes plan={HEAD_SHAPES} />
        {/* <Enquiry> is no longer a section of its own — it is the right-hand
            column of <Invitation>, at the client's ask. See the note on the
            grid there. */}
        <Invitation words={words} />
        <Portrait image={words.portrait === undefined ? PORTRAIT : words.portrait} />
      </div>
    </>
  );
}

/** 01 — the opening. A statement, a paragraph, and one photograph. */
function Invitation({ words }: { words: ContactWords }) {
  const {
    eyebrow = "Contact",
    lines = ["Let's Create", "Something Together."],
    lead = "Whether it is a question about an upcoming event, a place you would like to keep, or something you would like to make with us, write to the Maison and we will take it from there.",
  } = words;
  return (
    <Container
      as="section"
      aria-labelledby="contact-intro"
      className="relative pt-[4rem] md:pt-[6rem] lg:pt-[7rem]"
    >
      {/* Breaking the right edge of the measure, the way the deck lays a
          cut-out — never floating in clear space. */}
      <Reveal
        delay={0.3}
        className="pointer-events-none absolute -right-5 top-12 deco-mark w-[8rem] xl:w-[9.5rem]"
      >
        <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={320} />
      </Reveal>

      {/*
        ONE COLUMN: THE STATEMENT AND THE SENTENCE THAT FINISHES IT.

        The paragraph has been beside the statement and it has been under its
        right shoulder; the client has asked for it directly under the
        statement instead, and that is the version this page should have had
        from the start. The two are one thought — "let's create something
        together / whether it is a question about an upcoming event…" — and a
        sentence that continues a heading belongs on the heading's own measure,
        not across a gutter from it.

        WHAT THAT FREES IS THE RIGHT-HAND HALF, and it is deliberately not
        refilled with type. The form has moved into it lower down the page (see
        <Enquiry>), so the eye that crosses this band is already travelling
        towards the thing it will use; what stands in the band is the brand's
        own cut-outs, which is what the deck puts in a margin.

        `script-lede` rather than a margin, because the statement is set in
        Hapsha and its descenders hang into the gap — the same token every
        script heading on the site pays.
      */}
      <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-6">
          {eyebrow ? (
            <Reveal>
              <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
                <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
                {eyebrow}
              </p>
            </Reveal>
          ) : null}

          <h1 id="contact-intro" className="mt-8 md:mt-10">
            <Stagger>
              {lines.map((line) => (
                <span key={line} className={STATEMENT_LINE}>
                  {line}
                </span>
              ))}
            </Stagger>
          </h1>

          {lead ? (
            <Reveal delay={0.15}>
              <p className="script-lede max-w-[44ch] text-lead text-text">{lead}</p>
            </Reveal>
          ) : null}
          <Details words={words} />
        </div>

        {/*
          ==================================================================
          THE FORM COMES UP BESIDE THE STATEMENT
          ==================================================================

          It was a section of its own below this one, which put the thing the
          page exists for under the fold on every laptop: the statement, the
          sentence, a photograph's worth of Light Sage, and only then the
          field someone came here to fill in. The client has asked for it
          level with the heading, and that is also the shorter route — the
          invitation and the way to answer it are on screen together.

          SIX AND FIVE OF TWELVE. The statement is set in the script at
          display size and wants a measure that does not force a third line;
          the form is a panel with two fields to a row and stops being usable
          much under a third of the page. The column between them is the
          gutter both need to read as two objects rather than one block.

          WHAT WAS HERE WAS A PAIR OF CUT-OUTS, filling the margin the
          paragraph left. The margin is the form now. The marks that are left
          on this page are the wave breaking the measure above and the two at
          the foot of the details column — placed, in the air the composition
          actually leaves, which is the only place they were ever meant to be.
        */}
        <Enquiry words={words} />
      </div>

      {/*
        Full-bleed. The gutter is rebuilt by hand on the way out and back so the
        plate lines up with the page's own inset rather than approximating it —
        see the note on <Container>.
      */}
      {/*
        A tall plate in a wide band, so the crop is doing real work: 21:9 keeps
        about a third of the frame's height on a desktop, 16:9 about 45%, and
        3:2 on a phone about 54%. The subject of this one runs across the
        middle — the paper, the rainbow and both pairs of hands — so a centred
        crop holds all of it at every width and gives up only worktop.

        THIS WAS TWO CLAY-COVERED HANDS THROWING ON THE WHEEL, shared with the
        Shape strand in lib/disciplines.ts. The client has taken the brand off
        the wheel; the strand is gone and so is the photograph.

        A CLIENT OIL LANDSCAPE STOOD IN HERE and has been replaced. It was the
        widest picture left in the project, which was the whole argument for
        it — but a finished landscape in heavy impasto is a painting of a
        place, and the brief asks this site to show making: hands, materials,
        process. It also read as stock on the one page a visitor arrives at
        wanting to reach a person.

        THE MARBLING FRAME HAS BEEN REPLACED at the client's ask, with a
        photograph they supplied: an adult and a child painting a rainbow
        together, shot from above. It answers the page better than the
        marbling did — this is the one page a visitor reaches wanting to talk
        to a person, and two people making something together is nearer to
        that than a close-up of a technique.

        Checked before use, the way every image on this site is: no C2PA
        content credentials, no `trainedAlgorithmicMedia` or SynthID marker, no
        stock-agency strings, and the EXIF carries no camera make or software.
        Nothing to flag.

        ONE THING TO WATCH: the file is 4368x2912 and 1.6MB. Next resizes it
        per breakpoint so the page weight is fine, but it is an order of
        magnitude heavier than its neighbours in public/images/studio (110-183
        KB) and the first optimise of a 12-megapixel JPEG is slow. Worth
        downscaling the source to about 2400px wide.
      */}
    </Container>
  );
}

/**
 * The photograph — now AFTER the form rather than before it.
 *
 * It used to close <Invitation>, which put a full-bleed 21:9 plate between the
 * statement and the enquiry form. On a desktop that made the first screen a
 * heading, a paragraph and a picture, with the form a visitor came to this
 * page to use entirely below the fold. The client asked for the form in the
 * first view; moving the picture past it is the half of that change which is
 * not the form's own.
 *
 * It is not dropped, only moved: the page now closes on it, before the events
 * call to action. `priority` goes with it — it is no longer the first thing
 * painted, so it should not be competing with the form for the connection.
 */
function Portrait({ image }: { image: ImageAsset | null }) {
  if (!image) return null;
  return (
    <Container>
      <Reveal variant="maskUp" className="mt-16 md:mt-20 lg:mt-24">
        <div className="relative -mx-gutter aspect-[3/2] w-screen max-w-none overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            /*
              `contact-img.jpg` WAS NOT IN THE PROJECT. The path has been here
              and the file has not: `public/images/contact-img.jpg` does not
              exist, so this band has been rendering a broken image and the
              alt text described a photograph nobody could see. Caught when
              the same path was reached for in <AboutMenu>.

              This is one of the four stills cut from the studio's own film —
              hands only, no identifiable face — so it is a photograph the
              site is entitled to show. The alt describes the frame and
              nothing about an occasion.
            */
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            /* Centred: the paper, the rainbow and both pairs of hands run
               across the middle of this frame, so every crop keeps them and
               gives up only worktop. The 42% the marbling needed was for a
               subject sitting high in its own frame. */
            className="object-cover object-[50%_50%]"
            {...(image.position && image.position !== "50% 50%" ? { style: { objectPosition: image.position } } : {})}
          />
        </div>
      </Reveal>
    </Container>
  );
}

/** 02 — the form, and whatever the Maison has actually published beside it. */
/**
 * The form, as the right-hand column of the composition above.
 *
 * IT KEEPS ITS OWN LANDMARK. It is no longer a <Container> section stacked
 * under the invitation — it is a grid cell — but it is still the one place on
 * this page a visitor can act, so it stays a labelled <section> rather than
 * becoming an unnamed div inside someone else's. A landmark does not have to
 * be a top-level block to be one.
 */
function Enquiry({ words }: { words: ContactWords }) {
  const {
    formHeading = "Write to Us",
    formLead = "A few lines is plenty. Tell us what you are after and we will come back to you.",
  } = words;
  return (
    <section
      aria-labelledby="contact-enquiry"
      className="relative isolate col-span-12 lg:col-span-5 lg:col-start-8"
    >
      <SectionShapes plan={ENQUIRY_SHAPES} />
      {/*
        READING ORDER IS VISUAL ORDER, at every width. The statement, its
        sentence and "Find us" are one column in the source and one column on
        the screen; this follows them. On a phone the three stack in that
        order and the form is last, which is also the order someone reads the
        page in — nothing has to be put back with `order-*`, and a keyboard
        runs the page as it is drawn.
      */}
      <Reveal>
        <h2
          id="contact-enquiry"
          className="heading-script text-script-compact"
        >
          {formHeading}
        </h2>
        {formLead ? <p className="mt-5 text-lead text-muted">{formLead}</p> : null}
      </Reveal>

          {/*
            The form is an object laid on the paper rather than type running
            straight down it — a White Rock field, the deck's own. It is also
            the practical reading: a sheet you write on should look like one,
            and the inputs' own borders now sit on a ground that is not the
            page, so the fields read as fields without needing heavier rules.
          */}
          <Reveal delay={0.1} className="mt-10">
            {/*
              SOFT LAVENDER, MIXED BACK — and it is the only one of the two
              the client offered that works at all.

              AT FULL STRENGTH IT WAS TOO LOUD. #C4B5FD undiluted against the
              page's Light Sage is two saturated colours meeting over a large
              area, and the client read it as hard on the eye. Mixed 55% into
              White Rock it keeps the hue — the form is still plainly lavender
              and still plainly an object laid on the sage — with most of the
              vibration gone. Charcoal only reads BETTER on it as it lightens,
              so nothing below is at risk.

              The client offered Soft Lavender or Warm Terracotta. This panel
              is a FIELD carrying labels, field text, a placeholder and a
              paragraph, all in Charcoal Slate, so it owes them 4.5:1:
              Charcoal on Soft Lavender is 6.49:1 and clears it, Charcoal on
              Warm Terracotta is about 3.5:1 and does not. Terracotta would
              have meant re-inking every label on the form to a near-white and
              re-checking the Deep Lilac button against it — a different panel,
              not a different colour.

              It replaces White Rock, which was the page's own paper and so
              read as a lighter patch of the same ground rather than as a card
              laid on it. Lavender is a colour the Light Sage does not contain,
              which is what makes the form arrive as an object.
            */}
        <div className="rounded-[1.25rem] bg-[color-mix(in_oklab,var(--color-lavender)_55%,var(--color-cream))] px-6 py-8 md:rounded-[1.5rem] md:px-9 md:py-10">
          <ContactForm />
        </div>
      </Reveal>
    </section>
  );
}

/**
 * The published details, and only those.
 *
 * Each block is gated on its own value, so the section grows as the client
 * fills lib/constants.ts in and never shows a heading with nothing under it.
 * With all four empty the whole aside disappears and the form simply takes the
 * full measure — which is a better page than a column of "coming soon".
 */
function Details({ words }: { words: ContactWords }) {
  const {
    findUsHeading = "Find Us",
    whereTerm = "Where",
    emailTerm = "Email",
    phoneTerm = "Phone",
    followTerm = "Follow",
    venuesLinkLabel = "Venues are listed with each event",
    venuesLink = "/events",
    contact = CONTACT,
    social: links = SOCIAL_LINKS,
  } = words;
  const hasAddress = contact.addressLines.length > 0;
  const social = links.filter((link) => link.href);

  if (!hasAddress && !contact.email && !contact.phone && social.length === 0) return null;

  return (
    <aside aria-labelledby="contact-find-us" className="relative mt-14 md:mt-16">
      {/*
        THE TWO CUT-OUTS THAT STOOD HERE HAVE GONE WITH THE HOLE THEY FILLED.

        They were placed when this column was a short aside beside a tall
        form: the row was as tall as the form and what the Maison has actually
        published is a city and a line about venues, so about 430px of Light
        Sage sat under the rule with nothing in it.

        The form has moved up beside the statement, so this column is now the
        statement, its sentence AND the address, and the two columns end
        within ten pixels of each other. There is no band left — and a mark
        placed for a band that no longer exists does not sit in air, it sits
        on the address: measured, the starleaf was across "United Arab
        Emirates" and the bean was floating in the middle of the column.

        The page keeps the wave breaking the measure at the top, which is
        placed against an edge rather than against a gap and is unaffected by
        anything below it.
      */}

      <Reveal delay={0.2}>
        {/* A heading in the script, the pair of "Write to us" beside it. */}
        <h2 id="contact-find-us" className="heading-script text-script-compact text-text">
          {findUsHeading}
        </h2>

        <dl className="mt-10 border-t border-line">
          {hasAddress ? (
            <Block term={whereTerm}>
              <address className="not-italic">
                {contact.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {/*
                The city is all the project holds, and a city is not an
                address someone can arrive at. Each event carries its own
                venue, which is the detail a visitor actually wants, so this
                block points at where those live instead of pretending to be
                a street.
              */}
              {venuesLinkLabel ? (
                <Link
                  href={venuesLink}
                  className="mt-4 inline-block border-b border-terracotta/50 pb-1 text-fine transition-colors duration-300 ease-soft hover:border-terracotta"
                >
                  {venuesLinkLabel}
                </Link>
              ) : null}
            </Block>
          ) : null}

          {contact.email ? (
            <Block term={emailTerm}>
              <a
                href={`mailto:${contact.email}`}
                className="border-b border-line pb-1 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {contact.email}
              </a>
            </Block>
          ) : null}

          {contact.phone ? (
            <Block term={phoneTerm}>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="border-b border-line pb-1 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {contact.phone}
              </a>
            </Block>
          ) : null}

          {/*
            MARKS RATHER THAN A COLUMN OF WORDS, at the client's ask — this
            block used to set "Instagram" and "Facebook" as two stacked text
            links, which is the least of the space it has.

            IT STILL RENDERS NOTHING TODAY, and that is the project's own rule
            rather than an oversight: every `href` in SOCIAL_LINKS is `null`
            (lib/constants.ts), and this site does not ship a link that goes
            nowhere — the same reason LEGAL_NAV and the newsletter are
            absent. Put the two URLs on that constant and the row below
            appears with no other change.

            The label is on `aria-label`, not beside the glyph: an icon with
            its own name written next to it is the thing this was.
          */}
          {social.length > 0 ? (
            <Block term={followTerm}>
              <ul className="flex flex-wrap items-center gap-3">
                {social.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href as string}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      /* 44px, which is the target size WCAG 2.5.8 asks of a
                         control that is not inside a line of running text. */
                      className="flex size-11 items-center justify-center rounded-full border border-text/25 text-text transition-colors duration-300 ease-soft hover:border-terracotta hover:bg-terracotta/10"
                    >
                      <SocialGlyph name={link.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </dl>
      </Reveal>
    </aside>
  );
}

/**
 * The mark for one network, or a plain dot for one this does not know.
 *
 * Drawn here rather than pulled from an icon package: two glyphs is not a
 * dependency, and a package would arrive with a hundred more and its own
 * licence notice. `currentColor` throughout, so the anchor above decides the
 * ink and the hover needs no second rule.
 */
function SocialGlyph({ name }: { name: string }) {
  const key = name.trim().toLowerCase();

  if (key === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.1" cy="6.9" r="1.25" fill="currentColor" />
      </svg>
    );
  }

  if (key === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5">
        <path
          d="M13.9 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6a22 22 0 0 0-2.4-.12c-2.4 0-4 1.45-4 4.12V9.9H8v3.1h2.6V21z"
          fill="currentColor"
        />
      </svg>
    );
  }

  /* An unknown network still gets a target the same size as the others, so a
     third entry added to SOCIAL_LINKS never breaks the row's rhythm. */
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5">
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    </svg>
  );
}

/** One labelled line of the details list. */
function Block({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-7">
      <dt className="text-label font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-3 text-body text-text">{children}</dd>
    </div>
  );
}

/*
  The band's photograph as the page shipped it: one of the four stills cut
  from the studio's own film — hands only, no identifiable face. See the note
  in <Portrait> for why it replaced the earlier frames.
*/
const PORTRAIT: ImageAsset = {
  src: "/images/hero/plate-painting.jpg",
  alt: "A pair of hands painting a ceramic plate at a table, a brush in one of them.",
};
