/**
 * ==========================================================================
 * THE BOTTOM NAVIGATION'S ICONS — filled silhouettes, not drawn lines
 * ==========================================================================
 *
 * THIRD SET, AND THE REASONING IS WORTH KEEPING so the first two are not
 * tried again:
 *
 *   LUCIDE came first. Excellent, and the wrong voice beside a site whose
 *   every other mark is hand-cut paper — the one place the bar looked bought.
 *
 *   A HAND-DRAWN SET replaced it: multi-inflection wobble, overshooting
 *   corners, open contours, varying pen pressure. It is a good drawing at
 *   150px and it is NOISE at 21. Every device that makes a line look drawn
 *   works by adding information, and 21px is a budget of about four hundred
 *   pixels per glyph — there is nothing left over to spend on wobble. The
 *   client's note was that they were not good, and at the size they are
 *   actually used that was right.
 *
 *   FILLED SILHOUETTES are what survives. A shape reads at any size a stroke
 *   does and then some, because it is carried by area rather than by a line
 *   whose own weight is a third of the detail it is describing.
 *
 * ==========================================================================
 * HOW THEY ARE BUILT
 * ==========================================================================
 *
 * ONE PATH EACH, with `fill-rule: evenodd`. The door in the house, the thumb
 * hole in the palette, the eye of the pin and the cross on the calendar are
 * SUBPATHS, so they are knocked out rather than painted — whatever is behind
 * the icon shows through them. That matters here more than usual: the same
 * glyph sits on Deep Lilac when idle and on a White Rock blob when current,
 * and a knocked-out detail is correct on both without being told which.
 *
 * `currentColor`, so <BottomNav> keeps owning the ink — the measured table in
 * that file still holds. There is no `strokeWidth`: a filled glyph has no
 * stroke, and the current state is already said three ways without one.
 *
 * The geometry is CLEAN. Rounded joins, even weights, no wobble. The brand's
 * hand is in the bar's own wave, its paint blots and its thrown dots; the
 * icons are the part that has to be read in a quarter of a second.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const svg = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  fillRule: "evenodd" as const,
  clipRule: "evenodd" as const,
  "aria-hidden": true,
  focusable: "false" as const,
  className,
});

/**
 * The WhatsApp glyph — the one mark in this set that is NOT ours to redraw.
 *
 * Every other icon here is a filled silhouette cut for this bar. This one is
 * WhatsApp's own outline, carried verbatim from <WhatsAppWidget> so the two
 * surfaces show the identical mark. A hand-cut version would be a different
 * logo, and a brand doodle in its place would stop being recognisable, which
 * is the one thing a third-party action has to be.
 *
 * It keeps the set's build — one path, `currentColor`, knocked-out subpaths —
 * so it inherits the ink flip every other icon on the bar gets.
 */
export function WhatsAppIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

/** A house with its door knocked out. */
export function HomeIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12.7 2.6a1.1 1.1 0 0 0-1.4 0L2.6 10a1.1 1.1 0 0 0 1.4 1.7l.5-.4v8.3c0 .8.6 1.4 1.4 1.4h3.5v-5.4c0-.7.6-1.3 1.3-1.3h2.6c.7 0 1.3.6 1.3 1.3V21h3.5c.8 0 1.4-.6 1.4-1.4v-8.3l.5.4A1.1 1.1 0 0 0 21.4 10l-8.7-7.4Z" />
    </svg>
  );
}

/** A painter's palette: thumb hole and four dabs, all knocked out. */
export function ExperiencesIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 2.4c-5.4 0-9.6 4-9.6 9.2 0 5 3.9 8.8 9 9 1.5 0 2.5-1 2.5-2.2 0-.6-.2-1-.5-1.4-.3-.4-.4-.7-.4-1.1 0-.8.7-1.4 1.6-1.4h1.7c3 0 5.3-2.3 5.3-5.3 0-3.9-4-6.8-9.6-6.8Zm-5 10.9a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm1.9-4.6a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm4.6-.5a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm4.3 2.4a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z" />
    </svg>
  );
}

