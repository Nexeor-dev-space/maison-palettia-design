import Image from "next/image";
import Link from "next/link";

import styles from "@/components/booking/PaintBooking.module.css";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { PrivateEventEnquiry } from "@/components/private-events/PrivateEventEnquiry";
import { Container } from "@/components/ui/Container";
import { getCreativeExperiences } from "@/lib/experiences";
import { PRIVATE_EVENT_IMAGES, PRIVATE_EVENT_STEPS } from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/* The same two sentences of the client's p37 band the page's own intro
   prints (see the note there), so the search snippet and the page speak in
   one voice. It was "Tell Maison Palettia about your gathering and we will
   come back to you…", the wording that rewrite replaced. */
export const metadata = buildMetadata({
  title: "Plan a private event",
  description:
    "Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.",
  path: "/private-events/book",
});

/**
 * /private-events/book — the enquiry.
 *
 * WHY THIS PAGE EXISTS AT ALL. The brief specifies the private-events call to
 * action and names this path as its destination. Shipping the button without
 * the page behind it would put a 404 at the end of the one thing that page is
 * asking anyone to do, so the two were built together.
 *
 * WHY IT IS AN ENQUIRY AND NOT THE BOOKING FLOW. `/events/[slug]/book` exists
 * and works, and none of it applies here: it holds a seat on a scheduled
 * session at a known price, and a private event has no date, no price and no
 * seat count until somebody talks to the studio. Pointing this at the basket
 * would mean inventing all three. So nothing in the booking flow is touched,
 * reused or altered — this page writes to the enquiry seam in lib/enquiry.ts,
 * which the contact form already uses.
 *
 * "Book" is in the path because the brief names that path. The page itself
 * never uses the word: nothing is booked here, and a heading that said
 * otherwise would be the same false promise as a thank-you screen over a form
 * that goes nowhere.
 *
 * A thin server shell around a client form, which is the shape /contact uses
 * — and the shell is what reads the activity list, because
 * `getCreativeExperiences()` is async and a client component cannot await it.
 */
/* The small caps label, the same string <PlaceCard> uses on the other route
   — a card that is meant to be the twin of another should not re-type its
   type. */
const EYEBROW = "text-label font-medium uppercase tracking-eyebrow text-text/75";

export default async function PrivateEventBookingPage() {
  /*
    The studio's own approved list, which is also what /private-events shows.
    One source, so the select can never offer something the page before it did
    not, and a new activity reaches both surfaces with no edit here.

    The client's own flag travels with the name where there is one. Dropping
    "Glass painting" from the list would hide an activity the studio wants
    known about; offering it unmarked would imply it can be had next month. The
    flag in the label is the only version of this that is true.
  */
  const activities = (await getCreativeExperiences()).map((experience) =>
    experience.status ? `${experience.name} (${experience.status})` : experience.name,
  );

  return (
    <div className="relative isolate overflow-clip">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <Reveal>
          <Link
            href="/private-events"
            className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span
              aria-hidden
              className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
            >
              &#8592;
            </span>
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Back to private events
            </span>
          </Link>
        </Reveal>

        {/*
          ==============================================================
          THE GRID MOVED INTO <PrivateEventEnquiry>, at the client's ask
          ==============================================================

          The ticket's stub fills in as the form is written now — the name
          in it, a tick per contact given, five strokes of paint behind
          them. That only works if one component holds both columns, which
          is why <BookingForm> owns the equivalent grid on the other route.

          So this page is the shell it should have been: the masthead and
          the card's FACE are static and are handed down; everything that
          moves belongs to the form.
        */}
        <div className="mt-12 md:mt-16">
          <PrivateEventEnquiry
            activities={activities}
            intro={
              <Reveal>
                <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
                  <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
                  Private events
                </p>
                <h1 className="mt-8 heading-script text-script-section">
                  Plan Your Private Experience.
                </h1>
                {/*
                  THE CLIENT'S WORDS FOR THIS INVITATION, from the p37 band on
                  /private-events that sends people here — its second and
                  third sentences, exactly. The opening "Have something in
                  mind?" is left on that band: whoever reads this has just
                  answered it by clicking through. This was "Tell us who is
                  coming and what you would like them to make…", the voice
                  that rewrite replaced. Its reassurance — an estimate is
                  enough, nothing is fixed — is not lost: the fieldset opens
                  on "Answer what you know" and the stub closes on "Nothing
                  here is fixed once you send it."
                */}
                <p className="mt-8 max-w-[34rem] text-body text-text/80">
                  Tell us when, who’s coming and what you’d like to make. We’ll help turn the
                  idea into an experience made for your group.
                </p>
              </Reveal>
            }
            face={
              <div className={cn(styles.faceCut, "overflow-hidden rounded-t-[1.5rem] bg-cream")}>
          {/*
        The same photograph the page before this used, and now it is
        the card's face rather than a plate below it — continuity, and
        the picture a visitor arrived on meeting them at the form.
        2:1 capped at 10rem for the reason above: a card that cannot
        fit the window cannot stick.
          */}
          <div className="relative aspect-[2/1] max-h-[10rem] w-full">
        <Image
          src={PRIVATE_EVENT_IMAGES.experience.src}
          alt={PRIVATE_EVENT_IMAGES.experience.alt}
          fill
          sizes="(min-width: 1024px) 31vw, calc(100vw - 2 * max(0.75rem, 1.3889vw))"
          className="object-cover"
        />
          </div>

          {/* `px-6 pb-5 pt-5` — <SessionSummary>'s own figures. This was
          `px-6 pb-6 pt-5 md:px-7`, so the two cards sat 4px apart in
          their side padding and 4px apart at the foot, which is the
          kind of difference nobody can name and everybody sees. */}
          <div className="px-6 pb-5 pt-5">
        <h2 id="what-happens-next" className={EYEBROW}>
          What happens next
        </h2>

        {/*
          ONE HAIRLINE AT THE TOP, NOT ONE BETWEEN EVERY ROW. The
          other card's facts are a single `dl` under a single rule;
          this had a rule above every step, which drew three
          horizontal lines into a card whose neighbour has one and
          made the list read as three separate blocks. `gap-y-4`
          against that card's `gap-y-3.5` — a step is a title and a
          sentence where a fact is a label and a value.
        */}
        <ol className="mt-4 flex flex-col gap-4 border-t border-text/15 pt-4">
          {PRIVATE_EVENT_STEPS.map((step) => (
        <li key={step.number} className="flex gap-4">
          {/*
            NO `tracking-eyebrow` ON THE NUMERAL, which is what
            was setting "01" as "0 1". The 0.18em that makes a
            three-word label legible in caps is, on two digits,
            a gap wide enough to read as two numbers. Tabular
            and /75 — at /45 these measure 2.34:1 on White Rock
            and they are how a sighted reader gets the order.
          */}
          <span
            aria-hidden
            className="shrink-0 text-label font-medium tabular-nums text-text/75"
          >
            {step.number}
          </span>
          <div className="min-w-0">
            {/* `text-body` against the other card's `text-lead`
                value: there are three of these and one of that,
                so the same size would make this card shout. */}
            <h3 className="text-body font-medium leading-snug text-text">
              {step.title}
            </h3>
            <p className="mt-1.5 text-fine leading-[1.7] text-text/75">
              {step.detail}
            </p>
          </div>
        </li>
          ))}
        </ol>
          </div>
          </div>
            }
          />
        </div>

      </Container>
    </div>
  );
}
