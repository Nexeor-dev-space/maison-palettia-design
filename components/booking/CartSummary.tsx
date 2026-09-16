"use client";

import Image from "next/image";
import Link from "next/link";

import { PassCodeField } from "@/components/booking/PassCodeField";
import type { CartLine } from "@/lib/cart";
import { cn, formatMoney, formatSessionDay, formatSessionTimeRange } from "@/lib/utils";

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";

/**
 * Wall-clock time, read once when this module loads.
 *
 * At module scope rather than in a render body, and not in an effect either.
 * `Date.now()` during render is impure — the same props would answer
 * differently on a re-render — and setting state from an effect to work around
 * that buys a cascading render for a value that never usefully changes. A
 * constant taken at page load is exactly as precise as this needs to be: it
 * decides whether a held date is already behind us, which does not turn over
 * while someone fills in a checkout.
 *
 * Only ever read on the client. The panel renders after the basket has been
 * pulled out of browser storage (see `useCartHydrated`), which never happens
 * on the server, so there is no rendered output for the two clocks to disagree
 * about.
 */
const LOADED_AT = Date.now();

/**
 * The basket, as a booking summary.
 *
 * WHY THERE IS NO /cart ROUTE. The brief asks for a cart page and also asks
 * for no unnecessary intermediate pages, and those two pull in opposite
 * directions here. A second screen listing the same three facts with a
 * Continue button under them is a page whose only job is to have a button on
 * it, and every visitor pays for it on the way to paying for a workshop. So
 * the cart is this panel, on the checkout, where it can be edited beside the
 * things that complete the booking — which is also the arrangement the client
 * asked for and the one already in the codebase. Split it out if that call is
 * ever reversed; nothing here assumes its surroundings.
 *
 * WHAT IT HAS TO ANSWER, in this order and with this weight: what am I
 * booking, when is it, where is it, how many of us, what does it cost. The
 * title is the loudest thing in each entry; the schedule and the venue are
 * labelled rather than run together, because "wait, which Saturday?" is the
 * question that sends someone back to the listing and loses the booking.
 *
 * Every fact is read off the line as it was held. Nothing is derived that the
 * data does not support — a session with no venue on file simply shows no
 * venue rather than a placeholder (see {@link Venue}).
 */
