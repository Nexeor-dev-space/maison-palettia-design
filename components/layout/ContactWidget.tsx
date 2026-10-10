"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/layout/ContactWidget.module.css";
import { ContactIcon } from "@/components/layout/bottomNavIcons";

/* The one destination. A literal, as PRIMARY_CTA's is: it is the route itself,
   and lib/constants.ts lists it under the same href for the header and the
   footer. */
const CONTACT_HREF = "/contact";

/**
 * The floating Contact action.
 *
 * IT WAS WHATSAPP, and the client asked for it to go — on a desktop and on a
 * phone — with the contact page in its place. So it no longer leaves the site:
 * it is a <Link> to /contact, prefetched and routed client-side like every
 * other internal door, rather than an anchor out to `wa.me` in a new tab. The
 * `WHATSAPP` constant that pointed the old button at a number went with it;
 * neither this nor <BottomNav> reads anything from lib/constants.ts.
 *
 * NOT ON /contact ITSELF. A floating button whose only job is to take you to
 * the page you are reading is a control that does nothing, parked over the
 * form you came to fill in. That is the one reason this is a client component:
 * it reads the path, and returns null there.
 *
 * GROUND IS LIGHT SAGE, as the client asked for it while this was still
 * WhatsApp, and it stays: it is the ground of the bottom bar's raised Book
 * badge, so the site's two floating actions share one colour as well as the
 * one cut shape in ContactWidget.module.css.
 *
 * INK IS CHARCOAL SLATE. Cream on Light Sage would be 1.03:1 and an invisible
 * glyph; Charcoal Slate on Light Sage is 9.07:1, far over the 3:1 a graphical
 * control owes and over the 4.5 the label owes once it opens.
 *
 * PLACEMENT. Bottom right from `lg` up, above the page but below the header
 * and its overlays (z-30 against the header's z-50), so opening search covers
 * it rather than leaving it floating on top. The offset still reads
 * `env(safe-area-inset-*)` for a large screen with an inset of its own.
 * At the foot of the page it would sit on the footer's "Back to top", so that
 * row leaves a right-hand gutter for it from `lg` — see <Footer>. Move this
 * button and that gutter together.
 *
 * IT IS DESKTOP-ONLY. Below `lg` the same destination is <BottomNav>'s fourth
 * slot, and two controls for one action on one screen is the thing the client
 * asked not to have. Neither surface can show without the other being hidden,
 * because both branch on the same `lg`.
 *
 * AND IT NEVER MEETS THE BOOKING BAR. <EventBookingBar> is mounted inside a
 * `lg:hidden` wrapper on the event page — it is the phone's persistent action —
 * so the bar and this button are drawn on opposite sides of the same
 * breakpoint and can never cover each other.
 */
export function ContactWidget() {
  const pathname = usePathname();
  if (pathname === CONTACT_HREF || pathname.startsWith(`${CONTACT_HREF}/`)) return null;

  return (
    <Link
      href={CONTACT_HREF}
      aria-label="Contact us"
      /*
        The handle globals.css hides while the hero intro plays (the
        `[data-contact-fab]` rules beside the header's and the footer's).
        Those selectors live in globals.css, and renaming one side without
        the other would leave this standing in the corner of the intro.
        Rename both together.
      */
      data-contact-fab=""
      className={
        /*
          `lg` AND UP ONLY, and that is the whole of the no-duplicates rule.
          Below `lg` the bottom bar carries its own Contact slot, so a
          floating button there would be the second control for one
          destination on the same screen — and it would sit directly over the
          bar's own badge. `lg` is this site's definition of where a phone
          ends: it is where <BottomNav> hides, where the header swaps its
          links back in, and where `--bottom-nav-h` returns to 0.

          Which is also why there is no `--bottom-nav-h` term in the offset
          below: the bar and this button are never on screen together, so
          there is nothing to clear.
        */
        styles.fab + " hidden lg:inline-flex " +
        "fixed right-[max(1.5rem,env(safe-area-inset-right))] z-30 " +
        "bottom-[max(1.5rem,env(safe-area-inset-bottom))] " +
        /*
          A PILL THAT OPENS, NOT A BLOB THAT GROWS. It rests as a blob 56px
          tall — the compact default the client asked for — and the label
          beside the glyph is a `grid-template-columns` of 0fr that becomes
          1fr on hover and focus. Animating the track rather than a width
          means the pill measures itself from the word inside it, so the
          label can be re-worded in one place and nothing has to be re-tuned.
        */
        "group h-14 items-center gap-0 bg-sage pl-[1.125rem] pr-[1.125rem] text-text " +
        "hover:gap-2.5 focus-visible:gap-2.5 " +
        /* The shadow and the resting ring are one `box-shadow` list and they
           live together in `.fab` — a `shadow-[...]` here would replace that
           list rather than add to it, and the ring would go with it. */
        /*
          THREE STATES, NOT ONE. Hover lifts and deepens the shadow, focus
          opens the label and takes the site's own `:focus-visible` outline
          (see the note in ContactWidget.module.css for why that is not a
          Tailwind ring), and the press puts it back down — a control that
          only answers the mouse is a control a keyboard cannot see.
        */
        "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 " +
        "motion-reduce:transition-none"
      }
    >
      {/* The bottom bar's own envelope, at 28px rather than 21 — one mark
          for one destination on both surfaces. `currentColor`, so it takes
          the Charcoal ink from `text-text` above. */}
      <ContactIcon size={28} className="block shrink-0" />

      {/*
        THE LABEL, COLLAPSED UNTIL ASKED FOR. `grid-template-columns: 0fr ->
        1fr` is what animates here: a width transition needs a number somebody
        has to keep in step with the text, and `max-width` overshoots and
        leaves the pill padding a gap it is not filling. The span inside needs
        `min-w-0` or the grid refuses to crush it.

        `aria-hidden`, because the link already carries the same words as its
        accessible name — without it a screen reader hears them twice.
      */}
      <span
        aria-hidden
        className={
          "grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-soft " +
          "group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] motion-reduce:transition-none"
        }
      >
        <span className="min-w-0 whitespace-nowrap text-action font-medium uppercase tracking-eyebrow">
          Contact us
        </span>
      </span>
    </Link>
  );
}
