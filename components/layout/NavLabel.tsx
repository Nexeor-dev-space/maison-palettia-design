import { cn } from "@/lib/utils";

/**
 * A navigation label and the rule under it.
 *
 * The rule is an element rather than an underline, which is what lets it be
 * drawn: it scales from its left edge on hover and stays out at full width
 * while the page is the current one, so the active state and the hover state
 * are the same mark at two lengths rather than two different ideas.
 *
 * It sits on its own line below the text rather than on the text's baseline,
 * so a descender never crosses it — and `pb` on the label keeps that line far
 * enough down to clear one.
 *
 * Reduced motion is handled globally: the site's stylesheet cuts every
 * transition to almost nothing, so the rule is simply there or not.
 */
export function NavLabel({ children, isActive }: { children: string; isActive: boolean }) {
  return (
    <span className="relative block pb-1.5">
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px origin-left bg-sage",
          "transition-transform duration-[400ms] ease-editorial",
          isActive ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
        )}
      />
    </span>
  );
}
