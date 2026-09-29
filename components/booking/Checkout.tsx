"use client";

import { BlobButton } from "@/components/ui/BlobButton";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CartSummary } from "@/components/booking/CartSummary";
import { Reveal } from "@/components/motion/Reveal";
import { PAYMENT_CONFIGURED, placeBooking } from "@/lib/booking";
import {
  saveBookingDetails,
  useBookingDetails,
  useCart,
  useCartHydrated,
  validateBookingDetails,
  type BookingDetails,
} from "@/lib/cart";
import { cn, formatMoney } from "@/lib/utils";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";
const FIELD =
  "w-full border-0 border-b bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:outline-none focus:ring-0";

/** The order errors are read in, so focus lands on the first one down the page. */
const FIELD_ORDER = ["firstName", "lastName", "email", "phone"] as const;

/**
 * Checkout — the basket, the details and the last action, on one page.
 *
 * GUEST ONLY, AND NOT BY REMOVAL. There is no sign-in here to take out: this
 * project has never had authentication — no routes, no middleware, no session
 * handling, no provider — and the last of the sign-in *offers* came out of the
 * booking step in an earlier phase. Checked across every file, not assumed.
 * What this phase adds is the other half of that: saying so, where a customer
 * is deciding whether to type their details in.
 *
 * The layout is two columns that swap importance by width. Below `lg` the
 * summary comes first, because a phone should show what is being paid for
 * before it asks for anything; from `lg` it moves to the right and the form
 * takes the left, which is the reading order a form wants.
 *
 * THE SUMMARY IS NOT INSIDE THE FORM. It carries its own small form for the
 * pass code, and a form cannot be nested in a form — put it inside and Enter
 * in the code box would place the entire booking. They are siblings in the
 * grid instead, which costs nothing and makes that mistake unrepresentable.
 *
 * Client component, and it has to be: the basket lives in the browser (see
 * lib/cart.ts) and there is no server to ask.
 */
export function Checkout() {
  const { lines, setQuantity, remove, clear, subtotal, places, currency } = useCart();
  const hydrated = useCartHydrated();
  // Carried from the booking step through the same store as the basket, so the
  // server and the first client paint agree about there being nothing yet.
  const details = useBookingDetails();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  /*
    Move focus to the first field that needs attention.

    Without this a keyboard or screen-reader visitor presses the button, the
    page re-renders with four messages on it, and focus is still on a button
    that appears to have done nothing. The live region below announces that
    something is wrong; this is what makes it actionable.
  */
  useEffect(() => {
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (!first || !formRef.current) return;
    formRef.current.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }, [errors]);

  // The basket is read out of storage on commit, not on the server and not on
  // the first client render. Until it has been, "your cart is empty" is a
  // guess — and the one guess a checkout must never make out loud.
  if (!hydrated) return <LoadingBasket />;
  if (lines.length === 0) return <EmptyCart />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const submitted: BookingDetails = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      // Carried, not re-asked. The booking step already offered a line for
      // anything the studio should know, and it was being dropped on the floor
      // here — the customer typed it, agreed to it, and it never reached the
      // record. Passing it through is the contract `BookingDetails` already
      // describes, not a new field.
      notes: details?.notes,
    };

    // Validated here as well as by the browser: `required` alone gives a
    // native bubble that vanishes, and a visitor who gets past it should see
    // the same message in the same place either way. The rules live in
    // lib/cart.ts so the booking step and this page cannot disagree.
    const next = validateBookingDetails(submitted);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError(null);
      return;
    }

    // Kept, so a correction typed here survives. Without it a visitor who
    // fixes a typo, hits a failure and tries again is handed back the wrong
    // value the booking step saved — asked to re-enter what they already
    // corrected, which is the exact friction this phase is here to remove.
    saveBookingDetails(submitted);

    setSubmitting(true);
    setFormError(null);

    try {
      const outcome = await placeBooking({ lines, subtotal, currency, details: submitted });

      if (outcome.status === "empty") {
        setSubmitting(false);
        setFormError("There is nothing in your booking to confirm. Choose an event to continue.");
        return;
      }

      // Cleared before navigating, not after: the confirmation reads the
      // record by reference, and leaving the basket filled would put a stale
      // "Booking" link in the header over a booking already placed.
      clear();
      router.push(`/payment-success?ref=${encodeURIComponent(outcome.record.reference)}`);
    } catch {
      // Nothing here can throw today — `placeBooking` writes to this browser
      // and nowhere else. It will be a network call, and the failure a
      // customer meets then must be a sentence they can act on rather than a
      // page that stops responding. No status codes, no provider names.
      setSubmitting(false);
      setFormError(
        "We could not complete your booking just now. Nothing has been charged — please try again in a moment.",
      );
    }
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
          />
        </Reveal>
      </aside>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="col-span-12 mt-12 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:mt-0"
      >
        <CustomerDetails details={details} errors={errors} />
        <Complete
          submitting={submitting}
          total={subtotal}
          currency={currency}
          formError={formError}
          hasFieldErrors={Object.keys(errors).length > 0}
        />
      </form>
    </div>
  );
}

