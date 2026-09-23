"use client";

import Link from "next/link";
import { BlobButton } from "@/components/ui/BlobButton";
import { useEffect, useId, useRef, useState } from "react";

import { sendEnquiry, type EnquiryResult } from "@/lib/enquiry";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";
import { cn } from "@/lib/utils";

/**
 * Field chrome, lifted verbatim from <ContactForm> — which lifted it from
 * <BookingForm>. A hairline under the input rather than a box around it, so a
 * form reads as part of the page. Three forms on one site that disagree about
 * what an input looks like is two forms too many.
 */
const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:border-primary focus:outline-none focus:ring-0";

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
 * WHAT HAPPENS ON SUBMIT. Nothing is sent, and the form says so in plain
 * words — see lib/enquiry.ts. The success branch below is written and wired
 * but unreachable, because `ENQUIRY_CONFIGURED` is false and `sendEnquiry`
 * cannot return `ok` until there is a transport behind it. That is the whole
 * point: the screen a customer would see on success exists in code, so wiring
 * a mail service needs no change here, and it cannot be shown to anyone while
 * there is nowhere for their message to go. It matters more on this page than
 * anywhere else on the site — someone planning a birthday around a reply that
 * is never coming loses more than a reply.
 *
 * WHY THE ACTIVITIES ARRIVE AS A PROP. They are the studio's approved list and
 * it is read through `getCreativeExperiences()`, which is async because it is
 * the seam a CMS query will replace. A client component cannot await it, so
 * the server page does and hands the names down. The alternative — a second
 * copy of the list kept here — is exactly the drift that had this form and the
 * homepage disagreeing about what the Maison offers.
 */
export function PrivateEventEnquiry({ activities }: { activities: readonly string[] }) {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
    try {
      setResult(
        await sendEnquiry({
          name: values.name,
          email: values.email,
          phone: values.phone,
          topic: "private",
          message: values.message,
          details,
        }),
      );
    } catch {
      /*
        `sendEnquiry` cannot throw today — it returns before doing anything.
        It will be a network call, and an enquiry form that white-screens on a
        dropped connection loses the message and tells nobody. Reported as the
        same honest "not sent" outcome, because from where the customer sits
        that is exactly what happened.
      */
      setResult({ status: "unconfigured" });
    } finally {
      setSubmitting(false);
    }
  }

  /*
    The enquiry landed. Replaces the form rather than sitting under it: the
    thing has been sent, and leaving nine filled fields on screen invites
    somebody to send it again.

    UNREACHABLE TODAY. See the note at the head of this component — this is
    what the customer will see once a transport exists, and it cannot be
    reached until one does.
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
        <p className="mt-5 max-w-[36rem] text-lead leading-[1.6] text-text">
          Thank you — we have your enquiry.
        </p>
        <p className="mt-5 max-w-[36rem] text-body leading-[1.8] text-text/80">
          The Maison will read it and come back to you with what the session could look like. A
          copy has not been emailed to you, so keep an eye on the inbox you gave us.
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

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
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
            The same four groups the page before this one sets out, read from
            the same constant so a visitor is never offered a type here that
            the page did not show them. "Something else" stays: these are
            examples, and a select with no way out turns an example into a
            requirement.
          */}
          <Select id={`${ids}-occasion`} name="occasion" label="Event type">
            {PRIVATE_EVENT_AUDIENCES.map((audience) => (
              <option key={audience.slug} value={audience.name}>
                {audience.name}
              </option>
            ))}
            <option value="Something else">Something else</option>
          </Select>

          <Select id={`${ids}-activity`} name="activity" label="Creative activity">
            {activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </Select>

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

          <div className="sm:col-span-2">
            <label htmlFor={`${ids}-message`} className={LABEL}>
              What you have in mind
            </label>
            <textarea
              id={`${ids}-message`}
              name="message"
              rows={5}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? `${ids}-message-error` : undefined}
              className={cn(FIELD, "resize-y", errors.message && "border-terracotta")}
            />
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
          <p className="mt-12 max-w-[36rem] border-l-2 border-terracotta pl-5 text-body leading-[1.8] text-text">
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

      {/* The honest outcome while there is nowhere for a message to go. */}
      {result?.status === "unconfigured" ? (
        <div
          ref={outcomeRef}
          tabIndex={-1}
          role="status"
          className="mt-10 border-l-2 border-terracotta bg-cream/60 p-7 focus:outline-none md:p-8"
        >
          <p className="text-label font-medium uppercase tracking-eyebrow text-text">
            This enquiry was not sent
          </p>
          <p className="mt-4 max-w-[36rem] text-body leading-[1.8] text-text/80">
            The Maison has no inbox connected to this form yet, so nothing you have typed has
            been delivered anywhere and no one has been notified. Please do not plan around a
            reply.
          </p>
          <p className="mt-5 max-w-[36rem] text-body leading-[1.8] text-text/80">
            Every public event is listed with its venue and its times, and places can be held
            from there today.
          </p>
          <Link
            href="/events"
            className="group mt-7 inline-flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              See upcoming events
            </span>
            <span
              aria-hidden
              className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </div>
      ) : null}
    </form>
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

/**
 * A select on the same hairline as every other field.
 *
 * `appearance-none` with a drawn chevron, because a native control would
 * arrive carrying the operating system's own radius and shadow. The element is
 * still a real <select>, so it keeps the platform picker, the keyboard
 * behaviour and the screen-reader semantics.
 */
function Select({
  id,
  name,
  label,
  children,
}: {
  id: string;
  name: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={UNDECIDED}
          className={cn(FIELD, "cursor-pointer appearance-none pr-8")}
        >
          {/*
            The default, and a real answer rather than a disabled placeholder.
            Someone who has not chosen an activity yet is telling the studio
            something true, and the submit handler drops it rather than sending
            a row that says nothing.
          */}
          <option value={UNDECIDED}>{UNDECIDED}</option>
          {children}
        </select>
        {/* /70 rather than /50: measured on this ground, /50 composites to
            2.78:1, under even the 3:1 a graphical mark owes. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-1 text-action text-text/70"
        >
          &#9662;
        </span>
      </div>
    </div>
  );
}

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
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {optional ? (
          <span className="ml-2 normal-case tracking-normal text-text/70">optional</span>
        ) : null}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(FIELD, error && "border-terracotta")}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
