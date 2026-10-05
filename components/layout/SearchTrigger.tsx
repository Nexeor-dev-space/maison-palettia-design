import { Search } from "lucide-react";

import styles from "@/components/layout/SearchTrigger.module.css";
import type { Ref } from "react";


interface SearchTriggerProps {
  ref: Ref<HTMLButtonElement>;
  isOpen: boolean;
  onClick: () => void;
  panelId: string;
  /**
   * The swatch that used to sit behind the word.
   *
   * KEPT ON THE INTERFACE AND NO LONGER READ. The word is gone, so there is
   * nothing for a swatch to sit behind. <HeaderBar> still passes it and its
   * own note explains why the value is what it is, which is worth keeping
   * next to the decision — remove it there and here together.
   */
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
export function SearchTrigger({ ref, isOpen, onClick, panelId }: SearchTriggerProps) {
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
        /* The utility rung's size, the same one About and Contact take, so the
           three controls beside the mark read as one group. See the note on
           the two rungs in <NavLabel>. Below `lg` the label is `sr-only` and
           this is a round icon button, so the size reaches nothing there. */
        /*
          ==================================================================
          A BLOT ON A PHONE, A FIELD FROM `lg`
          ==================================================================

          The bar's right-hand track is one 44px control against a nav of
          three words on the other side of the mark, and from 1280 up there is
          200px of empty green between them — the client's note. A field uses
          it and says what the control does without a label beside it, which
          is what an icon alone could never do.

          It is a BUTTON STYLED AS A FIELD, not an input. <SearchPanel> owns
          the query, the results and the focus trap; a second input up here
          would be a second place to type the same thing, and the two would
          have to be kept in step. This opens the panel, which puts the cursor
          in the real field — the pattern a reader already knows from every
          other site that does this.

          Below `lg` it is unchanged: a 44px round target with the paint blot
          behind the glyph, because a phone's bar has no width to give.
        */
        "group/nav relative isolate inline-flex size-11 items-center justify-center rounded-full " +
        styles.blot + " lg:h-11 lg:w-[15rem] lg:justify-start lg:gap-2.5 lg:pl-5 lg:pr-5 xl:w-[17rem] " +
        "lg:bg-surface/70 lg:shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] " +
        "lg:hover:bg-surface lg:focus-visible:bg-surface " +
        "text-current transition-colors duration-300 ease-soft " +
        /*
          THE 44px BOX AT EVERY WIDTH. It used to be released at `lg`, where
          the label arrived to give the button its size; with the label gone
          there is nothing left but an 18px glyph, and the box is what makes
          that a target rather than a speck.

          THE QUIET WASH HAS GONE WITH THE `lg:hidden` ON THE BLOT. It was
          Charcoal at 6% behind the glyph, and it existed only because the
          paint blot below was mobile-only, leaving the desktop button with no
          mark of its own. The blot is drawn at every width now, at the
          client's ask, so a grey wash under it would be a faint ring around a
          lilac shape — two grounds for one control. The blot carries the
          state instead: see the swell on it below.
        */
        ""
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

        EVERY WIDTH NOW, at the client's ask. It was `lg:hidden`, because the
        desktop bar still showed the word "Search" and a blot would have sat
        under it; the word has since gone from every width, so the glyph stood
        alone on the bar with nothing behind it while the phone's had its
        paint. The two are one control again.

        IT SWELLS RATHER THAN THE BUTTON WASHING. A pointer needs an answer
        and the phone's blot never needed one, so hover, focus and the open
        panel scale the paint a little instead of putting a second ground
        behind it. That is this site's own hover language — the nav's swatches
        do exactly this under their words — and it costs no colour.
      */}
      <span
        aria-hidden
        className={
          /* The field from `lg` has a ground of its own, so the blot is the
             phone's device again — two grounds on one control is what the
             quiet wash was removed for. */
          "pointer-events-none absolute left-1/2 top-1/2 -z-10 size-9 -translate-x-1/2 -translate-y-1/2 lg:hidden " +
          "transition-transform duration-300 ease-soft motion-reduce:transition-none " +
          (isOpen
            ? "scale-110"
            : "group-hover/nav:scale-110 group-focus-visible/nav:scale-110")
        }
      >
        <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
          <path
            className="fill-primary"
            d="M3.4 17.6C2.2 10 8.6 3.4 16.2 2.6c7-.8 15.3-1.4 19.2 3.6 3.6 4.6 2.4 12.2 1.2 18-1.2 5.8-4.4 12.6-10.6 14.2-6.4 1.6-14.6-.8-18.6-5.8C3.6 28 4.4 23.2 3.4 17.6Z"
          />
        </svg>
      </span>
      {/*
        `on-primary` AT EVERY WIDTH, because the blot is at every width: the
        near-white is 4.90:1 on Deep Lilac, where the bar's own Charcoal would
        be 2.37 and under the 3:1 a graphical mark owes.

        AND NO `lg:mb-1.5`. That reserve matched the 6px <NavLabel> keeps under
        a word, so the glyph and the label beside it centred on one line. There
        is no label at any width now, so the margin was pushing the glyph three
        pixels below the middle of its own 44px box and off the centre of the
        blot behind it.
      */}
      {/* `on-primary` over the phone's lilac blot (4.90:1); the bar's own
          Charcoal over the field, where the ground is the page's surface and
          the near-white would be 1.1:1. */}
      <Search size={18} aria-hidden className="shrink-0 text-on-primary lg:text-text" />
      {/*
        THE NAME IS REAL TEXT AT EVERY WIDTH, which is the point the note at
        the top of this file makes: a control whose name exists only in an
        attribute cannot be spoken by anyone driving the page by voice, and
        "click Search" is how that visitor presses this button. On a phone it
        is simply not drawn; from `lg` the field shows it as its placeholder.

        `text-text/60` is the placeholder's register — present, plainly not
        typed text — and it is 5.6:1 on the field's ground, over the 4.5 a
        label owes even though a placeholder arguably owes less.
      */}
      <span className="sr-only lg:not-sr-only lg:truncate lg:text-body lg:font-normal lg:tracking-normal lg:text-text/60">
        Search experiences
      </span>
    </button>
  );
}
