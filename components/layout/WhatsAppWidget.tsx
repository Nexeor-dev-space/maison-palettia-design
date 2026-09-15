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
 * PLACEMENT. Bottom right, above the page but below the header and its
 * overlays (z-30 against the header's z-50), so opening the mobile menu or
 * search covers it rather than leaving it floating on top. The offset reads
 * `env(safe-area-inset-*)` so it clears the home indicator on a modern phone.
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
      aria-label="Message Maison Palettia on WhatsApp"
      className={
        "fixed right-[max(1rem,env(safe-area-inset-right))] z-30 " +
        "bottom-[max(1rem,env(safe-area-inset-bottom))] " +
        "inline-flex size-12 items-center justify-center rounded-pill bg-primary text-cream " +
        "shadow-[0_6px_20px_rgba(35,31,32,0.18)] " +
        "transition-transform duration-300 ease-soft " +
        "motion-safe:hover:-translate-y-0.5 md:size-14 " +
        "md:right-[max(1.5rem,env(safe-area-inset-right))] md:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
      }
    >
      {/* The WhatsApp glyph. Inlined rather than imported: lucide-react carries
          no brand marks, and one path is not worth a dependency. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6 md:size-7"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>
    </a>
  );
}
