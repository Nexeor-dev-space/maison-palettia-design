"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { useSessionPassed } from "@/components/booking/SessionClock";
import type { BookingOption } from "@/lib/bookingOptions";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * BOOK A SESSION — the sheet the bottom bar's middle button opens
 * ==========================================================================
 *
 * WHAT IT IS FOR. "Book a session" used to be a link to /events#scheduled —
 * the same listing the Experiences tab beside it already opens. Two of the
 * four things on the bar went to one page, and the one labelled as the
 * booking action was the slower route to booking: a visitor landed on a list
 * of seven activities, five of which cannot be booked at all.
 *
 * This asks the question that list was making them answer for themselves —
 * which of the two bookable activities — and then goes as deep into the
 * existing flow as the architecture allows. See lib/bookingOptions.ts for how
 * the list is derived and why it can only ever contain scheduled activities.
 *
 * IT IS AN ENTRY POINT, NOT A BOOKING SYSTEM. No dates, no seats, no prices,
 * no form. Those all live on the page it opens, which is unchanged.
 *
 * ==========================================================================
 * A DIALOG, WHICH <MoreSheet> DELIBERATELY IS NOT
 * ==========================================================================
 *
 * The bar's other sheet is `role="group"` with a plain scrim, and its own note
 * explains why: it is a drawer of links, the page behind it stays usable, and
 * a dialog's semantics would overclaim. This one is the opposite. It asks a
 * question and waits for an answer, so it is a real modal: `role="dialog"`,
 * `aria-modal`, a labelled title, focus moved in and trapped, Escape, backdrop
 * dismissal, the background held still, and focus handed back to the button
 * that opened it.
 *
 * The two look alike on purpose and behave differently on purpose.
 *
 * ==========================================================================
 * BOTTOM SHEET BELOW `sm`, CENTRED DIALOG ABOVE IT
 * ==========================================================================
 *
 * Same component, two shapes. A bottom sheet is a phone idiom — it is near the
 * thumb and it belongs to a bar fixed at the foot of the screen. Pinned to the
 * bottom of a 1280px window it would be a letterbox of empty space with three
 * cards in it, so from `sm` it becomes an ordinary centred dialog. The bar
 * itself is `lg:hidden`, so on a desktop this opens only if something else
 * ever calls it.
 */
