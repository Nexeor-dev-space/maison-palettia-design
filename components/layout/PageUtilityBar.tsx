import Link from "next/link";

import { Container } from "@/components/ui/Container";
import type { NavItem } from "@/types";

export interface PageUtilityBarProps {
  /** One short line of orientation. Optional; the bar is fine without it. */
  note?: string;
  /** Existing routes only. Never a booking or payment action — see below. */
  links: NavItem[];
}

/**
 * A compact strip at the foot of a page, between the content and the footer.
 *
 * WHAT IT IS FOR. Two pages ask a visitor to commit — the event page and
 * checkout — and on both of them the useful secondary questions ("what else is
 * on?", "who do I ask?", "what happened to my last booking?") have nowhere to
 * go, because answering them in the page body would compete with the thing the
 * page is for. This is where they go: after the decision, before the footer.
 *
 * WHAT IT IS NOT. It never carries a booking or payment action. Both host
 * pages already have exactly one primary action each — <EventBookingBar> and
 * the checkout's own submit — and a second one here would be the page arguing
 * with itself at the last moment. Everything in it is a quiet link.
 *
 * NOT STICKY, DELIBERATELY. It sits in the page's normal flow. The event page
 * already has a floating bar that retracts at a sentinel so it never meets the
 * fixed footer behind it; a second pinned element would reintroduce exactly
 * the collision that mechanism exists to avoid, and on checkout it would hover
 * over a form someone is trying to fill in.
 *
 * It takes the footer's own Light Sage ground so the page reads as arriving at
 * the footer rather than as gaining a widget — the arch below continues the
 * same colour.
 */
export function PageUtilityBar({ note, links }: PageUtilityBarProps) {
  if (links.length === 0) return null;

  return (
    // Full-bleed: the gutter is rebuilt inside by <Container>, so the band
    // runs edge to edge the way the footer under it does.
    <section
      aria-label="More from Maison Palettia"
      className="-mx-gutter mt-16 bg-sage/45 py-7 md:mt-20 md:py-8"
    >
      <Container>
        <div className="mx-auto flex max-w-site flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          {/* `text-body`, not `text-fine`. This is the reassurance a visitor reads
              before deciding to book — "everything is provided, no experience
              needed" — and it was set at 13px, the smallest size in the scale
              and the one meant for legal notes and captions. The client has
              said twice that copy on this site is set too small. */}
          {note ? <p className="max-w-[38rem] text-body leading-[1.7] text-text/80">{note}</p> : null}

          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "group -my-1.5 inline-flex items-center gap-2 py-1.5 text-fine font-medium " +
                    "uppercase tracking-[0.12em] text-text transition-colors duration-300 ease-soft"
                  }
                >
                  <span className="border-b border-text/25 pb-1 transition-colors duration-300 ease-soft group-hover:border-primary">
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className="text-primary transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-0.5"
                  >
                    &#8594;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
