import { headers } from "next/headers";

import { Confirmation } from "@/components/booking/Confirmation";
import type { OrderView } from "@/components/booking/orderView";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import {
  applyReturnSnapshot,
  findOrderByReference,
  getBookingGate,
  normaliseReference,
  orderViewOf,
  verifyReturnKey,
} from "@/lib/booking";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your booking",
  description: "Your Maison Palettia booking reference and event details.",
  path: "/payment-success",
  noindex: true,
});

/*
  Per request, never cached: this page reads one customer's order and may
  apply their payment. `Referrer-Policy: no-referrer` comes from
  next.config.ts (NO_REFERRER_ROUTES), and ExternalAnalytics is not mounted
  here, so `k` never reaches a third party (SPEC §H.5).
*/
export const dynamic = "force-dynamic";

/** The return path's gateway call is a write; ten a minute per connection is far beyond a person. */
const RETURN_APPLY_LIMIT = { limit: 10, windowMs: 60_000 } as const;

type Search = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);

/**
 * The end of the booking journey: where Mamo Pay's hosted page (or the mock
 * one at /dev/mamo-mock) returns the customer — `return_url =
 * {publicUrl}/payment-success?ref={ref}&k={k}`, with Mamo's own
 * `createdAt&paymentLinkId&status&transactionId` appended (SPEC §H.3–H.5).
 *
 * In order:
 *   1. read the order by `ref` (no order → "find your booking");
 *   2. check `k` — signed, expiring; it alone unlocks the lines, tickets and
 *      invoice on this page (without it: the state only);
 *   3. with a valid `k` and Mamo's `transactionId`, apply that payment now
 *      (`applyReturnSnapshot` → `applyPaymentSnapshot`, idempotent, the same
 *      path the webhook takes) — so a customer who beats the webhook home
 *      lands on "Confirmed" rather than on a spinner;
 *   4. hand the result to <Confirmation>, which polls while the payment is
 *      still being confirmed.
 */
export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const rawRef = one(params.ref);
  const reference = rawRef ? normaliseReference(rawRef) : null;
  const k = one(params.k);
  const transactionId = one(params.transactionId);

  const gate = await getBookingGate();
  let order = reference ? await findOrderByReference(reference) : null;
  const keyValid = Boolean(order && reference && verifyReturnKey(order.reference, k));

  if (order && keyValid && transactionId) {
    const allowed = rateLimit("payment-return", ipHash(clientIp(await headers())), RETURN_APPLY_LIMIT);
    if (allowed) {
      await applyReturnSnapshot(order, transactionId);
      order = (await findOrderByReference(order.reference)) ?? order;
    }
  }

  const view: OrderView | null = order ? await orderViewOf(order, { detail: keyValid }) : null;

  return (
    <div className="relative isolate overflow-clip">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Your booking
          </p>
        </Reveal>

        {/* The h1 is <Confirmation>'s: only it knows which of the outcomes this is. */}
        <Confirmation
          reference={order?.reference ?? reference}
          k={keyValid ? k : null}
          view={view}
          keyValid={keyValid}
          statusCopy={gate.statusCopy}
          purchaseConfirmedNote={gate.purchaseConfirmedNote}
          terms={gate.terms}
        />
      </Container>
    </div>
  );
}
