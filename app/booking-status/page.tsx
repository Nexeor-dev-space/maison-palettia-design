import { Suspense } from "react";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { INK } from "@/components/sections/hero/composition";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";

import { BookingStatusLookup } from "@/components/booking/BookingStatusLookup";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Check your booking",
  description: "Look up a Maison Palettia booking by its reference to see its status.",
  path: "/booking-status",
  noindex: true,
});

/**
 * Look up a booking.
 *
 * Deliberately not in the primary navigation: it is a page someone arrives at
 * from a confirmation or a link, not one anyone browses to, and putting it in
 * the bar would spend one of three slots on an errand. It is reachable from
 * the confirmation, from the footer, and by URL.
 *
 * <Suspense> is required, not decorative — see the same note on
 * /payment-success.
 */
export default function BookingStatusPage() {
  return (
    /*
      ==========================================================================
      ON THE SITE'S OWN PAPER, IN THE SITE'S OWN HEADING — at the client's ask
      ==========================================================================

      This page was the odd one out and in three ways at once. It had no
      section at all, only a <Container> on whatever the body's ground happened
      to be, so it floated on a near-white the rest of the site never uses. Its
      eyebrow was hand-built rather than the shared <Eyebrow>. And its title
      was a plain uppercase sans — `text-h1 font-light uppercase` — where every
      other page on this site opens on an eyebrow and a script statement, which
      is the heading system the client asked for across the board.

      So it takes Light Sage, the deck's one ground, and the same two
      components every other opening uses. Nothing about the lookup changed:
      this is the frame around it.

      THE FORM KEEPS THE MEASURE AND THE MARKS TAKE THE REST. A reference field
      is a narrow thing and the page is a wide one, which is where the empty
      half came from. The shapes fill it the way the rest of the site fills a
      masthead — placed, low, behind everything.
    */
    <section
      aria-labelledby="booking-status-title"
      className="relative isolate overflow-hidden bg-sage py-[4rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={STATUS_SHAPES} />

      <Container className="relative">
        <Reveal>
          <Eyebrow>Your booking</Eyebrow>
        </Reveal>

        <DisplayHeading
          as="h1"
          id="booking-status-title"
          className="mt-7 md:mt-9"
          lines={["Check Your", "Booking."]}
        />

        <Reveal delay={0.08}>
          <p className="mt-7 max-w-[34rem] text-lead text-text/80">
            Enter the reference from your confirmation and we will show you where that booking
            stands.
          </p>
        </Reveal>

        {/*
          A real fallback rather than `null`, because the lookup is client-only
          — it reads a store that exists solely in the browser — so there is a
          frame where the page would otherwise show a heading, an instruction,
          and nothing to act on.
        */}
        <Suspense
          fallback={
            <p className="mt-12 text-body text-text/75 md:mt-14">Loading the lookup&hellip;</p>
          }
        >
          <BookingStatusLookup />
        </Suspense>
      </Container>
    </section>
  );
}

/*
  The shapes behind the lookup, in the half the form does not use.

  Held low and desktop-only, the same as every other plan on the site: they sit
  under a script heading and a form, and a ground that competes with either is
  not a ground. Light Sage is not among them — it is the ground.
*/
const STATUS_SHAPES: readonly ShapePlan[] = groundShapes([INK.lilac, INK.terracotta, INK.lavender], { seed: 5 });
