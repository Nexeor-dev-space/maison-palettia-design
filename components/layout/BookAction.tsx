import Link from "next/link";

import { PRIMARY_CTA } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BookActionProps {
  /** Closes the mobile overlay when the action is used inside it. */
  onNavigate?: () => void;
  /** "bar" is the header's inline action; "panel" is the larger mobile one. */
  size?: "bar" | "panel";
  className?: string;
}

/**
 * The booking action, set as an editorial line rather than as a button.
 *
 * It has to be the clearest thing in the bar without being the loudest. A
 * filled chip would do the first and fail the second — on a page whose whole
 * language is warm neutrals and photography, a solid block of colour in the
 * corner reads as a shop. So the weight comes from three quiet things
 * instead: Light Sage against the charcoal ground where every other link is
 * plain white, a rule that is already drawn rather than waiting for a hover,
 * and an arrow that says the action leads somewhere.
 *
 * Sage measures 9.07:1 on the charcoal bar, so the colour is doing the work
 * of distinguishing it without costing any legibility.
 */
export function BookAction({ onNavigate, size = "bar", className }: BookActionProps) {
  return (
    <Link
      href={PRIMARY_CTA.href}
      onClick={onNavigate}
      className={cn(
        "group inline-flex items-center gap-2.5 font-medium uppercase text-sage",
        "transition-colors duration-300 ease-soft hover:text-white",
        size === "bar" ? "text-xs tracking-eyebrow" : "text-sm tracking-eyebrow",
        className,
      )}
    >
      <span className="border-b border-sage/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-white">
        {PRIMARY_CTA.label}
      </span>
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
