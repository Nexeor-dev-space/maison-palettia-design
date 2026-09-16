"use client";

import { useEffect, useRef, useState } from "react";

import { RuledLink } from "@/components/ui/Action";

/**
 * One destination, on a map — loaded only when a visitor asks for it.
 *
 * THE MECHANISM: A SEARCH, NOT A PIN. The frame is Google's keyless embed,
 * `maps.google.com/maps?q=<place>&output=embed`. No API key, no account, no
 * billing project and no coordinates — the query is the centre's name and city
 * as they are signposted, and Google resolves it the same way it resolves the
 * same words typed into Maps.
 *
 * That is the same reasoning `locationHref` in lib/partners.ts already sets
 * out, and it is the reason this is not a pinned map: there are no coordinates
 * anywhere in this project (see the note in <LocationDiscovery> too), and a
 * pin invented to fill the gap would be this site asserting an address it
 * cannot verify. A visitor navigating by a wrong pin is worse off than one
 * reading a correct name. So the name is the input, and nothing in this
 * component or its callers carries a latitude or a longitude.
 *
 * WHY IT DOES NOT LOAD ITSELF. Two reasons, and both are the reason:
 *
 *   1. This site has no cookie banner and no consent mechanism of any kind.
 *      An iframe that mounts on page load makes a third-party request that can
 *      set cookies for every visitor to the homepage, whether or not they ever
 *      look at the map — that is not a defensible thing to do silently, and
 *      the honest fix is to ask first rather than to bolt a banner onto a
 *      brochure site.
 *   2. It keeps a whole embedded document — Google's scripts, tiles and fonts
 *      — off the critical path of a page whose weight is otherwise
 *      photographs we control.
 *
 * So the resting state is a labelled well with a "Show map" control, and the
 * frame exists only after a press. The trade is a click; the alternative is
 * loading something on a visitor's behalf that they did not ask for.
 *
 * WHY THIS IS A CLIENT COMPONENT, and the only one in this section. It holds
 * one piece of state — whether the visitor has asked yet — and it moves focus
 * when that state changes. Neither is expressible on the server. <MallPartners>
 * stays a server component and this is the single island inside it, which is
 * also why it is a file of its own rather than a branch in that one.
 *
 * WITH SCRIPTING OFF the control is inert, and that is survivable rather than
 * broken: every destination in <MallPartners> carries a "Get directions" link
 * to the same place, rendered as a plain anchor on the server. Nobody is left
 * without a way to find the centre.
 *
 * NOT CONSIDERED FINISHED WITHOUT THE GUARD. A blank query renders nothing at
 * all — see below. An empty frame that resolves to the middle of the ocean is
 * worse than no frame, and this section's whole contract is that it renders
 * nothing rather than rendering a hole.
 */

/**
 * The embed endpoint, spelled out once.
 *
 * `output=embed` is what makes this legal in an iframe without a key. Opening
 * the same URL at the top level answers "The Google Maps Embed API must be
 * used in an iframe", which is the expected response and not a fault — it is
 * how the endpoint says it is an embed.
 */
const EMBED = "https://maps.google.com/maps";

function embedSrc(query: string): string {
  return `${EMBED}?q=${encodeURIComponent(query)}&output=embed`;
}

interface VenueMapProps {
  /**
   * What goes in `q=` — the place as Maps would be searched for it, e.g.
   * "Times Square Center Dubai".
   *
   * Held apart from `label` on purpose. One is a search string and one is
   * prose: the announcement wants a comma between the centre and the city and
   * the query does not, and a CMS that later supplies a better query (a Plus
   * Code, the centre's own listing) can do so without changing a visible word.
   */
  query: string;
  /** The place in prose, e.g. "Times Square Center, Dubai". Names the frame. */
  label: string;
}