/**
 * Who is coming, and the one sentence that says no account is needed.
 *
 * The sentence is the whole of the guest-checkout work on this page, and it
 * earns its place: an absence cannot be read. A visitor who has been asked to
 * register by every other booking site does not know this one will not, and
 * finding out at the last screen is finding out too late to have relaxed.
 */
function CustomerDetails({
  details,
  errors,
}: {
  details: BookingDetails | null;
  errors: Record<string, string>;
}) {
  return (
    <section aria-labelledby="customer-details">
      <h2
        id="customer-details"
        className="text-label font-medium uppercase tracking-eyebrow text-text"
      >
        Your details
      </h2>

      <p className="mt-4 max-w-[34rem] text-body leading-[1.8] text-text/80">
        No account needed. We ask only for what the studio needs to greet you on the day and
        reach you if anything changes.
      </p>

      {details ? (
        <p className="mt-3 text-fine text-text/70">
          Carried over from the last step — change anything that is not right.
        </p>
      ) : null}

      <div className="mt-9 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        <Field
          name="firstName"
          label="First name"
          defaultValue={details?.firstName}
          autoComplete="given-name"
          error={errors.firstName}
        />
        <Field
          name="lastName"
          label="Last name"
          defaultValue={details?.lastName}
          autoComplete="family-name"
          error={errors.lastName}
        />
        <Field
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          defaultValue={details?.email}
          autoComplete="email"
          error={errors.email}
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          defaultValue={details?.phone}
          autoComplete="tel"
          error={errors.phone}
        />
      </div>
    </section>
  );
}

/**
 * The last action.
 *
 * One button and the total, and deliberately no payment step above it. There
 * were three disabled card fields here — number, expiry, security code — under
 * a panel explaining that none of them worked. A dead card form is the single
 * most misleading thing a prototype can show, because it is the exact shape of
 * the screen where people expect to be charged.
 *
 * What replaces it is the truth in one line, next to the button that does the
 * thing. See lib/booking.ts for what actually happens when it is pressed.
 */
function Complete({
  submitting,
  total,
  currency,
  formError,
  hasFieldErrors,
}: {
  submitting: boolean;
  total: number;
  currency: string;
  formError: string | null;
  hasFieldErrors: boolean;
}) {
  return (
    <div className="mt-12 border-t border-line pt-9 md:mt-14 md:pt-10">
      {/*
        One live region for both kinds of failure, so a screen reader hears
        something on every unsuccessful press — the field messages alone are
        silent to someone who has not moved focus into the form yet.
      */}
      <div role="alert" aria-live="assertive">
        {formError ? (
          <p className="mb-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body leading-[1.8] text-text">
            {formError}
          </p>
        ) : hasFieldErrors ? (
          <p className="mb-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body leading-[1.8] text-text">
            Please check the highlighted details above and try again.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <p className="text-body text-text/80">
          Total{" "}
          <span className="ml-2 text-lead font-medium tabular-nums text-text">
            {formatMoney(total, currency)}
          </span>
        </p>

        {/*
          The one filled control on the page. "Confirm booking" rather than
          "Pay" or "Buy now": nothing is charged here, and a button that names
          a payment is a promise the flow does not keep.
        */}
        <BlobButton
          type="submit"
          disabled={submitting}
          className="w-full justify-center px-8 py-5 sm:w-auto"
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </BlobButton>
      </div>

      {/*
        Stated before the button is pressed, not after. Someone about to hand
        over a name and a phone number is entitled to know what the button
        does, and finding out on the next screen is finding out too late.
      */}
      {!PAYMENT_CONFIGURED ? (
        <p className="mt-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-fine leading-[1.8] text-text/80">
          This is a preview booking. Maison Palettia has no payment provider connected yet, so
          nothing is charged now and nothing is charged later — you will get a reference to keep
          and the studio will confirm your place directly.
        </p>
      ) : null}
    </div>
  );
}

/**
 * The frame before the basket has been read.
 *
 * A sentence rather than a shimmering skeleton of the panel: the wait is one
 * commit long, and a placeholder elaborate enough to be noticed is a
 * placeholder that has outstayed the thing it stands in for.
 */
function LoadingBasket() {
  return (
    <p role="status" className="mt-12 text-body text-text/75 md:mt-14">
      Loading your booking&hellip;
    </p>
  );
}

/**
 * Nothing held.
 *
 * One job: get the visitor back into the programme. No illustration, no
 * suggested sessions, no second-guessing why they are here — a button and the
 * sentence that explains it.
 */
function EmptyCart() {
  return (
    <Reveal className="mt-14 border-t border-line pt-12 md:mt-16 md:pt-14">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        Your booking is empty.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        Nothing is held yet. Choose an event and it will appear here with everything you need to
        complete the booking.
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
      {/*
        Tied to the input by `aria-describedby`, so the message is read as part
        of the field rather than as loose text somewhere after it. Charcoal,
        not terracotta: the accent measures 3.07:1 on this ground, under the
        4.5:1 a 13px message owes —
        the colour is carried by the rule under the input, and the words carry
        themselves.
      */}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
