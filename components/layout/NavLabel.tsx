import { cn } from "@/lib/utils";

/**
 * A navigation label, and the line that draws itself under it.
 *
 * A RULE, NOT A SQUIGGLE — the client's note is exact: "The movement of the
 * underline is good! but not the wavy lines." So the movement is untouched and
 * the wave is gone. What was a loose pen line, drawn once at 30rem and cropped
 * to each label, is a hairline of the label's own width; the wipe that reveals
 * it is the same one, at the same length and easing, and nothing else about
 * the component changed. `inline-block` so the line is the word's width even
 * where the link is a full-width row, as in the mobile menu.
 *
 * HOW IT ARRIVES. A wipe from the left edge, the direction a pen travels, on
 * hover; it stays drawn while the page is the current one, so hover and active
 * are the same mark rather than two ideas.
 *
 * `pb-1.5` is unchanged and still load-bearing: the search trigger reserves
 * the same 6px to sit on this label's baseline (see <SearchTrigger>). The line
 * hangs in that space, absolutely positioned, so the bar's layout does not
 * move.
 *
 * `currentColor`, so it is White Rock over a dark hero and Charcoal Slate on
 * the white bar — always the weight of the word it underlines. Reduced motion
 * is handled globally: the wipe simply completes at once.
 */
export function NavLabel({ children, isActive }: { children: string; isActive: boolean }) {
  return (
    <span className="relative inline-block pb-1.5">
      {children}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-full -mt-2 block h-2.5 w-full overflow-hidden",
          "transition-[clip-path] duration-[550ms] ease-editorial",
          isActive
            ? "[clip-path:inset(0_0_0_0)]"
            : "[clip-path:inset(0_100%_0_0)] group-hover/nav:[clip-path:inset(0_0_0_0)] group-focus-visible/nav:[clip-path:inset(0_0_0_0)]",
        )}
      >
        {/* Sat 4px into the 10px box the wipe crops, which is where the pen
            line used to cross it — so the underline sits exactly where it did,
            straight. */}
        <span className="mt-1 block h-px w-full bg-current" />
      </span>
    </span>
  );
}
