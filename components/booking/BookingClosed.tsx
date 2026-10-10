import { Reveal } from "@/components/motion/Reveal";
import { BlobButton } from "@/components/ui/BlobButton";

/**
 * Online bookings are closed — what every booking surface shows instead of
 * a form while `booking-settings.bookingsOpen` is off (SPEC §C.3).
 *
 * The admin writes the sentence (`closedMessage`, "Online bookings open
 * soon.") and the way out (`closedCtaLabel` → `closedCtaLink`, "Enquire" →
 * /contact by default). One sentence and one button, because the visitor
 * can do exactly one useful thing here: ask. Staff still take bookings at
 * the desk while this shows, which is why nothing here says the date is
 * unavailable — only that it cannot be booked online.
 *
 * No hooks and no directive: the book page and checkout (both server pages)
 * render it, and so would a client component.
 */
export function BookingClosed({
  heading = "Booking Opens Soon.",
  message,
  ctaLabel,
  ctaHref,
  className,
}: {
  heading?: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}) {
  return (
    <Reveal className={className ?? "mt-12 md:mt-14"}>
      <h1 className="text-h1 font-light tracking-[-0.02em]">{heading}</h1>
      <p role="status" className="mt-5 max-w-[34rem] text-body text-text/80">
        {message}
      </p>
      <BlobButton href={ctaHref} className="mt-9 justify-center px-8 py-5">
        {ctaLabel}
      </BlobButton>
    </Reveal>
  );
}
