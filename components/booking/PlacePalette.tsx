"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { EASE_EDITORIAL } from "@/lib/motion";
import { PAINTS_ON_CREAM, paintAt } from "@/lib/paint";
import { cn } from "@/lib/utils";

/**
 * Above this many spots the table stops being a table.
 *
 * Fifteen wells is eight along one side of the table and seven along the
 * other, which still reads at a glance as "how many of us are coming". Past
 * that it is a banquet to be counted rather than a choice to be made, so a
 * session that large gets a stepper instead.
 *
 * Exported for <BookingForm>'s live total, which has to know whether the
 * control above it says the count itself: a well is a radio named "3
 * spots", a stepper button is named "One more spot" whatever the count.
 */
export const WELL_CAP = 15;

/** The most dabs a row shows before it says "+n" instead. */
const DAB_CAP = 12;

/**
 * Five near-round outlines for the paint in a well.
 *
 * Near-round on purpose: a well is round, and paint that settles in it takes
 * its shape with a wobble rather than being cut to a circle. Fixed per
 * position, so nothing about the palette is random between renders — the
 * server and the browser draw the same plate.
 */
export const WELL_BLOBS = [
  "52% 48% 46% 54% / 50% 54% 46% 50%",
  "47% 53% 55% 45% / 53% 47% 51% 49%",
  "55% 45% 48% 52% / 46% 52% 48% 54%",
  "49% 51% 53% 47% / 48% 55% 45% 52%",
  "53% 47% 45% 55% / 52% 46% 54% 48%",
] as const;

/** Each well's lean, in degrees. Five at one angle read as buttons. */
const TILTS = [-4, 3, -2, 5, -3] as const;

/**
 * The plate's outline: four unequal corners in rem, so it reads as a palette
 * someone cut rather than as an egg — a percentage radius on a wide plate
 * would round the whole thing off. See `blob` in globals.css.
 */
const PLATE_BLOB = "2.2rem 2.6rem 2rem 2.4rem / 2.4rem 2rem 2.6rem 2.2rem";

const EASE_SOFT = [0.4, 0, 0.2, 1] as const;

const LEGEND = "block text-label font-medium uppercase tracking-eyebrow text-text";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/**
 * A new count, or a step from the current one. The stepper steps: two presses
 * inside one frame must land as two, which a value computed from this
 * render's `quantity` would collapse into one.
 */
export type PlacesChange = number | ((current: number) => number);

interface PlacePaletteProps {
  /** `Math.max(1, seatsAvailable)` — the radios never offer more than this. */
  max: number;
  quantity: number;
  onChange: (next: PlacesChange) => void;
  /** `isScarce` for the session — the one case that takes the terracotta dot. */
  scarce: boolean;
}

/**
 * 01 — how many spots, as paint wells set round a studio table.
 *
 * A NATIVE RADIO GROUP UNDER THE PAINT. Each well is a `<label>` round a
 * visually hidden radio, so arrow keys move between wells, a screen reader
 * says "3 spots, 3 of 9", and the choice reaches the form with nothing
 * reimplemented. The paint is the radio's picture, not a replacement for it.
 *
 * Choosing four is one tap, where the stepper this replaced took three presses
 * of `+`; and choosing fills every well up to it, the way a rating does, so
 * the table shows the size of the party rather than a single selected cell.
 *
 * The plate's height is fixed per session — always a row of palettes, the
 * table and another row — so nothing below it moves as the choice does.
 */
