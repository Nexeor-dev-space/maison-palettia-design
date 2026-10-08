"use client";

import { useId, useState } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { PAINTS_ON_CREAM, paintAt } from "@/lib/paint";

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/**
 * ==========================================================================
 * A CHOICE, MADE THE WAY THE PLACES ARE MADE
 * ==========================================================================
 *
 * At the client's ask, who wanted the enquiry form to answer the hand the way
 * the scheduled route's booking form does. That route's one tactile control
 * is <PlacePalette>: dishes you fill with paint, dashed while dry, solid once
 * chosen, a quarter-strength ghost under the pointer saying what you would be
 * choosing. This is that control for a question whose answers are words.
 *
 * ==========================================================================
 * IT IS A RADIO GROUP, WHICH IS WHY IT COULD REPLACE A SELECT AT ALL
 * ==========================================================================
 *
 * <PrivateEventEnquiry> reads its answers with `new FormData(form)` and
 * `data.get("occasion")`, so a radio group under the same `name` submits
 * identically to the `<select>` it replaces — no state lifted, no validation
 * touched, no change to what the studio receives. The inputs are `sr-only`
 * rather than `hidden`: a hidden input cannot be focused, and the focus ring
 * is drawn on the chip around it.
 *
 * `defaultChecked` rather than a controlled `checked`, for the same reason
 * the select carried `defaultValue` — the form owns its own values and this
 * component has no business holding a second copy of them.
 *
 * ==========================================================================
 * WHAT IS NOT CUMULATIVE HERE, AND IS THERE
 * ==========================================================================
 *
 * The places palette ghosts wells 1..n on hover, because places are a
 * quantity: pointing at the fourth dish means four. These are alternatives —
 * pointing at "Corporate Events" means that one and not the three beside it
 * — so exactly one chip ever ghosts. Copying the cumulative behaviour across
 * would have been the single easiest way to make this feel wrong.
 *
 * The preview is a mouse's. A finger has no hover, and a touch that set one
 * would leave a ghost behind after the tap — the palette's own note.
 */
export function PaintChoice({
  name,
  legend,
  options,
  defaultValue,
  /** A line under the row. The caption the palette puts beside its numeral. */
  note,
  /**
   * Told the new value when one is chosen, for a caller that mirrors the
   * answer somewhere else on the page. The FORM is still the source of
   * truth — the submit reads the DOM — so this is a notification, never a
   * controlled value.
   */
  onChoose,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  defaultValue: string;
  note?: string;
  onChoose?: (value: string) => void;
}) {
  const group = useId();
  const [hover, setHover] = useState<string | null>(null);
  /*
    The chosen value, held only so the chip can be painted. The FORM still
    owns the answer — this never feeds the submit, which reads the DOM. Two
    sources of truth would be a bug; this is a second view of one.
  */
  const [chosen, setChosen] = useState(defaultValue);

  return (
    <fieldset className="min-w-0">
      <legend className="block text-label font-medium uppercase tracking-eyebrow text-text/75">
        {legend}
      </legend>

      <div
        className="mt-3.5 flex flex-wrap gap-2.5"
        onPointerLeave={() => setHover(null)}
      >
        {options.map((option, i) => {
          const filled = chosen === option;
          const ghost = !filled && hover === option;

          return (
            <label
              key={option}
              className={styles.choice}
              data-filled={filled || undefined}
              data-ghost={ghost || undefined}
              style={{ "--paint": paintAt(i, PAINTS_ON_CREAM) } as CSSVars}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHover(option);
              }}
            >
              <input
                type="radio"
                name={name}
                value={option}
                defaultChecked={option === defaultValue}
                onChange={() => {
                  setChosen(option);
                  onChoose?.(option);
                }}
                className="sr-only"
                aria-describedby={note ? `${group}-note` : undefined}
              />
              <span className={styles.chip}>
                <span aria-hidden className={styles.chipPaint} />
                <span aria-hidden className={styles.chipGhost} />
                <span className={`${styles.chipLabel} text-fine font-medium text-text`}>
                  {option}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {note ? (
        <p id={`${group}-note`} className="mt-3 text-fine leading-[1.7] text-text/75">
          {note}
        </p>
      ) : null}
    </fieldset>
  );
}
