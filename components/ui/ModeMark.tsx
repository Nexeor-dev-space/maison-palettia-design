import { cn } from "@/lib/utils";

/**
 * Walk-in or scheduled, as a shape.
 *
 * A ring for walk-in DIY — open, come when you like — and a filled dot for a
 * scheduled session, a fixed point in time. Used wherever an activity appears
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
  const ink =
    tone === "dark"
      ? mode === "diy"
        ? "border-cream"
        : "bg-cream"
      : tone === "lilac"
        ? mode === "diy"
          ? "border-surface"
          : "bg-surface"
        : mode === "diy"
          ? "border-text"
          : "bg-text";

  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-pill",
        mode === "diy" ? "border-[1.5px]" : "",
        // Pressed on when the card it labels is hovered: the smallest member
        // of the tactile system, and the one that repeats most often.
        "transition-transform duration-[var(--duration-press)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "motion-safe:group-hover:scale-125 motion-safe:group-focus-within:scale-125",
        ink,
        className,
      )}
    />
  );
}
