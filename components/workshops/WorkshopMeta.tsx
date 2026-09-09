import {
  availabilityLabel,
  formatDuration,
  formatPrice,
  formatWorkshopDate,
  formatWorkshopTime,
  isFullyBooked,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * The facts about a workshop, in the two densities the homepage needs.
 *
 * Both live here so the wording of a duration or a price is decided once and
 * the listing page can reuse them without re-deriving anything.
 *
 * Opacity is not used to build the hierarchy below a certain size: a 10px
 * label at 40% of charcoal is unreadable long before it is subtle. Size and
 * weight do that work instead, and nothing drops below `text/70`, which is
 * where the palette stops clearing 4.5:1 on the warm off-white ground.
 */

/** A single fact in the feature's wall label. */
function Spec({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/70">{term}</dt>
      <dd className="mt-2 text-[0.8rem] font-medium uppercase tracking-[0.09em] text-text">
        {children}
      </dd>
    </div>
  );
}

/**
 * The feature's specification, set like the label beside a work in a gallery:
 * four terms, each with its own heading, wrapping two-up in a narrow column.
 */
export function WorkshopSpec({ workshop, className }: WorkshopMetaProps) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 lg:grid-cols-2", className)}>
      <Spec term="Date">
        <time dateTime={workshop.startsAt}>{formatWorkshopDate(workshop.startsAt)}</time>
      </Spec>
      <Spec term="Time">{formatWorkshopTime(workshop.startsAt)}</Spec>
      <Spec term="Duration">{formatDuration(workshop.durationMinutes)}</Spec>
      <Spec term="Price">{formatPrice(workshop.price)}</Spec>
    </dl>
  );
}

interface WorkshopMetaProps {
  workshop: Workshop;
  className?: string;
}

/** The same facts on one line, for the supporting entries. */
export function WorkshopMetaLine({ workshop, className }: WorkshopMetaProps) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/70",
        className,
      )}
    >
      <time dateTime={workshop.startsAt}>
        {formatWorkshopDate(workshop.startsAt)}, {formatWorkshopTime(workshop.startsAt)}
      </time>
      <Separator />
      <span>{formatDuration(workshop.durationMinutes)}</span>
      <Separator />
      <span>{formatPrice(workshop.price)}</span>
    </p>
  );
}

function Separator() {
  return (
    <span aria-hidden className="text-text/35">
      &middot;
    </span>
  );
}

/**
 * Availability, but only when there is something worth saying — a comfortably
 * open session shows nothing at all, which is what keeps the scarce ones
 * legible.
 *
 * A closed session gets the strongest treatment on the page, because the one
 * unacceptable outcome here is a visitor believing they can book something
 * they cannot. Terracotta marks the low-seat case as a dot rather than as
 * coloured type: at this size the fill would sit at 3.1:1 against the ground.
 */
export function AvailabilityMarker({ workshop, className }: WorkshopMetaProps) {
  const label = availabilityLabel(workshop);
  if (!label) return null;

  const closed = isFullyBooked(workshop);
  const waitlist = !closed && workshop.status === "waitlist";

  if (closed || waitlist) {
    return (
      <p
        className={cn(
          // `flex w-fit`, not `inline-flex`: an inline-level box would sit on
          // the same line as the action below it and ignore its own margin.
          "flex w-fit items-center rounded-pill px-3.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-eyebrow text-text",
          closed ? "bg-lavender/50" : "ring-1 ring-inset ring-line",
          className,
        )}
      >
        {label}
      </p>
    );
  }

  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text",
        className,
      )}
    >
      <span aria-hidden className="h-1 w-1 shrink-0 rounded-pill bg-terracotta" />
      {label}
    </p>
  );
}
