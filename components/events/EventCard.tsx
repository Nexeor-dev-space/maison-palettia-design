"use client";

import Link from "next/link";

import { useSessionPassed } from "@/components/booking/SessionClock";
import { LevelChip, TERM, TICKET_GROUNDS, type TicketGround } from "@/components/events/WorkshopTypeCards";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  hasSessionPassed,
  isFullyBooked,
  isScarce,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

import styles from "./Ticket.module.css";

/**
 * EventCard — styled to match the reference ticket design:
 * - Left side: Title, category badge, and subtitle/venue.
 * - Vertical divider: dashed perforation line between body and stub.
 * - Right side: Next available date, time, price, and circular arrow button.
 * - Rounded corners and decorative notched edges from Ticket.module.css.
 */
export function EventCard({
  workshop,
  index = 0,
  renderedAt,
  sizes,
  className,
  ground,
  perPersonLabel = "per person",
}: {
  workshop: Workshop;
  index?: number;
  renderedAt?: number;
  sizes?: string;
  className?: string;
  ground?: TicketGround;
  perPersonLabel?: string;
}) {
  const { start } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);
  const scarce = isScarce(workshop);
  const passed = useSessionPassed(
    workshop.startsAt,
    renderedAt ? Date.parse(workshop.startsAt) <= renderedAt : hasSessionPassed(workshop),
  );

  const cardGround = ground ?? TICKET_GROUNDS[index % TICKET_GROUNDS.length];
  const badge = workshop.workshopType?.level || workshop.category;

  return (
    <Link
      href={workshopHref(workshop)}
      data-ground={cardGround}
      className={cn(
        styles.ticket,
        styles.theme,
        "group press-in w-full overflow-hidden",
        (closed || passed) && "opacity-75",
        className,
      )}
    >
      {/* Left side: title, category badge, and location/details */}
      <span className={cn(styles.body, "relative flex flex-col justify-between p-6 md:p-7 min-w-0")}>
        <div>
          <span className="heading-script relative block pb-[0.2em] text-script-panel">
            <ScriptTitle>{workshop.title}</ScriptTitle>
          </span>
          <div className="relative mt-1 flex flex-wrap items-center gap-2">
            {badge ? <LevelChip>{badge}</LevelChip> : null}
            {closed || scarce ? (
              <LevelChip tone="lilac">{spotsLabel(workshop)}</LevelChip>
            ) : passed ? (
              <LevelChip tone="lilac">Date passed</LevelChip>
            ) : null}
          </div>
        </div>

        {workshop.venue ? (
          <span className="relative mt-3 block text-fine text-text/75">
            {formatVenueLine(workshop.venue)}
          </span>
        ) : workshop.workshopType?.name ? (
          <span className="relative mt-3 block text-fine text-text/75">
            {workshop.workshopType.name}
          </span>
        ) : null}
      </span>

      {/* Vertical divider perforation and right side: date, time, price, arrow */}
      <span className={cn(styles.stub, "px-6 py-5 md:px-7 md:py-6")}>
        <span className="min-w-0">
          <span className={TERM}>Next date</span>
          <span className="mt-1.5 block text-body font-medium leading-snug">
            {formatSessionDate(workshop.startsAt)}
            <span className="block">{start}</span>
            <span className="mt-1 block text-fine font-normal text-text/75">
              {formatPrice(workshop.price)} {perPersonLabel}
            </span>
          </span>
        </span>

        {/* Circular arrow button navigating to event details */}
        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 self-end place-items-center rounded-[58%_42%_55%_45%/50%_58%_42%_50%]",
            "bg-primary text-on-primary rotate-[-6deg] md:mt-4",
            "transition-transform duration-500 ease-editorial",
            "motion-safe:group-hover:translate-x-1 motion-safe:group-hover:rotate-[2deg]",
          )}
        >
          <span className="text-lead leading-none">&#8594;</span>
        </span>
      </span>
    </Link>
  );
}
