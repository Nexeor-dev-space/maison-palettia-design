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
          /*
          Follows the bar's ink rather than holding Light Sage.

          Sage was right while the bar was always charcoal. It is 1.3:1 on the
          white ground the bar now takes on scroll — not faint, gone — and an
          active-state rule that disappears in one of the two states is not an
          active state. `bg-current` makes it White Rock over the hero and
          Charcoal Slate on white, so it is always the same weight as the label
          it underlines.
        */
        "absolute inset-x-0 bottom-0 h-px origin-left bg-current",
          "transition-transform duration-[400ms] ease-editorial",
          isActive ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
        )}
      />
    </span>
  );
}
