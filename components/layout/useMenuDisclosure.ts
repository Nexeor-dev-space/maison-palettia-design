"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The behaviour every panel that hangs off the bar shares.
 *
 * Two menus now drop out of the header — the Experiences panel and the Private
 * events one — and the *behaviour* of a menu is the part that is easy to get
 * subtly wrong and expensive to get wrong twice: the grace period that lets a
 * pointer cross the bar's padding, the frame the open has to wait for, Escape
 * outranking focus-to-open, the closed panel staying out of the tab order.
 * Each of those was found by testing rather than by writing, so they live here
 * once and both menus are the same object opening.
 *
 * What a caller still owns: what the panel looks like, where it is positioned,
 * and what is inside it.
 *
 * THE GAP IS WHY THIS NEEDS A DELAY. A panel is `absolute … top-full`, which
 * positions it against the <header> — the nearest positioned ancestor — not
 * against the region, whose own box is the width and height of the trigger
 * word. Between the bottom of that word and the top of the panel lies the
 * bar's own padding, and that strip belongs to the header.
 *
 * `mouseleave` does not fire when the pointer moves into a descendant, so a
 * panel touching the trigger would be fine. Crossing the bar's padding is not:
 * the pointer leaves the region, the menu closes, and it closes before the
 * pointer has travelled far enough to reach the thing it was aiming at. A
 * short grace period fixes it without touching the layout — leaving arms a
 * close, re-entering anywhere in the region or the panel disarms it. 220ms is
 * long enough to cross roughly 40px of padding at an ordinary pointer speed
 * and short enough that a menu left behind still feels like it shut promptly.
 *
 * Escape and an outside click still close immediately; neither is a near miss.
 */
export function useMenuDisclosure(onOpenChange?: (open: boolean) => void) {
  const [isOpen, setIsOpen] = useState(false);
  /** Mounted on the first open; never unmounted after, so later opens animate. */
  const [mounted, setMounted] = useState(false);
  /** The visual state, set one frame behind `isOpen` — see the effect below. */
  const [shown, setShown] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
    ESCAPE HAS TO OUTRANK FOCUS-TO-OPEN, AND IT DID NOT.

    The region opens on focus, which is how a keyboard visitor gets into the
    panel at all. Escape closes the menu and then puts focus back on the
    trigger, so that they are not dropped at the top of the document — and that
    focus lands inside the region, fires the same handler, and the menu they
    just dismissed opens again. Measured: `aria-expanded` was still "true" one
    frame after Escape.

    Raised for exactly the one frame the programmatic focus takes, so the
    handler can tell "focus arrived because the visitor tabbed here" from
    "focus arrived because we put it here".
  */
  const dismissed = useRef(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const report = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      // Closing needs no frame of its own — the panel is already laid out, so
      // the visual state can drop in the same commit that closes it. Only the
      // open is deferred, in the effect below.
      if (!open) setShown(false);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const openNow = useCallback(() => {
    cancelClose();
    setMounted(true);
    report(true);
  }, [cancelClose, report]);

  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => report(false), 220);
  }, [cancelClose, report]);

  const closeNow = useCallback(() => {
    cancelClose();
    report(false);
  }, [cancelClose, report]);

  // A pending close must not outlive the component, or it fires against an
  // unmounted tree on the way to another page.
  useEffect(() => cancelClose, [cancelClose]);

  /*
    ONE FRAME LATER, ON PURPOSE.

    A transition needs two states in two frames. On the first open the panel's
    contents are mounting in the same commit that opens them, so setting the
    open classes now would paint them already open and there would be nothing
    to animate. Two nested frames is the reliable version of "after this one
    has been laid out and painted" — one is enough in Chrome and not in every
    engine. Closing needs no such care: the element is already there.
  */
  useEffect(() => {
    if (!isOpen) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dismissed.current = true;
      closeNow();
      trigger.current?.focus();
      requestAnimationFrame(() => {
        dismissed.current = false;
      });
    };

    // A click anywhere else dismisses it — including on the page behind, which
    // is what someone expects when they have decided against the menu.
    const onPointerDown = (event: PointerEvent) => {
      if (!region.current?.contains(event.target as Node)) closeNow();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, closeNow]);

  /** Spread onto the region that wraps the trigger and the panel. */
  const regionProps = {
    ref: region,
    onMouseEnter: openNow,
    onMouseLeave: closeSoon,
    /*
      A LINK INSIDE THE PANEL HAS TO CLOSE IT, AND NOTHING ELSE DID.

      The outside-click handler above only fires for a pointerdown the region
      does NOT contain, which is the whole point of it — and every link in the
      panel is inside the region. The header is in the layout, so it survives a
      client-side navigation with its state intact: the visitor picked an
      activity, arrived on that activity's page, and found the menu they had
      just used still hanging open over it.

      `click` rather than `pointerdown`: the panel must not be dismantled
      before the anchor's own default action has been dispatched. By the time
      this fires the click has already bubbled through the link — React
      dispatches to the deeper handler first — so Next has the navigation and
      this only has to put the menu away.

      It also covers the case a route watcher would miss: following a link to
      the page you are already on, where the path never changes and the panel
      would sit there open having apparently done nothing.
    */
    onClick: (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a[href]")) closeNow();
    },
    // Fires when focus leaves the region entirely, which is how a keyboard
    // visitor tabbing past the last item closes it. No grace period here —
    // focus does not drift across a gap the way a pointer does.
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) closeNow();
    },
    onFocus: () => {
      // Not when Escape put the focus here — see `dismissed` above.
      if (!dismissed.current) openNow();
    },
  };

  return { isOpen, mounted, shown, trigger, openNow, closeSoon, closeNow, regionProps };
}
