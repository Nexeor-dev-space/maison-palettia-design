"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The map plate for <MallPartners>, and it fetches nothing until it is asked.
 *
 * WHY THIS IS NOT <LocationMap>. That component already renders a keyless
 * Google embed and it stays exactly as it is, because app/events/[slug] mounts
 * it too — a session page is a page someone has already chosen, so a map that
 * simply loads there is the right trade. This is the homepage, where the same
 * frame would be a third-party request on every visit, and the two situations
 * want different behaviour rather than one component with a flag.
 *
 * WHY IT IS CLICK-TO-LOAD, WHICH IS THE ONLY REASON THIS FILE IS A CLIENT
 * COMPONENT. A Google Maps frame is a cross-site request that can set cookies,
 * and this site ships no cookie banner and no consent record. A frame that
 * fires on every homepage view is therefore a decision nobody was asked to
 * make. Holding it behind a press moves the decision to the reader, and it
 * also keeps roughly half a megabyte of map tiles, fonts and script off a page
 * that already carries a video hero and a smoothed scroller.
 *
 * `loading="lazy"` was the cheaper alternative and was rejected: it defers the
 * request but still makes it, unasked, the moment the plate is scrolled to.
 * It is also redundant here — a frame that does not exist cannot load early,
 * which is strictly stronger than a hint that it should load late.
 *
 * THE PLACEHOLDER IS AN INVITATION, NOT A GAP. Its contents are centred on
 * both axes. The first draft spaced a label to the top and a note to the
 * bottom of a 510px box, which is how a broken image renders — two fragments
 * pinned to opposite edges of an empty rectangle. Centred, at the width of a
 * caption, it reads as a card asking to be turned over.
 */
interface MallMapProps {
  /**
   * The finished embed URL, built on the server.
   *
   * A string rather than the partner object, for the reason <SessionCarousel>
   * takes formatted strings: `lib/partners.ts` is where the destinations live
   * and importing it here to build one URL would put the whole array in the
   * browser bundle. This component knows how to frame a map and nothing about
   * who the Maison works with.
   */
  src: string;
  /** "Times Square Center, Dubai" — the frame's title and the button's name. */
  place: string;
  className?: string;
}

export function MallMap({ src, place, className }: MallMapProps) {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  /*
    WHERE FOCUS GOES WHEN THE BUTTON IT WAS ON STOPS EXISTING.
    Pressing the placeholder unmounts it. Left alone, the browser hands focus
    back to <body> and the reader's next Tab restarts at the top of the
    document — they press a button in the middle of the page and are silently
    returned to the skip link. So focus moves to the region that replaced it.

    IT IS THE WRAPPER, NOT THE IFRAME. Focusing the iframe itself was tried and
    dropped: it puts the caret inside Google's map, where the arrow keys pan
    instead of scrolling the page, which is a surprise nobody asked for by
    pressing "open the map". The wrapper is a labelled group, so a screen
    reader announces what has just appeared, the next Tab steps into the map
    for anyone who wants it, and the one after that reaches "Get directions".

    An effect rather than the click handler, because the element being focused
    does not exist until this state change has committed.
  */
  useEffect(() => {
    if (open) frame.current?.focus();
  }, [open]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-sm border border-line bg-surface-alt",
        /*
          A map is only worth showing at a size you can read a street from, so
          this is the tallest plate in the section at every width. 4:5 on a
          phone — a portrait window shows the blocks around the centre, where a
          letterbox shows the car park. 16:10 once there is room for the type
          beside it. 4:3 from `lg`, which at 1440 makes the plate 680x510 and
          lands within 8px of the reference's own 694x518 image half.
        */
        "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/3]",
        className,
      )}
    >
      {open ? (
        <div
          ref={frame}
          tabIndex={-1}
          role="group"
          aria-label={`Map of ${place}`}
          /*
            The focus ring is drawn inside. The plate clips its children so the
            frame keeps the plate's corners, and the site's global ring sits at
            `outline-offset: 3px` — outside this element, and therefore clipped
            away to nothing. A negative offset puts all 2px of it back on
            screen without touching the shared rule.
          */
          className="absolute inset-0 focus-visible:[outline-offset:-4px]"
        >
          <iframe
            /*
              Titled for the place, not the vendor. An iframe is announced by
              its title, and "Google Maps" would tell a screen-reader user
              which company drew the tiles rather than which centre they are
              looking at.

              NO `allow` ATTRIBUTE, DELIBERATELY. Powerful features default to
              a `self` allowlist, so a cross-origin frame gets none of them
              unless it is granted them here. Nothing is granted — which
              matters most for the one a map would obviously want, since this
              frame cannot ask the reader for their location.

              `referrerPolicy` sends the origin alone. The default would do the
              same in current browsers, but stating it means the frame does not
              start leaking the full URL if that default ever moves.
            */
            title={`Map of ${place}`}
            src={src}
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          /*
            The whole plate is the target, so there is no 44px question to
            answer here. Same clipped-ring problem as the frame above, same
            fix.
          */
          className="group absolute inset-0 flex w-full flex-col items-center justify-center gap-5 px-6 text-center focus-visible:[outline-offset:-4px]"
        >
          {/*
            Charcoal on White Rock, 9.36:1. The rule under it is the site's own
            link idiom — Warm Terracotta measures 2.44:1 on this ground, which
            is why it is an underline on legible type and never the type.
          */}
          <span className="text-lead font-medium leading-[1.3] text-text">
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Open the map
            </span>
            {/*
              So the button's accessible name is "Open the map of Times Square
              Center, Dubai" rather than a label that is identical on every
              plate once there is more than one destination.
            */}
            <span className="sr-only"> of {place}</span>
          </span>

          {/*
            Why the map is not already here, said plainly. /75 rather than /70
            because this sits on White Rock, where /70 measures 4.24:1 and
            fails; /75 clears the bar.
          */}
          <span className="max-w-[24rem] text-fine leading-[1.7] text-text/75">
            It comes from Google Maps. Nothing is requested from them, cookies
            included, until you ask for it.
          </span>
        </button>
      )}
    </div>
  );
}
