import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Ask the Maison about an event, a booking or working together — or find an upcoming event and keep a place.",
  path: "/contact",
});

/* The page's banner line, in the brand's script — see `heading-script`. */
const STATEMENT_LINE = "block heading-script text-script-hero";

/**
 * Contact — an invitation, then a form, then the way back to the programme.
 *
 * Built from the same parts as the rest of the site rather than from a contact
 * template: the statement is set in the About page's own display line, the
 * inputs are <BookingForm>'s inputs, and the closing panel is the About page's
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
export default function ContactPage() {
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
        <Invitation />
        <Enquiry />
        <Portrait />
      </div>
      <EventsCta />
    </>
  );
}

/** 01 — the opening. A statement, a paragraph, and one photograph. */
function Invitation() {
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
        className="pointer-events-none absolute -right-5 top-12 hidden w-[8rem] lg:block xl:w-[9.5rem]"
      >
        <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={320} />
      </Reveal>

      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          Contact
        </p>
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
      <div className="mt-8 grid grid-cols-12 gap-x-6 md:mt-10 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-7">
          <h1 id="contact-intro">
            <Stagger>
              <span className={STATEMENT_LINE}>Let&apos;s create</span>
              <span className={STATEMENT_LINE}>something together.</span>
            </Stagger>
          </h1>

          <Reveal delay={0.15}>
            <p className="script-lede max-w-[44ch] text-lead font-light leading-[1.7] text-text md:text-[1.35rem]">
              Whether it is a question about an upcoming event, a place you would like to keep, or
              something you would like to make with us — write to the Maison and we will take it
              from there.
            </p>
          </Reveal>
        </div>

        {/*
          THE MARGIN THE PARAGRAPH LEFT, GIVEN THE DECK'S FURNITURE.

          Two cut-outs from the brand sheet, in two of its six colours, placed
          against the edges of the cell rather than floated in the middle of
          it — the client's standing note on icons is that uncontrolled
          scattering does not look good, and the deck's own habit is that a
          shape crosses something: an edge, a corner, a column.

          Terracotta and White Rock, because the wave already breaking the
          measure above this is Soft Lavender and the page itself is Light
          Sage. Four of the six colours are then in the band and none of them
          is the ground.

          `lg:` only: below that the statement runs the full measure and there
          is no margin for them to be the margin of.
        */}
        <div
          aria-hidden
          className="pointer-events-none relative hidden self-stretch lg:col-span-4 lg:col-start-9 lg:block"
        >
          <Reveal delay={0.35} className="absolute left-[6%] top-[14%] w-[7.5rem] xl:w-[9rem]">
            <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={420} />
          </Reveal>
          <Reveal delay={0.45} className="absolute -bottom-6 right-[4%] w-[8.5rem] xl:w-[10rem]">
            <DoodleMark name="cutout" color={INK.whiteRock} treatment="draw" delay={560} />
          </Reveal>
        </div>
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
function Portrait() {
  return (
    <Container>
      <Reveal variant="maskUp" className="mt-16 md:mt-20 lg:mt-24">
        <div className="relative -mx-gutter aspect-[3/2] w-screen max-w-none overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src="/images/contact-img.jpg"
            alt="Seen from above: an adult and a child painting a broad rainbow in red, yellow, green and blue across a sheet of paper, a tray of poster paints beside them."
            fill
            sizes="100vw"
            /* Centred: the paper, the rainbow and both pairs of hands run
               across the middle of this frame, so every crop keeps them and
               gives up only worktop. The 42% the marbling needed was for a
               subject sitting high in its own frame. */
            className="object-cover object-[50%_50%]"
          />
        </div>
      </Reveal>
    </Container>
  );
}

/** 02 — the form, and whatever the Maison has actually published beside it. */
function Enquiry() {
  return (
    <Container
      as="section"
      aria-labelledby="contact-enquiry"
      className="pt-[4.5rem] md:pt-[6.5rem] lg:pt-[8rem]"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
        {/*
          ==================================================================
          THE DETAILS LEAD THE COLUMN, THE FORM TAKES THE RIGHT-HAND SIDE
          ==================================================================

          The form used to lead and take two thirds of the left, on the
          argument that it is the only working way to reach the Maison from
          this page. That is still true and it is no longer the argument that
          decides the position: the client has asked for the form on the right
          and for "Find us" to fall under the statement's own paragraph.

          Read down the page that now gives one continuous left-hand column —
          statement, the sentence that finishes it, then where the Maison is —
          against one object on the right, which is the thing you came to use.
          The old arrangement had the two halves swapping sides between the
          first screen and the second, so the eye crossed the measure twice to
          read what is really one column of words.

          `Details` IS FIRST IN THE SOURCE, NOT JUST FIRST ON THE LEFT. Reading
          order and visual order are the same at every width — down the left
          on a desktop, top to bottom on a phone — so nothing has to be put
          back in place with `order-*`, and a keyboard runs the page in the
          order it is drawn.
        */}
        <Details />

        <div className="col-span-12 lg:col-span-7 lg:col-start-6 xl:col-span-6 xl:col-start-7">
          <Reveal>
            <h2
              id="contact-enquiry"
              className="heading-script text-script-compact"
            >
              Write to us
            </h2>
            <p className="mt-5 max-w-[30rem] text-body leading-[1.85] text-muted">
              A few lines is plenty. Tell us what you are after and we will come back to you.
            </p>
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
        </div>
      </div>
    </Container>
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
function Details() {
  const hasAddress = CONTACT.addressLines.length > 0;
  const social = SOCIAL_LINKS.filter((link) => link.href);

  if (!hasAddress && !CONTACT.email && !CONTACT.phone && social.length === 0) return null;

  return (
    <aside aria-labelledby="contact-find-us" className="relative col-span-12 lg:col-span-4">
      {/*
        THE FOOT OF THIS COLUMN IS AIR, AND IT IS THE FORM'S FAULT — in the
        good sense. The row is as tall as the form beside it, and what the
        Maison has actually published is a city and a line about venues, so
        below the rule there is about 430px of Light Sage at 1440 that no
        amount of writing should be invented to fill.

        Two more of the deck's cut-outs stand in it instead, on the same terms
        as the pair in the statement's margin: placed, not scattered, each one
        against an edge — the starleaf crosses the page's left gutter the way
        the deck lets a shape run off a page, and the bean crosses the column's
        inner edge into the channel between it and the form. Neither floats in
        clear space, which was the first attempt and read as a sticker dropped
        in the middle of the band. Deep Lilac and Warm Terracotta, the two of the six that
        the Light Sage ground shows at full strength.

        The aside already stretches to the row's height (the grid sets no
        `items-*`), so `relative` here is all these need to have a box to be
        placed in. Decorative, `aria-hidden`, untouchable, and `lg:` only,
        because on a phone the column is as tall as its own words and this air
        does not exist.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 bottom-[8%] hidden w-[9rem] -rotate-6 lg:block xl:w-[10.5rem]"
      >
        <DoodleMark name="starleaf" color={INK.lilac} treatment="draw" delay={640} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 bottom-[46%] hidden w-[5.5rem] rotate-[12deg] lg:block xl:w-[6.5rem]"
      >
        <DoodleMark name="bean" color={INK.terracotta} treatment="draw" delay={720} />
      </span>

      <Reveal delay={0.2}>
        {/* A heading in the script, the pair of "Write to us" beside it. */}
        <h2 id="contact-find-us" className="heading-script text-script-compact text-text">
          Find us
        </h2>

        <dl className="mt-10 border-t border-line">
          {hasAddress ? (
            <Block term="Where">
              <address className="not-italic">
                {CONTACT.addressLines.map((line) => (
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
              <Link
                href="/events"
                className="mt-4 inline-block border-b border-terracotta/50 pb-1 text-fine transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                Venues are listed with each event
              </Link>
            </Block>
          ) : null}

          {CONTACT.email ? (
            <Block term="Email">
              <a
                href={`mailto:${CONTACT.email}`}
                className="border-b border-line pb-1 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {CONTACT.email}
              </a>
            </Block>
          ) : null}

          {CONTACT.phone ? (
            <Block term="Phone">
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className="border-b border-line pb-1 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {CONTACT.phone}
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
            nowhere — the same reason LEGAL_NAV, WHATSAPP and the newsletter
            are all absent. Put the two URLs on that constant and the row below
            appears with no other change.

            The label is on `aria-label`, not beside the glyph: an icon with
            its own name written next to it is the thing this was.
          */}
          {social.length > 0 ? (
            <Block term="Follow">
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
      <dd className="mt-3 text-body leading-[1.8] text-text">{children}</dd>
    </div>
  );
}

/**
 * 03 — the way through to the programme.
 *
 * The About page's closing panel, deliberately the same object: a visitor who
 * has read both should arrive at the same door. Secondary to the form above
 * it, which is why it is a panel at the foot rather than a second column
 * competing with the enquiry.
 */
function EventsCta() {
  return (
    <section
      aria-labelledby="contact-cta"
      /*
        Deep Lilac, and the ink that clears it. This was Charcoal Slate with
        White Rock on it — legible, and not the language the rest of the site
        closes in: both the homepage and /about end on the lilac field. The
        spacing above moved to the paper's own padding, so this section no
        longer carries a margin that only existed to separate it from a page
        with no ground.
      */
      className="relative isolate overflow-hidden bg-primary py-[5rem] text-surface md:py-section"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <p className="text-label font-medium uppercase tracking-eyebrow text-surface/85">
                Looking for an event?
              </p>
              <h2
                id="contact-cta"
                className="mt-6 heading-script text-script-section"
              >
                <span className="block">The programme,</span>
                <span className="block">date by date.</span>
              </h2>
            </Reveal>
          </div>

          <div className="col-span-12 mt-10 lg:col-span-4 lg:col-start-9 lg:mt-0">
            <Reveal delay={0.15}>
              <p /*
                  `surface`, not White Rock. Moving this field from Charcoal
                  Slate to Deep Lilac changed what the ink owes: White Rock on
                  lilac is 3.95:1 and at /80 it is lower still, both under the
                  4.5:1 body text owes. `surface` is the one light ink that
                  clears it (4.90) — see inkFor() in <SectionHeader>. The Light
                  Sage rule and arrow below stay: they are graphical, owing
                  3:1, and sage on lilac is 3.83.
                */
                className="max-w-[24rem] text-body leading-[1.85] text-surface">
                Every event lists its venue, its times and what you will make. If you already
                know what you are after, it is quicker than writing to us.
              </p>

              <Link
                href="/events"
                className="group mt-9 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-surface"
              >
                <span className="border-b border-sage/60 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-sage">
                  Explore upcoming events
                </span>
                <span
                  aria-hidden
                  className="text-sage transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
