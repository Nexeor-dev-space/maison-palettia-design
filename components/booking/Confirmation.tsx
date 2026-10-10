"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BookingSummaryCard, type StatusCopy } from "@/components/booking/BookingSummaryCard";
import { displayStatus, parseOrderView, type DisplayStatus, type OrderView } from "@/components/booking/orderView";
import { Reveal } from "@/components/motion/Reveal";
import { BlobButton } from "@/components/ui/BlobButton";
import { completeBooking, pendingPaymentReference } from "@/lib/cart";

/** SPEC §H.5: poll every 3 s for up to 3 minutes. */
const POLL_EVERY_MS = 3_000;
const POLL_FOR_MS = 3 * 60_000;

const LINK_ROW =
  "group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text";
const LINK_LINE =
  "border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta";

/**
 * The confirmation — where Mamo Pay (or the mock gateway) sends the customer
 * back to: `/payment-success?ref&k` (+ Mamo's own `transactionId&status…`).
 *
 * THE SERVER HAS ALREADY LOOKED. app/(site)/payment-success reads the order,
 * checks `k` (the signed, expiring return key) and — when Mamo appended a
 * payment id — applies that payment before rendering, so most customers
 * land straight on "Confirmed". This component is what happens when the
 * payment is still being confirmed: it asks
 * `GET /api/site/orders/{ref}/status?k=` every 3 seconds for up to 3 minutes,
 * and when the state moves it re-renders the page on the server
 * (`router.refresh`), which is where the lines, tickets and invoice are read.
 * If the status route cannot answer, the refresh itself is the poll.
 *
 * Three outcomes, worded for what the customer can do about each:
 * Confirmed (tickets, "emailed to you"), Processing (wait, or come back from
 * the email), Not paid (back to checkout, where the basket is still held, to
 * try again on the same order).
 *
 * THE BASKET IS CLEARED HERE, AND ONLY HERE. Checkout keeps it while the
 * customer is away paying, so a declined card comes back to a full basket.
 * Once THIS order is confirmed, the basket it was made from goes, with the
 * details typed for it.
 */
export function Confirmation({
  reference,
  k,
  view,
  keyValid,
  statusCopy,
  purchaseConfirmedNote,
  terms,
}: {
  reference: string | null;
  k: string | null;
  /** The server's reading of the order, or null when there is no such reference. */
  view: OrderView | null;
  /** Whether `k` proved ownership; without it only the state is shown. */
  keyValid: boolean;
  statusCopy?: StatusCopy;
  purchaseConfirmedNote?: string;
  /** The "what a booking is" sentence (booking-settings). */
  terms: string;
}) {
  const status = view ? displayStatus(view.status) : null;
  const polling = usePollWhileProcessing(reference, k, view?.status ?? null, status === "processing");

  // Paid for (captured counts — `confirming` is only the tickets being issued):
  // forget the basket this order was made from.
  const paid = status === "confirmed" || status === "completed" || view?.status === "confirming";
  useEffect(() => {
    if (!reference || !paid) return;
    const pending = pendingPaymentReference();
    if (pending === null || pending === reference) completeBooking();
  }, [reference, paid]);

  if (!reference || !view || !status) return <NotFound reference={reference} />;

  return (
    <>
      <PageHeading>{view.status === "confirming" ? "Payment received." : HEADINGS[status]}</PageHeading>

      <div className="mt-12 md:mt-14" aria-live="polite">
        <BookingSummaryCard view={view} statusCopy={statusCopy} purchaseConfirmedNote={purchaseConfirmedNote} />
      </div>

      {status === "processing" ? (
        <p role="status" className="mt-6 max-w-[42rem] text-body text-text/80">
          {polling === "gave_up"
            ? "This is taking longer than usual. There is nothing more to do here: your confirmation and tickets will be emailed to you as soon as they are ready, and you can check this booking at any time with its reference."
            : view.status === "confirming"
              ? "Issuing your tickets… this page updates on its own."
              : "Checking with the payment provider… this page updates on its own."}
        </p>
      ) : null}

      {!keyValid ? (
        <p className="mt-6 max-w-[42rem] text-body text-text/80">
          To see the details of this booking, open the link in your confirmation email, or look it up with
          the email address it was made with.
        </p>
      ) : null}

      {status === "confirmed" || status === "completed" ? (
        <p className="mt-8 max-w-[42rem] text-fine leading-[1.8] text-text/75">
          {terms} A confirmation with your tickets and invoice has been sent to the email address on the
          booking.
        </p>
      ) : null}

      <div className="mt-11 flex flex-wrap items-center gap-x-9 gap-y-5">
        {status === "not_paid" ? (
          <BlobButton href={`/checkout?ref=${encodeURIComponent(reference)}&payment=failed`} className="px-7 py-4">
            Try the payment again
          </BlobButton>
        ) : (
          <BlobButton href="/events" className="px-7 py-4">
            View events
          </BlobButton>
        )}

        <Link href={`/booking-status?ref=${encodeURIComponent(reference)}`} className={LINK_ROW}>
          <span className={LINK_LINE}>Check booking status</span>
          <span
            aria-hidden
            className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </Link>
      </div>
    </>
  );
}

