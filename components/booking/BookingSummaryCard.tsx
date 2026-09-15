import Link from "next/link";

import { resolveStatus, type BookingRecord } from "@/lib/booking";

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";

/** "AED 320" — the code rather than a symbol, matching the rest of the site. */
function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

const ZONE = "Asia/Dubai";

function dayLine(startsAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  }).format(new Date(startsAt));
}

function timeLine(startsAt: string, durationMinutes: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ZONE,
  });
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/**
 * How each state is worded and marked.
 *
 * The rule's colour is the secondary signal, never the only one: the word is
 * always there, so a state is legible without seeing colour at all.
 */
const STATUS_COPY: Record<
  ReturnType<typeof resolveStatus>,
  { label: string; note: string; rule: string }
> = {
  confirmed: {
    label: "Confirmed",
    note: "Your place is held. Come to the venue at the time below.",
    rule: "border-primary",
  },
  completed: {
    label: "Completed",
    note: "This event has already taken place. We hope you took something home.",
    rule: "border-text/40",
  },
  pending: {
    label: "Pending",
    note: "This booking is waiting on confirmation from the Maison.",
    rule: "border-terracotta",
  },
  cancelled: {
    label: "Cancelled",
    note: "This booking is no longer held.",
    rule: "border-terracotta",
  },
};

/**
 * One booking, rendered the same way on the confirmation and on the status
 * page.
 *
 * Shared rather than written twice, because the two screens show identical
 * facts and the only difference between them is what is said above the card.
 * Two copies of this would have drifted by the second change to the data.
 */
export function BookingSummaryCard({ record }: { record: BookingRecord }) {
  const status = resolveStatus(record);
  const copy = STATUS_COPY[status];
  const places = record.lines.reduce((n, line) => n + line.quantity, 0);
  /*
    "Places" is a seat at a session; a pass holds none until it is redeemed
    against a date. A record of sessions keeps the word; one with a pass in it
    counts items, which is the only word true of both. Same derivation as
    <CartSummary>, for the same reason.
  */
  const unit = record.lines.every((line) => line.kind === "session") ? "place" : "item";
  /*
    Whether anything here happens at a time and a place. The confirmed note
    tells the customer to come to the venue, which is right for a session and
    meaningless for a pass bought on its own.
  */
  const hasSession = record.lines.some((line) => line.kind === "session");

  return (
    <div className={`border-l-2 ${copy.rule} bg-cream/60 p-7 md:p-9`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <div>
          <p className={TERM}>Status</p>
          <p className="mt-2 text-lead font-medium text-text">{copy.label}</p>
        </div>
        <div>
          <p className={TERM}>Reference</p>
          {/*
            Selectable and set in tabular figures: it is meant to be copied
            into the status page, and a reference that is awkward to select is
            a reference people mistype.
          */}
          <p className="mt-2 select-all text-lead font-medium tabular-nums tracking-[0.08em] text-text">
            {record.reference}
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-[34rem] text-body leading-[1.8] text-text/80">
        {status === "confirmed" && !hasSession ? "Your purchase is confirmed." : copy.note}
      </p>

      {record.lines.map((line) => (
        <dl key={line.slug} className="mt-8 border-t border-line pt-7">
          <div>
            <dt className={TERM}>{line.kind === "session" ? "Event" : "Pass"}</dt>
            <dd className="mt-2 text-lead font-light leading-[1.3] text-text">
              <Link
                href={line.kind === "session" ? `/events/${line.slug}` : "/loyalty"}
                className="border-b border-terracotta/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-terracotta"
              >
                {line.title}
              </Link>
            </dd>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {/*
              A session happens at a time and a place; a pass does neither until
              it is redeemed. It states what it carries instead, and states
              nothing at all when the data carries nothing — a "Date" row
              reading "—" would be worse than no row.
            */}
            {line.kind === "session" ? (
              <>
                <div>
                  <dt className={TERM}>Date</dt>
                  <dd className="mt-2 text-body text-text">
                    <time dateTime={line.startsAt}>{dayLine(line.startsAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt className={TERM}>Time</dt>
                  <dd className="mt-2 text-body tabular-nums text-text">
                    {timeLine(line.startsAt, line.durationMinutes)}
                  </dd>
                </div>

                {/* Venue is optional on the data model — see {@link Venue}. */}
                {line.venueName ? (
                  <div>
                    <dt className={TERM}>Location</dt>
                    <dd className="mt-2 text-body text-text">
                      {line.venueName}
                      {line.venueLocality ? (
                        <span className="block text-text/75">{line.venueLocality}</span>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : line.summary ? (
              <div>
                <dt className={TERM}>Includes</dt>
                <dd className="mt-2 text-body text-text">{line.summary}</dd>
              </div>
            ) : null}

            <div>
              <dt className={TERM}>{line.kind === "session" ? "Places" : "Passes"}</dt>
              <dd className="mt-2 text-body tabular-nums text-text">{line.quantity}</dd>
            </div>
          </div>
        </dl>
      ))}

      <dl className="mt-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t border-line pt-7">
        <div>
          <dt className={TERM}>Guest</dt>
          <dd className="mt-2 text-body text-text">
            {record.details.firstName} {record.details.lastName}
          </dd>
          <dd className="mt-1 text-fine text-text/75">{record.details.email}</dd>
        </div>
        <div className="text-right">
          <dt className={TERM}>{record.paid ? "Paid" : "Total"}</dt>
          <dd className="mt-2 text-lead font-medium tabular-nums text-text">
            {money(record.subtotal, record.currency)}
          </dd>
          <dd className="mt-1 text-fine text-text/75">
            {places} {places === 1 ? unit : `${unit}s`}
          </dd>
        </div>
      </dl>
    </div>
  );
}
