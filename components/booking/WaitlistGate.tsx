"use client";

import { useSyncExternalStore, type ReactNode } from "react";

/**
 * Waitlist form, or — for someone holding a waitlist offer — the booking form.
 *
 * A full session's book page shows <WaitlistForm>. The "a seat is free"
 * email links to the same page with `?w=<token>` (SPEC §H.11), and that
 * visitor should see the booking form instead: the token lets checkout take
 * the freed seat while the session is still marked waitlist.
 *
 * The page is prerendered, so the query string is read here, in the
 * browser, through an external store: the server and the first client
 * render both say "no offer" (the waitlist), and an offer swaps in after
 * hydration rather than as a mismatch. The token itself is checked by the
 * server at checkout — this only chooses which form to show.
 */
export function WaitlistGate({ waitlist, book }: { waitlist: ReactNode; book: ReactNode }) {
  const hasOffer = useSyncExternalStore(
    subscribeNever,
    () => /^[A-Za-z0-9_-]{8,64}$/.test(new URLSearchParams(window.location.search).get("w") ?? ""),
    () => false,
  );
  return <>{hasOffer ? book : waitlist}</>;
}

/** The address does not change under a mounted page without a navigation, which remounts it. */
function subscribeNever() {
  return () => {};
}
