import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { PrivateEventEnquiry } from "@/components/private-events/PrivateEventEnquiry";
import { Container } from "@/components/ui/Container";
import { PRIVATE_EVENT_STEPS } from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Plan a private event",
  description:
    "Tell Maison Palettia about your gathering and we will come back to you with what the creative session could look like.",
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
 * A thin server shell around a client form, which is the shape /contact uses.
 */
export default function PrivateEventBookingPage() {
  return (
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

      <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-16 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-7">
          <Reveal>
            <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
              <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
              Private events
            </p>
            <h1 className="mt-9 max-w-[18ch] text-[2rem] font-light uppercase leading-[1.04] tracking-[-0.02em] md:text-[2.75rem] lg:text-[3.25rem]">
              Plan your private experience.
            </h1>
            <p className="mt-8 max-w-[34rem] text-body leading-[1.85] text-text/80">
              Tell us who is coming and what you would like them to make. The more you can say
              the more useful our reply will be — but an estimate is enough to start with, and
              nothing you send here is fixed.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-14 md:mt-16">
            <PrivateEventEnquiry />
          </Reveal>
        </div>

        {/*
          What happens next, beside the form rather than after it.
          ---------------------------------------------------------------
          The same four steps the previous page sets out, restated where
          someone is deciding whether the effort of filling this in is worth
          it. Read from the same constant, so the two pages cannot drift.
        */}
        <Reveal
          variant="fadeIn"
          delay={0.25}
          className="col-span-12 lg:col-span-4 lg:col-start-9"
        >
          <aside aria-labelledby="what-happens-next" className="bg-cream p-7 md:p-8">
            <h2
              id="what-happens-next"
              className="text-label font-medium uppercase tracking-eyebrow text-text/75"
            >
              What happens next
            </h2>

            <ol className="mt-7 flex flex-col gap-6">
              {PRIVATE_EVENT_STEPS.map((step) => (
                <li key={step.number} className="flex gap-5 border-t border-text/15 pt-5 first:border-0 first:pt-0">
                  {/* /75: on White Rock, /45 measures 2.34:1 and these
                      numerals are how a sighted reader gets the order. */}
                  <span
                    aria-hidden
                    className="shrink-0 text-label font-medium tabular-nums tracking-eyebrow text-text/75"
                  >
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-body font-medium leading-snug text-text">{step.title}</h3>
                    <p className="mt-2 text-fine leading-[1.7] text-text/75">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          {/*
            The public programme, offered as the thing that can actually be
            booked today. Not a consolation prize — someone who wanted a
            creative afternoon and has just been told the enquiry goes nowhere
            should be handed the part of this site that works.
          */}
          <Link
            href="/events"
            className="group mt-8 inline-flex items-center gap-3 -my-1.5 py-1.5 text-label font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-text/30 pb-1 transition-colors duration-300 ease-soft group-hover:border-text">
              Or book a public event
            </span>
            <span
              aria-hidden
              className="text-text transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </Reveal>
      </div>
    </Container>
  );
}
