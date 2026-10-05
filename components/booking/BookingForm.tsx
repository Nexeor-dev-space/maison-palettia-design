"use client";

import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

import styles from "@/components/booking/PaintBooking.module.css";
import { PaintedField, type FieldStatus } from "@/components/booking/PaintedField";
import { PlaceCard, PlaceCardStub } from "@/components/booking/PlaceCard";
import { PlacePalette, WELL_CAP, type PlacesChange } from "@/components/booking/PlacePalette";
import { PointerTilt } from "@/components/motion/PointerTilt";
import { Reveal } from "@/components/motion/Reveal";
import { BlobButton } from "@/components/ui/BlobButton";
import { PAYMENT_CONFIGURED } from "@/lib/booking";
import {
  BOOKING_FIELD_ORDER,
  saveBookingDetails,
  toCartLine,
  useBookingDetails,
  useCart,
  validateBookingDetails,
  type BookingDetails,
} from "@/lib/cart";
import { cn, formatMoney } from "@/lib/utils";
import type { Workshop } from "@/types";

type FieldName = (typeof BOOKING_FIELD_ORDER)[number];
type Values = Record<FieldName | "notes", string>;

const EMPTY: Values = { firstName: "", lastName: "", email: "", phone: "", notes: "" };

const isField = (name: string): name is FieldName =>
  (BOOKING_FIELD_ORDER as readonly string[]).includes(name);

/** The required fields' messages for a set of values; empty when all pass. */
function errorsFor(values: Values): Record<string, string> {
  return validateBookingDetails({ ...values, notes: values.notes || undefined });
}

/**
 * The saved details, field by field, keeping only what is actually a string.
 *
 * Storage is not a trusted input (see `hydrateLine` in lib/cart.ts): a
 * hand-edited entry with a number for a name must leave that field empty,
 * not crash the form on `.trim()`. Picked by name, too, so nothing else that
 * happens to be stored rides into the mirror.
 */
