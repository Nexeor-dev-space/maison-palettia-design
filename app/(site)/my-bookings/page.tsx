import { cookies } from "next/headers";
import Link from "next/link";

import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { MagicLinkContinue } from "@/components/booking/MagicLinkContinue";
import { MyBookingsRequest } from "@/components/booking/MyBookingsRequest";
import type { OrderView } from "@/components/booking/orderView";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { customerFromSession, getBookingGate, ordersForCustomer, SESSION_COOKIE } from "@/lib/booking";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "My bookings",
  description: "Your Maison Palettia bookings, tickets and invoices.",
  path: "/my-bookings",
  noindex: true,
});

/*
  Dynamic and never cached: it reads one customer's cookie and orders.
  `Referrer-Policy: no-referrer` comes from next.config.ts, and
  ExternalAnalytics is not mounted here (SPEC §H.10).
*/
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

/**
 * "My bookings" — guest access without accounts (SPEC §H.10).
 *
 * Three states, decided on the server:
 *
 *   ?t=<token> ..... the emailed link. Renders only a form that POSTs the
 *                    token (<MagicLinkContinue>); the POST spends it, sets
 *                    the session cookie and comes back here without it.
 *   signed in ...... the `mp_session` cookie verifies and its
 *                    `sessionVersion` matches the customer's: every order
 *                    made with that email, newest first, each with its
 *                    tickets and invoice as signed, expiring downloads.
 *   neither ........ "Email me a link" (<MyBookingsRequest>), with a line
 *                    saying why when a link has just failed (`?e=expired`).
 */
export default async function MyBookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const token = typeof params.t === "string" && params.t.length <= 512 ? params.t : null;
  const error = params.e === "expired" ? "expired" : params.e === "busy" ? "busy" : null;

  let customer = null;
  let orders: OrderView[] = [];
  if (!token) {
    customer = await customerFromSession((await cookies()).get(SESSION_COOKIE)?.value);
    if (customer) {
      try {
        orders = await ordersForCustomer(customer);
      } catch {
        orders = [];
      }
    }
  }
  const gate = customer ? await getBookingGate() : null;

  return (
    <section aria-labelledby="my-bookings-title" className="relative isolate overflow-hidden bg-sage py-[4rem] md:py-section lg:py-section-lg">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="relative">
        <Reveal>
          <Eyebrow>Your bookings</Eyebrow>
        </Reveal>
        <DisplayHeading as="h1" id="my-bookings-title" className="mt-7 md:mt-9" lines={["My", "Bookings."]} />

        {token ? (
          <MagicLinkContinue token={token} />
        ) : customer && gate ? (
          <>
            <Reveal delay={0.08}>
              <p className="mt-7 max-w-[34rem] text-lead text-text/80">
                Every booking made with {customer.email}. Tickets and invoices download from each one.
              </p>
            </Reveal>

            <div className="mt-12 flex flex-col gap-10">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <BookingSummaryCard
                    key={order.reference}
                    view={order}
                    statusCopy={gate.statusCopy}
                    purchaseConfirmedNote={gate.purchaseConfirmedNote}
                  />
                ))
              ) : (
                <div className="plate max-w-[38rem] rounded-[1.25rem] bg-cream p-7 md:p-9">
                  <p className="text-label font-medium uppercase tracking-eyebrow text-text">No bookings yet</p>
                  <p className="mt-4 text-body text-text/80">
                    There are no bookings for this email address yet.{" "}
                    <Link href="/events" className="border-b border-terracotta/50 pb-0.5 hover:border-terracotta">
                      See what is on
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>

            <p className="mt-10 max-w-[40rem] text-body text-text/80">
              Need to change something? Reply to your confirmation email or{" "}
              <Link href="/contact" className="border-b border-terracotta/50 pb-0.5 hover:border-terracotta">
                get in touch
              </Link>{" "}
              with your booking reference. Cancellations follow the{" "}
              <Link href="/policies" className="border-b border-terracotta/50 pb-0.5 hover:border-terracotta">
                booking policies
              </Link>
              .
            </p>

            {/* On a shared tablet the next person should not see these. */}
            <form method="post" action="/api/site/my-bookings/consume" className="mt-8">
              <input type="hidden" name="signout" value="1" />
              <button
                type="submit"
                className="text-action font-medium uppercase tracking-eyebrow text-text underline decoration-terracotta/50 underline-offset-[6px] hover:decoration-terracotta"
              >
                Sign out of my bookings
              </button>
            </form>
          </>
        ) : (
          <>
            <Reveal delay={0.08}>
              <p className="mt-7 max-w-[34rem] text-lead text-text/80">
                No account needed. Enter the email you booked with and we will send you a link to every booking,
                ticket and invoice made with it.
              </p>
            </Reveal>
            {error ? (
              <p role="status" className="mt-8 max-w-[36rem] border-l-2 border-terracotta pl-5 text-body text-text">
                {error === "busy"
                  ? "Too many attempts from this connection just now. Please wait a minute and open the link again."
                  : "That link has expired or has already been used. Links work once, for 30 minutes — ask for a new one below."}
              </p>
            ) : null}
            <MyBookingsRequest />
          </>
        )}
      </Container>
    </section>
  );
}
