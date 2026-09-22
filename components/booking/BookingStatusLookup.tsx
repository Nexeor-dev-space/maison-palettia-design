"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { findBooking, useBookings } from "@/lib/booking";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lead tabular-nums " +
  "tracking-[0.08em] text-text uppercase placeholder:tracking-[0.08em] placeholder:text-text/40 " +
  "transition-colors duration-300 ease-soft focus:border-primary focus:outline-none focus:ring-0";

/**
 * What the visitor has actually asked to see.
 *
 * The *result* is derived from this and the store, never stored itself — a
 * second copy of a record that already lives in `useBookings` is a copy that
 * can go stale. `submitted` is the reference last asked for, and null before
 * anything has been.
 */

/**
 * Look a booking up by its reference.
 *
 * Reads the same store the confirmation writes — see lib/booking.ts — rather
 * than a second list of demo bookings of its own. That is the whole reason
 * this works at all: a reference typed in here was minted by a real pass
 * through the checkout on this browser, so the page is exercising the actual
 * journey instead of matching against invented fixtures.
 *
 * `?ref=` is honoured on arrival so the confirmation can link straight here
 * with the booking already resolved, and so the result is linkable.
 */
export function BookingStatusLookup() {
  const params = useSearchParams();
  const fromUrl = params.get("ref") ?? "";
  const id = useId();
  const bookings = useBookings();
  const [query, setQuery] = useState(fromUrl);
  /*
    Seeded from the query string so a link with `?ref=` resolves on arrival,
    and `useState`'s initial value is enough for that — no effect, because
    `useBookings` is already the thing that turns a server render with no
    storage into a client render with it.
  */
  const [submitted, setSubmitted] = useState<string | null>(fromUrl || null);

  const record = submitted ? findBooking(bookings, submitted) : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wanted = query.trim();
    if (!wanted) return;
    setSubmitted(wanted);
  }

  return (
    <>
      {/*
        `method="get"` and an input named `ref`, which is the same parameter
        this page already reads on arrival.

        That combination is what makes a submit before hydration land
        somewhere useful. React's handler calls `preventDefault` once it is
        attached, so the ordinary path never reloads — but a visitor who types
        a reference and hits Enter in the first moments of the page load
        submits the real form, and without this it would navigate to a dead
        `?reference=` URL and show nothing. With it, the reload arrives at
        `?ref=…` and resolves exactly as a link from the confirmation does.
      */}
      <form
        method="get"
        action="/booking-status"
        onSubmit={onSubmit}
        noValidate
        className="mt-12 max-w-[26rem] md:mt-14"
      >
        <label
          htmlFor={id}
          className="block text-label font-medium uppercase tracking-eyebrow text-text/75"
        >
          Booking reference
        </label>
        <input
          id={id}
          name="ref"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="MP-D4K7XY"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${id}-hint`}
          className={FIELD}
        />
        <p id={`${id}-hint`} className="mt-3 text-fine leading-[1.7] text-text/75">
          It is on your confirmation, and looks like MP-D followed by six characters.
        </p>

        <button
          type="submit"
          className={cn(
            "group mt-9 inline-flex w-full items-center justify-center gap-2.5 rounded-sm px-8 py-4",
            "text-action font-medium uppercase leading-none tracking-eyebrow",
            "bg-primary text-on-primary transition-colors duration-300 ease-soft",
            "press-in hover:bg-primary/90 sm:w-auto",
          )}
        >
          Check status
          <span
            aria-hidden
            className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </button>
      </form>

      {/*
        `aria-live` on a wrapper that is always in the tree, rather than on the
        result itself: a live region announces changes to something already
        present, and one that appears at the same moment as its content is
        frequently missed.
      */}
      <div aria-live="polite" className="mt-12">
        {record ? <BookingSummaryCard record={record} /> : null}

        {submitted && !record ? (
          <div className="max-w-[38rem] border-l-2 border-terracotta bg-cream/60 p-7 md:p-9">
            <p className="text-label font-medium uppercase tracking-eyebrow text-text">
              No booking found
            </p>
            <p className="mt-4 text-body leading-[1.8] text-text/80">
              Nothing matches <span className="tabular-nums text-text">{submitted}</span>.
              Preview bookings are held in the browser they were made in, so a reference from
              another device — or from a browser whose data has been cleared — will not be found
              here.
            </p>
            <Link
              href="/events"
              className="group mt-7 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                Browse events
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
