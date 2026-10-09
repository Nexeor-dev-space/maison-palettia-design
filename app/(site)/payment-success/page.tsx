import { Suspense } from "react";

import { Confirmation } from "@/components/booking/Confirmation";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your booking",
  description: "Your Maison Palettia booking reference and event details.",
  path: "/payment-success",
  noindex: true,
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
    <div className="relative isolate overflow-clip">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Your booking
          </p>
          {/*
            THE HEADING MOVED INTO <Confirmation>.

            It said "Booking confirmed" and "Your place is held." once — over a
            card that, while no backend records anything, reads "Pending ·
            waiting on confirmation from the Maison". Then "Your reference is
            ready.", which was meant to be true in both states and was not:
            with no `?ref=`, or one this browser has never seen, it sat
            directly above "No booking to show", announcing a reference the
            box beneath it said did not exist.

            Only <Confirmation> knows whether a booking was found, so it draws
            the h1 for each branch — "Your reference is ready." over a record,
            "Find your booking." over the empty state — with the same classes
            this used. The eyebrow stays here because it is true of every
            branch. The flags would not decide it either: they are readable
            here now (lib/bookingFlags.ts), but whether there is a booking to
            show is a fact about this browser's storage, not about the backend.
          */}
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
    </div>
  );
}
