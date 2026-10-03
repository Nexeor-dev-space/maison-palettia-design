import styles from "@/components/layout/WhatsAppWidget.module.css";
import { WHATSAPP } from "@/lib/constants";

/**
 * The floating WhatsApp action.
 *
 * RENDERS NOTHING UNTIL IT IS CONFIGURED. `WHATSAPP.number` is null — there is
 * no WhatsApp number anywhere in this project — and a floating button that
 * opens a chat with nobody is a broken control, not a placeholder. The same
 * rule the footer already applies to social links: nothing looks clickable
 * that is not. See the constant for the one-line change that switches it on.
 *
 * Ground is Deep Lilac rather than WhatsApp's own green. The green would be
 * the one colour on the page from outside the palette and would read as a
 * plugin bolted onto the site; the glyph is recognisable on its own, and the
 * brand ground keeps it part of the Maison rather than an advert for someone
 * else's product. Cream on Deep Lilac measures 5.1:1, clear of the 3:1 a
 * graphical control owes.
 *
 * PLACEMENT. Bottom right from `lg` up, above the page but below the header
 * and its overlays (z-30 against the header's z-50), so opening search covers
 * it rather than leaving it floating on top. The offset still reads
 * `env(safe-area-inset-*)` for a large screen with an inset of its own.
 *
 * IT IS DESKTOP-ONLY NOW. Below `lg` the same action lives in <BottomNav>'s
 * fourth slot, and two controls for one action on one screen is the thing the
 * client asked not to have. Neither surface can show it without the other
 * being hidden, because both branch on the same `lg`.
 *
 * TODO(phase 6): the event detail page gains a sticky booking bar along the
 * bottom edge. When it does, this has to lift above it or hide on that route —
 * a chat button must never sit on top of the booking action.
 */
export function WhatsAppWidget() {
  const { number, greeting } = WHATSAPP;
  if (!number) return null;

  const href = greeting
    ? `https://wa.me/${number}?text=${encodeURIComponent(greeting)}`
    : `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      /* The handle globals.css hides while the hero intro plays. */
      data-whatsapp-fab=""
      className={
        /*
          `lg` AND UP ONLY, and that is the whole of the no-duplicates rule.
          Below `lg` the bottom bar carries its own WhatsApp slot, so a
          floating button there would be the second control for one action on
          the same screen — and it would sit directly over the bar's own
          badge. `lg` is this site's definition of where a phone ends: it is
          where <BottomNav> hides, where the header swaps its links back in,
          and where `--bottom-nav-h` returns to 0.

          Which also retires the `--bottom-nav-h` term that used to be in the
          offset below: the bar and this button can no longer be on screen
          together, so there is nothing to clear.
        */
        styles.fab + " hidden lg:inline-flex " +
        "fixed right-[max(1.5rem,env(safe-area-inset-right))] z-30 " +
        "bottom-[max(1.5rem,env(safe-area-inset-bottom))] " +
        /*
          A PILL THAT OPENS, NOT A CIRCLE THAT GROWS. It rests as a 56px
          circle — the compact default the client asked for — and the label
          beside the glyph is a `grid-template-columns` of 0fr that becomes
          1fr on hover and focus. Animating the track rather than a width
          means the pill measures itself from the word inside it, so the
          label can be re-worded in one place and nothing has to be re-tuned.
        */
        "group h-14 items-center gap-0 bg-primary pl-[1.125rem] pr-[1.125rem] text-on-primary " +
        "hover:gap-2.5 focus-visible:gap-2.5 " +
        // Charcoal Slate at 18%, through the token. It was rgba(35,31,32,.18) —
        // the near-black the palette dropped for not being in the guidelines,
        // left behind in a shadow where nobody looks for a colour.
        "shadow-[0_6px_20px_color-mix(in_oklab,var(--color-text)_18%,transparent)] " +
        "hover:shadow-[0_10px_28px_color-mix(in_oklab,var(--color-text)_26%,transparent)] " +
        /*
          THREE STATES, NOT ONE. Hover lifts and deepens the shadow, focus
          draws the site's own ring rather than the browser's, and the press
          puts it back down — a control that only answers the mouse is a
          control a keyboard cannot see.
        */
        "outline-none ring-offset-2 ring-offset-surface focus-visible:ring-2 focus-visible:ring-primary " +
        "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 " +
        "motion-reduce:transition-none"
      }
    >
      {/* The WhatsApp glyph. Inlined rather than imported: lucide-react carries
          no brand marks, and one path is not worth a dependency. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-7"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>

      {/*
        THE LABEL, COLLAPSED UNTIL ASKED FOR. `grid-template-columns: 0fr ->
        1fr` is what animates here: a width transition needs a number somebody
        has to keep in step with the text, and `max-width` overshoots and
        leaves the pill padding a gap it is not filling. The span inside needs
        `min-w-0` or the grid refuses to crush it.

        `aria-hidden`, because the anchor already carries the same words as its
        accessible name — without it a screen reader hears them twice.
      */}
      <span
        aria-hidden
        className={
          "grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-soft " +
          "group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] motion-reduce:transition-none"
        }
      >
        <span className="min-w-0 whitespace-nowrap text-action font-semibold uppercase tracking-eyebrow">
          Chat with us
        </span>
      </span>
    </a>
  );
}
