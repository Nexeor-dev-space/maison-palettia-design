"use client";

import { useId, useState } from "react";

import { redeemPassCode, type PassCodeResult } from "@/lib/booking";
import { cn } from "@/lib/utils";

/**
 * The pass, loyalty or gift code box.
 *
 * WHAT IS REAL HERE, STATED PLAINLY. The field, the pending state, the
 * announcement and the wiring are real. The ledger behind it is not — there
 * are no codes, so nothing typed here can succeed. See `redeemPassCode` and
 * `PASS_CODES_CONFIGURED` in lib/booking.ts for the seam this renders.
 *
 * That is why the unconfigured answer is "codes are not live yet" rather than
 * "that code is invalid". The second would be the site telling a customer they
 * mistyped something, about a code that was never going to be recognised —
 * which is a lie dressed as a validation message, and worse than saying
 * nothing at all.
 *
 * Nothing here touches the basket or the total. A discount that moves a price
 * has to be calculated where the price is, and a browser inventing a
 * subtraction is the fake discount this must never produce.
 *
 * ITS OWN <form>, and it has to be. It sits beside the checkout's details
 * form, never inside it: nesting is invalid HTML, and an unnested code box
 * inside the booking form would mean pressing Enter after typing a code placed
 * the entire booking. As a form of its own, Enter applies the code — which is
 * what pressing Enter in a code box should do.
 */
export function PassCodeField() {
  const id = useId();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PassCodeResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) return;

    setChecking(true);
    // Cleared before the check, not after: leaving the previous answer on
    // screen while a new one is being fetched reads as a response to the code
    // that was just typed.
    setResult(null);
    try {
      setResult(await redeemPassCode(code));
    } catch {
      // The seam is local today and cannot throw. It will be a network call,
      // and a code box that white-screens the checkout it sits inside would
      // take the whole booking with it.
      setResult({ status: "invalid" });
    } finally {
      setChecking(false);
    }
  }

  const applied = result?.status === "applied";
  // A real ledger returns its own wording for a code it recognised, so that is
  // preferred over anything written here. See MESSAGES at the foot of the file.
  const message = result
    ? result.status === "applied"
      ? result.message || MESSAGES.applied
      : MESSAGES[result.status]
    : null;
  // Only a genuine "no such code" is an error on the field itself. "Not live
  // yet" is a fact about the site, not a fault in what the visitor typed.
  const invalid = result?.status === "invalid";

  return (
    <form onSubmit={onSubmit} className="mt-7 border-t border-text/15 pt-6">
      <label
        htmlFor={`${id}-code`}
        className="block text-label font-medium uppercase tracking-eyebrow text-text/75"
      >
        Have a pass or code?
      </label>

      <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-3">
        <input
          id={`${id}-code`}
          name="passCode"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            // The old answer stops being true the moment the code changes.
            if (result) setResult(null);
          }}
          disabled={applied}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter code"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? `${id}-message` : undefined}
          className={cn(
            "min-w-0 flex-1 border-0 border-b bg-transparent px-0 py-2.5",
            "text-body uppercase tracking-[0.08em] text-text placeholder:normal-case",
            "placeholder:tracking-normal placeholder:text-text/45",
            "transition-colors duration-300 ease-soft focus:outline-none focus:ring-0",
            "disabled:text-text/60",
            invalid ? "border-terracotta focus:border-terracotta" : "border-text/25 focus:border-primary",
          )}
        />

        {/*
          Quiet by design. The one filled button on this page is the one that
          completes the booking, and a code box competing with it for the eye
          is the generic-ecommerce reflex the brief asks us not to have.
        */}
        <button
          type="submit"
          disabled={checking || applied || code.trim().length === 0}
          className={cn(
            "shrink-0 border border-text/30 px-5 py-2.5",
            "text-label font-medium uppercase tracking-eyebrow text-text",
            "transition-colors duration-300 ease-soft",
            "hover:border-text hover:bg-text/5",
            "disabled:cursor-not-allowed disabled:border-text/15 disabled:text-text/45 disabled:hover:bg-transparent",
          )}
        >
          {checking ? "Checking…" : applied ? "Applied" : "Apply"}
        </button>
      </div>

      {/*
        `role="status"` rather than a bare paragraph: the answer arrives after
        a button press and replaces nothing on screen, so without a live region
        a screen-reader user presses Apply and hears silence.
      */}
      {message ? (
        <p
          id={`${id}-message`}
          role="status"
          className={cn(
            "mt-3 text-fine leading-[1.65]",
            invalid ? "text-text" : "text-text/75",
          )}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

/**
 * One line per outcome. Short, plain, and never technical — see §17 of the
 * brief: a customer should never be shown the inside of the system.
 *
 * `applied` is the only one that would be wrong to write here, because the
 * real ledger returns its own wording with the code it recognised. It is
 * unreachable today; the fallback stands until the ledger exists.
 */
const MESSAGES: Record<PassCodeResult["status"], string> = {
  empty: "Enter a code to apply it.",
  unavailable:
    "Pass codes are not active on this site yet, so nothing has been applied and your total is unchanged.",
  invalid: "We do not recognise that code. Check it and try again.",
  applied: "Code applied to this booking.",
};
