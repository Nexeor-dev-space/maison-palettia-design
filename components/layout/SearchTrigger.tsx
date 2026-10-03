import { Search } from "lucide-react";
import type { Ref } from "react";

import { NavLabel } from "@/components/layout/NavLabel";

interface SearchTriggerProps {
  ref: Ref<HTMLButtonElement>;
  isOpen: boolean;
  onClick: () => void;
  panelId: string;
  /** The swatch behind the word. Null over a dark hero. */
  paint?: string | null;
}

/**
 * The one button that opens the search overlay, at every width.
 *
 * A single trigger rather than two — one icon-only on mobile, one
 * icon-and-label on desktop — because the two would need to stay in sync by
 * hand: same open state, same `aria-controls`, same click handler, forked for
 * no reason the reader benefits from. Instead the label is always in the
 * markup and only its visibility changes: `sr-only` under `lg` keeps it out
 * of the layout but in the accessibility tree, so the icon is never the only
 * thing announcing what the control does, and `lg:not-sr-only` brings it back
 * on screen once the bar has the width in the brief's own desktop spec.
 *
 * Deliberately not `aria-label`-only. An icon button with a name that exists
 * solely in an attribute is one accessible-name bug away from silence; a real
 * text node that is merely hidden by CSS cannot go missing that way.
 *
 * Takes `ref` as a plain prop — React 19 forwards it to the DOM node without
 * `forwardRef`. <SearchPanel> needs it to exclude this button from its own
 * outside-click check; see the note there on why a click that is meant to
 * close the panel would otherwise reopen it on the same gesture.
 */
export function SearchTrigger({ ref, isOpen, onClick, panelId, paint = null }: SearchTriggerProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={
        /*
          The row's one weight, Medium, and not the Regular it used to set.

          The note here argued that weight in this row meant something and that
          Search, being a utility rather than a destination, should sit below
          the links beside it. The client's read of the finished bar was that
          the labels were simply in different weights — see <HeaderBar>, where
          the same ranking was undone for the same reason. Search keeps the one
          mark no other entry has, which is the icon.
        */
        "group/nav relative isolate inline-flex size-11 items-center justify-center gap-2 whitespace-nowrap text-body " +
        "font-medium tracking-[0.015em] text-current transition-colors duration-300 ease-soft " +
        // Below `lg` the label is `sr-only`, so the button is an icon in a
        // fixed 44px box — the touch target the icon alone could not give it.
        // From `lg` the label is visible and the row sits in an 80–104px bar,
        // so the box is let go and the button is sized by its own content.
        //
        // From `lg` the label sits in <NavLabel>, like every other entry in
        // the row: it reserves the same 6px under the word and draws the same
        // rule on hover. This button used to reserve that space itself and
        // draw nothing — the one entry in the bar with no hover mark at all.
        "lg:size-auto lg:justify-start"
      }
    >
      {/*
        THE ICON RESERVES WHAT THE LABEL RESERVES. <NavLabel> keeps 6px under
        the word for the rule that draws on hover, so from `lg` the label's
        flex item is the word plus six empty pixels — and `items-center` was
        centring the icon against that whole box, which sat it three pixels
        below the word it belongs to. That is the misalignment: not the
        baseline, which already matched the rest of the row, but the icon
        hanging low against every label beside it.

        Six pixels of the same reserve under the icon makes both items carry
        the same dead space, so centring them centres the word and the glyph
        on one line. Below `lg` the label is `sr-only` and the button is a
        plain 44px touch box, where there is nothing to align to and the
        margin would only push the icon off-centre.
      */}
      {/*
        A PAINT BLOT BEHIND THE GLYPH — MOBILE ONLY.

        It was a `coral` cut-out in Soft Lavender, and the client asked for it
        gone and for the <MoreSheet> cards' treatment instead. That is the
        better object anyway: the doodle set is ABSTRACT, so a cut-out behind
        a magnifier reads as two unrelated marks overlapping, where a blot
        reads as paint the glyph is sitting on.

        THE SAME HAND AS THE SHEET'S CARDS — one closed path, lumps in
        different places, no mirror symmetry — drawn at 1:1 here rather than
        the cards' 4:3, so nothing is stretched.

        DEEP LILAC, AND THAT CHANGES THE GLYPH. Measured on the bar's Light
        Sage: Deep Lilac is 3.83:1, over the 3:1 a graphical mark owes, while
        Soft Lavender was 1.40 and terracotta 2.36 — neither would have been a
        shape, only a stain. But Charcoal on Deep Lilac is 2.37:1, so the
        magnifier cannot stay `text-current` over it; below `lg` it takes
        `on-primary` (4.90:1) and from `lg`, where the blot is hidden and the
        label returns, it goes back to the bar's own ink.

        `lg:hidden` for the reason the cut-out had: from `lg` the label and
        its paint swatch return and a mark here would sit under the word.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-9 -translate-x-1/2 -translate-y-1/2 lg:hidden"
      >
        <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
          <path
            className="fill-primary"
            d="M3.4 17.6C2.2 10 8.6 3.4 16.2 2.6c7-.8 15.3-1.4 19.2 3.6 3.6 4.6 2.4 12.2 1.2 18-1.2 5.8-4.4 12.6-10.6 14.2-6.4 1.6-14.6-.8-18.6-5.8C3.6 28 4.4 23.2 3.4 17.6Z"
          />
        </svg>
      </span>
      <Search size={18} aria-hidden className="shrink-0 text-on-primary lg:mb-1.5 lg:text-current" />
      <span className="sr-only lg:not-sr-only">
        {/* Drawn while the panel is open as well as on hover, so the bar shows
            where you are the way a current page does. */}
        <NavLabel isActive={isOpen} paint={paint}>Search</NavLabel>
      </span>
    </button>
  );
}
