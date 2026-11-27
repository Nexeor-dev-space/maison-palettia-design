import Link from "next/link";

import { GENERIC_BOOKING_POLICY_LINE, policyHref, type EnquiryProgramme } from "@/lib/privateEvents";
import { cn } from "@/lib/utils";

/**
 * ONE LINE NAMING THE TERMS A BOOKING FOLLOWS — under the enquiry button on
 * a programme's page and under Send on the enquiry form.
 *
 *   · the programme links a policy → "Bookings follow our {title} →"
 *   · no policy, but a note        → the note, unlinked ("Quoted under a
 *                                     separate written agreement")
 *   · neither, or no programme     → the generic line, linking /policies
 *
 * Plain markup and no hooks, so the server page and the client form both
 * render it. A line of small type rather than a callout: it is a pointer to
 * the terms, not the terms, and it sits under the one action on the band.
 *
 * `newTab` for the form, where following the link must not cost somebody
 * the answers they have typed; the programme page opens it in place.
 * `tone="onPrimary"` for the Deep Lilac band (`on-primary` is the light ink
 * that clears it at small sizes; plain surface does not).
 */
export function BookingPolicyLine({
  programme,
  newTab = false,
  tone = "default",
  className,
  id,
}: {
  programme?: Pick<EnquiryProgramme, "bookingPolicy" | "bookingPolicyNote"> | null;
  newTab?: boolean;
  tone?: "default" | "onPrimary";
  className?: string;
  id?: string;
}) {
  const onPrimary = tone === "onPrimary";
  const ink = onPrimary ? "text-on-primary" : "text-text/80";
  const rule = onPrimary
    ? "border-on-primary/60 hover:border-on-primary"
    : "border-terracotta/50 hover:border-terracotta";
  const arrow = onPrimary ? "text-on-primary" : "text-terracotta";
  const linkProps = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

  const link = (href: string, words: string) => (
    <Link
      href={href}
      {...linkProps}
      className={cn("group whitespace-normal border-b pb-0.5 font-medium transition-colors duration-300 ease-soft", rule)}
    >
      {words}
      {newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
      <span
        aria-hidden
        className={cn(
          "ml-1.5 inline-block transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1",
          arrow,
        )}
      >
        &#8594;
      </span>
    </Link>
  );

  const policy = programme?.bookingPolicy;
  const note = programme?.bookingPolicyNote;

  return (
    <p id={id} className={cn("text-fine leading-[1.7]", ink, className)}>
      {policy ? (
        <>Bookings follow our {link(policyHref(policy), policy.title)}</>
      ) : note ? (
        note
      ) : (
        <>
          {GENERIC_BOOKING_POLICY_LINE.lead} {link(GENERIC_BOOKING_POLICY_LINE.href, GENERIC_BOOKING_POLICY_LINE.link)}
        </>
      )}
    </p>
  );
}
