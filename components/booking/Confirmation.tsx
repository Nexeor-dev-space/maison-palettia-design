"use client";

import Link from "next/link";
import { BlobButton } from "@/components/ui/BlobButton";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { Reveal } from "@/components/motion/Reveal";
import { findBooking, useBookings } from "@/lib/booking";
import { BOOKING_TERMS, bookingTerms, CONTACT, REFERENCE_CHANNEL_SET } from "@/lib/constants";

/**
 * The confirmation, read back from the reference in the URL.
 *
 * Client component, and it has to be: the booking lives in this browser's own
 * storage (see lib/booking.ts) and there is no server that could render it.
 * The record is read through `useBookings`, which is a `useSyncExternalStore`
 * over that storage — so the server renders an empty list, the client renders
 * the real one, and React is told about the difference instead of discovering
 * it as a hydration mismatch. No effect, and no cascading render.
 *
 * The reference travels in the query string rather than in storage-only state
 * so the page survives a reload and can be linked from an email later without
 * changing anything here.
 *
 * THE PAGE'S HEADING LIVES HERE NOW, because only this component knows which
 * page it is. app/payment-success printed "Your reference is ready." above
 * whatever this rendered — including, with no `?ref=` or one this browser
 * has never seen, directly above "No booking to show". The heading was
 * claiming a reference that the box under it said did not exist. So each
 * branch carries its own h1, and the route keeps only the eyebrow.
 */
