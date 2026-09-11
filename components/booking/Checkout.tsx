"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { PAYMENT_CONFIGURED, placeBooking, type BookingDetails, type BookingResult } from "@/lib/booking";
import { useBookingDetails, useCart, type CartLine } from "@/lib/cart";
import { cn } from "@/lib/utils";

const LABEL = "block text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75";
const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[0.95rem] text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:border-primary focus:outline-none focus:ring-0";

/** "AED 320" — the code rather than a symbol, matching the rest of the site. */
function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function dateLine(startsAt: string, durationMinutes: number) {
  const zone = "Asia/Dubai";
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: zone,
  }).format(new Date(startsAt));
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: zone,
  });
  const startDate = new Date(startsAt);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
  return `${day}, ${time.format(startDate)} – ${time.format(endDate)}`;
}

/**
 * Step four — the whole of it, on one page.
 *
 * The client asked for no separate cart, and this is why that is the right
 * call rather than merely what was asked: a basket holding one session on one
 * date is not a shop's basket. There is nothing to browse back to and nothing
 * to accumulate, so a dedicated page would be a screen whose only job is to
 * have a button on it. The basket lives here, editable, beside the two things
 * that actually complete the booking.
 *
 * Client component — the basket is held in the browser (see lib/cart.ts), so
 * this tree has no server to ask.
 */
export function Checkout() {
  const { lines, setQuantity, remove, subtotal, places, currency } = useCart();
  // Carried from the booking step through the same store as the basket, so the
  // server and the first client paint agree about there being nothing yet.
  const details = useBookingDetails();
  const [result, setResult] = useState<BookingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (lines.length === 0) return <EmptyBasket />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const outcome = await placeBooking({
      lines,
      subtotal,
      currency,
      details: {
        firstName: get("firstName"),
        lastName: get("lastName"),
        email: get("email"),
        phone: get("phone"),
      },
    });

    setResult(outcome);
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:gap-x-10">
      {/*
        The summary comes first in the DOM so a phone shows what is being paid
        for before asking for anything, and moves to the right at `lg`.
      */}
      <aside className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <OrderSummary
          lines={lines}
          subtotal={subtotal}
          places={places}
          currency={currency}
          onQuantity={setQuantity}
          onRemove={remove}
        />
      </aside>

      <div className="col-span-12 mt-14 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:mt-0">
        <CustomerDetails details={details} />
        <Payment />
        <Complete submitting={submitting} result={result} total={subtotal} currency={currency} />
      </div>
    </form>
  );
}

