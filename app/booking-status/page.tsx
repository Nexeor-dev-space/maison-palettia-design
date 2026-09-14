import { Suspense } from "react";

import { BookingStatusLookup } from "@/components/booking/BookingStatusLookup";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Check your booking",
  description: "Look up a Maison Palettia booking by its reference to see its status.",
  path: "/booking-status",
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
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          Your booking
        </p>
        <h1 className="mt-9 max-w-[20ch] text-[2rem] font-light uppercase leading-[1.04] tracking-[-0.02em] md:text-[2.75rem] lg:text-[3.25rem]">
          Check your booking.
        </h1>
        <p className="mt-8 max-w-[34rem] text-body leading-[1.85] text-text/80">
          Enter the reference from your confirmation and we will show you where that booking
          stands.
        </p>
      </Reveal>

      {/*
        A real fallback rather than `null`, because the lookup is client-only —
        it reads a store that exists solely in the browser — so there is a
        frame where the page would otherwise show a heading, an instruction,
        and then nothing at all where the form belongs.
      */}
      <Suspense
        fallback={
          <p role="status" className="mt-12 text-body text-text/75 md:mt-14">
            Loading the lookup&hellip;
          </p>
        }
      >
        <BookingStatusLookup />
      </Suspense>
    </Container>
  );
}
