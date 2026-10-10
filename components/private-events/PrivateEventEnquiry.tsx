"use client";

import Link from "next/link";
import { BlobButton } from "@/components/ui/BlobButton";
import { useEffect, useId, useRef, useState } from "react";

import { EnquiryOutcome, Honeypot } from "@/components/contact/EnquiryOutcome";
import { sendEnquiry, type EnquiryResult } from "@/lib/enquiry";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";
import { PaintChoice } from "@/components/booking/PaintChoice";
import cardStyles from "@/components/booking/PaintBooking.module.css";
import { EnquiryStub } from "@/components/private-events/EnquiryStub";
import { Reveal } from "@/components/motion/Reveal";
import { PointerTilt } from "@/components/motion/PointerTilt";
import { PeelNote } from "@/components/ui/PeelNote";
import { useFitsInView } from "@/components/booking/BookingForm";
import styles from "@/components/booking/PaintBooking.module.css";
import { cn } from "@/lib/utils";

/**
 * Field chrome, lifted verbatim from <ContactForm> — which lifted it from
 * the `Field` in <Checkout>. A hairline under the input rather than a box
 * around it, so a form reads as part of the page. Three forms on one site that
 * disagree about what an input looks like is two forms too many.
 */
/*
  THE BOOKING FLOW'S FIELD, SHARED RATHER THAN COPIED, at the client's ask to
  bring this page to the theme of /events/[slug]/book. `.stroke` in
  PaintBooking.module.css is the focus indicator now — a brush drawn out from
  the left and 1.75x deep — so it survives greyscale and any colour vision,
  where a recoloured hairline rests on hue alone. `border-text/60` is the
  measured hairline: 3.30:1, over the 3:1 a control's boundary owes.
*/
const FIELD =
  "w-full border-0 border-b border-text/60 bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:outline-none focus:ring-0";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/*
  NO PLACEHOLDERS ON THIS FORM, DELIBERATELY.

  The shared field chrome sets `placeholder:text-text/40`, which measures
  2.19:1 on the page ground — well under what text owes, and this form had two
  of them. Darkening them to clear 4.5:1 makes a hint look like a filled value,
  which is the other half of the reason placeholders are a poor place for
  anything worth reading: they vanish the moment someone starts typing.

  Both hints said "you can leave this vague", and the fieldset already opens
  with "Answer what you know", so they were reassurance the form gives twice.
  The labels carry the meaning; the `optional` marker carries the rest. The
  date field's dd/mm/yyyy is the browser's own and not one of ours.
*/

/** Offered alongside the real options, so nobody is forced into a wrong answer. */
const UNDECIDED = "Not decided yet";

/** The order errors are read in, so focus lands on the first one down the page. */
const FIELD_ORDER = ["name", "email", "phone", "date", "guests", "message"] as const;

