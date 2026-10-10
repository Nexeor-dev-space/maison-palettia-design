"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { PlaceDabs, WELL_BLOBS } from "@/components/booking/PlacePalette";
import { EASE_EDITORIAL } from "@/lib/motion";
import { PAINTS_ON_CREAM, paintAt } from "@/lib/paint";
import { cn } from "@/lib/utils";

export const EYEBROW = "text-label font-medium uppercase tracking-eyebrow text-text/75";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/*
  THE SCRIPT FACE IS LATIN ONLY. Hapsha draws Latin and nothing else, and its
  fallback is Georgia — so an Arabic or Devanagari name set in `heading-script`
  would come out in whatever serif the system has, at a size chosen for a
  script with long ascenders. Anything outside Latin, spaces, apostrophes,
  stops and hyphens is set in the sans instead, which has the scripts.
*/
const LATIN_NAME = /^[\p{Script=Latin}\s'’.-]+$/u;

/**
 * The place card: the session (the face, drawn on the server) and a stub that
 * fills in as the form is answered — the visitor's name in script, the party
 * as dabs of paint, a stroke of progress for each thing still to tell us.
 *
 * It is a picture of the form, not a second copy of it, so the stub is hidden
 * from assistive technology entirely. Everything on it is said once already,
 * by the field or the total it mirrors; a screen reader hearing it twice —
 * once as the visitor types it and again as the card repeats it — is the
 * chatter the live total is careful not to make.
 *
 * The face is readable: it is the summary of what is being booked, and on a
 * desktop it is the only one on the page. (Phones get <SessionStrip> above
 * the form instead; only one of the two is ever displayed.)
 */
export function PlaceCard({ face, children }: { face: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.cardShadow}>
      <div className={cn(styles.faceCut, "overflow-hidden rounded-t-[1.5rem] bg-cream")}>
        {face}
      </div>
      {children}
    </div>
  );
}

interface PlaceCardStubProps {
  /** `card` sits under the face on a desktop; `inline` stands alone above a
   *  phone's button, in its own shadow, with an eyebrow to say what it is. */
  variant: "card" | "inline";
  /** First and last name, trimmed. Empty until either is typed. */
  displayName: string;
  quantity: number;
  /** The price of one place, already formatted: "AED 240". */
  unitLabel: string;
  totalLabel: string;
  /** The widest the total can get, in `ch`, so it never moves its label. */
  totalMinCh: number;
  /** One per progress stroke: places, then each of the four required fields. */
  done: readonly boolean[];
  hasEmail: boolean;
  hasPhone: boolean;
  hasNote: boolean;
  submitting: boolean;
}

/**
 * The stub — the half of the card the visitor is writing.
 *
 * NO EMAIL OR PHONE NUMBER IS EVER ECHOED. This page is booked on phones in
 * malls and on studio tablets with a queue behind them; a card that repeated
 * an address and a number back in large type would be showing them to
 * whoever is standing there. A tick says "we have it", which is all the card
 * needs to say.
 *
 * Every line has a reserved height — the name is one fixed line that
 * truncates, the total has a minimum width, the stamp is positioned over the
 * card rather than in its flow — so nothing about the card changes size as it
 * fills, and nothing under it moves.
 */
export function PlaceCardStub({
  variant,
  displayName,
  quantity,
  unitLabel,
  totalLabel,
  totalMinCh,
  done,
  hasEmail,
  hasPhone,
  hasNote,
  submitting,
}: PlaceCardStubProps) {
  const stub = (
    <div
      aria-hidden
      className={cn("relative rounded-b-[1.5rem] bg-cream p-6 pt-5", styles.stubCut)}
    >
      <span className={styles.seam} />

      <p className={EYEBROW}>Admit</p>

      {/*
        `w-fit`, SO THE PAINT IS AS LONG AS THE NAME.

        The swatch was a fixed `w-36` sibling of the name — 144px of Deep
        Lilac under every booking whatever the name was, so "da sdfsd"
        carried a stroke half again as long as itself and a two-character
        name carried one four times its length. The client's note.

        `width: fit-content` makes this box as wide as the widest thing in
        it, which is the name, and the swatch inside takes `w-full`. No
        measuring and no layout effect: the name sets the width and the
        paint follows it. `max-w-full` keeps the cap, so a long name still
        truncates at the card's edge and the stroke stops with it.
      */}
      <div className="w-fit max-w-full">
        <NameLine name={displayName} />
        <Swatch show={displayName !== ""} />
      </div>

      <div className="mt-3 text-fine text-text">
        <div className="flex items-baseline justify-between gap-4">
          <span className={EYEBROW}>Places</span>
          <span className="tabular-nums">
            {quantity} &times; {unitLabel}
          </span>
        </div>
        <PlaceDabs count={quantity} className="mt-2" />

        {/* Three even columns rather than a wrapping row: at the card's
            narrowest (305px, at 1024 wide) a row wrapped "Note" onto a line
            of its own and cost the card the height it needs to stick. */}
        <div className="mt-3 grid grid-cols-3 gap-x-1">
          <Mark label="Email" on={hasEmail} />
          <Mark label="Phone" on={hasPhone} />
          <Mark label="Note" on={hasNote} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-text/15 pt-3">
        <span className={EYEBROW}>Total</span>
        <span
          className="text-right text-lead font-medium tabular-nums text-text"
          style={{ minWidth: `${totalMinCh}ch` }}
        >
          {totalLabel}
        </span>
      </div>

      <BrushProgress done={done} className="mt-3" />

      <p className="mt-3 text-fine text-text/75">Nothing is booked yet. You&rsquo;ll review and pay on the next step.</p>

      <Stamp show={submitting} />
    </div>
  );

  if (variant === "card") return stub;

  return (
    <div aria-hidden>
      <p className={EYEBROW}>Your place card</p>
      <div className={cn("mt-4", styles.cardShadow)}>{stub}</div>
    </div>
  );
}

