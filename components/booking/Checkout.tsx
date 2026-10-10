"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { CartSummary } from "@/components/booking/CartSummary";
import { PassCodeField, type CodeOutcome } from "@/components/booking/PassCodeField";
import { useAnySessionPassed } from "@/components/booking/SessionClock";
import { Reveal } from "@/components/motion/Reveal";
import { BlobButton } from "@/components/ui/BlobButton";
import {
  BOOKING_FIELD_ORDER,
  basketFingerprint,
  basketIdFor,
  completeBooking,
  notePendingPayment,
  readWaitlistToken,
  requestQuote,
  saveBookingDetails,
  startCheckout,
  useBookingDetails,
  useCart,
  useCartHydrated,
  validateBookingDetails,
  type BookingDetails,
  type CartLine,
  type CheckoutLineInput,
  type QuoteView,
  type StartCheckoutOutcome,
} from "@/lib/cart";
import { cn, formatMoney } from "@/lib/utils";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";
const FIELD =
  "w-full border-0 border-b bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:outline-none focus:ring-0";

/** Said beside the disabled button and on a refused press — one wording. */
const PASSED_LINE_MESSAGE =
  "A date in your booking has already passed, so it cannot be booked. Remove it to continue.";

const MAX_CODES = 3;

/** A policy the customer agrees to before paying (`getCheckoutSettings`, lib/booking.ts). */
export interface CheckoutConsent {
  policy: string;
  version: number;
  title: string;
  href: string;
}

export interface CheckoutProps {
  /** Slug → CMS id for what is on sale now, for basket lines that carry no id. */
  catalogue: { sessions: Record<string, string>; passes: Record<string, string> };
  /** `payment-settings.checkout.requireTerms` — and the policies it covers. */
  requireTerms: boolean;
  consents: CheckoutConsent[];
  /** The line under the Pay button. */
  captureNote: string;
  /** The "what a booking is" sentence. */
  terms: string;
  /** `/checkout?ref&payment=failed`: the customer is back from a declined or abandoned payment. */
  retryReference: string | null;
}

/**
 * Checkout — the basket, the details and Pay, on one page.
 *
 * WHAT PAY DOES (SPEC §H.3). The basket is a browser snapshot (lib/cart.ts);
 * the server is the truth. Pressing Pay sends the lines BY ID with the
 * details, the codes, the agreed policy versions and the basket's id to
 * `POST /api/site/checkout/start`, which re-prices every line from the
 * database, reserves the code and pass credits and the seats in one
 * transaction, and answers with Mamo Pay's hosted page — or, when nothing is
 * owed, a confirmed reference. The browser then goes to that page; the
 * confirmation at /payment-success is where it comes back.
 *
 * THE BASKET STAYS UNTIL THE ORDER IS CONFIRMED. A declined card returns to
 * `/checkout?ref&payment=failed` with everything still here, and pressing
 * Pay again re-uses the same order (same `basketId`) with a new payment
 * link, instead of holding the seats a second time.
 *
 * GUEST ONLY. There are no customer accounts (SPEC §H.10); the line under
 * "Your details" says so where a customer is deciding whether to type.
 *
 * Two columns that swap importance by width: below `lg` the summary comes
 * first, because a phone should show what is being paid for before it asks
 * for anything; from `lg` it moves right and the form takes the left.
 *
 * THE SUMMARY IS NOT INSIDE THE FORM. It carries the code box, which is a
 * form of its own, and forms do not nest — Enter in the code box would
 * otherwise press Pay.
 */