export function CartSummary({
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
  onQuantity: (slug: string, quantity: number) => void;
  onRemove: (slug: string) => void;
}) {
  /*
    What the count is counting.

    "Places" is the right word for a seat at a session and the wrong one for a
    pass, which holds no place until it is redeemed against a date. A basket of
    sessions keeps the word it has always used; one with a pass in it counts
    items, which is the only word true of both. Derived rather than stored, so
    it follows the basket without anything having to remember to update it.
  */
  const unit = lines.every((line) => line.kind === "session") ? "place" : "item";
  const countLabel = `${places} ${places === 1 ? unit : `${unit}s`}`;

  return (
    <section aria-labelledby="cart-summary" className="bg-cream p-6 xs:p-7 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="cart-summary" className={TERM}>
          Your booking
        </h2>
        <p className="text-label tabular-nums text-text/75">{countLabel}</p>
      </div>

      <ul className="mt-6 flex flex-col gap-7">
        {lines.map((line) => (
          <CartEntry
            key={line.slug}
            line={line}
            onQuantity={onQuantity}
            onRemove={onRemove}
          />
        ))}
      </ul>

      <PassCodeField />

      <dl className="mt-7 flex flex-col gap-3 border-t border-text/15 pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fine text-text/80">Subtotal · {countLabel}</dt>
          <dd className="text-body tabular-nums">{formatMoney(subtotal, currency)}</dd>
        </div>
        {/*
          No tax line, no fees line, no "calculated at the next step". There is
          no tax model and no fee model in this project, and a row that exists
          only to say "—" invites the reader to wonder what will be added later.
          Subtotal and total are the same number because nothing is added.
        */}
        <div className="flex items-baseline justify-between gap-4 border-t border-text/15 pt-4">
          <dt className="text-label font-medium uppercase tracking-eyebrow text-text">Total</dt>
          <dd className="text-lead font-medium tabular-nums">
            {formatMoney(subtotal, currency)}
          </dd>
        </div>
      </dl>

      <Link
        href="/events"
        className="group mt-7 inline-flex items-center gap-3 -my-1.5 py-1.5 text-label font-medium uppercase tracking-eyebrow text-text"
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

/**
 * One held session.
 *
 * The photograph is small and square rather than the wide plate the session's
 * own page uses: here it is a means of recognition — "yes, that one" — not the
 * subject. Everything that decides whether the booking is right is type.
 */
function CartEntry({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (slug: string, quantity: number) => void;
  onRemove: (slug: string) => void;
}) {
  const lineTotal = line.priceAmount * line.quantity;
  /*
    Places for a session, passes for a pass. The stepper's labels and the
    per-line arithmetic both read these, so the two cannot disagree — and the
    plural is spelled out rather than built by adding an "s", which is how
    "2 passs" got as far as a rendered checkout.
  */
  const unit = line.kind === "session" ? "place" : "pass";
  const units = line.kind === "session" ? "places" : "passes";
  /* Only a session has a cap — see `setQuantity` in lib/cart.ts. */
  const atCap = line.kind === "session" && line.quantity >= line.seatsAvailable;
  /*
    A date that has already gone by. Only reachable from a basket left open
    across the event itself, or from placeholder sessions outliving their
    invented dates in development — see the note on `getUpcomingWorkshops`.

    Said, not enforced. Blocking the button here would make the demo
    unusable the moment the placeholder dates pass, and the check that must
    actually stop a booking is the server-side one that does not exist yet
    (see `placeBooking`). A warning the visitor can act on is the honest
    amount of certainty a browser has.

    A pass has no date to have passed, so the question is only asked of a
    session.
  */
  const hasPassed = line.kind === "session" && new Date(line.startsAt).getTime() < LOADED_AT;

  return (
    <li className="border-t border-text/15 pt-6 first:border-0 first:pt-0">
      <div className="flex gap-4 sm:gap-5">
        {/* A pass may have no photograph on file; the entry then shows none
            rather than a stand-in borrowed from something else. */}
        {line.image ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-surface-alt sm:h-24 sm:w-24">
            <Image
              src={line.image.src}
              alt={line.image.alt}
              fill
              sizes="(min-width: 640px) 96px, 80px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className={TERM}>{line.category}</p>
          {/*
            The loudest thing in the entry, and an <h3> under the panel's <h2>
            so the summary reads as a real outline rather than as styled text.
          */}
          <h3 className="mt-2 text-lead font-medium leading-[1.25] tracking-[-0.01em] text-text">
            <Link
              href={line.kind === "session" ? `/events/${line.slug}` : "/loyalty"}
              className="border-b border-transparent pb-0.5 transition-colors duration-300 ease-soft hover:border-text/40"
            >
              {line.title}
            </Link>
          </h3>
        </div>
      </div>

      {/*
        What each kind of line has to answer.

        A session: when and where, labelled. Two definition rows rather than a
        run-on line — these are the two facts someone checks against their own
        week, and they should be findable without reading a sentence.

        A pass: what it carries, in the one line the pass itself states. No
        date and no venue, because a pass has neither until it is redeemed, and
        a row reading "—" would invite the reader to wonder what is missing.
      */}
      {line.kind === "session" ? (
        <dl className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <dt className={cn(TERM, "w-16 shrink-0 pt-0.5")}>When</dt>
            <dd className="min-w-0 flex-1 text-body leading-snug text-text">
              <time dateTime={line.startsAt}>{formatSessionDay(line.startsAt)}</time>
              <span className="mt-1 block text-fine tabular-nums text-text/75">
                {formatSessionTimeRange(line.startsAt, line.durationMinutes)}
              </span>
            </dd>
          </div>

          {/* Venue is optional on the data model — see {@link Venue}. */}
          {line.venueName ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className={cn(TERM, "w-16 shrink-0 pt-0.5")}>Where</dt>
              <dd className="min-w-0 flex-1 text-body leading-snug text-text">
                {line.venueName}
                {line.venueLocality ? (
                  <span className="mt-1 block text-fine text-text/75">{line.venueLocality}</span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : line.summary ? (
        <dl className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
          <dt className={cn(TERM, "w-16 shrink-0 pt-0.5")}>Includes</dt>
          <dd className="min-w-0 flex-1 text-body leading-snug text-text">{line.summary}</dd>
        </dl>
      ) : null}

      {hasPassed ? (
        <p
          role="status"
          className="mt-5 border-l-2 border-terracotta pl-4 text-fine leading-[1.7] text-text"
        >
          This date has already passed. Remove it and choose another, or the studio will be in
          touch to rebook you.
        </p>
      ) : null}

      {/* --- places and price ------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-4">
        <div>
          <p className={TERM}>{units === "places" ? "Places" : "Passes"}</p>
          <div className="mt-2 flex items-center overflow-hidden rounded-sm border border-text/20">
            <Step
              label={`One fewer ${unit} for ${line.title}`}
              onClick={() => onQuantity(line.slug, line.quantity - 1)}
              disabled={line.quantity <= 1}
            >
              &minus;
            </Step>
            {/*
              `aria-live` so the count is spoken when it changes: the buttons
              are the control, but the number is the answer, and a stepper that
              never announces its value leaves a screen-reader user counting
              their own presses.
            */}
            <output
              aria-live="polite"
              className="w-11 text-center text-body font-medium tabular-nums text-text"
            >
              {line.quantity}
            </output>
            <Step
              label={`One more ${unit} for ${line.title}`}
              onClick={() => onQuantity(line.slug, line.quantity + 1)}
              disabled={atCap}
            >
              +
            </Step>
          </div>
        </div>

        <div className="text-right">
          {/* The arithmetic, shown. A total nobody can check is a total
              somebody has to take on trust. */}
          {/*
            Two strings rather than one with a hidden word wedged into it. The
            multiplication sign is right on screen and unreadable aloud, and
            splicing "each, for" between the figures gives a screen reader
            "AED 320 each, for 2" — which is the sound of markup, not a price.
          */}
          <p className="text-fine tabular-nums text-text/75">
            <span aria-hidden>
              {formatMoney(line.priceAmount, line.priceCurrency)} &times; {line.quantity}
            </span>
            <span className="sr-only">
              {formatMoney(line.priceAmount, line.priceCurrency)} each, {line.quantity}{" "}
              {line.quantity === 1 ? unit : units}
            </span>
          </p>
          <p className="mt-1 text-body font-medium tabular-nums text-text">
            {formatMoney(lineTotal, line.priceCurrency)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => onRemove(line.slug)}
          className="-my-1 border-b border-text/25 py-1 text-label font-medium uppercase tracking-eyebrow text-text/75 transition-colors duration-300 ease-soft hover:border-text hover:text-text"
        >
          Remove
          <span className="sr-only"> {line.title} from your booking</span>
        </button>

        {/*
          Only when it is the reason the + is dead. A seat count printed under
          every entry is a scarcity nudge; printed at the moment the control
          stops responding, it is an explanation.
        */}
        {line.kind === "session" && line.quantity >= line.seatsAvailable ? (
          <p className="text-fine text-text/75">
            {line.seatsAvailable} {line.seatsAvailable === 1 ? "place" : "places"} left for this
            date
          </p>
        ) : null}
      </div>
    </li>
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
        // 44px square: the touch target the WCAG target-size rule asks for,
        // and the smallest a stepper on a phone should ever be.
        "flex h-11 w-11 items-center justify-center text-body leading-none",
        "transition-colors duration-300 ease-soft",
        disabled ? "cursor-not-allowed text-text/45" : "text-text hover:bg-text/5",
      )}
    >
      {children}
    </button>
  );
}

