import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";

import { BookingStatusLookup } from "@/components/booking/BookingStatusLookup";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { getBookingGate } from "@/lib/booking";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Check your booking",
  description: "Look up a Maison Palettia booking by its reference and email to see its status.",
  path: "/booking-status",
  noindex: true,
});

/* Reads `?ref=` per request; nothing about a booking is ever prerendered. */
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

/**
 * Look up a booking — by reference and the email it was made with
 * (SPEC §H.10). The answer comes from `POST /api/site/orders/lookup`; see
 * <BookingStatusLookup> for why both are asked for.
 *
 * Deliberately not in the primary navigation: it is a page someone arrives
 * at from a confirmation or a link, not one anyone browses to. Reachable
 * from the confirmation, from the footer, and by URL.
 */
export default async function BookingStatusPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.slice(0, 16) : "";
  const gate = await getBookingGate();

  return (
    /*
      On Light Sage, the deck's one ground, with the eyebrow and script
      statement every other page opens on — this page's frame, unchanged.
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

        <DisplayHeading as="h1" id="booking-status-title" className="mt-7 md:mt-9" lines={["Check Your", "Booking."]} />

        <Reveal delay={0.08}>
          <p className="mt-7 max-w-[34rem] text-lead text-text/80">
            Enter the reference from your confirmation and the email you booked with, and we will show you
            where that booking stands.
          </p>
        </Reveal>

        <BookingStatusLookup
          initialReference={ref}
          prefix={gate.referencePrefix}
          statusCopy={gate.statusCopy}
          purchaseConfirmedNote={gate.purchaseConfirmedNote}
        />
      </Container>
    </section>
  );
}

/*
  The shapes behind the lookup, in the half the form does not use. Held low
  and desktop-only, the same as every other plan on the site.
*/
const STATUS_SHAPES: readonly ShapePlan[] = groundShapes("sage");