export function PlacePalette({ max, quantity, onChange, scarce }: PlacePaletteProps) {
  const captionId = useId();

  /*
    Every word here is a plain fact derived from `max` — the session's own
    `seatsAvailable`. Nothing is estimated and nothing urges.

    NOT `spotsLabel`, although it reads like the same sentence. `spotsLabel`
    describes the session's status, and a session on "waitlist" with seats
    still free reaches this step (only a full one is turned away), where it
    says "Waitlist only" — which would print "Waitlist only on this date"
    over a working picker and a Continue button. This caption only ever
    describes the count the picker offers. "Left" for the scarce case and
    "available" otherwise, the same split `spotsLabel` draws.
  */
  const count = `${max === 1 ? "One" : max} ${max === 1 ? "spot" : "spots"} ${scarce ? "left" : "available"} on this date`;
  const text =
    max === 1
      ? `${count}, so this booking is for one.`
      : quantity >= max
        ? "That's every spot left on this date."
        : `${count}.`;

  const caption = (
    <p id={captionId} className="flex items-start gap-2 text-fine text-text/75">
      {scarce ? (
        <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-terracotta" />
      ) : null}
      <span>{text}</span>
    </p>
  );

  // One spot left is not a choice, so it is not offered as one: no group of
  // one radio to tab into, just the fact.
  if (max === 1) {
    return (
      <div>
        <p className={LEGEND}>
          <span aria-hidden>01&nbsp;&nbsp;</span>Spots
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
          <div
            aria-hidden
            className="blob plate w-max bg-cream p-6 md:p-7"
            style={{ "--blob": PLATE_BLOB } as CSSVars}
          >
            <span className={styles.well} data-filled>
              <span className={styles.rim}>
                <span
                  className={cn("blob", styles.paint)}
                  style={
                    {
                      "--blob": WELL_BLOBS[0],
                      "--paint": paintAt(0, PAINTS_ON_CREAM),
                      transform: `rotate(${TILTS[0]}deg)`,
                    } as CSSVars
                  }
                />
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2.5 md:max-w-[15rem] md:pb-1">
            <p className="flex items-end gap-3 text-text">
              <span className="text-folio font-light leading-[0.85] tabular-nums">1</span>{" "}
              <span className="text-body text-text/75">spot</span>
            </p>
            {caption}
          </div>
        </div>
      </div>
    );
  }

  return (
    <fieldset aria-describedby={captionId} className="min-w-0">
      <legend className={LEGEND}>
        <span aria-hidden>01&nbsp;&nbsp;</span>Spots
      </legend>
      {max > WELL_CAP ? (
        <Stepper max={max} quantity={quantity} onChange={onChange} caption={caption} />
      ) : (
        <Wells max={max} quantity={quantity} onChange={onChange} caption={caption} />
      )}
    </fieldset>
  );
}

/** What a well's paint needs to know to bloom or drain. */
interface WellCustom {
  tilt: number;
  delay: number;
  reduce: boolean;
}

/*
  The bloom and the drain.

  Paint wells UP from the bottom of the well (origin 50% 100%), growing and
  leaning into place. Draining is quicker and plainer — scaleY and opacity
  only, with no stagger — because taking paint away is a correction, not an
  event. The drain then resets the bloom's starting size and lean with a zero
  duration once it is out of sight, so the next fill always starts from the
  same place.

  The transitions live inside the variants, so the reduced-motion branch has
  to live here too: a `transition` prop on the element would lose to them.
*/
const WELL_PAINT: Variants = {
  wet: ({ tilt, delay, reduce }: WellCustom) => ({
    scale: 1,
    scaleY: 1,
    opacity: 1,
    rotate: tilt,
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.38, ease: EASE_EDITORIAL, ...(delay ? { delay } : {}) },
  }),
  dry: ({ tilt, reduce }: WellCustom) => ({
    scale: 0.6,
    scaleY: 0,
    opacity: 0,
    rotate: tilt - 6,
    transition: reduce
      ? { duration: 0 }
      : {
          duration: 0.22,
          ease: EASE_SOFT,
          scale: { duration: 0, delay: 0.22 },
          rotate: { duration: 0, delay: 0.22 },
        },
  }),
};

/**
 * The spots, laid round a table: half the wells along the top edge, half
 * along the bottom, the way a studio sets out a session.
 *
 * NUMBERED ACROSS THE TABLE. Spot 1 is top-left and spot 2 sits opposite it,
 * 3 beside 1 and 4 opposite 3, and so on — so a party fills the table from
 * one end, in facing pairs, rather than all down one side. The radios stay in
 * DOM order 1..n (arrow keys walk the count, not the geometry); each is
 * placed on the grid by its row and column instead.
 *
 * The grid's columns are fluid up to 4.5rem — a well and room to pull up a
 * chair — so a long table still fits a phone: at eight to a side each well
 * gives up a little width rather than the table pushing the page sideways.
 */
