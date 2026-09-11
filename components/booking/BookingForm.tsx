"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { saveBookingDetails, toCartLine, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * Shared field chrome. A hairline under the input rather than a box around it
 * — the same rule the site draws under every link, so a form reads as part of
 * the page instead of as a widget dropped onto it.
 */
const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[0.95rem] text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:border-primary focus:outline-none focus:ring-0";

const LABEL = "block text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75";

type Mode = "guest" | "signin" | "register";

/**
 * The booking step: how many places, and who is coming.
 *
 * The session has already been chosen, so this page never makes anyone
 * rediscover it — the summary beside this form is a reminder, not a listing.
 *
 * Nothing here is asked for that the studio would not need on the day: a name
 * to greet you by, an email and a phone to reach you on, and one optional line
 * for anything they should know. No address, no marketing opt-in, no account
 * creation in the middle of a purchase.
 */
export function BookingForm({ workshop }: { workshop: Workshop }) {
  const router = useRouter();
  const { setLine } = useCart();
  const ids = useId();
  const [mode, setMode] = useState<Mode>("guest");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const max = Math.max(1, workshop.seatsAvailable);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const details = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      notes: get("notes") || undefined,
    };

    // Validated here as well as by the browser: `required` and `type="email"`
    // are the first pass, not the only one, and a visitor who gets past them
    // should see the same message in the same place rather than a native
    // bubble that vanishes.
    const next: Record<string, string> = {};
    if (!details.firstName) next.firstName = "Please tell us your first name.";
    if (!details.lastName) next.lastName = "Please tell us your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) next.email = "Please check this email address.";
    if (details.phone.replace(/[^\d]/g, "").length < 7) next.phone = "Please add a number we can reach you on.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLine(toCartLine(workshop, quantity));
    saveBookingDetails(details);
    router.push("/checkout");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10">
      {/* --- 01 how many ------------------------------------------------- */}
      <fieldset>
        <legend className={LABEL}>Places</legend>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center border border-line">
            <Step
              label="One fewer place"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              &minus;
            </Step>
            <output
              aria-live="polite"
              className="w-14 text-center text-[1.05rem] font-medium tabular-nums text-text"
            >
              {quantity}
            </output>
            <Step
              label="One more place"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
            >
              +
            </Step>
          </div>
          {/* The cap is real: it comes from `seatsAvailable` on the session. */}
          <p className="text-[0.8rem] text-text/75">
            {max} {max === 1 ? "place" : "places"} available
          </p>
        </div>
      </fieldset>

      {/* --- 02 who is coming -------------------------------------------- */}
      <div className="mt-12 border-t border-line pt-10">
        <AccountChoice mode={mode} onChange={setMode} />

        {mode === "guest" ? (
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            <Field
              id={`${ids}-first`}
              name="firstName"
              label="First name"
              autoComplete="given-name"
              error={errors.firstName}
            />
            <Field
              id={`${ids}-last`}
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              error={errors.lastName}
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
            />
            <div className="sm:col-span-2">
              <Field
                id={`${ids}-notes`}
                name="notes"
                label="Anything we should know (optional)"
                autoComplete="off"
              />
            </div>
          </div>
        ) : (
          <AccountsUnavailable />
        )}
      </div>

      <button
        type="submit"
        disabled={mode !== "guest"}
        className={cn(
          "group mt-12 inline-flex w-full items-center justify-center gap-2.5 px-8 py-5",
          "text-[0.72rem] font-medium uppercase leading-none tracking-eyebrow",
          "transition-colors duration-300 ease-soft sm:w-auto",
          mode === "guest"
            ? "bg-primary text-white hover:bg-primary/90"
            : "cursor-not-allowed bg-text/15 text-text/60",
        )}
      >
        Continue to checkout
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </button>
    </form>
  );
}

/**
 * Guest, sign in, or create an account.
 *
 * The client asked for sign-in and sign-up to be offered to guests. There is
 * no authentication in this project — no provider, no session, no user record
 * — so the two account paths are presented and deliberately not wired.
 *
 * They are presented WITHOUT a live password field, and that is a considered
 * decision rather than an omission. A password box that looks real and does
 * nothing invites someone to type a password they use elsewhere, into a form
 * that cannot protect it. Showing the choice, the placement and the language
 * costs nothing; collecting a credential nothing can secure is a hazard. The
 * fields render disabled so the design reads true and the input cannot happen.
 */
function AccountChoice({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options: { value: Mode; label: string }[] = [
    { value: "guest", label: "Continue as guest" },
    { value: "signin", label: "Sign in" },
    { value: "register", label: "Create account" },
  ];

  return (
    <div role="radiogroup" aria-label="How would you like to book?">
      <p className={LABEL}>Your details</p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "text-[0.68rem] font-medium uppercase tracking-eyebrow transition-colors duration-300 ease-soft",
              mode === option.value
                ? "border-b border-primary pb-1.5 text-primary"
                : "border-b border-transparent pb-1.5 text-text/75 hover:text-text",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The honest state behind both account paths. */
function AccountsUnavailable() {
  return (
    <div className="mt-10 border border-line bg-cream/60 p-7 md:p-8">
      <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
        Accounts are not open yet
      </p>
      <p className="mt-4 max-w-[34rem] text-[0.9rem] leading-[1.8] text-text/80">
        Maison Palettia does not have accounts at the moment, so there is nothing to sign in to
        and nothing to create. Booking as a guest takes the same details and works today.
      </p>

      {/* Disabled on purpose — see the note on <AccountChoice>. */}
      <div className="mt-8 grid max-w-[28rem] grid-cols-1 gap-6" aria-hidden>
        <div>
          <span className={LABEL}>Email</span>
          <input disabled className={cn(FIELD, "cursor-not-allowed opacity-50")} />
        </div>
        <div>
          <span className={LABEL}>Password</span>
          <input disabled type="password" className={cn(FIELD, "cursor-not-allowed opacity-50")} />
        </div>
      </div>
    </div>
  );
}

function Step({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center text-[1.1rem] leading-none transition-colors duration-300 ease-soft",
        disabled ? "cursor-not-allowed text-text/45" : "text-text hover:bg-cream",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
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