/** A calendar with a cross knocked out of it — the booking action. */
export function BookIcon({ size = 23, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M8.4 2a1 1 0 0 1 1 1v1.1h5.2V3a1 1 0 1 1 2 0v1.1h.6A2.8 2.8 0 0 1 20 6.9v11.3a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 18.2V6.9a2.8 2.8 0 0 1 2.8-2.8h.6V3a1 1 0 0 1 1-1ZM6 10.4v7.8c0 .4.4.8.8.8h10.4c.4 0 .8-.4.8-.8v-7.8H6Zm7 2.3a1 1 0 1 0-2 0v1.4H9.6a1 1 0 1 0 0 2H11v1.4a1 1 0 1 0 2 0v-1.4h1.4a1 1 0 1 0 0-2H13v-1.4Z" />
    </svg>
  );
}

/** A pin with its eye knocked out. */
export function LocationsIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 4.3 4.3 9.2 6.6 11.5a1.4 1.4 0 0 0 2 0c2.3-2.3 6.6-7.2 6.6-11.5A7.6 7.6 0 0 0 12 2.2Zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z" />
    </svg>
  );
}

/**
 * Two figures, the nearer one whole and the further one behind its shoulder.
 *
 * A GROUP, NOT A GIFT, and the first draft was the gift. A box with a ribbon
 * knocked out of it reads instantly at 21px and it says birthday — which is
 * one of the four programmes this slot leads to and wrong for the other
 * three. What a corporate away-day, a school visit, a mall activation and a
 * birthday have in common is that somebody books the table for a group, so
 * that is what the glyph draws.
 *
 * FOUR SUBPATHS THAT DO NOT TOUCH. Under `evenodd` an overlap is a hole, so
 * the two heads are 7.1 apart against radii summing to 5.8, and the back
 * figure's shoulder stops at x 7.6 where the front one starts at 8.2. Drawn
 * as one path because every icon here is.
 */
export function PrivateEventsIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M13.6 4.9a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm-7 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm7 6.5c-3 0-5.4 2.4-5.4 5.4v1a1 1 0 0 0 1 1h8.8a1 1 0 0 0 1-1v-1c0-3-2.4-5.4-5.4-5.4Zm-7 .8c-2.3 0-4.2 1.9-4.2 4.2v.6a1 1 0 0 0 1 1h3.2v-.2c0-2 .7-3.9 1.9-5.4a4.3 4.3 0 0 0-1.9-.2Z" />
    </svg>
  );
}

/**
 * The information mark: a disc with its stem and tittle knocked out.
 *
 * It names the sheet that holds About the Maison, Locations, Gallery and
 * Contact — "who this is and how to reach it" — which is the one thing in the
 * bar that is not a place in the programme. Conventional on purpose: the slot
 * used to say More with three bars, and a reader who has learnt that glyph
 * means "the rest of the menu" should not have to learn a second house mark
 * to find the same four pages.
 *
 * The stem and the tittle are SUBPATHS, so they are knocked out and take
 * whatever is behind the icon — which is the whole reason this set is built
 * the way it is: the same glyph sits on Deep Lilac when idle and on a White
 * Rock blob when current, and a knocked-out detail is right on both.
 */
export function AboutIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 3.6a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9Zm-1.2 4.6h2.4a1 1 0 0 1 1 1v5.9a1 1 0 0 1-1 1h-2.4a1 1 0 0 1-1-1v-5.9a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

/** Three bars of different lengths, and a dot off the short one. */
export function MoreIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M4 6.1a1.1 1.1 0 0 1 1.1-1.1h13.8a1.1 1.1 0 1 1 0 2.2H5.1A1.1 1.1 0 0 1 4 6.1Zm0 5.9a1.1 1.1 0 0 1 1.1-1.1h9.3a1.1 1.1 0 1 1 0 2.2H5.1A1.1 1.1 0 0 1 4 12Zm14.6-1.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM4 17.9a1.1 1.1 0 0 1 1.1-1.1h13.8a1.1 1.1 0 1 1 0 2.2H5.1A1.1 1.1 0 0 1 4 17.9Z" />
    </svg>
  );
}