function Wells({
  max,
  quantity,
  onChange,
  caption,
}: {
  max: number;
  quantity: number;
  onChange: (next: PlacesChange) => void;
  caption: ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;
  const [hover, setHover] = useState(0);
  const columns = Math.ceil(max / 2);

  // Where the paint stopped last time, so a bloom staggers outward from it
  // rather than from well one. Held in state and updated during render — the
  // pattern React documents for "the previous value of a prop" — so the
  // render that needs it already has it.
  const [last, setLast] = useState(quantity);
  const [from, setFrom] = useState(quantity);
  if (quantity !== last) {
    setFrom(last);
    setLast(quantity);
  }

  return (
    <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
      <div
        className="blob plate w-full bg-cream px-4 py-5 sm:px-6 md:w-max md:p-7"
        style={{ "--blob": PLATE_BLOB } as CSSVars}
      >
        <div
          className={cn(styles.table, "grid justify-center gap-x-2 gap-y-2 sm:gap-x-3 md:gap-x-4")}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 4.5rem))` }}
          onPointerLeave={() => setHover(0)}
        >
          {/* The table top, under the middle row. Decoration only. */}
          <span
            aria-hidden
            className={cn("blob", styles.tableTop)}
            style={{ gridColumn: `1 / span ${columns}`, gridRow: 2 } as CSSVars}
          />

          {Array.from({ length: max }, (_, i) => {
            const n = i + 1;
            const top = i % 2 === 0;
            const filled = n <= quantity;
            const ghost = !filled && n <= hover;
            const tilt = TILTS[i % TILTS.length];
            // 35ms between neighbours, counted from the first newly filled
            // well — so going from 2 to 6 runs 3, 4, 5, 6 rather than waiting
            // out two wells that were already full.
            const delay = filled && n > from ? (n - from - 1) * 0.035 : 0;
            const paint = {
              "--blob": WELL_BLOBS[i % WELL_BLOBS.length],
              "--paint": paintAt(i, PAINTS_ON_CREAM),
            } as CSSVars;

            return (
              <label
                key={n}
                className={cn(styles.well, top && styles.wellTop)}
                style={{ gridColumn: Math.floor(i / 2) + 1, gridRow: top ? 1 : 3 }}
                data-filled={filled || undefined}
                data-ghost={ghost || undefined}
                // The preview is for a mouse only. A finger has no hover, and
                // a touch that set it would leave a ghost behind after the tap.
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHover(n);
                }}
              >
                <input
                  type="radio"
                  name="places"
                  value={n}
                  checked={quantity === n}
                  onChange={() => onChange(n)}
                  className="sr-only"
                />
                <span aria-hidden className={styles.rim}>
                  <span className={cn("blob", styles.ghost)} style={paint} />
                  <motion.span
                    className={cn("blob", styles.paint)}
                    style={{ ...paint, transformOrigin: "50% 100%" }}
                    custom={{ tilt, delay, reduce } satisfies WellCustom}
                    variants={WELL_PAINT}
                    initial={false}
                    animate={filled ? "wet" : "dry"}
                  />
                </span>
                <span className="sr-only">
                  {n} {n === 1 ? "spot" : "spots"}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "text-fine tabular-nums text-text",
                    top ? "mb-1" : "mt-1",
                    quantity === n && "font-semibold",
                  )}
                >
                  {n}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 md:max-w-[15rem] md:pb-1">
        {/* The radios carry the value; this is its picture. */}
        <p aria-hidden className="flex items-end gap-3 text-text">
          <Numeral value={quantity} digits={String(max).length} />
          <span className="text-body text-text/75">{quantity === 1 ? "spot" : "spots"}</span>
        </p>
        {caption}
      </div>
    </div>
  );
}

/*
  The count, rolled like a numbering stamp: up when it rises, down when it
  falls, in a box sized for the widest value so the word beside it never
  moves — tabular figures are all one `ch` wide, so the box is exactly the
  digits of `max`. Reduced motion keeps the same elements and zeroes the time, rather
  than swapping in plain text — a different element tree on the client than
  the server drew is a hydration mismatch waiting for whoever prefers less
  motion.
*/
const ROLL: Variants = {
  enter: (dir: number) => ({ y: `${dir * 60}%`, opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (dir: number) => ({ y: `${dir * -60}%`, opacity: 0 }),
};

function Numeral({ value, digits }: { value: number; digits: number }) {
  const reduce = useReducedMotion();
  const [last, setLast] = useState(value);
  const [dir, setDir] = useState(1);
  if (value !== last) {
    setDir(value > last ? 1 : -1);
    setLast(value);
  }

  return (
    <span
      className="relative inline-block h-[0.85em] overflow-hidden text-folio font-light leading-[0.85] tabular-nums"
      style={{ width: `${digits}ch` }}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={value}
          className="block"
          custom={dir}
          variants={ROLL}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE_EDITORIAL }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * The fallback for a session too large for a palette — see `WELL_CAP`.
 *
 * AT A BOUND THE BUTTON SAYS SO RATHER THAN SWITCHING OFF. `disabled` on the
 * button under the keyboard's focus throws that focus to `<body>`, so a
 * visitor pressing `+` up to the limit is dropped back at the top of the
 * page. `aria-disabled` announces the same thing and keeps them where they
 * are; the click is simply ignored.
 */
function Stepper({
  max,
  quantity,
  onChange,
  caption,
}: {
  max: number;
  quantity: number;
  onChange: (next: PlacesChange) => void;
  caption: ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div
          className="blob plate flex items-center bg-cream p-1.5"
          style={{ "--blob": PLATE_BLOB } as CSSVars}
        >
          <StepButton
            label="One fewer spot"
            atBound={quantity <= 1}
            onPress={() => onChange((q) => q - 1)}
          >
            &minus;
          </StepButton>
          {/*
            Not a live region, although `<output>` is one by default: the
            total under the form already announces "n spots", and two
            regions saying the same thing on one press is chatter.
          */}
          <output
            aria-live="off"
            className="w-16 text-center text-lead font-medium tabular-nums text-text"
          >
            {quantity}
          </output>
          <StepButton
            label="One more spot"
            atBound={quantity >= max}
            onPress={() => onChange((q) => q + 1)}
          >
            +
          </StepButton>
        </div>
        <PlaceDabs count={quantity} />
      </div>
      {caption}
    </div>
  );
}

function StepButton({
  label,
  atBound,
  onPress,
  children,
}: {
  label: string;
  atBound: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={atBound || undefined}
      onClick={() => {
        if (!atBound) onPress();
      }}
      className={cn(
        "press-in flex size-12 items-center justify-center rounded-full text-lead leading-none transition-colors duration-300 ease-soft",
        atBound ? "cursor-not-allowed text-text/45" : "text-text hover:bg-surface",
      )}
    >
      {children}
    </button>
  );
}

/**
 * One small dab per spot, the palette's colours in order — the party, drawn.
 *
 * Capped at twelve and then "+n", so the row has a fixed reach and never
 * wraps into a second line that would push whatever sits under it. A new dab
 * settles in; one taken away simply goes. Decorative every time: the count is
 * always said in words somewhere beside it.
 */
export function PlaceDabs({ count, className }: { count: number; className?: string }) {
  const reduce = useReducedMotion();
  const shown = Math.min(count, DAB_CAP);

  return (
    <span aria-hidden className={cn("flex h-4 items-center gap-[3px]", className)}>
      <AnimatePresence initial={false}>
        {Array.from({ length: shown }, (_, i) => (
          <motion.span
            key={i}
            className="blob block size-3.5 shrink-0"
            style={
              {
                "--blob": WELL_BLOBS[i % WELL_BLOBS.length],
                backgroundColor: paintAt(i, PAINTS_ON_CREAM),
              } as CSSVars
            }
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE_EDITORIAL }}
          />
        ))}
      </AnimatePresence>
      {count > DAB_CAP ? (
        <span className="ml-1 text-fine tabular-nums text-text/75">+{count - DAB_CAP}</span>
      ) : null}
    </span>
  );
}
