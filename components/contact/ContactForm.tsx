"use client";

import { BlobButton } from "@/components/ui/BlobButton";
import { useEffect, useId, useRef, useState } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { EnquiryOutcome, Honeypot } from "@/components/contact/EnquiryOutcome";
import { ENQUIRY_TOPICS, sendEnquiry, type EnquiryResult, type EnquiryTopic } from "@/lib/enquiry";
import { isValidEmail, isValidName, isValidPhone, NAME_FORMAT_MESSAGE, PHONE_FORMAT_MESSAGE } from "@/lib/fieldValidation";
import { cn } from "@/lib/utils";

/**
 * Field chrome, lifted verbatim from the `Field` in <Checkout> rather than
 * restyled. (It was <BookingForm>'s until the booking step took the painted
 * field — see <PaintedField> — and Checkout is now the plain original.)
 *
 * A hairline under the input instead of a box around it — the same rule this
 * site draws under every link — so a form reads as part of the page rather
 * than as a widget dropped onto it. Two forms on one site that disagree about
 * what an input looks like is one form too many.
 */
/*
  THE SAME FIELD THE BOOKING FLOW DRAWS, at the client's ask — see
  <PaintedField> and `.stroke` in PaintBooking.module.css, which this now
  shares rather than copies. Focus used to recolour the hairline to Deep
  Lilac; it lays a brush stroke under it instead, drawn out from the left and
  1.75x deep, so the indicator survives greyscale and any colour vision
  instead of resting on a hue change alone.

  `border-text/60`, not `border-line`: Charcoal at 60% is 3.30:1 on the page
  ground and clears the 3:1 an input's boundary owes as a non-text control.
  Sage into lavender did not, and the field could only be found by its label.

  No `focus:border-*` left here on purpose. Two focus indicators on one
  control is one of them arguing with the other.
*/
const FIELD =
  "w-full border-0 border-b border-text/60 bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:outline-none focus:ring-0";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/**
 * The enquiry form.
 *
 * Five fields and nothing else. No company, no budget, no "how did you hear
 * about us", no marketing consent — the studio is a table in a mall running a
 * creative afternoon, and every extra field on a contact form is a person who
 * decided not to bother.
 *
 * Validated here as well as by the browser: `required` and `type="email"` are
 * the first pass, not the only one, and someone who gets past them should see
 * the same message in the same place rather than a native bubble that
 * vanishes. Errors appear when a filled field is left and on submit, not per
 * keystroke before that, so nobody is told their email is wrong while they
 * are still halfway through typing it.
 *
 * WHAT HAPPENS ON SUBMIT. The enquiry is posted to the CMS Inbox
 * (`sendEnquiry`, lib/enquiry.ts → `/api/site/enquiries`), and the form says
 * what the server answered: the thank-you only once the enquiry is stored,
 * and a specific sentence for each way it can fail — switched off, too many
 * from this connection, a field refused, our side down — with everything
 * typed left in place to send again (<EnquiryOutcome>). A hidden `website`
 * field is the honeypot.
 */
type ContactValues = { name: string; email: string; phone: string; message: string };

const LIVE_FIELDS = ["name", "email", "phone"] as const;
type LiveField = (typeof LIVE_FIELDS)[number];
const isLiveField = (name: string): name is LiveField => (LIVE_FIELDS as readonly string[]).includes(name);

function validateContact(values: ContactValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Please tell us your name.";
  else if (!isValidName(values.name)) errors.name = NAME_FORMAT_MESSAGE;
  if (!isValidEmail(values.email)) errors.email = "Please check this email address.";
  if (values.phone && !isValidPhone(values.phone)) errors.phone = PHONE_FORMAT_MESSAGE;
  if (!values.message) errors.message = "Please add a little about what you need.";
  return errors;
}

const liveFieldError = (name: LiveField, value: string) =>
  validateContact({ name: "", email: "", phone: "", message: "", [name]: value.trim() })[name];

