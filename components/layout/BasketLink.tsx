"use client";

import Link from "next/link";

import { useCart } from "@/lib/cart";

/**
 * A held booking, and the way back to it.
 *
 * Renders nothing until there is something to return to. A basket sitting
 * permanently in the corner belongs to a shop; this studio sells one Saturday
 * morning at a time, and an empty icon would be a promise of commerce the rest
 * of the page is carefully not making.
 *
 * It is the only link to `/checkout` anywhere in the chrome. Before it, the
 * page was reachable exactly once — immediately after the booking step — and a
 * visitor who navigated away had no route back to a booking they had started.
 */
export function BasketLink() {
  const { places } = useCart();

  if (places === 0) return null;

  return (
    <Link
      href="/checkout"
      className="group inline-flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-current"
    >
      <span className="border-b border-current/40 pb-1 transition-colors duration-300 ease-soft group-hover:border-current">
        Booking
      </span>
      {/*
        The count is the point of the link, so it is announced rather than left
        as a decorative bubble beside a word.
      */}
      <span className="rounded-pill bg-current/15 px-2 py-0.5 tabular-nums">
        {places}
        {/* "Places" would be wrong the moment a pass is in the basket, which
            holds no place until it is redeemed. This counts both. */}
        <span className="sr-only"> in your booking</span>
      </span>
    </Link>
  );
}
