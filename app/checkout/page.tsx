import Link from "next/link";

import { Steps } from "@/components/booking/Steps";
import { Checkout } from "@/components/booking/Checkout";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your Maison Palettia booking.",
  path: "/checkout",
});

/**
 * Step four — the basket, the details and the payment, on one page.
 *
 * There is no `/cart` route and there should not be: the client asked for one
 * checkout, and a basket that holds one session on one date has nothing to
 * browse back to. See <Checkout> for the rest of that argument.
 *
 * A thin server shell around a client tree, because the basket lives in the
 * browser. The header and footer come from the root layout unchanged — the
 * brief allows a reduced checkout navigation and it is not worth taking: this
 * is a studio booking a Saturday morning, not a cart worth defending with a
 * stripped chrome.
 */
export default function CheckoutPage() {
  return (
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <Link
          href="/events"
          className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
        >
          <span
            aria-hidden
            className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
          >
            &#8592;
          </span>
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            Back to sessions
          </span>
        </Link>
      </Reveal>

      <Steps current={2} />

      <Reveal className="mt-12 md:mt-14">
        <h1 className="text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] md:text-[2.25rem]">
          Complete your booking.
        </h1>
      </Reveal>

      <Checkout />
    </Container>
  );
}
