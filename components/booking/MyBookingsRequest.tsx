"use client";

import { useId, useState } from "react";

import { Honeypot } from "@/components/contact/EnquiryOutcome";
import { BlobButton } from "@/components/ui/BlobButton";

const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lead text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft focus:border-primary focus:outline-none focus:ring-0";

/**
 * "Email me a link to my bookings" (SPEC §H.10).
 *
 * There are no customer accounts and no passwords: the email a booking was
 * made with is the identity. `POST /api/site/my-bookings/request` answers the
 * same "if there are bookings for that address, a link is on its way" for
 * every address — whether or not any exist — so this form cannot be used to
 * learn who has booked. The link lasts 30 minutes and works once; only the
 * newest one sent works at all.
 */
export function MyBookingsRequest() {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "rate_limited" | "error">("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please check this email address.");
      return;
    }
    setFieldError(null);
    setState("sending");
    try {
      const response = await fetch("/api/site/my-bookings/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website: String(data.get("website") ?? "") || undefined }),
        cache: "no-store",
      });
      setState(response.ok ? "sent" : response.status === 429 ? "rate_limited" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="mt-12 max-w-[38rem] border-l-2 border-primary bg-cream/60 p-7 md:p-9">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">Check your inbox</p>
        <p className="mt-4 text-body text-text/80">
          If there are bookings for that address, a link to them is on its way. It works once and lasts 30
          minutes. Nothing arrived? Check the spam folder, and that this is the address you booked with.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-12 max-w-[28rem] md:mt-14">
      <Honeypot id={`${id}-website`} />
      <label htmlFor={`${id}-email`} className="block text-label font-medium uppercase tracking-eyebrow text-text/75">
        Email you booked with
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? `${id}-error` : undefined}
        className={FIELD}
      />
      {fieldError ? (
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {fieldError}
        </p>
      ) : null}

      <BlobButton type="submit" tone="deep" disabled={state === "sending"} className="mt-9 w-full justify-center px-8 py-4 sm:w-auto">
        {state === "sending" ? "Sending…" : "Email me a link"}
      </BlobButton>

      <div role="alert">
        {state === "rate_limited" || state === "error" ? (
          <p className="mt-6 max-w-[34rem] border-l-2 border-terracotta pl-5 text-body text-text">
            {state === "rate_limited"
              ? "A few links have been requested already. Please wait a quarter of an hour, then try again — or use the newest email you received."
              : "Something went wrong on our side. Please try again in a moment."}
          </p>
        ) : null}
      </div>
    </form>
  );
}