function stringFields(details: BookingDetails | null): Partial<Values> {
  const out: Partial<Values> = {};
  if (!details) return out;
  for (const key of [...BOOKING_FIELD_ORDER, "notes"] as const) {
    const value: unknown = details[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

const HEADING = "block text-label font-medium uppercase tracking-eyebrow text-text";

/*
  What the alert says when the press fails — and it carries no count, on
  purpose. The sentence is fixed at the moment of the press, but the fields
  go on changing under it: "Four details need a look" read after three of
  them were fixed is a sentence that has stopped being true. Updating the
  count live would be worse, since changing the words inside a `role=alert`
  has a screen reader announce them again, mid-keystroke. The fields say
  which, beside each one; this only says that some do.
*/
const SUMMARY = "Some details need a look before you continue. Each one is marked beside its field.";

interface BookingFormProps {
  workshop: Workshop;
  /** The h1 and its lead, drawn on the server. */
  intro: ReactNode;
  /** <SessionSummary>, drawn on the server: the face of the desktop card. */
  summary: ReactNode;
  /** <SessionStrip>, drawn on the server: what is being booked, on a phone. */
  strip: ReactNode;
  /** `isScarce` for the session, resolved by the page — see below. */
  scarce: boolean;
}

/**
 * The booking step: how many places, and who is coming — painted.
 *
 * Places are paint wells on a palette plate (<PlacePalette>), every field is
 * underlined in a brush stroke (<PaintedField>), and beside the form a place
 * card fills in as it is answered (<PlaceCard>): the visitor's name in
 * script, their party as dabs of colour, a stroke for each detail still to
 * give. The studio's medium is paint, so the one form a visitor fills in on
 * this site is laid out in it.
 *
 * Nothing here is asked for that the studio would not need on the day: a name
 * to greet you by, an email and a phone to reach you on, and one optional line
 * for anything they should know. No address, no marketing opt-in, and no
 * account — there is no authentication anywhere in this project, checked
 * rather than assumed, and the client asked for the sign-in offer to come out
 * of this step entirely. Everyone books as a guest.
 *
 * THE SERVER DRAWS THE FACTS, THIS FILE DRAWS THE STATE. The intro, the card
 * face and the phone strip arrive as slots, rendered on the server, so this
 * client component never imports the workshops module — which holds the
 * session array as well as the formatters, and would pull the whole catalogue
 * into the browser (the note on <EventBookingBar> says the same). The one
 * availability fact it needs, whether the session is nearly gone, arrives as
 * a flag the same way.
 *
 * THE INPUTS ARE UNCONTROLLED. FormData is the source of truth at submit;
 * `values` below is only a mirror, kept so the card and the fields' ticks can
 * follow along. Every derived thing — errors, statuses, progress, the total —
 * is recomputed each render from that mirror, so there is nothing stored that
 * could drift from what is on screen.
 */
export function BookingForm({ workshop, intro, summary, strip, scarce }: BookingFormProps) {
  const router = useRouter();
  const { lines, setLine } = useCart();
  const saved = useBookingDetails();
  const reduce = useReducedMotion();

  const max = Math.max(1, workshop.seatsAvailable);
  const clamp = useCallback((n: number) => Math.min(max, Math.max(1, Math.round(n))), [max]);

  // Null until the visitor chooses: until then the count is derived, below.
  const [picked, setPicked] = useState<number | null>(null);
  // Only the fields the visitor has typed in (or left), keyed as they go —
  // a key that is absent means "not touched", which is not the same as "".
  const [typed, setTyped] = useState<Partial<Values>>({});
  const [blurred, setBlurred] = useState<Partial<Record<FieldName, true>>>({});
  const [attempted, setAttempted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [summaryShown, setSummaryShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set before the re-render that `submitting` causes, so a second press in
  // the same frame cannot slip past it.
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const cardFits = useFitsInView(asideRef);

  /*
    COMING BACK FROM CHECKOUT, the form is as it was left — DERIVED, NOT
    COPIED IN.

    The details and the basket line live in sessionStorage (lib/cart.ts), read
    through `useSyncExternalStore` — so both are null on the server and on the
    first client render, and only arrive after hydration. Nothing here copies
    them into state when they do: the count falls back to the held line until
    the visitor picks one, the mirror lays what they typed over what was saved,
    and the inputs take the saved values as `defaultValue`. React updates the
    default of an input nobody has edited and leaves an edited one alone — the
    browser's own dirty flag — so a restore that lands late never overwrites a
    keystroke.

    ONLY WITH A PLACE HELD, FOR THIS SESSION. The details are restored when a
    line for this session is still in the basket — someone stepping back from
    checkout to change something. Details on their own are not a booking in
    progress, and must not fill in a form for whoever books next on this
    tablet; checkout also forgets them once a booking is placed.

    A field that comes back filled counts as visited until it is typed in, so
    its tick shows at once — it was valid when it was saved, or it would not
    have been.
  */
  const line = lines.find((l) => l.kind === "session" && l.slug === workshop.slug);
  const restored = line ? stringFields(saved) : {};
  const quantity = clamp(picked ?? line?.quantity ?? 1);

  const values: Values = { ...EMPTY, ...restored, ...typed };

  /* -- derived, every render ------------------------------------------- */

  const errors = errorsFor(values);
  const visited = (k: FieldName) =>
    Boolean(blurred[k] || (typed[k] === undefined && restored[k]?.trim()));

  /*
    When a field speaks.

    Not while it is being typed into for the first time: an email field that
    says "please check this email address" on the first letter is scolding
    someone for not having finished. A message appears once the visitor has
    LEFT a field holding something malformed, or after a press of the button —
    and from then on it clears the moment the value is right. Leaving a field
    empty says nothing until the button is pressed; an empty field is a field
    not reached yet, not a mistake.
  */
  const status = (k: FieldName): FieldStatus => {
    const filled = values[k].trim() !== "";
    if (errors[k]) return attempted || (visited(k) && filled) ? "error" : "idle";
    return filled && (visited(k) || attempted) ? "valid" : "idle";
  };

  // Places count as answered from the start: one is chosen on arrival.
  const done = [true, ...BOOKING_FIELD_ORDER.map((k) => !errors[k])];
  const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
  const unitLabel = formatMoney(workshop.price.amount, workshop.price.currency);
  const totalLabel = formatMoney(workshop.price.amount * quantity, workshop.price.currency);
  // The widest the total can be, so the figures never shift their label.
  const totalMinCh = formatMoney(workshop.price.amount * max, workshop.price.currency).length + 1;
  const placesWord = quantity === 1 ? "place" : "places";

  /*
    What the live region says, and when.

    NOTHING UNTIL THE VISITOR CHOOSES. The count can change on its own after
    hydration — the held line arriving from storage — and a page that speaks
    "Total AED 720" on load, to someone who has not touched anything, is
    announcing its own bookkeeping. `picked` is only set by a choice.

    ONLY WHAT IS NEW. A well is a radio whose name is "3 places", and the
    screen reader has just said it; repeating the count here is chatter, so
    the region says the total alone. The stepper's buttons are named "One more
    place" whatever the count, so for a session that large the count is said
    here as well — nowhere else on the page would say it.
  */
  const announcement =
    picked === null
      ? ""
      : max > WELL_CAP
        ? `${quantity} ${placesWord}, total ${totalLabel}`
        : `Total ${totalLabel}`;

  /* -- events ------------------------------------------------------------ */

  // Every count passes through `clamp`, whether it came from a well, a step
  // or the basket — the radios only offer 1..max, but the rule is enforced
  // here rather than trusted to the control. A step from "not yet chosen"
  // steps from the count on screen.
  function onQuantity(next: PlacesChange) {
    setPicked((current) =>
      clamp(typeof next === "function" ? next(current ?? quantity) : next),
    );
  }

  /*
    The summary is retired once everything it complained about is fixed —
    and only a press brings it back. Tied to the live errors instead, it
    would reappear the moment someone mistyped an email after fixing it,
    announced by the alert mid-keystroke with no press to explain it.
  */
  function settle(name: FieldName | "notes", value: string) {
    if (!summaryShown) return;
    const next = errorsFor({ ...values, [name]: value });
    if (!BOOKING_FIELD_ORDER.some((k) => next[k])) setSummaryShown(false);
  }

  // Delegated from the form rather than wired to each input, so the inputs
  // stay plain and uncontrolled. The places radios are ignored here — they
  // are controlled and report through `onQuantity`.
  function onInput(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const name = target.name;
    if (!isField(name) && name !== "notes") return;
    const value = target.value;
    setTyped((current) => (current[name] === value ? current : { ...current, [name]: value }));
    settle(name, value);
  }

  // Leaving a field marks it visited, and re-reads its value: autofill can
  // fill a field without firing an input event, and the card should not be
  // left showing a blank name the field plainly has.
  function onBlur(event: React.FocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !isField(target.name)) return;
    const name = target.name;
    const value = target.value;
    setBlurred((current) => (current[name] ? current : { ...current, [name]: true }));
    setTyped((current) => (current[name] === value ? current : { ...current, [name]: value }));
    settle(name, value);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const data = new FormData(event.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const details: BookingDetails = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      notes: get("notes") || undefined,
    };

    // The rules live in lib/cart.ts so this step and checkout cannot disagree
    // about what counts as an email address. Validated here as well as by the
    // browser's types: a native bubble vanishes, and a visitor who gets past
    // it should see the same message in the same place either way.
    const found = validateBookingDetails(details);
    const bad = BOOKING_FIELD_ORDER.filter((k) => found[k]);

    if (bad.length > 0) {
      /*
        COMMIT FIRST, THEN FOCUS — synchronously.

        Focusing the first invalid field before React has committed would let
        a screen reader announce it as it was a moment ago: a plain field with
        no `aria-invalid` and no message attached. `flushSync` puts the
        invalid state and the described-by message into the DOM before focus
        lands, so the first thing read is the field together with what is
        wrong with it.
      */
      flushSync(() => {
        setTyped({ ...details, notes: details.notes ?? "" });
        setAttempted(true);
        setAttemptCount((n) => n + 1);
        setSummaryShown(true);
      });
      formRef.current?.querySelector<HTMLInputElement>(`[name="${bad[0]}"]`)?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setLine(toCartLine(workshop, clamp(quantity)));
    saveBookingDetails(details);
    // Never awaited and never held back for the card's stamp: the press on
    // the card plays in the same tick, and whatever of it the navigation
    // overtakes was decoration.
    router.push("/checkout");
  }

  /* -- render ------------------------------------------------------------ */

  const stubProps = {
    displayName,
    quantity,
    unitLabel,
    totalLabel,
    totalMinCh,
    done,
    hasEmail: !errors.email,
    hasPhone: !errors.phone,
    hasNote: values.notes.trim() !== "",
    submitting,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:gap-x-10">
        {/*
          The phone's summary, first in the DOM so a phone shows what is being
          booked before asking for anything — compact, so the first question
          still lands in the first screen. From `lg` the card takes over and
          this is `display: none`, which takes it out of the accessibility
          tree as well: there is only ever one summary to read.
        */}
        <div className="col-span-12 lg:hidden">{strip}</div>

        <form
          ref={formRef}
          noValidate
          onSubmit={onSubmit}
          onInput={onInput}
          onBlur={onBlur}
          className="col-span-12 mt-10 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:mt-0"
        >
          {intro}

          {/* --- 01 places -------------------------------------------------- */}
          <Reveal className="mt-12 md:mt-14">
            <PlacePalette
              max={max}
              quantity={quantity}
              onChange={onQuantity}
              scarce={scarce}
            />
          </Reveal>

          {/* --- 02 who is coming ------------------------------------------- */}
          <section aria-labelledby="booking-who" className="mt-12 border-t border-line pt-10">
            <h2 id="booking-who" className={HEADING}>
              <span aria-hidden>02&nbsp;&nbsp;</span>Who is coming
            </h2>

            {/* `gap-y` tightens from `sm`, where each required field reserves
                two lines for its message rather than one — see <PaintedField>. */}
            <Reveal className="mt-9 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-3">
              <PaintedField
                name="firstName"
                label="First name"
                autoComplete="given-name"
                autoCapitalize="words"
                dir="auto"
                required
                defaultValue={restored.firstName}
                status={status("firstName")}
                error={errors.firstName}
              />
              <PaintedField
                name="lastName"
                label="Last name"
                autoComplete="family-name"
                autoCapitalize="words"
                dir="auto"
                required
                defaultValue={restored.lastName}
                status={status("lastName")}
                error={errors.lastName}
              />
              <PaintedField
                name="email"
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                defaultValue={restored.email}
                status={status("email")}
                error={errors.email}
              />
              <PaintedField
                name="phone"
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                defaultValue={restored.phone}
                status={status("phone")}
                error={errors.phone}
              />
              <PaintedField
                name="notes"
                label="Anything we should know (optional)"
                autoComplete="off"
                dir="auto"
                defaultValue={restored.notes}
                className="sm:col-span-2"
              />
            </Reveal>
          </section>

          {/*
            The card, on a phone — just above the button, so the thing being
            made is in view at the moment of pressing. Hidden from assistive
            technology like the desktop card; see <PlaceCardStub>.
          */}
          <div className="mt-10 lg:hidden">
            <PlaceCardStub variant="inline" {...stubProps} />
          </div>

          {/* --- 03 ready ------------------------------------------------------ */}
          <section aria-labelledby="booking-ready" className="mt-12 border-t border-line pt-10">
            <h2 id="booking-ready" className={HEADING}>
              <span aria-hidden>03&nbsp;&nbsp;</span>Ready when you are
            </h2>

            {/*
              Always mounted, so the region exists before anything is put in
              it — a live region created together with its message is not
              reliably announced. The message is keyed by attempt, so pressing
              again with something still wrong is said again rather than
              silently re-rendering the same words.

              RETIRED, NOT REMOVED. Once everything is fixed the sentence is
              hidden (`visibility: hidden`, which also takes it out of the
              accessibility tree) but keeps its height until the next press.
              Unmounting it would lift the button 70-odd pixels at the moment
              the last field turns valid — under the pointer of someone
              reaching for it.
            */}
            <div role="alert" className="mt-6">
              {attemptCount > 0 ? (
                <p
                  key={attemptCount}
                  className={cn(
                    "mb-2 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body text-text",
                    !summaryShown && "invisible",
                  )}
                >
                  {SUMMARY}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
              {/*
                Plain text, read in its place like anything else. The live
                region is the sibling below, so what is announced on a change
                can differ from what is shown — and be one node, said whole.
              */}
              <p className="text-body text-text/80">
                Total
                <span
                  className="ml-3 inline-block text-lead font-medium tabular-nums text-text"
                  style={{ minWidth: `${`${max} places · `.length + totalMinCh}ch` }}
                >
                  {quantity} {placesWord}
                  <span aria-hidden> &middot; </span>
                  <span className="sr-only">, </span>
                  {totalLabel}
                </span>
              </p>
              {/*
                The one polite echo on the page — see `announcement` above.
                ATOMIC, AND ONE STRING. React updates text nodes one at a
                time, and without `aria-atomic` a screen reader reads only
                the nodes that changed: "4 … AED 960", stripped of what it is.
              */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
              </p>

              {/*
                NOT `disabled` WHILE IT SENDS. A disabled BlobButton dims to
                55%, which reads as "this did not work" at the one moment it
                has — and it would drop keyboard focus to <body> mid-press. The
                ref above is what stops a second press; the label is what says
                the first one landed.
              */}
              <BlobButton
                type="submit"
                arrow={!submitting}
                className="w-full justify-center px-8 py-5 sm:w-auto"
              >
                {submitting ? "Opening checkout…" : "Continue to checkout"}
              </BlobButton>
            </div>

            {/*
              Said before the button is pressed, not after. Someone about to
              hand over a name and a number is entitled to know nothing is
              taken here. Keyed off the same flag as checkout, so the sentence
              goes the moment a provider is wired.
            */}
            {!PAYMENT_CONFIGURED ? (
              /* `body`, not `fine`: this tells somebody mid-booking that they
                 are not being charged yet — the opposite of fine print. */
              <p className="mt-8 max-w-[40rem] border-l-2 border-terracotta pl-5 text-body text-text/80">
                Nothing is charged here. You&rsquo;ll review everything and confirm on the next
                step.
              </p>
            ) : null}
          </section>
        </form>

        <aside
          ref={asideRef}
          data-fits={cardFits || undefined}
          className={`hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block lg:self-start ${styles.stickyCard}`}
        >
          <Reveal variant="fadeIn">
            <PointerTilt max={4}>
              <motion.div
                animate={submitting && !reduce ? { scale: [1, 0.994, 1] } : { scale: 1 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <PlaceCard face={summary}>
                  <PlaceCardStub variant="card" {...stubProps} />
                </PlaceCard>
              </motion.div>
            </PointerTilt>
          </Reveal>
        </aside>
      </div>
    </MotionConfig>
  );
}

/**
 * Whether the element fits in the window below its own sticky offset, with
 * 24px to spare — kept current as the window or the element changes size.
 *
 * Read after mount only, so the server and the first client render agree that
 * it does not (yet): the card starts in the page's flow, which at the top of
 * the page looks exactly the same as stuck. See `stickyCard` in
 * PaintBooking.module.css for why this is measured at all.
 */
function useFitsInView(ref: React.RefObject<HTMLElement | null>): boolean {
  const [fits, setFits] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      // The resolved `top` of the sticky offset, which is declared whether or
      // not the element is currently positioned.
      const top = parseFloat(getComputedStyle(el).top) || 0;
      const height = el.offsetHeight;
      setFits(height > 0 && height + top + 24 <= window.innerHeight);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [ref]);

  return fits;
}