/**
 * The name, on one line of fixed height.
 *
 * Set in the script at 28px — Charcoal on White Rock at that size is far past
 * any ratio it owes — and truncated rather than wrapped, so "Maria-Fernanda
 * de la Cruz Villanueva" costs the card no more height than "Ana". `dir="auto"`
 * lets a right-to-left name sit at its own start.
 */
export function NameLine({ name }: { name: string }) {
  if (!name) {
    return (
      <p className="flex h-[2.75rem] items-end pb-1.5">
        <span className="border-b border-dotted border-text/40 pb-0.5 text-fine text-text/75">
          Your name
        </span>
      </p>
    );
  }

  const latin = LATIN_NAME.test(name);
  return (
    <p
      dir="auto"
      className={cn(
        "h-[2.75rem] truncate text-text",
        latin
          ? "heading-script pt-1.5 text-[1.75rem] leading-[1.35]"
          : "font-sans text-lead font-medium leading-[2.75rem]",
      )}
    >
      {name}
    </p>
  );
}

/**
 * A stroke of Deep Lilac under the name, laid once when the first letter
 * arrives — not redrawn per keystroke, which would be a card fidgeting while
 * someone types. Cleared, it fades; typed again, it paints again.
 */
function Swatch({ show }: { show: boolean }) {
  const reduce = useReducedMotion();

  return (
    <span className="-mt-1 block h-4">
      <AnimatePresence initial={false}>
        {show ? (
          <motion.span
            key="swatch"
            className="block w-full"
            style={{ transformOrigin: "0% 50%" }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.42, ease: EASE_EDITORIAL }}
          >
            <span
              className="dab h-4 w-full"
              style={{ "--paint": "var(--color-primary)", "--tilt": "-1.5deg" } as CSSVars}
            />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

/** "Email ✓" or "Email —": that it is there, never what it is. */
export function Mark({ label, on }: { label: string; on: boolean }) {
  const reduce = useReducedMotion();

  return (
    <span className="flex h-5 items-center gap-1.5">
      <span className={EYEBROW}>{label}</span>
      <span className="relative flex size-5 items-center justify-center">
        {/* A middle dot rather than an em dash: the client has asked for the
            long dash to come off the site, and a status marker is still
            something a visitor reads. The dot is the same "nothing here yet"
            signal and it pairs with the tick that replaces it. */}
        {on ? null : <span className="text-text/75">&middot;</span>}
        <AnimatePresence initial={false}>
          {on ? (
            <motion.span
              key="on"
              className="blob absolute inset-0 flex items-center justify-center bg-lavender text-text"
              style={{ "--blob": WELL_BLOBS[1] } as CSSVars}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_EDITORIAL }}
            >
              <Check size={12} strokeWidth={2.5} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </span>
  );
}

/** Each stroke's lean. Fixed, so the row reads as paint and not as a bar. */
const PROGRESS_TILTS = ["-1.5deg", "1deg", "-0.5deg", "1.5deg", "-1deg"] as const;

/**
 * Five strokes, one per thing the booking needs: the places (answered from
 * the start — one is chosen on arrival), then first name, last name, email
 * and phone. Each paints in from the left as its field becomes valid, over a
 * dry track at a tenth of Charcoal so the unfinished ones are still there to
 * be seen.
 *
 * A picture of the form's state, not a measure anyone has to read: the
 * fields' own messages are what say what is missing.
 */
export function BrushProgress({
  done,
  className,
}: {
  done: readonly boolean[];
  className?: string;
}) {
  return (
    /*
      THE COLUMN COUNT IS THE ARRAY'S, NOT A FIVE WRITTEN INTO THE CLASS.

      This was `grid-cols-5`, which was true of the only caller it had: the
      scheduled route passes places plus its four required fields. The
      enquiry route has six things to answer, and a hard-coded five silently
      wrapped the sixth stroke onto a second row — a progress bar with a
      stray mark under it. The count belongs to whoever is counting.
    */
    <span
      aria-hidden
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${done.length}, minmax(0, 1fr))` }}
    >
      {done.map((isDone, i) => {
        const tilt = PROGRESS_TILTS[i % PROGRESS_TILTS.length];
        return (
          <span key={i} className="relative block h-4">
            <span
              className="dab absolute inset-0"
              style={
                {
                  "--paint": "color-mix(in oklab, var(--color-text) 10%, transparent)",
                  "--tilt": tilt,
                } as CSSVars
              }
            />
            <span
              data-done={isDone || undefined}
              className={cn("dab absolute inset-0", styles.progressFill)}
              style={{ "--paint": paintAt(i, PAINTS_ON_CREAM), "--tilt": tilt } as CSSVars}
            />
          </span>
        );
      })}
    </span>
  );
}

/**
 * "Ready to confirm", pressed onto the card as the button sends the visitor
 * on — the one moment the card is finished.
 *
 * Not "booked", "reserved" or "confirmed": nothing has been, yet, and the
 * next step is where it will be. Charcoal letters inside a lilac ring, because
 * lilac at 12px would fall short of the ratio its words owe.
 */
function Stamp({ show }: { show: boolean }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          key="stamp"
          className="pointer-events-none absolute right-5 top-5 rounded-full border-2 border-primary bg-cream/85 px-3 py-1.5 text-label font-medium uppercase tracking-eyebrow text-text"
          initial={reduce ? false : { opacity: 0, scale: 1.12, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          transition={reduce ? { duration: 0 } : { duration: 0.26, ease: EASE_EDITORIAL }}
        >
          Ready to confirm
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
