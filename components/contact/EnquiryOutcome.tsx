import Link from "next/link";
import type { Ref } from "react";

import type { EnquiryResult } from "@/lib/enquiry";

/**
 * ==========================================================================
 * What happened to an enquiry — said once, for both forms
 * ==========================================================================
 *
 * The contact form and the private-event enquiry post to the same Inbox
 * (lib/enquiry.ts) and can meet the same five answers. They used to share
 * one: "This message was not sent — the Maison has no inbox connected", true
 * while there was nowhere for a message to go. There is now, so each answer
 * the server can give gets its own sentence, and none of them pretends:
 *
 *   ok ............ stored in the Inbox. The only branch with a thank-you.
 *   disabled ...... the owner has switched enquiries off.
 *   rate_limited .. five an hour from one connection.
 *   invalid ....... the server refused a field the browser accepted; the
 *                   form marks the field, this repeats the server's words.
 *   error ......... nothing was stored (database or network trouble).
 *
 * `role="status"` so it is announced; focusable (`tabIndex={-1}`) so the
 * form can move focus onto it, which is what lets someone act on it without
 * hunting back through the fields for the end of the form.
 */

const PANEL = "border-l-2 bg-cream/60 p-7 focus:outline-none md:p-8";
const EYEBROW = "text-label font-medium uppercase tracking-eyebrow text-text";

export function EnquiryOutcome({
  result,
  noun,
  className,
  ref,
}: {
  result: Exclude<EnquiryResult, { status: "ok" }>;
  /** "message" on /contact, "enquiry" on /private-events. */
  noun: "message" | "enquiry";
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  const copy = OUTCOME[result.status](noun, result.status === "invalid" ? result.message : undefined);
  return (
    <div ref={ref} tabIndex={-1} role="status" className={`${PANEL} border-terracotta ${className ?? ""}`}>
      <p className={EYEBROW}>{copy.title}</p>
      <p className="mt-4 max-w-[36rem] text-body text-text/80">{copy.body}</p>
      {copy.events ? (
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
      ) : null}
    </div>
  );
}

const OUTCOME: Record<
  Exclude<EnquiryResult["status"], "ok">,
  (noun: string, message?: string) => { title: string; body: string; events?: boolean }
> = {
  disabled: (noun) => ({
    title: `This ${noun} was not sent`,
    body: "The Maison is not taking messages through the site just now, so nothing you typed has been sent. Everything you wrote is still in the form.",
    events: true,
  }),
  rate_limited: (noun) => ({
    title: `This ${noun} was not sent`,
    body: "Several messages have been sent from this connection in the last hour. Please try again a little later — everything you wrote is still in the form.",
  }),
  invalid: (noun, message) => ({
    title: `This ${noun} was not sent`,
    body: message ?? "One of the details could not be accepted. Please check the form and send it again.",
  }),
  error: (noun) => ({
    title: `This ${noun} was not sent`,
    body: "Something went wrong on our side and nothing was saved. Please try again in a moment — everything you wrote is still in the form.",
  }),
};

/**
 * The honeypot. Positioned off-screen rather than `display: none` (which
 * some scripts skip), hidden from assistive technology and out of the tab
 * order, so a person never meets it and a script that fills every input
 * does. The server stores what it catches as possible spam and answers as
 * it would for anyone (cms/endpoints/enquiries.ts).
 */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}
