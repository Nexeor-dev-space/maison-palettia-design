"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { ENQUIRY_TOPICS, sendEnquiry, type EnquiryResult, type EnquiryTopic } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

/**
 * Field chrome, lifted verbatim from <BookingForm> rather than restyled.
 *
 * A hairline under the input instead of a box around it — the same rule this
 * site draws under every link — so a form reads as part of the page rather
 * than as a widget dropped onto it. Two forms on one site that disagree about
 * what an input looks like is one form too many.
 */
const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[0.95rem] text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:border-primary focus:outline-none focus:ring-0";

const LABEL = "block text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75";

/**
 * The enquiry form.
 *
 * Five fields and nothing else. No company, no budget, no "how did you hear
 * about us", no marketing consent — the studio is a table in a mall running a
 * pottery afternoon, and every extra field on a contact form is a person who
 * decided not to bother.
 *
 * Validated here as well as by the browser: `required` and `type="email"` are
 * the first pass, not the only one, and someone who gets past them should see
 * the same message in the same place rather than a native bubble that
 * vanishes. Errors are set on submit rather than per keystroke, so nobody is
 * told their email is wrong while they are still halfway through typing it.
 *
 * WHAT HAPPENS ON SUBMIT. Nothing is sent, and the form says so in plain
 * words — see lib/enquiry.ts. That is deliberate and it is the same line the
 * booking flow draws: there is no mail service in this project and no address
 * to send to, and a thank-you screen over a form that goes nowhere is the one
 * thing that must never ship.
 */
export function ContactForm() {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const enquiry = {
      name: get("name"),
      email: get("email"),
      phone: get("phone") || undefined,
      topic: get("topic") as EnquiryTopic,
      message: get("message"),
    };

    const next: Record<string, string> = {};
    if (!enquiry.name) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) next.email = "Please check this email address.";
    if (!enquiry.message) next.message = "Please add a little about what you need.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setResult(await sendEnquiry(enquiry));
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
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

        <div>
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
              className="pointer-events-none absolute bottom-4 right-1 text-[0.7rem] text-text/70"
            >
              &#9662;
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-message`} className={LABEL}>
            Message
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
            <p id={`${ids}-message-error`} className="mt-2 text-[0.78rem] text-text">
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "group mt-12 inline-flex w-full items-center justify-center gap-2.5 px-8 py-5",
          "text-[0.72rem] font-medium uppercase leading-none tracking-eyebrow",
          "bg-primary text-white transition-colors duration-300 ease-soft",
          "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
        )}
      >
        {submitting ? "Sending" : "Send enquiry"}
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </button>

      {/*
        The honest outcome. `role="status"` so it is announced rather than
        only seen — the button is above it and a submit that appears to do
        nothing is the worst version of this.
      */}
      {result?.status === "unconfigured" ? (
        <div role="status" className="mt-10 border-l-2 border-terracotta bg-cream/60 p-7 md:p-8">
          <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
            This message was not sent
          </p>
          <p className="mt-4 max-w-[36rem] text-[0.9rem] leading-[1.8] text-text/80">
            The Maison has no inbox connected to this form yet, so nothing you have typed has
            been delivered anywhere and no one has been notified. Please do not treat this as
            received.
          </p>
          <p className="mt-5 max-w-[36rem] text-[0.9rem] leading-[1.8] text-text/80">
            Every upcoming event is listed with its venue and its times, and places can be held
            from there.
          </p>
          <Link
            href="/events"
            className="group mt-7 inline-flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text"
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
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {/* /70 for the same measured reason as the select's chevron above: this
            word is read, so it owes 4.5:1, and /50 came to 2.78. */}
        {optional ? <span className="ml-2 normal-case tracking-normal text-text/70">optional</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(FIELD, error && "border-terracotta")}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[0.78rem] text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