/**
 * The private-event enquiry.
 *
 * NOT THE CHECKOUT, AND DELIBERATELY SO. `/events/[slug]/book` holds a seat on
 * a scheduled session at a known price; a private event has no date, no price
 * and no seat count until somebody talks to the studio. Pointing this at the
 * basket would mean inventing all three. Nothing in the booking or payment
 * flow is touched, imported or altered by this file — it writes to the enquiry
 * seam in lib/enquiry.ts, the one the contact form already uses.
 *
 * WHAT IT ASKS. Nine fields, and no more: who you are and how to reach you,
 * then the five things the studio would have to ask before it could answer,
 * then a message. No company name, no budget band, no "how did you hear about
 * us", no marketing consent — every extra field on an enquiry form is a person
 * who decided not to bother.
 *
 * Three are required: name, email and phone. Everything about the event itself
 * is optional and every select offers a way out, because somebody at the "I
 * wonder if they even do this" stage does not know their date or their numbers
 * yet, and a form that demands them loses exactly the enquiry this page exists
 * to collect.
 *
 * ASKING IS NOT CLAIMING. The guest count and the location are questions. They
 * are not a statement that any particular number can be seated or that the
 * studio travels anywhere, and nothing on this page or the one before it says
 * either — which is why the guest field has no min, no max and no suggested
 * range, and the location field is free text with no list of venues behind it.
 *
 * WHAT HAPPENS ON SUBMIT. The enquiry is posted to the CMS Inbox
 * (`sendEnquiry`, lib/enquiry.ts → `/api/site/enquiries`) with the answered
 * questions as `details`, and the form says what the server answered. The
 * thank-you replaces the form only once the enquiry is stored; every other
 * answer — enquiries switched off in the admin, too many from this
 * connection, a field refused, our side down — gets its own sentence
 * (<EnquiryOutcome>) with the form left filled to send again. It matters more
 * on this page than anywhere else on the site: someone planning a birthday
 * around a reply must never be told one is coming when it is not. A hidden
 * `website` field is the honeypot.
 *
 * WHY THE ACTIVITIES ARRIVE AS A PROP. They are the studio's approved list and
 * it is read through `getCreativeExperiences()`, which is async because it is
 * the seam a CMS query will replace. A client component cannot await it, so
 * the server page does and hands the names down. The alternative — a second
 * copy of the list kept here — is exactly the drift that had this form and the
 * homepage disagreeing about what the Maison offers.
 */
