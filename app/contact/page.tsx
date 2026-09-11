import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Ask the Maison about an event, a booking or working together — or find an upcoming session and keep a place.",
  path: "/contact",
});

const STATEMENT_LINE =
  "block font-light uppercase leading-[0.96] tracking-[-0.02em] " +
  "text-[2.25rem] xs:text-[2.75rem] sm:text-[3.25rem] md:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]";

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
      <Invitation />
      <Enquiry />
      <EventsCta />
    </>
  );
}

/** 01 — the opening. A statement, a paragraph, and one photograph. */
function Invitation() {
  return (
    <Container as="section" aria-labelledby="contact-intro" className="pt-[4rem] md:pt-[6rem] lg:pt-[7rem]">
      <Reveal>
        <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          Contact
        </p>
      </Reveal>

      <h1 id="contact-intro" className="mt-10 md:mt-14 lg:mt-16">
        <Stagger>
          <span className={STATEMENT_LINE}>Let&rsquo;s create</span>
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
          <p className="text-[1.15rem] font-light leading-[1.7] text-text md:text-[1.35rem]">
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
        A square plate in a wide band, so the crop is doing real work: 21:9
        keeps about 43% of its height on a desktop, 16:9 about 56%, and 3:2 on
        a phone about 67%. Centred rather than offset, because the subject sits
        in the middle of the frame — the hands and the rising wall of the pot
        are held at every one of those three crops, and what is given up is
        blurred table at the top and wheel head at the foot.

        The same photograph carries the Shape strand (see lib/disciplines.ts),
        so it also appears inside the events menu and the mobile panel. Never
        at the same moment as this: both are surfaces someone has to open.
      */}
      <Reveal variant="maskUp" className="mt-16 md:mt-20 lg:mt-24">
        <div className="relative -mx-gutter aspect-[3/2] w-screen max-w-none overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src="/images/creative/pottery.jpg"
            alt="Two clay-covered hands throwing on the wheel — one inside the vessel opening it out, the other holding a metal rib against the turning wall."
            fill
            priority
            sizes="100vw"
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
          The form leads and takes two thirds. It is the only working way to
          reach the Maison on this page, so it gets the column that a sheet of
          telephone numbers would have had.
        */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-6">
          <Reveal>
            <h2
              id="contact-enquiry"
              className="text-[1.6rem] font-light uppercase leading-[1.1] tracking-[-0.01em] md:text-[2rem]"
            >
              Write to us
            </h2>
            <p className="mt-5 max-w-[30rem] text-[0.95rem] leading-[1.85] text-muted">
              A few lines is plenty. Tell us what you are after and we will come back to you.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-12">
            <ContactForm />
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
    <aside className="col-span-12 lg:col-span-4 lg:col-start-9">
      <Reveal delay={0.2}>
        <Signature ground="warm">Find us</Signature>

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
                className="mt-4 inline-block border-b border-terracotta/50 pb-1 text-[0.8rem] transition-colors duration-300 ease-soft hover:border-terracotta"
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
      <dt className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-3 text-[0.95rem] leading-[1.8] text-text">{children}</dd>
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
      className="mt-[5.5rem] bg-text py-[5rem] text-cream md:mt-[8rem] md:py-section lg:mt-[9rem]"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-cream/75">
                Looking for an event?
              </p>
              <h2
                id="contact-cta"
                className="mt-7 text-[2rem] font-light uppercase leading-[1.02] tracking-[-0.02em] md:text-[2.75rem] lg:text-[3.25rem]"
              >
                <span className="block">The programme,</span>
                <span className="block">date by date.</span>
              </h2>
            </Reveal>
          </div>

          <div className="col-span-12 mt-10 lg:col-span-4 lg:col-start-9 lg:mt-0">
            <Reveal delay={0.15}>
              <p className="max-w-[24rem] text-[0.95rem] leading-[1.85] text-cream/80">
                Every session lists its venue, its times and what you will make. If you already
                know what you are after, it is quicker than writing to us.
              </p>

              <Link
                href="/events"
                className="group mt-9 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-cream"
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
