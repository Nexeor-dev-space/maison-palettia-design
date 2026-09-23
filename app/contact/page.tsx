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
      <div className="relative isolate overflow-hidden bg-sage pb-[5.5rem] md:pb-[8rem] lg:pb-[9rem]">
        <Invitation />
        <Enquiry />
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

      <h1 id="contact-intro" className="mt-10 md:mt-14 lg:mt-16">
        <Stagger>
          <span className={STATEMENT_LINE}>Let&apos;s create</span>
          <span className={STATEMENT_LINE}>something together.</span>
        </Stagger>
      </h1>

      {/*
        The paragraph is set against the second half of the measure, under the
        statement's own right shoulder — the staircase the brand introduction
        and the About page both use, rather than a block centred under a
        heading.
      */}
      <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:gap-x-10">
        <Reveal delay={0.15} className="col-span-12 md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-7">
          <p className="text-lead font-light leading-[1.7] text-text md:text-[1.35rem]">
            Whether it is a question about an upcoming event, a place you would like to keep, or
            something you would like to make with us — write to the Maison and we will take it
            from there.
          </p>
        </Reveal>
      </div>

      {/*
        Full-bleed. The gutter is rebuilt by hand on the way out and back so the
        plate lines up with the page's own inset rather than approximating it —
        see the note on <Container>.
      */}
      {/*
        A tall plate in a wide band, so the crop is doing real work: 21:9 keeps
        about a third of its height on a desktop, 16:9 about 45%, and 3:2 on a
        phone about 54%. Held above centre, because a landscape has its subject
        along the horizon rather than in the middle — the hillside, the trees
        and the flowering shrubs survive all three crops, and what is given up
        is empty sky at the top and foreground at the foot.

        THIS WAS TWO CLAY-COVERED HANDS THROWING ON THE WHEEL, shared with the
        Shape strand in lib/disciplines.ts. The client has taken the brand off
        the wheel; the strand is gone and so is the photograph.

        A CLIENT OIL LANDSCAPE STOOD IN HERE and has been replaced. It was the
        widest picture left in the project, which was the whole argument for
        it — but a finished landscape in heavy impasto is a painting of a
        place, and the brief asks this site to show making: hands, materials,
        process. It also read as stock on the one page a visitor arrives at
        wanting to reach a person.

        This frame is the Maison's own, pulled from its banner footage: ink
        being drawn through a marbling bath, which is a real technique the
        studio runs and is entirely material and process. It is C2PA-clean.
      */}
      <Reveal variant="maskUp" className="mt-16 md:mt-20 lg:mt-24">
        <div className="relative -mx-gutter aspect-[3/2] w-screen max-w-none overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src="/images/studio/marbling.jpg"
            alt="A close view of a marbling bath: a fine needle drawn down through floating orange, teal and red inks, pulling them into feathered swirls."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_42%]"
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
          The form leads and takes two thirds. It is the only working way to
          reach the Maison on this page, so it gets the column that a sheet of
          telephone numbers would have had.
        */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-6">
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
            <div className="rounded-[1.25rem] bg-cream px-6 py-8 md:rounded-[1.5rem] md:px-9 md:py-10">
              <ContactForm />
            </div>
          </Reveal>
        </div>

        <Details />
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
    <aside aria-labelledby="contact-find-us" className="col-span-12 lg:col-span-4 lg:col-start-9">
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

          {social.length > 0 ? (
            <Block term="Follow">
              <ul className="flex flex-col gap-2">
                {social.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href as string}
                      target="_blank"
                      rel="noreferrer"
                      className="border-b border-line pb-1 transition-colors duration-300 ease-soft hover:border-terracotta"
                    >
                      {link.label}
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
