import Link from "next/link";

import { BookingClosed } from "@/components/booking/BookingClosed";
import { Steps } from "@/components/booking/Steps";
import { Checkout } from "@/components/booking/Checkout";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { PageUtilityBar } from "@/components/layout/PageUtilityBar";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { REFERENCE_PATTERN } from "@/cms/lib/reference";
import { getBookingGate, getCheckoutCatalogue, getCheckoutSettings, normaliseReference } from "@/lib/booking";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your Maison Palettia booking.",
  path: "/checkout",
  noindex: true,
});

/*
  Per request: the open/closed switch, the terms versions and what is on sale
  are read at the moment of paying, never from a prerender.
*/
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

/**
 * Step four — the basket, the details and the payment, on one page.
 *
 * There is no `/cart` route and there should not be: the client asked for one
 * checkout, and a basket that holds one session on one date has nothing to
 * browse back to. See <Checkout> for the rest of that argument.
 *
 * A server shell around a client tree, because the basket lives in the
 * browser. The shell reads what only the server knows — whether bookings are
 * open, which policies must be agreed to and in which version, the slug → id
 * map for what is on sale — and hands it down.
 *
 * CLOSED (`booking-settings.bookingsOpen` off): no form and no Pay button,
 * only the admin's closed message and its Contact link (SPEC §H.3: the UI
 * never shows Pay while closed; the 503 from the route is only the guard).
 *
 * `?ref&payment=failed` is Mamo's `failure_return_url`: the customer is back
 * from a declined or abandoned payment, and <Checkout> says so above the
 * form and retries on the same order.
 */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const rawRef = typeof params.ref === "string" ? normaliseReference(params.ref) : null;
  const retryReference = params.payment === "failed" && rawRef && REFERENCE_PATTERN.test(rawRef) ? rawRef : null;

  const gate = await getBookingGate();
  const [settings, catalogue] = gate.open ? await Promise.all([getCheckoutSettings(), getCheckoutCatalogue()]) : [null, null];

  return (
    /* `pb-0` — see the note on the same change in app/events/[slug]: the
       utility bar closes this page as a Deep Lilac field and meets the
       footer's wave directly. */
    <div className="relative isolate overflow-clip">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="pb-0 pt-[3.5rem] md:pt-[5rem] lg:pt-[6rem]">
        <Reveal>
          <Link
            href="/events"
            className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span
              aria-hidden
              className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
            >
              &#8592;
            </span>
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Back to events
            </span>
          </Link>
        </Reveal>

        {settings && catalogue ? (
          <>
            <Steps current={2} />

            <Reveal className="mt-12 md:mt-14">
              <h1 className="text-h1 font-light tracking-[-0.02em]">
                Complete Your Booking.
              </h1>
            </Reveal>

            <Checkout
              catalogue={catalogue}
              requireTerms={settings.requireTerms}
              consents={settings.consents}
              captureNote={settings.captureNote}
              terms={gate.terms}
              retryReference={retryReference}
            />
          </>
        ) : (
          <BookingClosed message={gate.closed.message} ctaLabel={gate.closed.ctaLabel} ctaHref={gate.closed.ctaHref} />
        )}

        {/*
          Reassurance and a way out, not a second action. Checkout already has
          exactly one primary control and this must not argue with it, so there
          is nothing here that books, pays or confirms — only the two questions
          someone actually has at this moment, and where each is answered.

          NO NOTE HERE, ON PURPOSE. What a booking is has one sentence
          (booking-settings → "What a booking is"), and <Checkout> prints it
          beside Pay, where it is read before the press. Repeating it here
          would be the page saying it twice.
        */}
        <PageUtilityBar
          links={[
            { label: "Check a booking", href: "/booking-status" },
            { label: "Questions", href: "/faq" },
            { label: "Contact", href: "/contact" },
          ]}
        />
      </Container>
    </div>
  );
}
