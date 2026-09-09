import { cn } from "@/lib/utils";

interface WorkshopActionProps {
  label: string;
  /** The feature carries the section's primary action and takes Deep Lilac. */
  tone?: "primary" | "quiet";
  className?: string;
}

/**
 * The visible "Explore workshop &rarr;" affordance.
 *
 * Deliberately not a link. Every workshop has exactly one anchor — its title,
 * stretched across the whole entry — so a second anchor to the same page would
 * put each workshop in the tab order twice and read out twice in a list of
 * links, for nothing. This is the affordance that says the entry is clickable;
 * the title is the thing that is.
 *
 * It reacts to `group-focus-within` as well as `group-hover` so a keyboard
 * visitor sees the same response as a pointer one.
 */
export function WorkshopAction({ label, tone = "quiet", className }: WorkshopActionProps) {
  const primary = tone === "primary";

  return (
    <span
      aria-hidden
      className={cn(
        "flex w-fit items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-eyebrow",
        primary ? "text-primary" : "text-text",
        className,
      )}
    >
      <span
        className={cn(
          "border-b pb-1.5 transition-colors duration-300 ease-soft",
          primary
            ? "border-primary/40 group-hover:border-primary group-focus-within:border-primary"
            : "border-text/25 group-hover:border-text/70 group-focus-within:border-text/70",
        )}
      >
        {label}
      </span>
      <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1">
        &#8594;
      </span>
    </span>
  );
}