export function Confirmation() {
  const params = useSearchParams();
  const reference = params.get("ref");
  const bookings = useBookings();
  const read = useStoreRead();
  const record = reference ? findBooking(bookings, reference) : null;

  /*
    "Not found" only once the store has actually been read. Before that, no
    record means "not looked yet": lib/booking.ts reads browser storage on its
    first subscription, which React makes after the first render — so that
    render always sees an empty list. With the heading in this component the
    gap was measured on a reload of a real confirmation: "Find your booking."
    and the "No booking to show" box painted for ~80-100ms before the record
    replaced them. The empty frame now says what is happening instead.
  */
  if (!record && reference && !read) return <LookingUp />;
  if (!record) return <NotFound reference={reference} />;

  return (
    <>
      {/*
        True in every state of the backend: a reference exists, and the card
        under it carries the status — Pending today, so nothing here may say
        "confirmed" or "held". It said "Booking confirmed" once, over a record
        nobody had received.
      */}
      <PageHeading>Your reference is ready.</PageHeading>

      <div className="mt-12 md:mt-14">
        <BookingSummaryCard record={record} />
      </div>

      {/*
        Said plainly, on the screen that would otherwise be the one place
        someone assumes they have paid. The brief's own instruction, and the
        right one: this page must never imply a transaction happened.

        ONE SENTENCE, SHARED. This is BOOKING_TERMS in lib/constants.ts, the
        same words checkout prints under "Confirm booking" and the FAQ gives
        for "Am I charged?", picked by the two flags in lib/bookingFlags.ts so it
        changes everywhere at once when a backend is wired. This page's own
        version was the only one of the four that was right — a request, kept
        in this browser, confirmed once the studio has the reference — and it
        is what the shared sentence says, less "send them your reference"
        while there is nowhere to send it (see <SendReference> below). It no
        longer says "a place" or "a seat" either, so it stays true of a pass,
        which holds no seat until it is redeemed against a date.
      */}
      <p className="mt-8 max-w-[42rem] text-fine leading-[1.8] text-text/75">
        {bookingTerms()}
      </p>
      <SendReference />

      <div className="mt-11 flex flex-wrap items-center gap-x-9 gap-y-5">
        <BlobButton href="/events" className="px-7 py-4">
          View events
        </BlobButton>

        <Link
          href={`/booking-status?ref=${encodeURIComponent(record.reference)}`}
          className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
        >
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            Check booking status
          </span>
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

/*
  WHERE "SEND THEM YOUR REFERENCE" GOES — said only when there is somewhere.

  The request line asks the customer to send their reference to the studio
  only while REFERENCE_CHANNEL_SET says a channel exists (see the note over
  BOOKING_TERMS in lib/constants.ts), and this page is where they are holding
  the reference when they read it, so it names the channel as a link instead
  of leaving them to go and find one: the studio's email, its phone, or — with
  neither published but the form wired — the contact page. Today all three
  are missing, the line ends at "keep the reference you are given", and this
  renders nothing. Nor does it under the `recorded` or `paid` sentences,
  which ask the customer to send nothing.

  The links take the contact page's own treatment for an address and a
  number — a hairline that warms to Terracotta — so they read as links in a
  sentence without relying on colour alone.
*/
const SEND_LINK =
  "border-b border-line pb-0.5 text-text transition-colors duration-300 ease-soft hover:border-terracotta";

function SendReference() {
  if (!REFERENCE_CHANNEL_SET || bookingTerms() !== BOOKING_TERMS.request) return null;

  const email = CONTACT.email ? (
    <a href={`mailto:${CONTACT.email}`} className={SEND_LINK}>
      {CONTACT.email}
    </a>
  ) : null;
  const phone = CONTACT.phone ? (
    <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className={SEND_LINK}>
      {CONTACT.phone}
    </a>
  ) : null;

  return (
    <p className="mt-3 max-w-[42rem] text-fine leading-[1.8] text-text/75">
      {email || phone ? (
        <>
          Send it to {email}
          {email && phone ? " or " : null}
          {phone}.
        </>
      ) : (
        <>
          Send it through the{" "}
          <Link href="/contact" className={SEND_LINK}>
            contact page
          </Link>
          .
        </>
      )}
    </p>
  );
}

/*
  Whether this page has subscribed to the bookings store yet — i.e. whether
  `useBookings` is returning what storage holds or the empty list it starts
  from. Flipped by this store's own subscription, which React makes in the
  same pass as the bookings store's, so the render that follows has both the
  records and the flag. False on the server and through hydration, so the
  HTML and the first client render agree.

  Module-level on purpose: once read in this tab, the bookings store stays
  read, and a second visit should not pass through "looking" again.

  This is the hook lib/booking.ts would carry if it were written like
  lib/cart.ts (`useCartHydrated`). It is not, and that file is not this
  one's to change — so the signal is kept here, next to the one place that
  needs it.
*/
let storeRead = false;
function subscribeStoreRead(onChange: () => void) {
  if (!storeRead) {
    storeRead = true;
    onChange();
  }
  return () => {};
}
function useStoreRead(): boolean {
  return useSyncExternalStore(
    subscribeStoreRead,
    () => storeRead,
    () => false,
  );
}

/** The frame before the store has been read — the route's own fallback line. */
function LookingUp() {
  return (
    <p role="status" className="mt-12 text-body text-text/75">
      Looking up your booking&hellip;
    </p>
  );
}

/**
 * No reference, or one this browser has never seen.
 *
 * Both cases get the same screen because the visitor can act on both the same
 * way, and distinguishing them would mean telling someone their reference is
 * "wrong" when the real answer is that bookings are stored per browser and
 * they are on a different device.
 */
function NotFound({ reference }: { reference: string | null }) {
  return (
    <>
      {/* Neutral, because there is nothing to announce: the box below says
          why, and the heading's only job is to say what the page is for. */}
      <PageHeading>Find your booking.</PageHeading>

      <div className="mt-12 max-w-[38rem] border-l-2 border-terracotta bg-cream/60 p-7 md:p-9">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">
          No booking to show
        </p>
        <p className="mt-4 text-body text-text/80">
          {reference ? (
            <>
              Nothing here matches <span className="tabular-nums text-text">{reference}</span>.
              Preview bookings are held in the browser they were made in, so a reference from
              another device or a cleared browser will not be found.
            </>
          ) : (
            <>This page needs a booking reference. Open it from a confirmation, or look a booking up by its reference.</>
          )}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/booking-status"
            className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Check a booking
            </span>
          </Link>
          <Link
            href="/events"
            className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              View events
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}

/**
 * The route's h1, set exactly as app/payment-success set it before it moved
 * here — the same measure, size and case — so the page reads as it did; only
 * the words now depend on what was found.
 */
function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <h1 className="mt-9 max-w-[20ch] text-h1 font-light uppercase tracking-[-0.02em]">
        {children}
      </h1>
    </Reveal>
  );
}
