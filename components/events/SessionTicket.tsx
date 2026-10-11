import Link from "next/link";

import { SessionGate } from "@/components/booking/SessionClock";
import { TERM } from "@/components/events/WorkshopTypeCards";
import { BlobButton } from "@/components/ui/BlobButton";
import { PeelNote } from "@/components/ui/PeelNote";
import { cn } from "@/lib/utils";
import {
  bookingStepHref,
  durationToIso,
  formatDuration,
  formatPrice,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

import styles from "./Ticket.module.css";

/**
 * One dated sitting of a format, as a ticket: the date, the time and the
 * price on the body, the seats and the door on a stub torn off the end
 * (Ticket.module.css says how the notches are cut).
 *
 * Drawn on a format's page under "Pick a date" (components/events/
 * WorkshopTypePages.tsx), where it replaced a bordered row. The dated
 * cards elsewhere — <EventCard> in the listing and the showcase — keep
 * their own shape: those are events to read about, this is a seat to buy.
 *
 *   open .......... "Book" into the booking step
 *   waitlist ...... "Join the waitlist" to the session page, which holds the form
 *   full .......... the state, in words, and a link to the date's page
 *   passed ........ never listed: the resolver drops them before render,
 *                   and <SessionGate> closes a ticket that lapses on screen
 *
 * `perPersonLabel` and `priceTerm` are the Page labels, passed in by the
 * server component that read them.
 */
export function SessionTicket({
  session,
  renderedAt,
  priceTerm = "Price",
  perPersonLabel = "per person",
}: {
  session: Workshop;
  renderedAt: number;
  priceTerm?: string;
  perPersonLabel?: string;
}) {
  const { weekday, day, month } = sessionDateParts(session.startsAt);
  const { start, end } = sessionTimeRange(session.startsAt, session.durationMinutes);
  const full = isFullyBooked(session);
  const waitlist = session.status === "waitlist" || full;
  const scarce = isScarce(session);
  const passed = Date.parse(session.startsAt) <= renderedAt;

  return (
    <article className={styles.ticket} aria-label={`${weekday} ${day} ${month}, ${start}`}>
      <div className={cn(styles.body, "grid grid-cols-12 items-center gap-x-4 gap-y-5 px-6 py-6 md:gap-x-6 md:px-8 md:py-7")}>
        {/* The date, set stepped: the numeral largest, the day and month under it. */}
        <Link href={workshopHref(session)} className="col-span-12 flex items-baseline gap-3 sm:col-span-4">
          <time dateTime={session.startsAt} className="text-folio font-light leading-none tabular-nums text-text">
            {day}
          </time>
          <span className="text-body font-medium leading-tight text-text">
            {month}
            <span className="block text-fine font-normal text-text/75">{weekday}</span>
          </span>
        </Link>

        <div className="col-span-7 sm:col-span-5">
          <span className={TERM}>Time</span>
          <p className="mt-1 text-body font-medium tabular-nums text-text">
            {start} <span aria-hidden className="text-text/50">–</span> <span className="sr-only">to</span> {end}
          </p>
          <p className="text-fine text-text/75">
            <time dateTime={durationToIso(session.durationMinutes)}>{formatDuration(session.durationMinutes)}</time>
            {session.venue ? <span> · {session.venue.name}</span> : null}
          </p>
        </div>

        <div className="col-span-5 sm:col-span-3">
          <span className={TERM}>{priceTerm}</span>
          <p className="mt-1 text-body font-medium text-text">
            {formatPrice(session.price)}
            <span className="block text-fine font-normal text-text/75">{perPersonLabel}</span>
          </p>
        </div>
      </div>

      {/* The stub: what is left, and the door. */}
      <div className={cn(styles.stub, "px-6 py-4 md:gap-3 md:px-7 md:py-6")}>
        <p className="flex items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-text">
          <SessionGate
            startsAt={session.startsAt}
            passedAtRender={passed}
            open={
              <>
                {scarce ? <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-primary" /> : null}
                {spotsLabel(session)}
              </>
            }
            passed="Date passed"
          />
        </p>
        <SessionGate
          startsAt={session.startsAt}
          passedAtRender={passed}
          open={
            waitlist ? (
              <PeelNote href={workshopHref(session)} className="min-h-[2.75rem] px-5">
                {full && session.status !== "waitlist" ? "View date" : "Join the waitlist"}
              </PeelNote>
            ) : (
              <BlobButton href={bookingStepHref(session)} className="px-6 py-3.5 md:w-full md:justify-center">
                Book
              </BlobButton>
            )
          }
          passed={null}
        />
      </div>
    </article>
  );
}
