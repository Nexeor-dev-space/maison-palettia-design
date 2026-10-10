import Link from "next/link";

import { displayStatus, formatFils, type DisplayStatus, type OrderView } from "@/components/booking/orderView";

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";
const LINK =
  "border-b border-terracotta/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-terracotta";

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

function timeLine(startsAt: string, durationMinutes?: number) {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONE });
  const start = new Date(startsAt);
  if (!durationMinutes) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(new Date(start.getTime() + durationMinutes * 60_000))}`;
}

/** The four states the admin words (Booking & checkout wording → Booking status wording). */
export type StatusCopy = Partial<Record<"confirmed" | "pending" | "completed" | "cancelled", { label?: string | null; note?: string | null }>>;

/**
 * How each state is worded and marked. The rule's colour is the secondary
 * signal, never the only one: the word is always printed.
 *
 * Four of the six take the admin's wording when it is set. `processing` is
 * NOT the admin's "pending" ("waiting on confirmation from the Maison"): a
 * paid booking is not waiting on a person, it is waiting on a payment
 * notification measured in seconds, and saying otherwise would send people
 * to the contact form. `not_paid` and `refunded` have no admin wording.
 */
function statusWords(status: DisplayStatus, copy: StatusCopy = {}): { label: string; note: string; rule: string } {
  const pick = (key: keyof StatusCopy, label: string, note: string) => ({
    label: copy[key]?.label?.trim() || label,
    note: copy[key]?.note?.trim() || note,
  });
  switch (status) {
    case "confirmed":
      return { ...pick("confirmed", "Confirmed", "Your place is held. Come to the venue at the time below."), rule: "border-primary" };
    case "completed":
      return {
        ...pick("completed", "Completed", "This event has already taken place. We hope you took something home."),
        rule: "border-text/40",
      };
    case "cancelled":
      return { ...pick("cancelled", "Cancelled", "This booking is no longer held."), rule: "border-terracotta" };
    case "refunded":
      return {
        label: "Refunded",
        note: "This booking was refunded to the card it was paid with. Refunds usually reach the account within a few working days.",
        rule: "border-terracotta",
      };
    case "not_paid":
      return {
        label: "Not paid",
        note: "The payment for this booking did not go through, so nothing was charged and nothing is booked.",
        rule: "border-terracotta",
      };
    default:
      return {
        label: "Processing",
        note: "Your payment is being confirmed. Your tickets follow by email as soon as it is — usually within a minute.",
        rule: "border-terracotta",
      };
  }
}

/**
 * One booking, rendered the same way on the confirmation, the status lookup
 * and the guest's list of bookings.
 *
 * Shared rather than written three times, because the screens show identical
 * facts and differ only in what is said above the card. No hooks and no
 * directive, so a server page (/my-bookings) and a client one (the lookup)
 * render the same component.
 *
 * Every fact is the ORDER's, as the server recorded it — the title, date and
 * venue were snapshotted onto the order line when it was paid for, so a
 * session renamed or moved afterwards does not rewrite what was bought here
 * (a move by the studio rewrites the line itself, and that is shown).
 *
 * A view without `detail` (no proof of ownership yet) shows the reference
 * and the state only.
 */
/** Captured, tickets on their way: `confirming` is paid, unlike the rest of "processing". */
const PAID_NOTE = "Payment received. Your tickets are being issued and will arrive by email in a moment.";

export function BookingSummaryCard({
  view,
  statusCopy,
  purchaseConfirmedNote = "Your purchase is confirmed.",
}: {
  view: OrderView;
  statusCopy?: StatusCopy;
  purchaseConfirmedNote?: string;
}) {
  const status = displayStatus(view.status);
  const words = statusWords(status, statusCopy);
  const detail = view.detail;
  const lines = detail?.lines ?? [];
  const places = lines.reduce((n, line) => n + line.qty, 0);
  /*
    "Places" is a seat at a session; a pass holds none until it is redeemed
    against a date. A booking of sessions keeps the word; one with a pass in
    it counts items, which is the only word true of both.
  */
  const unit = lines.every((line) => line.kind === "session") ? "place" : "item";
  const hasSession = lines.some((line) => line.kind === "session");
  const tickets = (detail?.tickets ?? []).filter((ticket) => ticket.status !== "void");

  return (
    <div className={`border-l-2 ${words.rule} bg-cream/60 p-7 md:p-9`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <div>
          <p className={TERM}>Status</p>
          <p className="mt-2 text-lead font-medium text-text">{words.label}</p>
        </div>
        <div>
          <p className={TERM}>Reference</p>
          {/* Selectable and in tabular figures: it is read out at the desk and typed into the lookup. */}
          <p className="mt-2 select-all text-lead font-medium tabular-nums tracking-[0.08em] text-text">
            {view.reference}
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-[34rem] text-body text-text/80">
        {status === "confirmed" && detail && !hasSession
          ? purchaseConfirmedNote
          : view.status === "confirming"
            ? PAID_NOTE
            : words.note}
      </p>

      {detail?.failureMessage && status === "not_paid" ? (
        <p className="mt-3 max-w-[34rem] text-body text-text">
          The payment page said: <span className="italic">{detail.failureMessage}</span>
        </p>
      ) : null}

      {lines.map((line, index) => (
        <dl key={`${line.title}-${index}`} className="mt-8 border-t border-line pt-7">
          <div>
            <dt className={TERM}>{line.kind === "session" ? "Event" : "Pass"}</dt>
            <dd className="mt-2 text-lead font-light leading-[1.3] text-text">
              {line.href ? (
                <Link href={line.href} className={LINK}>
                  {line.title}
                </Link>
              ) : (
                line.title
              )}
            </dd>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {line.kind === "session" && line.startsAt ? (
              <>
                <div>
                  <dt className={TERM}>Date</dt>
                  <dd className="mt-2 text-body text-text">
                    <time dateTime={line.startsAt}>{dayLine(line.startsAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt className={TERM}>Time</dt>
                  <dd className="mt-2 text-body tabular-nums text-text">{timeLine(line.startsAt, line.durationMinutes)}</dd>
                </div>
                {line.venueName ? (
                  <div>
                    <dt className={TERM}>Location</dt>
                    <dd className="mt-2 text-body text-text">{line.venueName}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div>
              <dt className={TERM}>{line.kind === "session" ? "Places" : "Passes"}</dt>
              <dd className="mt-2 text-body tabular-nums text-text">{line.qty}</dd>
            </div>
          </div>
        </dl>
      ))}

      {/*
        THE TICKETS, once they exist. Issued by the finalise job seconds after
        the payment is confirmed, so a confirmation opened at once may show
        the line below instead — the email carries them either way. Each link
        is signed and expires (SPEC §H.7): the only customer path to a PDF.
      */}
      {detail && hasSession && (status === "confirmed" || status === "completed") ? (
        <div className="mt-8 border-t border-line pt-7">
          <p className={TERM}>Tickets</p>
          {tickets.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {tickets.map((ticket) => (
                <li key={ticket.code} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-body">
                  <span className="tabular-nums tracking-[0.06em] text-text">
                    {ticket.code}
                    <span className="ml-3 text-fine tracking-normal text-text/70">
                      Place {ticket.seatNo}
                      {ticket.status === "checked_in" ? " · checked in" : ""}
                      {ticket.status === "refunded" ? " · refunded" : ""}
                    </span>
                  </span>
                  {ticket.pdfUrl && ticket.status !== "refunded" ? (
                    <a href={ticket.pdfUrl} className={`text-fine text-text ${LINK}`}>
                      Download ticket (PDF)
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body text-text/80">Your tickets are being issued and will arrive by email.</p>
          )}
        </div>
      ) : null}

      {detail ? (
        <dl className="mt-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t border-line pt-7">
          <div>
            <dt className={TERM}>Guest</dt>
            <dd className="mt-2 text-body text-text">
              {detail.guest.firstName} {detail.guest.lastName}
            </dd>
            {detail.guest.email ? <dd className="mt-1 text-fine text-text/75">{detail.guest.email}</dd> : null}
          </div>
          <div className="text-right">
            <dt className={TERM}>{detail.paid ? "Paid" : "Total"}</dt>
            <dd className="mt-2 text-lead font-medium tabular-nums text-text">
              {formatFils(detail.totals.grossFils, detail.totals.currency)}
            </dd>
            <dd className="mt-1 text-fine text-text/75">
              {places} {places === 1 ? unit : `${unit}s`}
              {detail.totals.discountFils > 0 ? ` · ${formatFils(detail.totals.discountFils, detail.totals.currency)} off` : ""}
            </dd>
            {detail.totals.vatFils > 0 ? (
              <dd className="mt-1 text-fine text-text/75">
                Includes VAT {formatFils(detail.totals.vatFils, detail.totals.currency)}
              </dd>
            ) : null}
            {detail.invoice?.pdfUrl ? (
              <dd className="mt-3 text-fine">
                <a href={detail.invoice.pdfUrl} className={`text-text ${LINK}`}>
                  Invoice {detail.invoice.number} (PDF)
                </a>
              </dd>
            ) : null}
          </div>
        </dl>
      ) : null}
    </div>
  );
}
