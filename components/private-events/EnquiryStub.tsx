"use client";

import styles from "@/components/booking/PaintBooking.module.css";
import { BrushProgress, EYEBROW, Mark, NameLine } from "@/components/booking/PlaceCard";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * THE STUB, FILLING IN AS THE ENQUIRY IS WRITTEN
 * ==========================================================================
 *
 * At the client's ask, and it is the half of the ticket this route was
 * missing. The scheduled route's stub is the reason that card feels alive:
 * the name appears in it as you type, a dot turns into a tick for each
 * contact you give, and five strokes of paint fill in behind them. This is
 * that, for an enquiry.
 *
 * NameLine, Mark, BrushProgress and EYEBROW are imported from <PlaceCard>
 * rather than rewritten. They were local to it until now; exporting them was
 * the whole of the change over there, and it is what stops the two stubs
 * drifting into two different objects — the script name line, the dot that
 * blooms into a tick, the tilted strokes are one implementation.
 *
 * ==========================================================================
 * WHAT IT SHOWS, AND THE ONE ROW IT CANNOT HAVE
 * ==========================================================================
 *
 *   ADMIT ......... the name. Identical to the other route.
 *   THE EVENT ..... the type and the activity, each falling back to a dotted
 *                   placeholder. This is the slot PLACES occupies over there.
 *   EMAIL/PHONE/
 *   DATE .......... three marks, where the other has email, phone and note.
 *
 * NO TOTAL. That row is the whole point of the other stub and there is no
 * honest version of it here: an enquiry has no price, no quantity and no
 * availability behind it, and a stub that invented a figure would be the one
 * thing this route must never do. Its place is taken by the line the page
 * already stands behind — "An enquiry, not a booking."
 *
 * ==========================================================================
 * SIX STROKES, ONE PER FIELD THE FORM IS NOT OPTIONAL ABOUT
 * ==========================================================================
 *
 * The client counted them and they were wrong. The list is `validate()`'s,
 * not a judgement: it rejects a submit missing the name, the email, the
 * phone or the message, and it checks the date and the guest count only
 * when they hold something. Those four plus the two choosers — neither of
 * which carries the `optional` marker the other three wear — are the six
 * fields a visitor is being asked for.
 *
 * WHAT THE FIRST VERSION GOT WRONG, because each mistake is a different
 * kind and worth naming:
 *
 *   it counted the DATE ....... which is labelled `optional` on the form.
 *                               A stroke for it says the enquiry is
 *                               incomplete without one.
 *   it collapsed the two
 *   CHOOSERS into one ......... so answering both painted one stroke and
 *                               answering either painted the same one.
 *   it omitted the MESSAGE .... the one field `validate` will not let a
 *                               submit past, and the only one the studio
 *                               cannot do without.
 *
 * "NOT DECIDED YET" IS NOT AN ANSWER, for the stroke's purposes, and that is
 * consistent rather than a second rule: the submit handler drops it from
 * `details` on exactly the same test. A stroke that painted on load would be
 * telling somebody they had done something they had not.
 */
export function EnquiryStub({
  name,
  email,
  phone,
  date,
  occasion,
  activity,
  message,
  /** The value both choosers start on, so the stub can tell it from a choice. */
  undecided,
}: {
  name: string;
  email: string;
  phone: string;
  /** Optional on the form, so it earns a MARK but not a stroke. */
  date: string;
  occasion: string;
  activity: string;
  message: string;
  undecided: string;
}) {
  const chose = (value: string) => value !== "" && value !== undecided;

  const done = [
    name.trim() !== "",
    email.trim() !== "",
    phone.trim() !== "",
    chose(occasion),
    chose(activity),
    message.trim() !== "",
  ];

  return (
    <div
      aria-hidden
      className={cn("relative rounded-b-[1.5rem] bg-cream p-6 pt-5", styles.stubCut)}
    >
      <span className={styles.seam} />

      <p className={EYEBROW}>Admit</p>
      <NameLine name={name.trim()} />

      <div className="mt-3 text-fine text-text">
        <p className={EYEBROW}>The event</p>

        {/*
          TWO LINES, EACH HOLDING ITS OWN HEIGHT WHETHER OR NOT IT IS
          ANSWERED. A stub that grows as it is filled nudges everything under
          it down the card on every keystroke — and this card is `sticky`, so
          a height that changes is a card that jumps while you are reading it.
          `min-h` on each line is what the other stub buys with its fixed
          `h-[2.75rem]` name line.
        */}
        <p className="mt-2 flex min-h-[1.5rem] items-end">
          {chose(occasion) ? (
            <span className="font-medium text-text">{occasion}</span>
          ) : (
            <span className="border-b border-dotted border-text/40 pb-0.5 text-text/75">
              Event type
            </span>
          )}
        </p>
        <p className="mt-1.5 flex min-h-[1.5rem] items-end">
          {chose(activity) ? (
            <span className="font-medium text-text">{activity}</span>
          ) : (
            <span className="border-b border-dotted border-text/40 pb-0.5 text-text/75">
              Creative activity
            </span>
          )}
        </p>

        {/* Three even columns, for the reason the other stub gives: at the
            card's narrowest a wrapping row drops the third onto a line of its
            own and costs the card the height it needs to stick. */}
        <div className="mt-3.5 grid grid-cols-3 gap-x-1">
          <Mark label="Email" on={email.trim() !== ""} />
          <Mark label="Phone" on={phone.trim() !== ""} />
          <Mark label="Date" on={date.trim() !== ""} />
        </div>
      </div>

      <div className="mt-4 border-t border-text/15 pt-3">
        <p className={EYEBROW}>What you are sending</p>
        <p className="mt-2 text-lead font-medium leading-snug tracking-[-0.01em] text-text">
          An enquiry, not a booking.
        </p>
      </div>

      <BrushProgress done={done} className="mt-3.5" />

      <p className="mt-3 text-fine leading-[1.7] text-text/75">
        Nothing here is fixed once you send it.
      </p>
    </div>
  );
}