export function BookingSheet({
  id,
  open,
  onClose,
  options,
  returnFocusTo,
}: {
  /** Named by the trigger's `aria-controls`, so it must be the same string. */
  id: string;
  open: boolean;
  onClose: () => void;
  options: readonly BookingOption[];
  /** The control that opened it, so focus can go home. */
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  /*
    ESCAPE, AND THE FOCUS TRAP.

    A modal that does not trap focus is a modal only to somebody looking at it:
    Tab walks straight out of it and into the page it is covering, which is
    still there and still full of links. Both live in one listener because they
    are the same question — what the keyboard is allowed to reach while this is
    open.
  */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /*
    THE BACKGROUND IS HELD STILL.

    `overflow: hidden` on <html> rather than on <body>: this site drives its
    scrolling through Lenis, which reads the document element, and locking the
    body alone leaves the smooth-scroll loop free to carry on under the sheet.

    The previous value is restored rather than cleared, because something else
    may already be holding it — the mobile menu does the same thing — and
    clearing it would release a lock that is not ours.
  */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  /* Focus into the panel on open, and back to the trigger on close. */
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [open]);

  /*
    BACK TO THE TRIGGER — BUT ONLY FROM A SHEET THAT WAS ACTUALLY OPEN.

    This was `if (!open) returnFocusTo.current?.focus()`, which is true on the
    first run as well as on every close, and the first run is the page load.
    Measured at 390 and 768, on / and /events: `document.activeElement` was
    the bar's "Book a Session" button before anyone had touched anything. A
    keyboard visitor arrived at the foot of the page — first Tab went to the
    bar's next slots (Contact, then About), and the header, the skip link and
    the whole of the content were behind Shift+Tab. A screen reader opened on
    the bar.

    It did not show up on a desktop only because `lg:hidden` is
    `display: none` and `.focus()` on an undisplayed element is a no-op, so
    the bug was invisible exactly where it was being looked at.

    The ref remembers whether there is a sheet to come back from. Restoring
    focus is the close half of a round trip, and a round trip that never
    started has no close.
  */
  const hadFocus = useRef(false);
  useEffect(() => {
    if (open) {
      hadFocus.current = true;
      return;
    }
    if (!hadFocus.current) return;
    hadFocus.current = false;
    returnFocusTo.current?.focus();
  }, [open, returnFocusTo]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* The backdrop. A dialog's, so it is the thing a tap outside
              lands on — and `aria-hidden`, because the sheet above it is
              already announced. */}
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24 }}
            className="fixed inset-0 z-50 bg-text/45 backdrop-blur-[2px]"
          />

          <motion.div
            id={id}
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }
            }
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              /*
                ABOVE THE BAR AND ABOVE THE HOME INDICATOR. Measured: the bar
                stands 91px tall on a phone, so 5.25rem left 7px of daylight —
                clear of it, but only just. 6rem gives 15px, which reads as a
                gap rather than as two things that nearly touch.

                `env()` answers 0 where there is no inset, so this is the bar's
                height on a phone with a button and the bar plus the home
                indicator on one without.
              */
              "pb-[calc(6rem+env(safe-area-inset-bottom))]",
              /* A sheet below `sm`; a centred dialog above it — see the note. */
              "sm:inset-0 sm:grid sm:place-items-center sm:pb-0",
            )}
          >
            <div
              className={cn(
                "mx-auto flex max-h-[min(78svh,34rem)] w-full flex-col overflow-hidden bg-surface",
                "rounded-t-[1.75rem] shadow-[0_-18px_48px_-24px_rgb(45_55_72/0.45)]",
                "sm:max-w-[30rem] sm:rounded-[1.75rem] sm:shadow-[0_24px_60px_-28px_rgb(45_55_72/0.5)]",
              )}
            >
              {/* ---- the head ---- */}
              <div className="relative shrink-0 px-6 pb-5 pt-6 md:px-7">
                {/*
                  The grabber. Decorative — nothing here is draggable, and a
                  handle that cannot be dragged is a lie — so it is only the
                  visual cue that this is a sheet, and only where it is one.
                */}
                <span
                  aria-hidden
                  className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-pill bg-text/15 sm:hidden"
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2
                      id={titleId}
                      className="heading-script pb-[0.12em] text-[1.6rem] leading-[1.2] text-text"
                    >
                      What would you like to create?
                    </h2>
                    <p id={descriptionId} className="mt-1.5 text-fine leading-[1.6] text-text/75">
                      Choose a scheduled experience to start your booking.
                    </p>
                  </div>

                  {/* 44px of target around a 14px glyph — the size a finger
                      owes, not the size the mark looks. */}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-pill text-text/70 outline-offset-2 transition-colors duration-200 ease-soft hover:bg-text/5 hover:text-text"
                  >
                    <span aria-hidden className="relative block size-3.5">
                      <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                      <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
                    </span>
                  </button>
                </div>
              </div>

              {/* ---- the options ---- */}
              <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-6 pb-2 md:px-7">
                {options.map((option, i) => (
                  <li key={option.slug}>
                    <OptionCard
                      option={option}
                      accent={OPTION_ACCENTS[i % OPTION_ACCENTS.length]}
                      onClose={onClose}
                    />
                  </li>
                ))}
              </ul>

              {/*
                ---- the way out for everybody else ----

                Five of the seven activities are come-anytime and none of them
                can be booked online, so a sheet that only offers the two
                scheduled ones has to say where the rest are. Quiet and
                secondary on purpose: it is the alternative, not a second call
                to action.
              */}
              <div className="shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:px-7">
                {/*
                  ONE FLOWING SENTENCE, NOT A FLEX ROW. This was
                  `inline-flex items-center gap-2`, which makes the question and
                  the link two unbreakable columns — at 390px the second one
                  wrapped onto two lines beside the first and the pair read as a
                  broken two-column layout rather than as a sentence. Inline
                  text wraps the way text wraps.
                */}
                <p className="text-fine leading-[1.6] text-text/75">
                  Prefer to come anytime?{" "}
                  <Link
                    href="/events"
                    onClick={onClose}
                    className="font-medium text-text underline decoration-terracotta/60 decoration-[1.5px] underline-offset-4 outline-offset-2 transition-colors duration-200 ease-soft hover:decoration-terracotta"
                  >
                    Browse all experiences
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * One option. A component of its own for one reason: it asks the clock.
 *
 * `option.href` was decided when the layout rendered — on a prerendered page,
 * at build time — so after a session began it went on sending "Choose
 * session" straight to a booking step that could no longer be taken. Once
 * `option.startsAt` has begun in the visitor's browser the card falls back
 * to the activity's own page with "See dates", the same answer
 * lib/bookingOptions.ts gives an activity with nothing still to come; that
 * page lists whatever is open. The sheet only mounts in the browser, so there
 * is no server render for the clock to agree with.
 */