export function PrivateEventEnquiry({
  activities,
  intro,
  face,
}: {
  activities: readonly string[];
  /**
   * The masthead, and the ticket's face. Both are static and both belong to
   * the server page — but the GRID that places them has to live here, for
   * the same reason <BookingForm> owns the one on the other route: the card
   * in the right-hand column mirrors values only this component holds, so
   * the two columns cannot be siblings in a server page.
   */
  intro: React.ReactNode;
  face: React.ReactNode;
}) {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /*
    A SECOND VIEW OF THE ANSWERS, NOT A SECOND COPY OF THEM.

    The stub beside the form fills in as the form is written, which needs the
    values during render — and the submit still reads them off the DOM with
    `new FormData`, which is what keeps this component uncontrolled and the
    fields cheap. So this is written by `onInput` on the form element itself:
    one listener, bubbling, no `value`/`onChange` pair on nine inputs, and no
    way for the two to disagree about what will actually be sent.
  */
  const [watched, setWatched] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    message: "",
    occasion: UNDECIDED,
    activity: UNDECIDED,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardFits = useFitsInView(cardRef);
  const dateRef = useRef<HTMLInputElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  /*
    Stop the picker offering days that have already gone.

    Set here rather than as a `min` attribute in the markup, and the reason is
    that this page is statically prerendered: a date computed while rendering
    would be baked into the HTML at build time and would still be claiming
    today is the build date months later. Written straight to the DOM node
    instead of through state, so it costs no extra render and cannot disagree
    with the server's markup — the attribute simply is not there until the
    browser adds it.

    It is a convenience, not the guard. A typed date bypasses `min` entirely,
    so the real check is in `validate` below.
  */
  useEffect(() => {
    const el = dateRef.current;
    if (el) el.min = new Date().toLocaleDateString("en-CA");
  }, []);

  /*
    Move focus to the first field that needs attention.

    Without this a keyboard or screen-reader visitor presses the button, the
    page re-renders with messages on it, and focus is still on a button that
    appears to have done nothing. The summary above the button announces that
    something is wrong; this is what makes it actionable.
  */
  useEffect(() => {
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (!first || !formRef.current) return;
    formRef.current.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [errors]);

  /*
    Move focus to the outcome once there is one.

    `role="status"` gets it announced; focus is what lets someone act on it
    without hunting back through nine fields for the end of the form.
  */
  useEffect(() => {
    if (result) outcomeRef.current?.focus();
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const values = {
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      occasion: get("occasion"),
      activity: get("activity"),
      date: get("date"),
      guests: get("guests"),
      location: get("location"),
      message: get("message"),
      website: get("website"),
    };

    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setResult(null);
      return;
    }

    /*
      Only questions that were actually answered travel. An enquiry listing
      five blank rows is harder for the studio to read than one carrying the
      two facts the sender knew, and the contract on `details` says not to
      pad it.
    */
    const details = [
      { label: "Event type", value: values.occasion },
      { label: "Creative activity", value: values.activity },
      { label: "Preferred date", value: values.date },
      { label: "Estimated guests", value: values.guests },
      { label: "Preferred location", value: values.location },
    ].filter((entry) => entry.value !== "" && entry.value !== UNDECIDED);

    setSubmitting(true);
    setResult(null);
    try {
      const outcome = await sendEnquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        topic: "private",
        message: values.message,
        details,
        source: "private-event",
        website: values.website || undefined,
      });
      // A field the server refused is marked where it is, as the browser's own checks are.
      if (outcome.status === "invalid" && outcome.field && (FIELD_ORDER as readonly string[]).includes(outcome.field)) {
        setErrors({ [outcome.field]: outcome.message });
      }
      setResult(outcome);
    } catch {
      /*
        `sendEnquiry` returns rather than throws, but an enquiry form that
        white-screens on something unforeseen loses the message and tells
        nobody. Reported as "not sent", because from where the customer sits
        that is exactly what happened.
      */
      setResult({ status: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  /*
    The enquiry is stored in the Inbox. Replaces the form rather than sitting
    under it: the thing has been sent, and leaving nine filled fields on
    screen invites somebody to send it again.
  */
  if (result?.status === "ok") {
    return (
      <div
        ref={outcomeRef}
        tabIndex={-1}
        role="status"
        className="border-l-2 border-primary bg-cream/60 p-7 focus:outline-none md:p-9"
      >
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">
          Enquiry received
        </p>
        <p className="mt-5 max-w-[36rem] text-lead text-text">
          Thank you. We have your enquiry.
        </p>
        <p className="mt-5 max-w-[36rem] text-body text-text/80">
          The Maison will read it and come back to you with what the session could look like, at
          the email address you gave us.
        </p>
        <Link
          href="/events"
          className="group mt-8 inline-flex items-center gap-3 -my-1.5 py-1.5 text-label font-medium uppercase tracking-eyebrow text-text"
        >
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            Meanwhile, see the public events
          </span>
          <span
            aria-hidden
            className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </Link>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  const stub = (
    <EnquiryStub
      name={watched.name}
      email={watched.email}
      phone={watched.phone}
      date={watched.date}
      occasion={watched.occasion}
      activity={watched.activity}
      message={watched.message}
      undecided={UNDECIDED}
    />
  );

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
      <div className="col-span-12 lg:col-span-7 lg:col-start-1 lg:row-start-1">
        {intro}

        <div className="mt-14 md:mt-16">
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative"
      /* One bubbling listener for the typed fields. The choosers are radios
         and report through <PaintChoice>'s `onChoose` instead — a radio fires
         `change`, not `input`, and catching both here would be two code paths
         for one job. */
      onInput={(event) => {
        /* The textarea bubbles `input` like the rest, which is why the
           message needed no second path — only a key in `watched`. */
        const el = event.target as HTMLInputElement | HTMLTextAreaElement;
        if (!el.name || !(el.name in watched)) return;
        setWatched((prev) => ({ ...prev, [el.name]: el.value }));
      }}
    >
      <Honeypot id={`${ids}-website`} />
      <fieldset className="border-0 p-0">
        <legend className="text-label font-medium uppercase tracking-eyebrow text-text">
          About you
        </legend>

        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
          <Field
            id={`${ids}-name`}
            name="name"
            label="Name"
            autoComplete="name"
            error={errors.name}
          />
          <Field
            id={`${ids}-email`}
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            error={errors.email}
          />
          {/*
            Required here where the contact form leaves it optional, and the
            difference is the conversation each one starts. A contact message
            can be answered by reply; a private event is planned over a call,
            and the studio asking for a number afterwards is a day lost. Same
            rule as the booking step, so the two cannot disagree about what
            counts as a phone number.
          */}
          <Field
            id={`${ids}-phone`}
            name="phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
          />
        </div>
      </fieldset>

      <fieldset className="mt-14 border-0 p-0">
        <legend className="text-label font-medium uppercase tracking-eyebrow text-text">
          About the event
        </legend>
        <p className="mt-4 max-w-[34rem] text-fine leading-[1.7] text-text/70">
          Answer what you know. None of this is required, and nothing here is fixed once you
          send it.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
          {/*
            ==============================================================
            CHIPS RATHER THAN SELECTS — at the client's ask
            ==============================================================

            Both of these were `<select>`s. The client's note was that this
            form should answer the hand the way the scheduled route's booking
            form does, and the one control that does it over there is
            <PlacePalette> — dishes you fill with paint. <PaintChoice> is
            that control for a question whose answers are words, built on the
            palette's own CSS so the two cannot drift.

            IT CHANGES NOTHING BELOW THE SURFACE, which is why it was safe to
            do. The submit reads `new FormData(form)` and `data.get("occasion")`,
            so a radio group under the same `name` submits exactly what the
            select did; `validate` never looked at either field, and neither
            is in FIELD_ORDER. The lists are still the same constants.

            WHY THESE TWO AND NOT THE REST. A select is the right control for
            a long or open list, and the wrong one for five or eight named
            alternatives a visitor is meant to browse — it hides every option
            but one behind a tap. Name, email, phone, date and guests are all
            things somebody types; these two are the only places on this form
            where the whole answer can be shown at once.

            "Something else" stays: these are examples, and a list with no way
            out turns an example into a requirement.
          */}
          <PaintChoice
            name="occasion"
            legend="Event type"
            defaultValue={UNDECIDED}
            options={[
              UNDECIDED,
              ...PRIVATE_EVENT_AUDIENCES.map((audience) => audience.name),
              "Something else",
            ]}
          />

          {/*
            The note is the palette's "9 places available on this date." —
            the line that tells you what the control means once you have used
            it. Here the true thing to say is that choosing is not committing,
            which the fieldset above already says once and which is the single
            most common reason somebody abandons a form like this.
          */}
          <PaintChoice
            name="activity"
            legend="Creative activity"
            defaultValue={UNDECIDED}
            options={[UNDECIDED, ...activities]}
            note="Pick the one you have in mind, or leave it undecided — nothing here is fixed."
          />

          {/*
            A real date control, so a phone offers its own picker and a screen
            reader announces it as a date. It says what the sender would like,
            not what is free: there is no availability model behind this page
            and the copy never implies one.
          */}
          <Field
            ref={dateRef}
            id={`${ids}-date`}
            name="date"
            label="Preferred date"
            type="date"
            error={errors.date}
            optional
          />

          {/*
            Numeric keypad on a phone, but a text input rather than
            `type="number"` — a number spinner on a hairline field is the one
            control that would arrive wearing the operating system's own
            chrome. No min, no max and no suggested range: the studio has not
            published a capacity and this field must not imply one.
          */}
          <Field
            id={`${ids}-guests`}
            name="guests"
            label="Estimated guests"
            inputMode="numeric"
            autoComplete="off"
            error={errors.guests}
            optional
          />

          <div className="sm:col-span-2">
            {/*
              Free text, and no list behind it. The studio publishes no venues
              for private events, so a dropdown here would be a set of promises
              nobody has made.
            */}
            <Field
              id={`${ids}-location`}
              name="location"
              label="Preferred location"
              autoComplete="off"
              optional
            />
          </div>

          <div
            className={cn(styles.field, "sm:col-span-2")}
            data-status={errors.message ? "error" : "idle"}
          >
            <label htmlFor={`${ids}-message`} className={LABEL}>
              What you have in mind
            </label>
            <div className="relative">
              <textarea
                id={`${ids}-message`}
                name="message"
                rows={5}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? `${ids}-message-error` : undefined}
                className={cn(FIELD, "resize-y block")}
              />
              <span aria-hidden className={cn("dab", styles.stroke)} />
            </div>
            {errors.message ? (
              <p id={`${ids}-message-error`} className="mt-2 text-fine text-text">
                {errors.message}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      {/*
        One live region for the summary, so a screen reader hears something on
        every unsuccessful press — the field messages alone are silent to
        someone who has not moved focus into the form yet.
      */}
      <div role="alert" aria-live="assertive">
        {errorCount > 0 ? (
          <p className="mt-12 max-w-[36rem] border-l-2 border-terracotta pl-5 text-body text-text">
            {errorCount === 1
              ? "One detail needs checking before this can be sent."
              : `${errorCount} details need checking before this can be sent.`}
          </p>
        ) : null}
      </div>

      {/* The ink is the component's now. `--color-on-primary` is the one light
          ink that clears Deep Lilac (4.90:1, against 3.95:1 for plain White
          Rock), and <BlobButton> carries it for every tone. */}
      <BlobButton
        type="submit"
        disabled={submitting}
        className="mt-12 w-full justify-center px-8 py-5 sm:w-auto"
      >
        {submitting ? "Sending" : "Send enquiry"}
      </BlobButton>

      {/* Every answer that is not "stored" — see <EnquiryOutcome>. */}
      {result ? (
        <EnquiryOutcome ref={outcomeRef} result={result} noun="enquiry" className="mt-10" />
      ) : null}
    </form>
        </div>
      </div>

      {/*
        ==================================================================
        THE TICKET, BESIDE THE FORM THAT FILLS IT IN
        ==================================================================

        Columns 9 to 12 on one row with the masthead and the form, sticky
        while it fits — the arrangement <BookingForm> uses, down to the
        `stickyCard` class, so the two routes place their card identically.

        The FACE comes from the server page because it is static — a
        photograph and the three steps, neither of which this component has
        any business holding. The STUB is built here because it is the only
        part that moves.

        `lg:` only. A phone gets the stub under the button instead — see
        below — because a 2:1 photograph and three steps between the heading
        and the first question is the fold spent on something nobody is
        answering yet.
      */}
      {/*
        `data-fits` IS WHAT MAKES IT STICK, and its absence is why this card
        did not. `.stickyCard` declares a `top` and nothing else; the rule
        that sets `position: sticky` is `.stickyCard[data-fits]`, gated that
        way because a card taller than the window hides its own foot for as
        long as it is stuck. The class was here from the start and the
        attribute was not, so the card simply scrolled away with the page.

        Measured rather than guessed at, and measured by the other route's
        own hook — see <useFitsInView>. The height of this card depends on
        the column's width and on how much of the form has been answered, so
        no media query is right for all of it.
      */}
      <div
        ref={cardRef}
        data-fits={cardFits || undefined}
        className={`col-span-12 hidden lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block lg:self-start ${cardStyles.stickyCard}`}
      >
        <Reveal variant="fadeIn" delay={0.25}>
          {/*
            THE LEAN, which is the last thing this card was missing. The other
            route wraps its own in <PointerTilt max={4}> and the card turns a
            few degrees toward the hand — the near edge dipping, the way a
            ticket held in two hands does. Four degrees and the same
            component, so the two cards bend by the same amount; the tilt
            gates itself off on a coarse pointer and under reduced motion.

            AROUND THE TICKET, NOT THE WHOLE COLUMN. The link below it is
            navigation and should not tip when the pointer crosses it, and a
            tilt on the sticky element itself would fight `position: sticky`
            for the same transform.
          */}
          <PointerTilt max={4}>
            <aside aria-labelledby="what-happens-next" className={cardStyles.cardShadow}>
              {face}
              {stub}
            </aside>
          </PointerTilt>

          {/*
            THE SITE'S SECONDARY ACTION IS <PeelNote>, EVERYWHERE — see the
            note on <BlobButton>'s tones. This was the navigation treatment:
            a word on a hairline with an arrow after it, which is the right
            object for a link inside a sentence and the wrong one for the
            only other thing a visitor can do from this page.
          */}
          <PeelNote href="/events" className="mt-8 min-h-[3.25rem] px-7">
            Or book a public event
          </PeelNote>
        </Reveal>
      </div>

      {/*
        THE PHONE'S COPY OF THE STUB, under the form rather than over it.
        Same component, its own shadow, and an eyebrow to say what it is —
        the shape <PlaceCardStub variant="inline"> takes on the other route
        and for the same reason: the summary is worth having on a phone, the
        photograph above it is not.
      */}
      {/* `aria-hidden` on the WRAPPER, label included. <EnquiryStub> hides
          itself — it is a picture of answers the form has already given, and
          reading them twice is worse than not reading them at all — so a
          label left outside it would announce a heading over nothing.
          <PlaceCardStub variant="inline"> wraps its own eyebrow for exactly
          this reason. */}
      <div aria-hidden className="col-span-12 lg:hidden">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
          Your enquiry
        </p>
        <div className={`mt-4 ${cardStyles.cardShadow}`}>{stub}</div>
      </div>
    </div>
  );
}

/**
 * Every rule the form applies, in one function.
 *
 * Separate from the component so the shape of the checking is readable on its
 * own, and so the real server-side validation a transport will need has
 * something to mirror. The messages are the customer's, not the developer's:
 * they say what to do, never what failed.
 *
 * The optional fields are checked only when they hold something. "Leave it
 * blank" and "fill it in correctly" are both acceptable answers; "fill it in
 * wrongly" is not.
 */
function validate(v: {
  name: string;
  email: string;
  phone: string;
  date: string;
  guests: string;
  message: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!v.name) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "Please check this email address.";
  // Digit count rather than a format pattern, and the same rule the booking
  // step uses. UAE numbers are written +971 50 123 4567, 050 123 4567 and
  // 0501234567 by people who all mean the same thing, and a regex strict
  // enough to be worth having would reject two of the three.
  if (v.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Please add a number we can reach you on.";
  }

  if (v.date) {
    // `toLocaleDateString("en-CA")` is YYYY-MM-DD in the visitor's own zone,
    // which is the same shape the input produces — so this compares two local
    // calendar days rather than two instants, and cannot call today yesterday
    // for anyone east of UTC.
    const today = new Date().toLocaleDateString("en-CA");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || Number.isNaN(Date.parse(v.date))) {
      errors.date = "Please check this date.";
    } else if (v.date < today) {
      errors.date = "Please choose a date that has not passed.";
    }
  }

  // A whole number, and nothing beyond that. No upper bound: the studio has
  // published no capacity, so there is no number this form is entitled to
  // call too many.
  if (v.guests && !/^\d{1,5}$/.test(v.guests.replace(/[\s,]/g, ""))) {
    errors.guests = "Please give this as a number, or leave it blank.";
  }

  if (!v.message) errors.message = "Please add a little about what you have in mind.";

  return errors;
}

/*
  (REMOVED) <Select> — its two callers became <PaintChoice> on 2026-10-08 and
  nothing else on the site used it. The chevron, the `appearance-none` and the
  /70 measurement it carried are in the component's own history if a select is
  ever wanted back.
*/


function Field({
  ref,
  id,
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  error,
  optional,
}: {
  ref?: React.Ref<HTMLInputElement>;
  id: string;
  name: string;
  label: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  error?: string;
  /** Marks the label rather than the input: the field simply is not required. */
  optional?: boolean;
}) {
  return (
    <div className={styles.field} data-status={error ? "error" : "idle"}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {optional ? (
          <span className="ml-2 normal-case tracking-normal text-text/70">optional</span>
        ) : null}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={FIELD}
        />
        <span aria-hidden className={cn("dab", styles.stroke)} />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
