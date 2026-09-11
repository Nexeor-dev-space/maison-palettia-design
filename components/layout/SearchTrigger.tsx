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
        "group/nav inline-flex size-11 items-center justify-center gap-2 text-[0.9rem] " +
        "font-medium tracking-[0.01em] text-white transition-colors duration-300 ease-soft " +
        // Below `lg` the label is `sr-only`, so the button is an icon in a
        // fixed 44px box — the touch target the icon alone could not give it.
        // From `lg` the label is visible and the row sits in an 80–104px bar,
        // so the box is let go and the button is sized by its own content.
        "lg:size-auto lg:justify-start"
      }
    >
      <Search size={18} aria-hidden className="shrink-0" />
      <span className="sr-only lg:not-sr-only">Search</span>
    </button>
  );
}