function OptionCard({
  option,
  accent,
  onClose,
}: {
  option: BookingOption;
  accent: (typeof OPTION_ACCENTS)[number];
  onClose: () => void;
}) {
  const passed = useSessionPassed(option.startsAt ?? "");
  const href = passed ? `/events/${option.slug}` : option.href;
  const action = passed ? "See dates" : option.action;

  return (
    <Link
      href={href}
      onClick={onClose}
      style={{ background: accent.wash } as React.CSSProperties}
      className={cn(
        "group plate relative isolate flex items-center gap-4 overflow-clip rounded-[1.1rem] p-2.5 pr-4",
        "outline-offset-2 transition-transform duration-[var(--duration-hover)] ease-soft",
        "active:scale-[0.985] motion-safe:hover:scale-[1.01] motion-reduce:transition-none",
      )}
    >
      {/*
        THE BRAND CUT-OUT THAT GIVES EACH CARD ITS COLOUR, the
        way <MoreSheet>'s blots do. Clipped to the card's own
        corner — a shape inside a shape, the brand sheet's
        device — and `-z-10` under the isolated card so it rides
        on the wash, behind the photo and the words. `stamp`
        renders it filled and still and answers the card's
        hover, so it never needs the scroll timeline a sheet
        cannot give it.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-6 -z-10 w-[4.5rem] rotate-6"
      >
        <DoodleMark name={accent.mark} color={accent.color} treatment="stamp" depth={0} />
      </span>

      <span className="relative block size-[4.25rem] shrink-0 overflow-clip rounded-[0.85rem] bg-surface-alt">
        {option.image ? (
          <Image
            src={option.image.src}
            alt=""
            fill
            /* A 68px box, and the source is a tall crop — the
               cover crop is what decides the fetch, not the
               element's width. */
            sizes="140px"
            style={{ objectPosition: option.image.position ?? "50% 50%" }}
            className="object-cover"
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-semibold leading-snug text-text">
          {option.name}
        </span>
        {option.description ? (
          <span className="mt-1 block text-fine leading-[1.5] text-text/75">
            {option.description}
          </span>
        ) : null}
        <span className="mt-1.5 block text-label font-medium uppercase tracking-eyebrow text-primary">
          {action}
        </span>
      </span>

      <span
        aria-hidden
        className="shrink-0 text-text/40 transition-transform duration-300 ease-editorial motion-safe:group-hover:translate-x-0.5"
      >
        &#8250;
      </span>
    </Link>
  );
}

/*
  A COLOUR PER OPTION, THE WAY <MoreSheet> GIVES ONE TO EACH OF ITS CARDS —
  the site's rotation on White Rock: Deep Lilac, Warm Terracotta, Soft
  Lavender. Each is mixed into White Rock so the ground reads clearly
  brand-coloured while the charcoal name and the /75 description it carries
  stay legible; the full strength lives in the cut-out, not in the field.
  Assigned by position, not by meaning — a fourth option takes the first
  colour again, which is what PAINTS_ON_CREAM does everywhere else.
*/
const OPTION_ACCENTS: readonly { wash: string; mark: DoodleName; color: string }[] = [
  { wash: "color-mix(in oklab, var(--color-primary) 15%, var(--color-cream))", mark: "bow", color: INK.lilac },
  { wash: "color-mix(in oklab, var(--color-terracotta) 15%, var(--color-cream))", mark: "splash", color: INK.terracotta },
  { wash: "color-mix(in oklab, var(--color-lavender) 24%, var(--color-cream))", mark: "coral", color: INK.lavender },
];
