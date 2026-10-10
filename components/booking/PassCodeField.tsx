"use client";

import { useId, useState } from "react";

import type { RejectedCodeReason } from "@/lib/cart";
import { cn } from "@/lib/utils";

/** What the checkout answers when a code is offered. */
export type CodeOutcome =
  | { status: "applied"; message?: string }
  | { status: "rejected"; reason: RejectedCodeReason }
  | { status: "unavailable" }
  | { status: "rate_limited" }
  | { status: "too_many" }
  | { status: "error" };

/**
 * The pass, promo or gift code box.
 *
 * WHAT HAPPENS ON APPLY. <Checkout> asks the server to price the basket with
 * the code (`requestQuote` → `POST /api/site/checkout/quote`, SPEC §H.3): the
 * promo rules (dates, uses, minimum spend, what it applies to) and any pass
 * credits held by the email in the form are checked there, and the total the
 * basket shows is the server's. Nothing is subtracted in the browser, and
 * nothing is reserved by applying — the same pricing runs again, atomically,
 * when Pay is pressed, so a code that ran out in between is reported then.
 *
 * Each refusal says why, in the customer's terms (MESSAGES below), rather
 * than a blanket "invalid": "that code has been used up" is something a
 * customer can act on, "invalid" sends them to retype a code that was fine.
 *
 * ITS OWN <form>, and it has to be: it sits beside the checkout's details
 * form, never inside it, so Enter in the code box applies the code instead
 * of submitting the booking.
 */
export function PassCodeField({
  applied,
  onApply,
  onRemove,
  disabled,
}: {
  /** Codes the server accepted, in the order they were added. */
  applied: readonly string[];
  onApply: (code: string) => Promise<CodeOutcome>;
  onRemove: (code: string) => void;
  /** While Pay is in flight. */
  disabled?: boolean;
}) {
  const id = useId();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<CodeOutcome | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wanted = code.trim().toUpperCase();
    if (checking || !wanted) return;
    if (applied.includes(wanted)) {
      setOutcome({ status: "applied", message: "That code is already applied." });
      return;
    }
    setChecking(true);
    // Cleared first: the previous answer must not read as the answer to this code.
    setOutcome(null);
    try {
      const next = await onApply(wanted);
      setOutcome(next);
      if (next.status === "applied") setCode("");
    } catch {
      setOutcome({ status: "error" });
    } finally {
      setChecking(false);
    }
  }

  const message = outcome ? messageFor(outcome) : null;
  // Only a refusal of what was typed is an error on the field; "cannot check
  // right now" is a fact about the site, not a fault in the code.
  const invalid = outcome?.status === "rejected";

  return (
    <div className="mt-7 border-t border-text/15 pt-6">
      <form onSubmit={onSubmit}>
        <label htmlFor={`${id}-code`} className="block text-label font-medium uppercase tracking-eyebrow text-text/75">
          Have a pass or code?
        </label>

        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-3">
          <input
            id={`${id}-code`}
            name="passCode"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (outcome) setOutcome(null);
            }}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            placeholder="Enter code"
            aria-invalid={invalid || undefined}
            aria-describedby={message ? `${id}-message` : `${id}-note`}
            className={cn(
              "min-w-0 flex-1 border-0 border-b bg-transparent px-0 py-2.5",
              "text-body uppercase tracking-[0.08em] text-text placeholder:normal-case",
              "placeholder:tracking-normal placeholder:text-text/45",
              "transition-colors duration-300 ease-soft focus:outline-none focus:ring-0",
              "disabled:text-text/60",
              invalid ? "border-terracotta focus:border-terracotta" : "border-text/25 focus:border-primary",
            )}
          />

          {/* Quiet by design: the one filled button on the page is Pay. */}
          <button
            type="submit"
            disabled={disabled || checking || code.trim().length === 0}
            className={cn(
              "shrink-0 rounded-sm border border-text/30 px-5 py-2.5",
              "text-label font-medium uppercase tracking-eyebrow text-text",
              "transition-colors duration-300 ease-soft",
              "hover:border-text hover:bg-text/5",
              "disabled:cursor-not-allowed disabled:border-text/15 disabled:text-text/45 disabled:hover:bg-transparent",
            )}
          >
            {checking ? "Checking…" : "Apply"}
          </button>
        </div>

        <p id={`${id}-note`} className="mt-2 text-fine text-text/70">
          Pass credits are matched to the email address in your details.
        </p>

        {/* A live region, so the answer to a button press is heard as well as seen. */}
        <p id={`${id}-message`} role="status" className={cn("mt-3 text-fine leading-[1.65]", invalid ? "text-text" : "text-text/75")}>
          {message}
        </p>
      </form>

      {applied.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {applied.map((entry) => (
            <li key={entry} className="inline-flex items-center gap-2 rounded-pill bg-text/[0.07] py-1 pl-3 pr-1 text-fine">
              <span className="tabular-nums tracking-[0.06em]">{entry}</span>
              <button
                type="button"
                onClick={() => onRemove(entry)}
                disabled={disabled}
                aria-label={`Remove code ${entry}`}
                className="rounded-pill px-2 py-0.5 text-text/70 hover:bg-text/10 hover:text-text"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function messageFor(outcome: CodeOutcome): string {
  switch (outcome.status) {
    case "applied":
      return outcome.message ?? "Code applied. Your total below has been updated.";
    case "rejected":
      return REJECTED[outcome.reason];
    case "unavailable":
      return "Codes cannot be checked just now, so nothing has been applied and your total is unchanged. Please try again shortly.";
    case "rate_limited":
      return "Several codes have been tried from this connection. Please wait a minute and try again.";
    case "too_many":
      return "Up to three codes can be used on one booking.";
    default:
      return "We could not check that code just now. Your total is unchanged; please try again.";
  }
}

/** One line per refusal reason (`Quote.rejectedCodes[].reason`, SPEC §O). */
const REJECTED: Record<RejectedCodeReason, string> = {
  invalid: "We do not recognise that code. Check it and try again.",
  expired: "That code is no longer valid.",
  exhausted: "That code has been used up. If it is a pass, it has no sessions left for this email address.",
  min_spend: "That code needs a larger booking before it applies.",
  not_applicable: "That code does not apply to anything in this booking.",
  one_promo_only: "Only one promo code can be used per booking.",
};