export function ContactForm() {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstError = useRef(false);
  const touched = useRef(new Set<string>());
  const updateFieldError = (name: string, message: string | undefined) =>
    setErrors((prev) => {
      if (prev[name] === message) return prev;
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });

  /*
    MOVE FOCUS TO THE FIRST FIELD THAT NEEDS ATTENTION.

    This form was the only one of the three on the site that failed silently:
    it is `noValidate`, so pressing Send with a bad email re-rendered messages
    the browser never announced, left focus on the button, and showed nothing
    to anyone who had not already scrolled to the field. A sighted visitor saw
    red text; a screen-reader user got nothing at all.

    <PrivateEventEnquiry> and <BookingForm> already do both halves of this —
    a live region for the count and focus onto the first bad field. This is
    that same pair, so all three forms now fail the same way.
  */
  const FIELD_ORDER = ["name", "email", "phone", "message"] as const;
  useEffect(() => {
    if (!focusFirstError.current) return;
    focusFirstError.current = false;
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (!first || !formRef.current) return;
    formRef.current.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    // FIELD_ORDER is a module-stable literal; only `errors` can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const outcomeRef = useRef<HTMLDivElement>(null);

  // Focus follows the answer, so it can be read and acted on at once.
  useEffect(() => {
    if (result) outcomeRef.current?.focus();
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const enquiry = {
      name: get("name"),
      email: get("email"),
      phone: get("phone") || undefined,
      topic: get("topic") as EnquiryTopic,
      message: get("message"),
      source: "contact" as const,
      website: get("website") || undefined,
    };

    const next = validateContact({ name: enquiry.name, email: enquiry.email, phone: enquiry.phone ?? "", message: enquiry.message });
    LIVE_FIELDS.forEach((name) => touched.current.add(name));
    focusFirstError.current = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setResult(null);
    const outcome = await sendEnquiry(enquiry);
    setSubmitting(false);
    // A field the browser let through and the server did not: mark it where
    // it is, as the browser-side checks do, as well as saying so below.
    if (outcome.status === "invalid" && outcome.field && FIELD_ORDER.some((name) => name === outcome.field)) {
      focusFirstError.current = true;
      setErrors({ [outcome.field]: outcome.message });
    }
    setResult(outcome);
  }

  /*
    Stored. Replaces the form rather than sitting under it: leaving the
    filled fields on screen invites the same message being sent twice.
  */
  if (result?.status === "ok") {
    return (
      <div
        ref={outcomeRef}
        tabIndex={-1}
        role="status"
        className="border-l-2 border-primary bg-cream/60 p-7 focus:outline-none md:p-8"
      >
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">Message received</p>
        <p className="mt-4 max-w-[36rem] text-lead text-text">Thank you. We have your message.</p>
        <p className="mt-4 max-w-[36rem] text-body text-text/80">
          The Maison will reply to the email address you gave us.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative"
      onInput={(event) => {
        const el = event.target as HTMLInputElement;
        if (!isLiveField(el.name) || !touched.current.has(el.name)) return;
        updateFieldError(el.name, (el.value.trim() || errors[el.name]) ? liveFieldError(el.name, el.value) : undefined);
      }}
      onBlur={(event) => {
        const el = event.target as Element as HTMLInputElement;
        if (!isLiveField(el.name) || !el.value.trim()) return;
        touched.current.add(el.name);
        updateFieldError(el.name, liveFieldError(el.name, el.value));
      }}
    >
      <Honeypot id={`${ids}-website`} />

      {/*
        One column to `sm`, two from there for the short fields, and the
        message always full width. A name and an email side by side is the one
        pairing that reads as a pair rather than as a grid for its own sake.
      */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
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
          autoComplete="email"
          error={errors.email}
        />
        <Field
          id={`${ids}-phone`}
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
          optional
        />

        <div className={styles.field}>
          <label htmlFor={`${ids}-topic`} className={LABEL}>
            What can we help with
          </label>
          {/*
            `appearance-none` and a drawn chevron, because a native select
            control on this hairline is the one element that would arrive with
            an operating system's own border radius and shadow on it. The
            element itself is still a real <select>, so it keeps the platform's
            picker, its keyboard behaviour and its screen-reader semantics.
          */}
          <div className="relative">
            <select
              id={`${ids}-topic`}
              name="topic"
              defaultValue="event"
              className={cn(FIELD, "cursor-pointer appearance-none pr-8")}
            >
              {ENQUIRY_TOPICS.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
            {/*
              /70, not the /50 this was drawn at. Measured on the page's own
              ground: /50 composites to rgb(150,154,160) against the warm
              off-white, which is 2.78:1 — under even the 3:1 a graphical mark
              owes, let alone the 4.5:1 for anything read. /70 clears it.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-4 right-1 text-action text-text/70"
            >
              &#9662;
            </span>
            <span aria-hidden className={cn("dab", styles.stroke)} />
          </div>
        </div>

        <div
          className={cn(styles.field, "sm:col-span-2")}
          data-status={errors.message ? "error" : "idle"}
        >
          <label htmlFor={`${ids}-message`} className={LABEL}>
            Message
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
              <span aria-hidden className="mr-2 inline-block size-1.5 rounded-full bg-terracotta align-middle" />
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      <BlobButton
        type="submit"
        disabled={submitting}
        className="mt-12 w-full justify-center px-8 py-5 sm:w-auto"
      >
        {submitting ? "Sending" : "Send enquiry"}
      </BlobButton>

      {/*
        Every answer that is not "stored", said beside the button that sent
        it — see <EnquiryOutcome> for the five.
      */}
      {result ? (
        <EnquiryOutcome ref={outcomeRef} result={result} noun="message" className="mt-10" />
      ) : null}
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
  optional,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  /** Marks the label rather than the input: the field simply is not required. */
  optional?: boolean;
}) {
  return (
    <div className={styles.field} data-status={error ? "error" : "idle"}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {/* /70 for the same measured reason as the select's chevron above: this
            word is read, so it owes 4.5:1, and /50 came to 2.78. */}
        {optional ? <span className="ml-2 normal-case tracking-normal text-text/70">optional</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={FIELD}
        />
        <span aria-hidden className={cn("dab", styles.stroke)} />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          <span aria-hidden className="mr-2 inline-block size-1.5 rounded-full bg-terracotta align-middle" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
