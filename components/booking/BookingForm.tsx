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
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-body text-text " +
  "placeholder:text-text/40 transition-colors duration-300 ease-soft " +
  "focus:border-primary focus:outline-none focus:ring-0";

const LABEL = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

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
              className="w-14 text-center text-lead font-medium tabular-nums text-text"
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
          <p className="text-fine text-text/75">
            {max} {max === 1 ? "place" : "places"} available
          </p>
        </div>
      </fieldset>

      {/* --- 02 who is coming -------------------------------------------- */}
      {/*
        No account, and no offer of one.
        ---------------------------------------------------------------
        This used to open with a three-way choice — guest, sign in, create
        account — where two of the three led to a panel explaining that
        accounts do not exist. The client has asked for customer-facing
        sign-in and sign-up to come out entirely, and it is the right call
        independently: a booking is one Saturday morning at a mall, and an
        account gate in front of it is friction protecting nothing. Everyone
        books as a guest, which is what everyone was doing anyway.

        There is no authentication anywhere else in this project to preserve —
        no routes, no middleware, no session handling — so nothing here is
        being worked around. Checked, not assumed.
      */}
      <div className="mt-12 border-t border-line pt-10">
        <h2 className={LABEL}>Who is coming</h2>

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
      </div>

      <button
        type="submit"
        className={cn(
          "group mt-12 inline-flex w-full items-center justify-center gap-2.5 px-8 py-5",
          "text-action font-medium uppercase leading-none tracking-eyebrow",
          "bg-primary text-on-dark transition-colors duration-300 ease-soft",
          "hover:bg-primary/90 sm:w-auto",
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
        "flex h-12 w-12 items-center justify-center text-lead leading-none transition-colors duration-300 ease-soft",
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
        <p id={`${id}-error`} className="mt-2 text-fine text-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
