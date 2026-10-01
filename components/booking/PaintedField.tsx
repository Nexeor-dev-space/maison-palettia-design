"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useId, type HTMLAttributes } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { EASE_EDITORIAL } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** What a field is showing: nothing yet, a tick, or a message. */
export type FieldStatus = "idle" | "valid" | "error";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/*
  The hairline is Charcoal at 60%: 3.30:1 on the page ground, over the 3:1 an
  input's boundary owes as a non-text control. The line this replaced was
  `border-line` — sage into lavender — which measures well under that, so the
  field could only be found by its label.
*/
const INPUT =
  "w-full border-0 border-b border-text/60 bg-transparent px-0 py-3 pr-9 text-body text-text " +
  "focus:outline-none focus:ring-0";

interface PaintedFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoCapitalize?: string;
  spellCheck?: boolean;
  /** `auto` on anything a person writes in their own script — a name, a
   *  note — so Arabic is typed right to left from the right-hand edge. */
  dir?: "auto";
  /** Said to assistive technology as `aria-required`. Not the `required`
   *  attribute: the form is `noValidate` and speaks its own messages, and
   *  `required` would also match `:invalid` on every empty field at load. */
  required?: boolean;
  /** What to show before the visitor types — a restored value. See
   *  <BookingForm>: React updates it only while the field is untouched. */
  defaultValue?: string;
  /** Omitted for a field that never ticks or errors — the optional note. */
  status?: FieldStatus;
  error?: string;
  className?: string;
}

/**
 * One input, underlined in paint.
 *
 * UNCONTROLLED, ON PURPOSE. The form reads FormData on submit and mirrors
 * keystrokes through a delegated `onInput` for the place card — so the input
 * keeps its own value, and the browser's autofill, undo stack and IME
 * composition are left exactly as the browser built them. A controlled input
 * would round-trip every character through React to get the same result.
 *
 * The message slot below is always there, reserved so a message arriving
 * never pushes the next field down. One line on a phone, where the field
 * has the full width; TWO from `sm`, where fields sit in pairs and a column
 * can be as narrow as 266px (at 1024 wide) — "Please add a number we can
 * reach you on." needs about 293px and wraps there, which pushed everything
 * under it down a line as the visitor left the field, the Continue button
 * included. Only a field that can carry a message reserves the second line.
 * `min-h`, not `h`: at 200% text a message wraps further, and a fixed height
 * would clip it.
 */
export function PaintedField({
  name,
  label,
  type = "text",
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
  dir,
  required,
  defaultValue,
  status: given,
  error,
  className,
}: PaintedFieldProps) {
  const id = useId();
  const errId = `${id}-error`;
  const status = given ?? "idle";
  // A field given a status is one that can show a message, so it keeps room.
  const speaks = given !== undefined;
  const showError = status === "error" && Boolean(error);

  return (
    <div className={cn(styles.field, className)} data-status={status}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          dir={dir}
          defaultValue={defaultValue}
          aria-required={required || undefined}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errId : undefined}
          className={INPUT}
        />
        <span aria-hidden className={cn("dab", styles.stroke)} />
        <ValidMark show={status === "valid"} />
      </div>
      {/*
        Charcoal words with a terracotta dot, never terracotta words: the
        accent is 2.44:1 on this ground, under the 4.5:1 a 13px message owes.
      */}
      <p
        id={errId}
        className={cn("mt-2 min-h-[1.3rem] text-fine text-text", speaks && "sm:min-h-[2.6rem]")}
      >
        {showError ? (
          <>
            <span
              aria-hidden
              className="mr-2 inline-block size-1.5 rounded-full bg-terracotta align-middle"
            />
            {error}
          </>
        ) : null}
      </p>
    </div>
  );
}

/**
 * A lavender dab with a tick in it, at the field's right edge.
 *
 * Only after the visitor has left the field (or pressed the button): a tick
 * that appears on the seventh digit of a phone number is congratulating them
 * for something they had not finished. Hidden from assistive technology — the
 * field being valid is the absence of a message, which the field already says.
 */
function ValidMark({ show }: { show: boolean }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.span
          key="tick"
          aria-hidden
          className="blob absolute bottom-0 right-0 top-0 my-auto flex size-[1.375rem] items-center justify-center bg-lavender text-text"
          style={{ "--blob": "52% 48% 46% 54% / 50% 54% 46% 50%" } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_EDITORIAL }}
        >
          <Check size={14} strokeWidth={2.5} />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