export function Checkout({ catalogue, requireTerms, consents, captureNote, terms, retryReference }: CheckoutProps) {
  const { lines, setQuantity, remove, subtotal, places, currency } = useCart();
  const hydrated = useCartHydrated();
  const details = useBookingDetails();
  const router = useRouter();
  const ids = useId();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [quote, setQuote] = useState<{ fingerprint: string; view: QuoteView } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  /*
    A LAPSED DATE CANNOT BE BOOKED. A basket outlives the page it was filled
    from, so checkout asks the visitor's clock about every session line —
    live, so a tab left open flips at the start time — and while any has gone
    by Pay is disabled with the reason beside it. The server refuses the same
    line regardless (sales close at the start time).
  */
  const sessionStarts = lines.flatMap((line) => (line.kind === "session" ? [line.startsAt] : []));
  const hasPassedLine = useAnySessionPassed(sessionStarts);

  // Focus the first field that needs attention, so a failed press is actionable.
  useEffect(() => {
    const first = BOOKING_FIELD_ORDER.find((name) => errors[name]);
    if (!first || !formRef.current) return;
    formRef.current.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }, [errors]);

  if (!hydrated) return <LoadingBasket />;
  if (lines.length === 0) return <EmptyCart retryReference={retryReference} />;

  const fingerprint = basketFingerprint(lines);
  // A quote is only good for the basket it priced: change a quantity and the
  // total goes back to the lines' own sum until the codes are re-checked.
  const freshQuote = quote && quote.fingerprint === fingerprint ? quote.view : null;
  const totalAed = freshQuote ? freshQuote.totals.grossFils / 100 : subtotal;
  const resolved = resolveLines(lines, catalogue);

  const currentEmail = () =>
    formRef.current?.querySelector<HTMLInputElement>('[name="email"]')?.value.trim() || details?.email || undefined;

  async function priceWith(nextCodes: string[], basket: readonly CartLine[] = lines): Promise<CodeOutcome> {
    const { inputs, missing } = resolveLines(basket, catalogue);
    if (missing.length > 0) return { status: "error" };
    const result = await requestQuote({ lines: inputs, codes: nextCodes, email: currentEmail() });
    if (result.status !== "ok") return result;
    setQuote({ fingerprint: basketFingerprint(basket), view: result.quote });
    return { status: "applied" };
  }

  async function applyCode(code: string): Promise<CodeOutcome> {
    if (codes.length >= MAX_CODES) return { status: "too_many" };
    const next = [...codes, code];
    const { inputs, missing } = resolveLines(lines, catalogue);
    if (missing.length > 0) return { status: "error" };
    const result = await requestQuote({ lines: inputs, codes: next, email: currentEmail() });
    if (result.status !== "ok") return result;
    const rejected = result.quote.rejectedCodes.find((entry) => entry.code.toUpperCase() === code);
    if (rejected) return { status: "rejected", reason: rejected.reason };
    setCodes(next);
    setQuote({ fingerprint, view: result.quote });
    return { status: "applied" };
  }

  function removeCode(code: string) {
    const next = codes.filter((entry) => entry !== code);
    setCodes(next);
    if (next.length === 0) setQuote(null);
    else void priceWith(next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    // Asked at the instant of the press: the disabled state is only as fresh as the last render.
    const now = Date.now();
    if (sessionStarts.some((startsAt) => Date.parse(startsAt) <= now)) {
      setFormError(PASSED_LINE_MESSAGE);
      return;
    }

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const submitted: BookingDetails = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      // Carried from the booking step, where it was asked.
      notes: details?.notes,
    };

    const next = validateBookingDetails(submitted);
    const needsConsent = requireTerms && consents.length > 0;
    if (needsConsent && data.get("consent") !== "yes") {
      next.consent = "Please confirm you have read and agree to the terms.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError(null);
      return;
    }

    // Kept, so a correction typed here survives a declined card and a retry.
    saveBookingDetails(submitted);

    const { inputs, missing } = resolveLines(lines, catalogue);
    if (missing.length > 0) {
      setFormError(
        `${missing.map((line) => line.title).join(", ")} can no longer be booked online. Remove ${missing.length === 1 ? "it" : "them"} to continue.`,
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    const outcome = await startCheckout({
      basketId: basketIdFor(lines),
      details: {
        firstName: submitted.firstName,
        lastName: submitted.lastName,
        email: submitted.email,
        phone: submitted.phone,
        marketingOptIn: false,
      },
      notes: submitted.notes?.slice(0, 500) || undefined,
      lines: inputs,
      codes,
      consents: needsConsent ? consents.map(({ policy, version }) => ({ policy, version })) : [],
      waitlistToken: readWaitlistToken(lines),
    });

    if (outcome.status === "redirect") {
      // Noted before leaving, so the confirmation knows which basket to clear
      // once this order is paid — and only then.
      notePendingPayment(outcome.reference);
      window.location.assign(outcome.paymentUrl);
      return; // The page is going; the button keeps saying so.
    }
    if (outcome.status === "paid") {
      completeBooking();
      router.push(`/payment-success?ref=${encodeURIComponent(outcome.reference)}&k=${encodeURIComponent(outcome.k)}`);
      return;
    }

    submittingRef.current = false;
    setSubmitting(false);
    setFormError(refusalMessage(outcome));
  }

  return (
    <div className="mt-10 grid grid-cols-12 gap-x-6 md:mt-14 lg:gap-x-10">
      <aside className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <Reveal variant="fadeIn">
          <CartSummary
            lines={lines}
            subtotal={subtotal}
            places={places}
            currency={currency}
            onQuantity={setQuantity}
            onRemove={remove}
            priced={
              freshQuote
                ? {
                    discount: freshQuote.totals.discountFils / 100,
                    total: freshQuote.totals.grossFils / 100,
                    passCredits: freshQuote.passCredits,
                  }
                : null
            }
            codes={
              <>
                <PassCodeField applied={codes} onApply={applyCode} onRemove={removeCode} disabled={submitting} />
                {codes.length > 0 && !freshQuote ? (
                  <button
                    type="button"
                    onClick={() => void priceWith(codes)}
                    className="mt-3 text-fine text-text underline decoration-terracotta/50 underline-offset-4"
                  >
                    Your booking changed — update the price with your codes
                  </button>
                ) : null}
              </>
            }
          />
        </Reveal>
      </aside>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="col-span-12 mt-12 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:mt-0"
      >
        {retryReference ? <PaymentNotCompleted /> : null}

        <CustomerDetails details={details} errors={errors} />

        {requireTerms && consents.length > 0 ? (
          <Consent id={`${ids}-consent`} consents={consents} error={errors.consent} />
        ) : null}

        <Complete
          submitting={submitting}
          blockReason={
            hasPassedLine
              ? PASSED_LINE_MESSAGE
              : resolved.missing.length > 0
                ? `${resolved.missing.map((line) => line.title).join(", ")} can no longer be booked online. Remove ${resolved.missing.length === 1 ? "it" : "them"} to continue.`
                : null
          }
          total={totalAed}
          currency={currency}
          formError={formError}
          hasFieldErrors={Object.keys(errors).length > 0}
          captureNote={captureNote}
          terms={terms}
        />
      </form>
    </div>
  );
}

/** Basket lines → `{ kind, id, qty }`, and the lines that are no longer on sale. */
function resolveLines(
  lines: readonly CartLine[],
  catalogue: CheckoutProps["catalogue"],
): { inputs: CheckoutLineInput[]; missing: CartLine[] } {
  const inputs: CheckoutLineInput[] = [];
  const missing: CartLine[] = [];
  for (const line of lines) {
    const id =
      line.kind === "session"
        ? (catalogue.sessions[line.slug] ?? line.id)
        : (catalogue.passes[line.slug.replace(/^pass:/, "")] ?? line.id);
    // A slug the catalogue no longer lists is a session that has started or
    // been unpublished, or a pass taken off sale: refuse it here, by name,
    // rather than send it to be refused by the server in general terms.
    const listed =
      line.kind === "session" ? line.slug in catalogue.sessions : line.slug.replace(/^pass:/, "") in catalogue.passes;
    if (id && listed) inputs.push({ kind: line.kind, id, qty: line.quantity });
    else missing.push(line);
  }
  return { inputs, missing };
}

/** Every refusal `startCheckout` can give, in words a customer can act on. Nothing is charged in any of them. */
function refusalMessage(outcome: Exclude<StartCheckoutOutcome, { status: "redirect" | "paid" }>): string {
  switch (outcome.status) {
    case "sold_out":
      return typeof outcome.available === "number" && outcome.available > 0
        ? `Only ${outcome.available} ${outcome.available === 1 ? "place is" : "places are"} left on one of the dates in your booking. Lower the number of places and try again. Nothing has been charged.`
        : "One of the dates in your booking has just sold out. Remove it to continue. Nothing has been charged.";
    case "closed":
      return "Online bookings have just been paused, so this booking could not be made. Nothing has been charged.";
    case "gateway_disabled":
      return "Payments are not available on the site right now, so this booking could not be made. Nothing has been charged — please try again later.";
    case "rate_limited":
      return "Several attempts have been made from this connection in the last minute. Please wait a moment and try again. Nothing has been charged.";
    case "invalid":
      return outcome.message ?? "Some details could not be accepted. Please check them and try again.";
    case "payment_link_failed":
      return "We could not open the payment page just now. Your places are held for a few minutes — press Pay again to retry. Nothing has been charged.";
    default:
      return "We could not complete your booking just now. Nothing has been charged. Please try again in a moment.";
  }
}

/**
 * Back from a payment that did not complete — declined, cancelled, or
 * abandoned on the payment page. Said first, above the form, because it is
 * the reason the customer is looking at checkout again.
 */
function PaymentNotCompleted() {
  return (
    <div role="status" className="mb-12 max-w-[40rem] border-l-2 border-terracotta bg-cream/60 p-6 md:p-7">
      <p className="text-label font-medium uppercase tracking-eyebrow text-text">Payment not completed</p>
      <p className="mt-3 text-body text-text/80">
        The payment did not go through, so nothing has been charged. Your booking is still here and your
        places are held for a few minutes — check your details and press Pay to try again, with the same card
        or another.
      </p>
    </div>
  );
}

/**
 * Who is coming, and the one sentence that says no account is needed — an
 * absence cannot be read, and finding out at the last screen is too late.
 */
function CustomerDetails({ details, errors }: { details: BookingDetails | null; errors: Record<string, string> }) {
  return (
    <section aria-labelledby="customer-details">
      <h2 id="customer-details" className="text-label font-medium uppercase tracking-eyebrow text-text">
        Your details
      </h2>

      <p className="mt-4 max-w-[34rem] text-body text-text/80">
        No account needed. We ask only for what the studio needs to greet you on the day, send your tickets,
        and reach you if anything changes.
      </p>

      {details ? (
        <p className="mt-3 text-fine text-text/70">Carried over from the last step. Change anything that is not right.</p>
      ) : null}

      <div className="mt-9 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        <Field name="firstName" label="First name" defaultValue={details?.firstName} autoComplete="given-name" error={errors.firstName} />
        <Field name="lastName" label="Last name" defaultValue={details?.lastName} autoComplete="family-name" error={errors.lastName} />
        <Field
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          defaultValue={details?.email}
          autoComplete="email"
          error={errors.email}
        />
        <Field name="phone" label="Phone" type="tel" inputMode="tel" defaultValue={details?.phone} autoComplete="tel" error={errors.phone} />
      </div>
    </section>
  );
}

/**
 * "I have read and agree to …" — one box for every policy flagged "Require
 * agreement at checkout", each linked. The versions agreed to travel with
 * the order (`orders.consentedPolicyVersions`).
 */
function Consent({ id, consents, error }: { id: string; consents: CheckoutConsent[]; error?: string }) {
  return (
    <div className="mt-10">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name="consent"
          type="checkbox"
          value="yes"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
        />
        <label htmlFor={id} className="text-body text-text">
          I have read and agree to the{" "}
          {consents.map((consent, index) => (
            <span key={consent.policy}>
              {index > 0 ? (index === consents.length - 1 ? " and " : ", ") : null}
              <Link
                href={consent.href}
                target="_blank"
                className="border-b border-terracotta/50 pb-0.5 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {consent.title}
              </Link>
            </span>
          ))}
          .
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 pl-8 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The last action: the total, Pay, and what Pay does — said before it is pressed. */
function Complete({
  submitting,
  blockReason,
  total,
  currency,
  formError,
  hasFieldErrors,
  captureNote,
  terms,
}: {
  submitting: boolean;
  /** Why Pay is disabled — a date that has passed, a line no longer on sale — or null. */
  blockReason: string | null;
  total: number;
  currency: string;
  formError: string | null;
  hasFieldErrors: boolean;
  captureNote: string;
  terms: string;
}) {
  const blocked = blockReason !== null;
  // A refused press repeats the block reason in the alert; once the cause is
  // gone, that copy is stale and goes with it.
  const passedPress = formError === PASSED_LINE_MESSAGE;
  const shownError = passedPress && !blocked ? null : formError;
  const free = total === 0;

  return (
    <div className="mt-12 border-t border-line pt-9 md:mt-14 md:pt-10">
      {/* One live region for both kinds of failure, so every unsuccessful press is heard. */}
      <div role="alert" aria-live="assertive">
        {shownError ? (
          <p className="mb-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body text-text">{shownError}</p>
        ) : hasFieldErrors ? (
          <p className="mb-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body text-text">
            Please check the highlighted details above and try again.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <p className="text-body text-text/80">
          Total{" "}
          <span className="ml-2 text-lead font-medium tabular-nums text-text">{formatMoney(total, currency)}</span>
        </p>

        {/*
          "Pay" now, because the press does take payment: it opens the
          payment page for exactly this total. Nothing is owed (a pass or a
          full discount) → "Confirm booking", which is what that press does.
        */}
        <BlobButton
          type="submit"
          disabled={submitting || blocked}
          className="w-full justify-center px-8 py-5 sm:w-auto"
        >
          {submitting ? (free ? "Confirming…" : "Opening payment…") : free ? "Confirm booking" : `Pay ${formatMoney(total, currency)}`}
        </BlobButton>
      </div>

      {blockReason && blockReason !== shownError ? (
        <p role="status" className="mt-6 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body text-text">
          {blockReason}
        </p>
      ) : null}

      {!free ? <p className="mt-6 max-w-[40rem] text-fine text-text/75">{captureNote}</p> : null}

      {/* The one "what a booking is" sentence (booking-settings), the same words the confirmation and FAQ print. */}
      <p className="mt-6 max-w-[40rem] border-l-2 border-terracotta pl-5 text-fine leading-[1.8] text-text/80">{terms}</p>
    </div>
  );
}

function LoadingBasket() {
  return (
    <p role="status" className="mt-12 text-body text-text/75 md:mt-14">
      Loading your booking&hellip;
    </p>
  );
}

/**
 * Nothing in the basket. Back from a failed payment with an empty basket
 * (another tab, a cleared browser) still says what happened.
 */
function EmptyCart({ retryReference }: { retryReference: string | null }) {
  return (
    <Reveal className="mt-14 border-t border-line pt-12 md:mt-16 md:pt-14">
      <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">Your booking is empty.</p>
      <p className="mt-5 max-w-[32rem] text-body text-text/75">
        {retryReference
          ? `The payment for ${retryReference} did not go through and nothing was charged. This browser no longer holds that booking — choose an event to start again.`
          : "Nothing is held yet. Choose an event and it will appear here with everything you need to complete the booking."}
      </p>
      <BlobButton href="/events" className="mt-9 justify-center px-8 py-5">
        Explore events
      </BlobButton>
    </Reveal>
  );
}

function Field({
  name,
  label,
  type = "text",
  inputMode,
  defaultValue,
  autoComplete,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  defaultValue?: string;
  autoComplete?: string;
  error?: string;
}) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(FIELD, error ? "border-terracotta" : "border-line focus:border-primary")}
      />
      {/* Charcoal, not terracotta: the accent is under 4.5:1 for a message this size. */}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
