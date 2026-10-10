"use client";

import { BlobButton } from "@/components/ui/BlobButton";
import { useEffect, useId, useRef, useState } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { EnquiryOutcome, Honeypot } from "@/components/contact/EnquiryOutcome";
import { ENQUIRY_TOPICS, sendEnquiry, type EnquiryResult, type EnquiryTopic } from "@/lib/enquiry";
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
 * vanishes. Errors are set on submit rather than per keystroke, so nobody is
 * told their email is wrong while they are still halfway through typing it.
 *
 * WHAT HAPPENS ON SUBMIT. The enquiry is posted to the CMS Inbox
 * (`sendEnquiry`, lib/enquiry.ts → `/api/site/enquiries`), and the form says
 * what the server answered: the thank-you only once the enquiry is stored,
 * and a specific sentence for each way it can fail — switched off, too many
 * from this connection, a field refused, our side down — with everything
 * typed left in place to send again (<EnquiryOutcome>). A hidden `website`
 * field is the honeypot.
 */
export function ContactForm() {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

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
  const FIELD_ORDER = ["name", "email", "message"] as const;
  useEffect(() => {
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (!first || !formRef.current) return;
    formRef.current.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    // FIELD_ORDER is a module-stable literal; only `errors` can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const errorCount = Object.keys(errors).length;
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

    const next: Record<string, string> = {};
    if (!enquiry.name) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) next.email = "Please check this email address.";
    if (!enquiry.message) next.message = "Please add a little about what you need.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setResult(null);
    const outcome = await sendEnquiry(enquiry);
    setSubmitting(false);
    // A field the browser let through and the server did not: mark it where
    // it is, as the browser-side checks do, as well as saying so below.
    if (outcome.status === "invalid" && outcome.field && FIELD_ORDER.some((name) => name === outcome.field)) {
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
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative">
      <Honeypot id={`${ids}-website`} />
      {/*
        One live region for the summary, so a screen reader hears something on
        every unsuccessful press — the per-field messages alone are silent to
        someone whose focus is still on the button. Wording follows the
        private-events form so the two read as one system.
      */}
      <div role="alert" aria-live="assertive">
        {errorCount > 0 ? (
          <p className="mb-8 max-w-[36rem] border-l-2 border-terracotta pl-5 text-body text-text">
            {errorCount === 1
              ? "One detail needs checking before this can be sent."
              : `${errorCount} details need checking before this can be sent.`}
          </p>
        ) : null}
      </div>

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
          {error}
        </p>
      ) : null}
    </div>
  );
}
