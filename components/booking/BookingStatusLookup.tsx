"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { BookingSummaryCard, type StatusCopy } from "@/components/booking/BookingSummaryCard";
import { parseOrderView, type OrderView } from "@/components/booking/orderView";
import { BlobButton } from "@/components/ui/BlobButton";

const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lead text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft focus:border-primary focus:outline-none focus:ring-0";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

type Outcome =
  | { status: "found"; view: OrderView; k?: string }
  | { status: "none" }
  | { status: "rate_limited" }
  | { status: "error" };

/**
 * Look a booking up by its reference AND the email it was made with.
 *
 * Both, because a reference alone is six characters printed on a screen and
 * an email — and anyone who has seen it over a shoulder would see a
 * stranger's name, phone and tickets. The server (`POST
 * /api/site/orders/lookup`, 10 an hour per connection and email, SPEC
 * §H.10) answers only when the pair matches, and answers "no booking found"
 * for every pair that does not, so it cannot be used to discover which
 * references exist.
 *
 * `?ref=` is honoured on arrival, so the confirmation's "Check booking
 * status" lands with the reference already filled in.
 *
 * Nothing is kept in the browser: the result lives in this component's state
 * and goes when the tab does. For every booking made with an email, there
 * is /my-bookings and its emailed link.
 */
export function BookingStatusLookup({
  initialReference,
  prefix,
  statusCopy,
  purchaseConfirmedNote,
}: {
  initialReference: string;
  /** "MP-" — booking-settings.referencePrefix. */
  prefix: string;
  statusCopy?: StatusCopy;
  purchaseConfirmedNote?: string;
}) {
  const id = useId();
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const reference = String(data.get("ref") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!reference || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(!reference ? "Please enter your booking reference." : "Please enter the email address the booking was made with.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    setOutcome(null);
    try {
      const response = await fetch("/api/site/orders/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference, email }),
        cache: "no-store",
      });
      if (response.status === 429) setOutcome({ status: "rate_limited" });
      else if (response.status === 404) setOutcome({ status: "none" });
      else if (!response.ok) setOutcome({ status: "error" });
      else {
        const body: unknown = await response.json();
        const view = parseOrderView(body, reference.toUpperCase());
        // The lookup answers with a fresh return key: the full confirmation —
        // tickets and invoice as signed downloads — is one link away.
        const k = (body as { k?: unknown } | null)?.k;
        setOutcome(view ? { status: "found", view, k: typeof k === "string" ? k : undefined } : { status: "none" });
      }
    } catch {
      setOutcome({ status: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="mt-12 grid max-w-[40rem] gap-x-8 gap-y-8 sm:grid-cols-2 md:mt-14">
        <div>
          <label htmlFor={`${id}-ref`} className={LABEL}>
            Booking reference
          </label>
          <input
            id={`${id}-ref`}
            name="ref"
            defaultValue={initialReference}
            placeholder={`${prefix}4K7XY2`}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={`${id}-hint`}
            className={`${FIELD} uppercase tabular-nums tracking-[0.08em] placeholder:tracking-[0.08em]`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={LABEL}>
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={FIELD}
          />
        </div>
        <p id={`${id}-hint`} className="text-fine leading-[1.7] text-text/75 sm:col-span-2">
          The reference is on your confirmation and looks like {prefix} followed by six characters. Use the
          email address the booking was made with.
        </p>

        <div role="alert" className="sm:col-span-2">
          {fieldError ? (
            <p className="max-w-[36rem] border-l-2 border-terracotta pl-5 text-body text-text">{fieldError}</p>
          ) : null}
        </div>

        {/* `deep`: this form stands on Light Sage, where the default tone would vanish under the pointer. */}
        <BlobButton type="submit" tone="deep" disabled={submitting} className="w-full justify-center px-8 py-4 sm:w-auto">
          {submitting ? "Looking…" : "Check status"}
        </BlobButton>
      </form>

      <div aria-live="polite" className="mt-12">
        {outcome?.status === "found" ? (
          <>
            <BookingSummaryCard view={outcome.view} statusCopy={statusCopy} purchaseConfirmedNote={purchaseConfirmedNote} />
            {outcome.k ? (
              <Link
                href={`/payment-success?ref=${encodeURIComponent(outcome.view.reference)}&k=${encodeURIComponent(outcome.k)}`}
                className="group mt-8 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
              >
                <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                  Tickets and invoice
                </span>
                <span
                  aria-hidden
                  className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            ) : null}
          </>
        ) : null}

        {outcome && outcome.status !== "found" ? (
          <div className="plate max-w-[38rem] rounded-[1.25rem] bg-cream p-7 md:p-9">
            <p className="text-label font-medium uppercase tracking-eyebrow text-text">
              {outcome.status === "none" ? "No booking found" : "We could not look that up"}
            </p>
            <p className="mt-4 text-body text-text/80">
              {outcome.status === "none"
                ? "No booking matches that reference and email together. Check both against your confirmation email — the email must be the one the booking was made with."
                : outcome.status === "rate_limited"
                  ? "Several lookups have been made from this connection in the last hour. Please try again later, or use the link in your confirmation email."
                  : "Something went wrong on our side. Please try again in a moment."}
            </p>
            <Link
              href="/my-bookings"
              className="group mt-7 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                Email me a link to my bookings
              </span>
              <span
                aria-hidden
                className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
