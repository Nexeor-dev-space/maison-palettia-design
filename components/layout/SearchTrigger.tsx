import { Search } from "lucide-react";
import type { Ref } from "react";

interface SearchTriggerProps {
  ref: Ref<HTMLButtonElement>;
  isOpen: boolean;
  onClick: () => void;
  panelId: string;
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
        "group/nav inline-flex size-11 items-center justify-center gap-2 whitespace-nowrap text-body " +
        "font-medium tracking-[0.015em] text-current transition-colors duration-300 ease-soft " +
        // Below `lg` the label is `sr-only`, so the button is an icon in a
        // fixed 44px box — the touch target the icon alone could not give it.
        // From `lg` the label is visible and the row sits in an 80–104px bar,
        // so the box is let go and the button is sized by its own content.
        //
        // `lg:pb-1.5` is what puts this label on the same line as the others,
        // and it is reserving space rather than adding padding. Every nav
        // entry sets its word inside <NavLabel>, which keeps 6px under the
        // text for the rule it draws on hover; this button has no rule, so its
        // box measured 29.75px against their 35.75px and centred 3px lower in
        // the row. Matching the reserved space matches the baseline — and the
        // icon moves with the label, which it would not if the padding went on
        // the label alone. Only from `lg`: below it the button is the fixed
        // 44px icon box and there is nothing to line up with.
        "lg:size-auto lg:justify-start lg:pb-1.5"
      }
    >
      <Search size={18} aria-hidden className="shrink-0" />
      <span className="sr-only lg:not-sr-only">Search</span>
    </button>
  );
}