/** The basket, editable in place. */
function OrderSummary({
  lines,
  subtotal,
  places,
  currency,
  onQuantity,
  onRemove,
}: {
  lines: CartLine[];
  subtotal: number;
  places: number;
  currency: string;
  onQuantity: (slug: string, q: number) => void;
  onRemove: (slug: string) => void;
}) {
  return (
    <section aria-labelledby="your-session" className="bg-cream p-7 md:p-8">
      <h2 id="your-session" className={LABEL}>
        Your event
      </h2>

      <ul className="mt-7 flex flex-col gap-8">
        {lines.map((line) => (
          <li key={line.slug} className="border-t border-text/15 pt-6 first:border-0 first:pt-0">
            <div className="flex gap-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-surface-alt">
                <Image
                  src={line.image.src}
                  alt={line.image.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[0.58rem] font-medium uppercase tracking-eyebrow text-text/75">
                  {line.category}
                </p>
                <h3 className="mt-1.5 text-[1rem] font-medium leading-snug">{line.title}</h3>
                {line.venueName ? (
                  <p className="mt-1.5 text-[0.8rem] text-text/75">
                    {line.venueName}
                    {line.venueLocality ? `, ${line.venueLocality}` : ""}
                  </p>
                ) : null}
                <p className="mt-1 text-[0.8rem] text-text/75">
                  <time dateTime={line.startsAt}>
                    {dateLine(line.startsAt, line.durationMinutes)}
                  </time>
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center border border-text/20">
                <Step
                  label={`One fewer place for ${line.title}`}
                  onClick={() => onQuantity(line.slug, line.quantity - 1)}
                  disabled={line.quantity <= 1}
                >
                  &minus;
                </Step>
                <output className="w-10 text-center text-[0.9rem] font-medium tabular-nums">
                  {line.quantity}
                </output>
                <Step
                  label={`One more place for ${line.title}`}
                  onClick={() => onQuantity(line.slug, line.quantity + 1)}
                  disabled={line.quantity >= line.seatsAvailable}
                >
                  +
                </Step>
              </div>
              <p className="text-[0.95rem] font-medium tabular-nums">
                {money(line.priceAmount * line.quantity, line.priceCurrency)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(line.slug)}
              className="mt-4 border-b border-text/25 pb-0.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75 transition-colors duration-300 ease-soft hover:border-text hover:text-text"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <dl className="mt-8 flex flex-col gap-3 border-t border-text/15 pt-6">
        <div className="flex items-baseline justify-between">
          <dt className="text-[0.8rem] text-text/80">
            Subtotal · {places} {places === 1 ? "place" : "places"}
          </dt>
          <dd className="text-[0.95rem] tabular-nums">{money(subtotal, currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-text/15 pt-4">
          <dt className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text">Total</dt>
          <dd className="text-[1.25rem] font-medium tabular-nums">{money(subtotal, currency)}</dd>
        </div>
      </dl>

      <Link
        href="/events"
        className="group mt-7 inline-flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text"
      >
        {/* Charcoal, not terracotta: on White Rock the accent is 2.4:1, which
            is too faint to read as an arrow at this size. */}
        <span
          aria-hidden
          className="text-text transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
        >
          &#8592;
        </span>
        <span className="border-b border-text/30 pb-1 transition-colors duration-300 ease-soft group-hover:border-text">
          Add another event
        </span>
      </Link>
    </section>
  );
}

function CustomerDetails({ details }: { details: BookingDetails | null }) {
  return (
    <section aria-labelledby="customer-details">
      <h2 id="customer-details" className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text">
        Your details
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        <Field name="firstName" label="First name" defaultValue={details?.firstName} autoComplete="given-name" />
        <Field name="lastName" label="Last name" defaultValue={details?.lastName} autoComplete="family-name" />
        <Field name="email" label="Email" type="email" defaultValue={details?.email} autoComplete="email" />
        <Field name="phone" label="Phone" type="tel" defaultValue={details?.phone} autoComplete="tel" />
      </div>
    </section>
  );
}

/**
 * The payment step.
 *
 * The fields are rendered and disabled, and that is a deliberate line rather
 * than an unfinished one. There is no payment provider in this project — no
 * SDK, no account, no key — so a live card field would be an input collecting
 * a primary account number into a page that cannot protect it, cannot tokenise
 * it and has nowhere to send it. Showing the shape of the step is useful;
 * accepting a card number here would be indefensible.
 *
 * When a provider is wired, this whole block is replaced by that provider's own
 * hosted element — which is also the only way the card number stays out of
 * this application's scope. See PAYMENT_CONFIGURED in lib/booking.ts.
 */
function Payment() {
  return (
    <section aria-labelledby="payment" className="mt-14 border-t border-line pt-12">
      <h2 id="payment" className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text">
        Payment
      </h2>

      {!PAYMENT_CONFIGURED ? (
        <div className="mt-7 border border-line bg-cream/60 p-7 md:p-8">
          <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
            Card payment is not connected yet
          </p>
          <p className="mt-4 max-w-[36rem] text-[0.9rem] leading-[1.8] text-text/80">
            Maison Palettia has no payment provider set up, so nothing on this page can take a
            card. The fields below show where payment will sit and are switched off — your card
            details would have nowhere safe to go.
          </p>
        </div>
      ) : null}

      <div
        className={cn("mt-9 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2", !PAYMENT_CONFIGURED && "opacity-50")}
        aria-hidden={!PAYMENT_CONFIGURED}
      >
        <div className="sm:col-span-2">
          <span className={LABEL}>Card number</span>
          <input disabled={!PAYMENT_CONFIGURED} className={cn(FIELD, "cursor-not-allowed")} />
        </div>
        <div>
          <span className={LABEL}>Expiry</span>
          <input disabled={!PAYMENT_CONFIGURED} className={cn(FIELD, "cursor-not-allowed")} />
        </div>
        <div>
          <span className={LABEL}>Security code</span>
          <input disabled={!PAYMENT_CONFIGURED} className={cn(FIELD, "cursor-not-allowed")} />
        </div>
      </div>
    </section>
  );
}

/** The last action, and the only honest thing it can currently report. */
function Complete({
  submitting,
  result,
  total,
  currency,
}: {
  submitting: boolean;
  result: BookingResult | null;
  total: number;
  currency: string;
}) {
  return (
    <div className="mt-14 border-t border-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <p className="text-[0.9rem] text-text/80">
          Total to pay{" "}
          <span className="ml-2 text-[1.15rem] font-medium tabular-nums text-text">
            {money(total, currency)}
          </span>
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex w-full items-center justify-center gap-2.5 bg-primary px-8 py-5 text-[0.72rem] font-medium uppercase leading-none tracking-eyebrow text-white transition-colors duration-300 ease-soft hover:bg-primary/90 disabled:opacity-70 sm:w-auto"
        >
          {submitting ? "Checking…" : "Complete booking"}
          <span
            aria-hidden
            className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </button>
      </div>

      {result?.status === "unconfigured" ? (
        <div
          role="status"
          className="mt-9 border-l-2 border-terracotta bg-cream/60 p-7 md:p-8"
        >
          <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
            Nothing was charged and nothing was booked
          </p>
          <p className="mt-4 max-w-[36rem] text-[0.9rem] leading-[1.8] text-text/80">
            This booking could not be completed because{" "}
            {result.missing.includes("payment") && result.missing.includes("recording")
              ? "the studio has no payment provider and nowhere to record a booking"
              : result.missing.includes("payment")
                ? "the studio has no payment provider connected"
                : "there is nowhere to record the booking"}
            . Your details have not been sent anywhere. Nothing has been reserved, so please do
            not treat this as confirmed.
          </p>
          <p className="mt-5 max-w-[36rem] text-[0.9rem] leading-[1.8] text-text/80">
            To hold a place today, contact the Maison directly and we will arrange it.
          </p>
          <Link
            href="/contact"
            className="group mt-7 inline-flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Contact the Maison
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
  );
}

function EmptyBasket() {
  return (
    <Reveal className="mt-16 border-t border-line pt-12 md:mt-20 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        Nothing held yet.
      </p>
      <p className="mt-5 max-w-[32rem] text-[0.95rem] leading-[1.85] text-text/75">
        Choose a session and it will appear here with everything you need to complete the
        booking.
      </p>
      <Link
        href="/events"
        className="group mt-9 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
      >
        <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
          See upcoming events
        </span>
        <span
          aria-hidden
          className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </Reveal>
  );
}

function Step({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center text-[1rem] leading-none transition-colors duration-300 ease-soft",
        disabled ? "cursor-not-allowed text-text/45" : "text-text hover:bg-text/5",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className={LABEL} htmlFor={`checkout-${name}`}>
        {label}
      </label>
      <input
        id={`checkout-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className={FIELD}
      />
    </div>
  );
}
