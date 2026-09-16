import { Suspense } from "react";

import { Confirmation } from "@/components/booking/Confirmation";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your booking",
  description: "Your Maison Palettia booking reference and event details.",
  path: "/payment-success",
});

/**
 * The end of the booking journey.
 *
 * The route is `/payment-success` because that is the path the brief names and
 * the one a payment provider would redirect to; the page itself is careful
 * never to claim a payment happened while none can — see <Confirmation> and
 * PAYMENT_CONFIGURED in lib/booking.ts.
 *
 * <Suspense> is required rather than decorative: <Confirmation> reads the
 * reference with `useSearchParams`, and Next will not prerender a page
 * containing that hook unless the boundary is there to fall back to.
 */
export default function PaymentSuccessPage() {
  return (
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          Your booking
        </p>
        {/*
          This said "Booking confirmed" and "Your place is held." — over a card
          that, while no backend records anything, reads "Pending · waiting on
          confirmation from the Maison". The page was contradicting its own
          record in the one place a customer most needs to trust it, and the
          old wording would have sent someone across Dubai to a table nobody
          had set.

          The heading is now true in both states and says nothing the record
          does not: a reference always exists, and the card carries the status.
          It deliberately does NOT read the BOOKING_CONFIGURED flag — lib/
          booking.ts pulls in `useSyncExternalStore` without a "use client"
          directive, so importing it here breaks the build. See the note in the
          Phase 9 report; that module should carry the directive.
        */}
        <h1 className="mt-9 max-w-[20ch] text-h1 font-light uppercase tracking-[-0.02em]">
          Your reference is ready.
        </h1>
      </Reveal>

      <Suspense
        fallback={
          <p role="status" className="mt-12 text-body text-text/75">
            Looking up your booking&hellip;
          </p>
        }
      >
        <Confirmation />
      </Suspense>
    </Container>
  );
}
