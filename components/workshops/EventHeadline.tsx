import Image from "next/image";
import Link from "next/link";

import { ParallaxPlate } from "@/components/motion/ParallaxPlate";
import { cn } from "@/lib/utils";
import {
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * The plate's proportion, and the one measurement everything else hangs off.
 *
 * The reference sets its Headlines images at 690x412 in a 690px column, which
 * is 1.674:1 — 5:3 to within four pixels. Taken as a ratio rather than as a
 * height on purpose: the same class gives 414px in a 690px column at 1440 and
 * 222px in a 366px column on a 390px phone, so the composition is one shape at
 * every width instead of two that have to be kept in step.
 *
 * IT IS A RATIO AND NOT A HEIGHT FOR A SECOND, HARDER REASON. `next/image`
 * with `fill` lazy-loads, and a lazy loader — like any IntersectionObserver —
 * needs a box with a definite size before it will fire. <WorkshopPhoto> carries
 * the scar from the last time this site got that wrong: an `absolute inset-0`
 * picture inside a crop whose height came from a sibling never became visible
 * at all, and read as a deliberately empty panel rather than as a broken image.
 * `aspect-[5/3]` on the frame settles the height from the width alone, before
 * anything loads and without reference to any neighbour.
 */
const PLATE = "aspect-[5/3]";

/**
 * One bookable date, in the arrangement the client asked for: the reference's
 * HEADLINES item, extended with the facts a buyer actually weighs.
 *
 * ==========================================================================
 * WHAT WAS TAKEN FROM THE REFERENCE, AND WHAT WAS ADDED TO IT
 * ==========================================================================
 *
 * Their Headlines item is four things in a flex column with a 16px gap: a
 * landscape photograph, a 12px meta row of category / divider / date, and a
 * 16px title — the whole of it one anchor, sitting directly on the page ground
 * with no card, no border, no fill and no shadow. That is reproduced exactly,
 * because it is the right grammar for this section: the photograph is the
 * argument and everything under it is a caption on the photograph.
 *
 * What their Headlines item does NOT carry is anything you would need to
 * decide with. It links to a news story; this links to a seat you pay for. So
 * the WHAT'S ON extension on the same site is what the lower half follows —
 * the identical pattern with place and dates added as further quiet 12px lines
 * — and here that becomes venue, then time and duration, then price. Four
 * facts, in the same order and through the same formatters as <EventCard> and
 * the listing, so a visitor who has read one page already knows how to read
 * this one.
 *
 * THE TITLE IS ONE STEP ABOVE THE REFERENCE'S 16px, AND THAT IS DELIBERATE.
 * Their titles are news headlines — eight to twelve words, which occupy the
 * measure at 16px on their own. Ours are product names of one or two words
 * ("Candle Making"), and two words at 16px under a 690px photograph read as a
 * file name rather than as the thing being sold. `text-lead` is 18-20px, one
 * notch up, which is the smallest size that still holds the column.
 *
 * NOTHING HERE IS A STRING. Every date, time, duration and price is computed
 * from the workshop through `lib/workshops.ts` — the section has no literals
 * to go stale and no second implementation to disagree with the listing.
 *
 * ONE ANCHOR PER ITEM, stretched over the whole thing by the title link's
 * `::after`. The "Book event" affordance on the price row is an `aria-hidden`
 * span for that reason: a second anchor to the same page would put every date
 * in the tab order twice, and a screen reader through the section twice.
 *
 * NO ENTRY REVEAL, ON ANY PART OF THIS. The parallax below is the section's
 * motion, and it is driven by scroll position rather than by an observer that
 * has to fire — see <WorkshopPhoto> on what an `imageReveal` did to a
 * photograph inside a crop, and why "an entry animation is a nicety" but a
 * bookable date is not.
 *
 * Server component. The only JavaScript this ships is <ParallaxPlate>.
 */
export function EventHeadline({
  workshop,
  sizes,
}: {
  workshop: Workshop;
  /** Rendered width per breakpoint, so the browser fetches one size only. */
  sizes: string;
}) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);
  const scarce = isScarce(workshop);

  /*
    Printed only when it is not the title said twice. Several activities are
    filed under a category of their own name — "Ceramic Painting" under
    "Ceramic Painting" — and a meta row repeating the heading beneath it is the
    furniture that makes a composition look automated. Lifted from <EventCard>
    rather than re-derived, so the two can never disagree.
  */
  const category = workshop.category.trim();
  const categoryLabel =
    category.toLowerCase() === workshop.title.toLowerCase() ? null : category;

  return (
    <article
      className={cn(
        // `h-full` is what makes the `mt-auto` on the price row mean anything:
        // the grid stretches the <li>, not the block inside it, so without
        // this the article is only as tall as its own content and the two
        // price rows in a row stop agreeing.
        "group relative flex h-full flex-col",
        // A sold-out date stays in the grid and stays readable — it is still
        // information — but it stops competing with the ones that can be had.
        closed && "opacity-75",
      )}
    >
      {/*
        The frame. Its only jobs are to settle the height from the width (see
        PLATE) and to hold a ground under the picture while it loads, so the
        column never collapses and reflows the type below it.

        No `overflow-hidden` here: <ParallaxPlate> is itself the clip, and
        stating the same thing twice invites the two to drift. No radius
        either — this site sets photographs as artwork rather than as the top
        of a card, and the hero triptych and the editorial plates are both
        hard-edged. Square corners are what make this section read as part of
        the same page.
      */}
      <div className={cn("relative w-full bg-surface-alt", PLATE)}>
        {/*
          THE SCROLLING ANIMATION THE CLIENT ASKED FOR.

          The reference marks its Headlines images `image root round parallax`
          and drifts them against the page as it scrolls. <ParallaxPlate> is
          that effect, already on this site for the editorial spreads and the
          experience index: it cuts the picture 16% taller than the frame and
          slides it through that overscan, so the drift is bought with slack
          the frame already hides rather than with a margin that could open a
          hairline at the extremes.

          It is tied to SCROLL POSITION, not played on entry. Dragging the page
          back up runs it backwards, which is the difference between a picture
          responding to the reader and one performing at them — and it means
          the effect cannot strand a photograph the way an entry animation can.

          Under `prefers-reduced-motion` the component flattens its own range
          and the plate simply sits centred: the same picture with the parallax
          taken out, never a missing one.
        */}
        <ParallaxPlate>
          <Image
            src={workshop.image.src}
            alt={workshop.image.alt}
            fill
            sizes={sizes}
            style={{ objectPosition: workshop.image.position ?? "50% 50%" }}
            /*
              The hover lift stays, and it is pure CSS. With no card and no
              border around the item, the picture answering the pointer is
              most of what says the whole thing is clickable. It scales the
              `img` while the plate's drift transforms the element above it,
              so the two never fight over one `transform`.
            */
            className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-within:scale-[1.03]"
          />
        </ParallaxPlate>

        {/*
          THE ONE FILLED THING IN THE SECTION, AND THE ONLY ONE WORTH THE
          EXCEPTION.

          The brief for this redesign is no cards, no borders, no fills — and
          that holds for every piece of the item's own furniture below. This
          sits on the photograph rather than on the page ground, and it exists
          because the one unacceptable outcome here is a visitor believing they
          can book something they cannot. That has to be legible before any
          type is read.

          It says only what `seatsAvailable` already knows, through the same
          `spotsLabel` the listing calls:

            fully booked ....... "Fully booked"   — charcoal, a statement of fact
            nearly gone ........ "3 spots left"   — Deep Lilac, the one accent
            comfortably open ... nothing at all

          The third case is the one that makes the other two work. A chip on
          every picture is a chip that means nothing. Solid grounds rather than
          tints, so neither has to be re-measured when the studio swaps a
          photograph: White Rock on Charcoal is 12.33:1, and the near-white on
          Deep Lilac is 4.90:1, which is what `--color-on-primary` is for.
        */}
        {closed || scarce ? (
          <p
            className={cn(
              "absolute left-3 top-3 rounded-sm px-3 py-1.5 text-label font-medium uppercase tracking-eyebrow",
              closed ? "bg-text text-on-dark" : "bg-primary text-on-primary",
            )}
          >
            {spotsLabel(workshop)}
          </p>
        ) : null}
      </div>

      {/*
        The meta row: category, a thin vertical divider, the date — the
        reference's own line, at the site's label size.

        The date carries full-strength charcoal where the category sits at
        /75, because this row is the ONLY place the date appears on the item
        and someone choosing between two Saturdays is reading exactly this.
        Same size for both, so the hierarchy costs no extra line.

        The divider is `text/70` — 4.70:1 on this ground. It separates two data
        points rather than decorating, so it owes the 3:1 a graphical mark
        owes, and <EventCard> already rejected /40 here at 2.17:1 as faint
        enough to read as a rendering artefact rather than as a considered mark.
      */}
      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-label font-medium uppercase tracking-eyebrow">
        {categoryLabel ? (
          <>
            <span className="text-text/75">{categoryLabel}</span>
            <span aria-hidden className="h-3 w-px shrink-0 bg-text/70" />
          </>
        ) : null}
        <time className="text-text" dateTime={workshop.startsAt}>
          {weekday} {formatSessionDate(workshop.startsAt)}
        </time>
      </p>

      <h3 className="mt-3 text-lead font-medium leading-[1.35] tracking-[-0.01em]">
        <Link href={workshopHref(workshop)} className="after:absolute after:inset-0">
          {/*
            The underline draws itself from the left on hover — a background
            image rather than a border, so it animates its width without
            reserving a box. Deep Lilac, the same mark <EventCard> and the
            index use.
          */}
          <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-editorial group-hover:bg-[length:100%_1px] group-focus-within:bg-[length:100%_1px]">
            {workshop.title}
          </span>
        </Link>
      </h3>

      {/*
        The facts, as quiet lines rather than a specification block: where,
        then when and for how long. Both at `text-fine` on /75, which is the
        reference's own treatment of place and dates — small enough that the
        photograph keeps the weight of the item, large enough to be read rather
        than scanned past.

        The venue line is omitted entirely when a session has none. `venue` is
        optional in the data precisely so the schedule can stay silent rather
        than invent a mall — see the note at the top of lib/workshops.ts.
      */}
      <div className="mt-4 space-y-1.5">
        {workshop.venue ? (
          <p className="text-fine leading-[1.7] text-text/75">
            {formatVenueLine(workshop.venue)}
          </p>
        ) : null}

        <p className="text-fine leading-[1.7] text-text/75">
          {/*
            The end of the session is derived from the duration by
            `sessionTimeRange` rather than stored, so a visitor is never told
            a finish time that contradicts the length printed beside it.
            `tabular-nums` keeps the two ends of the range on one rhythm.
          */}
          <span className="tabular-nums">
            {start} &ndash; {end}
          </span>
          {/* Inherits the line's own /75 — a separator lighter than the type
              it separates reads as dirt on the screen. */}
          <span aria-hidden className="px-2">
            &middot;
          </span>
          <time dateTime={durationToIso(workshop.durationMinutes)}>
            {formatDuration(workshop.durationMinutes)}
          </time>
        </p>
      </div>

      {/*
        Price and the way in, on one line and with no rule above them. The rule
        <EventCard> carries there is exactly the border this redesign was asked
        to remove; the space does the separating instead.

        `mt-auto` holds this at the foot of the item, so the price lines agree
        across a row even when one title wraps and its neighbour does not.
        Without it the two columns stagger and a grid reads as a collage.
      */}
      <div className="mt-auto flex items-baseline justify-between gap-4 pt-5">
        <p className="text-body font-medium text-text">
          {formatPrice(workshop.price)}
          <span className="ml-1.5 text-fine font-normal text-text/75">per person</span>
        </p>

        {/*
          A span, not a link — see the note at the top of this file. It also
          never offers a booking that does not exist: a closed date says "View
          event", which is the third thing after the chip and the dimming that
          stops a sold-out Saturday looking bookable.

          "Event", not "workshop". `workshopActionLabel` in lib/workshops.ts
          still says workshop and is left alone deliberately — the data model
          keeps the studio's word while everything public says event, which is
          the split documented on `workshopHref`. <EventCard> writes its label
          the same way and for the same reason.
        */}
        <span
          aria-hidden
          className="inline-flex shrink-0 items-baseline gap-2 text-action font-medium uppercase tracking-eyebrow text-text"
        >
          {closed ? "View event" : "Book event"}
          <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
            &#8594;
          </span>
        </span>
      </div>
    </article>
  );
}
