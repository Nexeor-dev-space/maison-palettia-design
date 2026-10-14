import { CalendarCheck, DoorOpen } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Walk-in or scheduled, as an icon.
 *
 * AN OPEN DOOR for walk-in — come on in — and A CALENDAR WITH A TICK for a
 * session booked online. It used to be a hollow ring and a filled dot, and
 * the client pointed out the ring reads as a zero: set before "NO BOOKING" in
 * tracked capitals it said "O NO BOOKING". An icon cannot be mistaken for a
 * letter, and it says what the mode means instead of asking a visitor to
 * learn a code. Used wherever an activity appears
 * (the hero, the homepage groups, the listing, the detail page), so the
 * difference is learned once and read everywhere.
 *
 * ALWAYS BESIDE A WORD. The mark is decorative (`aria-hidden`) and every use
 * puts "Walk-in" or "Scheduled" next to it: shape and colour carry nothing a
 * reader who cannot see them would miss.
 *
 * `tone` picks the ink from the ground, because on this palette the ink is
 * never a free choice: Charcoal Slate on light grounds, White Rock on dark
 * grounds and photographs, and the near-white `surface` on Deep Lilac.
 */
export function ModeMark({
  mode,
  tone = "light",
  className,
}: {
  mode: "diy" | "scheduled";
  tone?: "light" | "dark" | "lilac";
  className?: string;
}) {
  const ink = tone === "dark" ? "text-cream" : tone === "lilac" ? "text-surface" : "text-current";
  const Icon = mode === "diy" ? DoorOpen : CalendarCheck;

  return (
    <Icon
      aria-hidden
      strokeWidth={2}
      className={cn(
        // Sized by the text it stands beside, a touch larger than a capital.
        "inline-block size-[1.15em] shrink-0",
        // Pressed on when the card it labels is hovered: the smallest member
        // of the tactile system, and the one that repeats most often.
        "transition-transform duration-[var(--duration-press)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "motion-safe:group-hover:scale-110 motion-safe:group-focus-within:scale-110",
        ink,
        className,
      )}
    />
  );
}
