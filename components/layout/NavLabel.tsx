import { PaintStroke } from "@/components/layout/PaintStroke";
import { cn } from "@/lib/utils";

/**
 * A navigation label, and the line that draws itself under it.
 *
 * A RULE, NOT A SQUIGGLE — the client's note was exact: "The movement of the
 * underline is good! but not the wavy lines." So the movement stayed and the
 * wave went, and this is a hairline of the label's own width.
 *
 * HOW IT ARRIVES, AND HOW IT LEAVES. It used to be one gesture played
 * backwards: a clip wiping in from the left on hover, and the same clip
 * unwiping to the left on the way out — which reads as the mark being undone
 * rather than as the pen finishing. It now travels. The rule scales from its
 * left edge on the way in and from its right edge on the way out, so it
 * arrives under the word in the direction a hand writes and leaves in the same
 * direction rather than reversing into itself. Nothing else moves: no lift, no
 * colour change, no second signal. That restraint is the point — the client's
 * earlier note was that uncontrolled movement "doesn't look good or smooth".
 *
 * 380ms rather than 550: the wipe was slow enough to still be arriving after
 * the eye had moved on. This is quick without snapping, and it is the one
 * hover language the bar, the mobile menu and the Experiences menu all share.
 *
 * `scale` rather than `clip-path` is also why it is smooth: a transform is
 * composited, where clipping re-rasterises the box on every frame.
 *
 * Tailwind v4 wraps `hover:` in `(hover: hover)`, so a touch device never gets
 * a rule stuck under the last thing tapped; focus draws it for a keyboard.
 *
 * `pb-1.5` is unchanged and still load-bearing: the search trigger reserves
 * the same 6px to sit on this label's baseline (see <SearchTrigger>). The line
 * hangs in that space, absolutely positioned, so the bar's layout does not
 * move.
 *
 * `currentColor`, so it is White Rock over a dark hero and Charcoal Slate on
 * the white bar — always the weight of the word it underlines.
 */
export function NavLabel({
  children,
  isActive,
  paint = null,
}: {
  children: string;
  isActive: boolean;
  /**
   * The swatch behind the word, or null for none.
   *
   * Null is not an oversight and not a default anyone should "fix": on the
   * routes where the bar sits over a dark hero the ink goes light, and a pale
   * swatch behind pale type is unreadable. <HeaderBar> knows which case it is
   * in and passes null there, and the hairline below carries the hover on its
   * own — which is exactly what this component did before the paint existed.
   */
  paint?: string | null;
}) {
  return (
    <span className="relative inline-block pb-1.5">
      {/*
        Behind the word, and behind it in both senses: `-z-10` in the
        stylesheet, and drawn before the text so the swatch can never be the
        thing a screen reader reaches first. See <PaintStroke>.
      */}
      <PaintStroke
        paint={paint}
        isCurrent={isActive}
        /* The 6px this label reserves below the word for its rule. Without
           it the stroke is measured against the padded box and the bar's
           lines come out fatter than the footer's. */
        seat="0.375rem"
      />
      {children}
      <span
        aria-hidden
        className={cn(
          // -mt-1 puts the rule exactly where the clipped version sat: 4px
          // under the text box, on the baseline the search trigger aligns to.
          "pointer-events-none absolute left-0 top-full -mt-1 block h-px w-full bg-current",
          /*
            THE RULE IS THE FALLBACK NOW, not the whole treatment.

            Where a swatch is drawn the rule would be a second answer to the
            same question — a painted underline with a hairline under it reads
            as two devices arguing. Where no swatch is drawn (the dark-hero
            bar) it is still the only thing marking hover and current, so it
            cannot simply be deleted.
          */
          paint ? "opacity-0" : null,
          "transition-transform duration-[380ms] ease-editorial motion-reduce:transition-none",
          isActive
            ? "origin-left scale-x-100"
            : cn(
                // At rest it is collapsed against its right edge, so the next
                // growth starts from the left and the last retreat ended right.
                "origin-right scale-x-0",
                "group-hover/nav:origin-left group-hover/nav:scale-x-100",
                "group-focus-visible/nav:origin-left group-focus-visible/nav:scale-x-100",
              ),
        )}
      />
    </span>
  );
}
