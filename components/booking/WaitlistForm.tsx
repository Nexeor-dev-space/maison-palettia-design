"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "@/components/booking/PaintBooking.module.css";
import { Honeypot } from "@/components/contact/EnquiryOutcome";
import { BlobButton } from "@/components/ui/BlobButton";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full border-0 border-b border-text/60 bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft focus:outline-none focus:ring-0";
const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/** The waitlist allows up to twelve seats per request (`waitlist.qty`, SPEC §D.3). */
const MAX_QTY = 12;

type Outcome =
  | { status: "ok"; position?: number }
  | { status: "rate_limited" }
  | { status: "invalid"; field?: string; message: string }
  | { status: "closed" }
  | { status: "error" };

/**
 * Join the waitlist for a session that is full (SPEC §H.11).
 *
 * Shown instead of the booking form when the session's editor switch says
 * `waitlist` or no seats are left, and bookings are open. It posts to
 * `POST /api/site/waitlist` (5 an hour per connection, a `website` honeypot),
 * which keeps one row per session and email — asking again only updates the
 * number of places — and answers with the place in the queue.
 *
 * WHAT IT PROMISES, AND WHAT IT DOES NOT. When seats come free the queue is
 * emailed in order with a link to book; the link does not reserve anything
 * (first come, first served — the email says so too). So the success
 * message says "we will email you", never "you have a place".
 */
export function WaitlistForm({ sessionSlug, title }: { sessionSlug: string; title: string }) {
  const ids = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outcome) outcomeRef.current?.focus();
  }, [outcome]);

  useEffect(() => {
    const first = ["name", "email", "phone", "qty"].find((name) => errors[name]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [errors]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const values = {
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      qty: Number(get("qty") || "1"),
      website: get("website"),
    };

    const next: Record<string, string> = {};
    if (!values.name) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Please check this email address.";
    if (values.phone && values.phone.replace(/\D/g, "").length < 7) next.phone = "Please check this number, or leave it blank.";
    if (!Number.isInteger(values.qty) || values.qty < 1 || values.qty > MAX_QTY) next.qty = `Choose between 1 and ${MAX_QTY} places.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setOutcome(null);
    try {
      const response = await fetch("/api/site/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionSlug,
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          qty: values.qty,
          website: values.website || undefined,
        }),
        cache: "no-store",
      });
      let body: Record<string, unknown> = {};
      try {
        body = (await response.json()) as Record<string, unknown>;
      } catch {
        // judged by the status alone
      }
      if (response.ok && body.status === "ok") {
        setOutcome({ status: "ok", position: typeof body.position === "number" ? body.position : undefined });
      } else if (response.status === 429) setOutcome({ status: "rate_limited" });
      else if (body.status === "invalid") {
        const field = typeof body.field === "string" ? body.field : undefined;
        const message = typeof body.message === "string" ? body.message : "Please check the form.";
        if (field) setErrors({ [field]: message });
        setOutcome({ status: "invalid", field, message });
      } else if (body.status === "closed") setOutcome({ status: "closed" });
      else setOutcome({ status: "error" });
    } catch {
      setOutcome({ status: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (outcome?.status === "ok") {
    return (
      <div
        ref={outcomeRef}
        tabIndex={-1}
        role="status"
        className="border-l-2 border-primary bg-cream/60 p-7 focus:outline-none md:p-9"
      >
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">You are on the waitlist</p>
        <p className="mt-4 max-w-[36rem] text-lead text-text">
          {outcome.position ? `You are number ${outcome.position} in the queue for ${title}.` : `We have you down for ${title}.`}
        </p>
        <p className="mt-4 max-w-[36rem] text-body text-text/80">
          If places come free we will email you in queue order with a link to book. The link does not hold a
          place for you — the first to book gets it — so it is worth acting on quickly.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative" aria-labelledby={`${ids}-heading`}>
      <Honeypot id={`${ids}-website`} />
      <h2 id={`${ids}-heading`} className="text-label font-medium uppercase tracking-eyebrow text-text">
        Join the waitlist
      </h2>
      <p className="mt-4 max-w-[34rem] text-body text-text/80">
        This date is full. Leave your details and we will email you, in the order you joined, if places come
        free.
      </p>

      <div className="mt-9 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        <WaitField id={`${ids}-name`} name="name" label="Name" autoComplete="name" error={errors.name} />
        <WaitField id={`${ids}-email`} name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
        <WaitField id={`${ids}-phone`} name="phone" label="Phone" type="tel" autoComplete="tel" optional error={errors.phone} />
        <div className={styles.field} data-status={errors.qty ? "error" : "idle"}>
          <label htmlFor={`${ids}-qty`} className={LABEL}>
            Places wanted
          </label>
          <div className="relative">
            <select id={`${ids}-qty`} name="qty" defaultValue="1" className={cn(FIELD, "cursor-pointer appearance-none pr-8")}>
              {Array.from({ length: MAX_QTY }, (_, index) => index + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute bottom-4 right-1 text-action text-text/70">
              &#9662;
            </span>
            <span aria-hidden className={cn("dab", styles.stroke)} />
          </div>
          {errors.qty ? <p className="mt-2 text-fine text-text">{errors.qty}</p> : null}
        </div>
      </div>

      <BlobButton type="submit" disabled={submitting} className="mt-10 w-full justify-center px-8 py-5 sm:w-auto">
        {submitting ? "Joining…" : "Join the waitlist"}
      </BlobButton>

      {outcome ? (
        <div
          ref={outcomeRef}
          tabIndex={-1}
          role="status"
          className="mt-8 border-l-2 border-terracotta bg-cream/60 p-6 focus:outline-none md:p-7"
        >
          <p className="text-label font-medium uppercase tracking-eyebrow text-text">You are not on the waitlist yet</p>
          <p className="mt-3 max-w-[36rem] text-body text-text/80">
            {outcome.status === "rate_limited"
              ? "Several requests have come from this connection in the last hour. Please try again later."
              : outcome.status === "invalid"
                ? outcome.message
                : outcome.status === "closed"
                  ? "This date is no longer taking waitlist requests."
                  : "Something went wrong on our side and nothing was saved. Please try again in a moment."}
          </p>
        </div>
      ) : null}
    </form>
  );
}

function WaitField({
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
  optional?: boolean;
}) {
  return (
    <div className={styles.field} data-status={error ? "error" : "idle"}>
      <label htmlFor={id} className={LABEL}>
        {label}
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