export function VenueMap({ query, label }: VenueMapProps) {
  const [shown, setShown] = useState(false);
  const region = useRef<HTMLDivElement>(null);

  /*
    WHERE FOCUS GOES WHEN THE FRAME ARRIVES.

    The control the visitor pressed is gone the moment it succeeds — it is
    replaced by the thing it asked for. Left alone that drops focus back to
    <body>, which sends a keyboard visitor to the top of the document as a
    reward for pressing a button, and is the standard way this pattern fails.

    So the region takes focus instead. It is `tabIndex={-1}` only once it holds
    the map, so it is never a tab stop of its own, and a programmatic focus
    after a keyboard press still draws the base layer's focus ring — the
    visitor can see where they landed. The frame itself is the next stop after
    it, which is the correct place for Tab to go next.

    Deliberately not `preventScroll`: if the well was only half in view when it
    was pressed, being scrolled to it is the right outcome.
  */
  useEffect(() => {
    if (shown) region.current?.focus();
  }, [shown]);

  const place = query.trim();
  if (!place) return null;

  return (
    /*
      A DEFINITE BOX IN BOTH STATES, and the same box in both.

      The aspect ratio is on the wrapper rather than on either child, so the
      well and the frame occupy identical space and nothing on the page moves
      when one becomes the other. `min-h-64` is the floor for a narrow phone,
      where 4:3 of a 280px column would be a map too small to read.

      3:2 from `lg` puts the frame at roughly 526px tall in seven of twelve
      columns at 1440 — the height the reference gives its large plates, which
      is what "tall" means in this composition.

      The ground is the page's own surface rather than White Rock: this section
      sits on White Rock, and a White Rock well on a White Rock field is a box
      nobody can see (see ONE GROUND PER SECTION in app/globals.css). It is on
      the wrapper so there is no flash of the section's ground between the
      control unmounting and the frame painting.
    */
    <div
      ref={region}
      tabIndex={shown ? -1 : undefined}
      className="relative aspect-[4/3] min-h-64 w-full border border-text/25 bg-surface lg:aspect-[3/2]"
    >
      {shown ? (
        /*
          `title` because a frame without one is an unnamed document in the tab
          order — it is the only thing a screen reader has to say what this is.

          `loading="lazy"` is close to redundant given that the element does
          not exist until it has been asked for, and it is set anyway: it costs
          nothing and it is still correct if a visitor presses the control and
          scrolls away before the tiles arrive.

          `referrerPolicy="no-referrer-when-downgrade"` sends no referrer to an
          insecure destination, which is the conservative end of what this
          embed accepts.

          NO `allowFullScreen`: a frame that can take over the display is a
          second and larger surprise after the one the visitor consented to,
          and the "Get directions" link beside every destination already opens
          the real thing in a new tab. NO `sandbox` either — the verified
          working embed is the one without it, a cross-origin frame cannot
          reach this document regardless, and a sandbox tight enough to be
          worth adding is tight enough to break the map.

          There is no control to put it away again. A visitor who has asked for
          a map has it; a hide button would be a third state to explain for a
          problem nobody has.
        */
        <iframe
          src={embedSrc(place)}
          title={`Map showing ${label}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        /*
          The whole well is the control, rather than a small button inside it.
          It is the area a visitor is already looking at when they decide they
          want a map, and it makes the target enormous rather than 44px.

          A native `<button>`, so Enter and Space both work, it is in the tab
          order once, and it takes the base layer's focus ring without being
          told. `group` is what lets the <RuledLink asSpan> inside pick up the
          hover and focus states off the whole plate.

          THE ACCESSIBLE NAME IS BUILT, NOT OVERRIDDEN. An `aria-label` here
          would be the obvious move and it would silently delete the line about
          where the map comes from — the one thing a visitor is being asked to
          consent to. So the name is composed from content instead: an sr-only
          sentence carries it, and the two visible strings are aria-hidden
          pictures of it. The same shape <RuledLink> uses for "(opens in a new
          tab)".
        */
        <button
          type="button"
          onClick={() => setShown(true)}
          /*
            `justify-center`, not `justify-between`.

            It was `justify-between`, which is the right instinct in a short
            control and the wrong one here: this well is 526px tall at 1440, so
            spacing the label and the control to opposite ends left 391px of
            bare ground between them — 74% of the box, with nothing in it.

            That is a different thing from the empty space this page uses
            deliberately elsewhere. In the strand rows and the About teaser the
            space sits beside a large photograph, so the eye has somewhere to
            go. Here the space IS the column, and nothing rewards it. Worse,
            this box is a placeholder for something not yet loaded, so "looks
            empty" and "failed to load" reinforce each other and a visitor has
            no way to tell them apart.

            Centred, the three lines read as one deliberately quiet unit, which
            is what they are.
          */
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center md:p-8"
        >
          <span className="sr-only">Show map of {label}. The map is loaded from Google Maps.</span>

          <span
            aria-hidden
            className="text-label font-medium uppercase tracking-eyebrow text-text/75"
          >
            {label}
          </span>

          <span aria-hidden className="flex flex-col items-center gap-3">
            <RuledLink asSpan label="Show map" />
            <span className="text-fine text-text/75">Loaded from Google Maps</span>
          </span>
        </button>
      )}
    </div>
  );
}
