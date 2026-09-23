"use client";

import Link from "next/link";
import { BlobButton } from "@/components/ui/BlobButton";
import { useSearchParams } from "next/navigation";

import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { PAYMENT_CONFIGURED, findBooking, useBookings } from "@/lib/booking";

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
 */
export function Confirmation() {
  const params = useSearchParams();
  const reference = params.get("ref");
  const bookings = useBookings();
  const record = reference ? findBooking(bookings, reference) : null;

  if (!record) return <NotFound reference={reference} />;

  return (
    <>
      <div className="mt-12 md:mt-14">
        <BookingSummaryCard record={record} />
      </div>

      {/*
        Said plainly, on the screen that would otherwise be the one place
        someone assumes they have paid. The brief's own instruction, and the
        right one: this page must never imply a transaction happened.
      */}
      {/*
        "Your place" and "a reserved seat" were right while a booking could
        only ever be a seat at a table. A pass is neither — it holds no seat
        until it is redeemed against a date — so the sentence now says the one
        thing that is true of both, and gives up nothing: it is still a request
        rather than a confirmation, which is the point of saying it at all.
      */}
      {!PAYMENT_CONFIGURED ? (
        <p className="mt-8 max-w-[42rem] text-fine leading-[1.8] text-text/75">
          No payment has been taken and none is due through this site yet, and this reference is
          held in your browser rather than by the studio. Send it to the Maison and we will
          confirm it — until then it is a request, not a confirmed booking.
        </p>
      ) : null}

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
    <div className="mt-12 max-w-[38rem] border-l-2 border-terracotta bg-cream/60 p-7 md:p-9">
      <p className="text-label font-medium uppercase tracking-eyebrow text-text">
        No booking to show
      </p>
      <p className="mt-4 text-body leading-[1.8] text-text/80">
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
  );
}