const HEADINGS: Record<DisplayStatus, string> = {
  confirmed: "You are booked.",
  processing: "Confirming your payment.",
  not_paid: "Payment not completed.",
  completed: "Your booking.",
  cancelled: "Your booking.",
  refunded: "Your booking.",
};

/**
 * Polls the status route while the order is processing; refreshes the server
 * render whenever the state it reports differs from the one on screen.
 * Returns "polling" while it is still looking, "gave_up" after three minutes.
 */
function usePollWhileProcessing(
  reference: string | null,
  k: string | null,
  shown: OrderView["status"] | null,
  active: boolean,
): "idle" | "polling" | "gave_up" {
  const router = useRouter();
  const [phase, setPhase] = useState<"polling" | "gave_up">("polling");
  const shownRef = useRef(shown);
  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    if (!active || !reference) return;
    const startedAt = Date.now();
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      if (Date.now() - startedAt > POLL_FOR_MS) {
        stopped = true;
        window.clearInterval(timer);
        setPhase("gave_up");
        return;
      }
      if (document.visibilityState !== "visible") return;
      try {
        const query = k ? `?k=${encodeURIComponent(k)}` : "";
        const response = await fetch(`/api/site/orders/${encodeURIComponent(reference)}/status${query}`, { cache: "no-store" });
        if (!response.ok) {
          // The status route is not answering: the server render is the poll.
          router.refresh();
          return;
        }
        const next = parseOrderView(await response.json());
        if (next && next.status !== shownRef.current) router.refresh();
      } catch {
        // Offline for a moment; the next tick tries again.
      }
    };

    const timer = window.setInterval(tick, POLL_EVERY_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [active, reference, k, router]);

  return active ? phase : "idle";
}

/**
 * No reference, or one that matches no booking. One screen for both, and no
 * guess about which: the way forward is the same — look it up with the
 * email it was made with.
 */
function NotFound({ reference }: { reference: string | null }) {
  return (
    <>
      <PageHeading>Find your booking.</PageHeading>

      <div className="mt-12 max-w-[38rem] border-l-2 border-terracotta bg-cream/60 p-7 md:p-9">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">No booking to show</p>
        <p className="mt-4 text-body text-text/80">
          {reference ? (
            <>
              We could not find a booking with the reference{" "}
              <span className="tabular-nums text-text">{reference}</span>. Check it against your confirmation
              email, or look the booking up with the email address it was made with.
            </>
          ) : (
            <>Open the link from your confirmation email, or look up your booking by its reference.</>
          )}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/booking-status" className={LINK_ROW}>
            <span className={LINK_LINE}>Check a booking</span>
          </Link>
          <Link href="/my-bookings" className={LINK_ROW}>
            <span className={LINK_LINE}>My bookings</span>
          </Link>
        </div>
      </div>
    </>
  );
}

/** The route's h1, set as app/(site)/payment-success always set it; only the words depend on the state. */
function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <h1 className="mt-9 max-w-[20ch] text-h1 font-light uppercase tracking-[-0.02em]">{children}</h1>
    </Reveal>
  );
}
