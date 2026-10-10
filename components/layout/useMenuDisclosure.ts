"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The behaviour every panel that hangs off the bar shares.
 *
 * Three menus now drop out of the header — Experiences, Private events and
 * About — and the *behaviour* of a menu is the part that is easy to get
 * subtly wrong and expensive to get wrong twice: the grace period that lets a
 * pointer cross the bar's padding, the frame the open has to wait for, Escape
 * outranking focus-to-open, the closed panel staying out of the tab order,
 * a click that must not undo the hover before it. Each of those was found by
 * testing rather than by writing, so they live here once and all three menus
 * are the same object opening.
 *
 * What a caller still owns: what the panel looks like, where it is positioned,
 * and what is inside it.
 *
 * THE GAP IS WHY THIS NEEDS A DELAY. A panel is `absolute … top-full`, which
 * positions it against the <header> — the nearest positioned ancestor — not
 * against the region, whose own box is only the trigger's column of the bar:
 * measured at 1440, "Experiences" is a 120x88 region over a panel 1379px
 * wide. A pointer heading for anything in the panel that is not directly
 * under the word steps sideways out of that column while it is still in the
 * bar, and that part of the bar belongs to the header.
 *
 * `mouseleave` does not fire when the pointer moves into a descendant, so a
 * panel touching the trigger would be fine. Crossing the bar is not: the
 * pointer leaves the region, the menu closes, and it closes before the
 * pointer has travelled far enough to reach the thing it was aiming at. A
 * short grace period fixes it without touching the layout — leaving arms a
 * close, re-entering anywhere in the region or the panel disarms it. 220ms is
 * long enough to cross roughly 40px of bar at an ordinary pointer speed and
 * short enough that a menu left behind still feels like it shut promptly.
 *
 * Escape and an outside click still close immediately; neither is a near miss.
 *
 * ==========================================================================
 * HOVER OPENS IN PASSING; A CLICK ASKS FOR IT — and the two used to cancel
 * ==========================================================================
 *
 * The trigger's click was a plain toggle, `isOpen ? close : open`, sitting on
 * top of a region that had ALREADY opened on the way to that click. Measured
 * at 1440 with a mouse: hover gave `aria-expanded="true"`, and the click a
 * moment later gave "false" — the menu shut under the very gesture that asked
 * for it. On a touch tablet (1024 and 1180, where this bar shows and the
 * bottom bar does not) it was worse: one tap fires the emulated `mouseenter`,
 * then `focus`, then `click`, all in one gesture, so the first two opened it
 * and the third closed it before a frame was painted. A tap never opened any
 * of the three menus, and the triggers are buttons rather than links, so a
 * tablet had no way into them from the bar at all. Keyboard had the same
 * shape: Tab opened it on focus, and Enter then closed it.
 *
 * WHAT IT DOES NOW, per way in:
 *
 *   mouse .......... hovering the word opens it "in passing"; a click on the
 *                    trigger then KEEPS it open and claims it; a second click
 *                    closes it. Leaving the region still closes it after the
 *                    grace.
 *   touch .......... the emulated hover is ignored outright — a finger has no
 *                    hover, and acting on the fake one is what made the tap
 *                    cancel itself. First tap opens, second tap closes.
 *   keyboard ....... focus opens in passing (unchanged), Enter or Space keeps
 *                    it and a second press closes; ArrowDown opens it and
 *                    moves into the panel's first link.
 *   all three ...... Escape and a press outside close it at once. A press
 *                    INSIDE the panel that is not on a link — its padding, a
 *                    rail heading, the gap between two doors — leaves it
 *                    open; see the note on `onBlur` below for why that needed
 *                    saying.
 *
 * WHY A CLAIM AND NOT A TIMER. The obvious fix is "ignore a close within
 * ~300ms of a hover open", and it fixes the tap — those events land in one
 * gesture — but not the mouse: a visitor who moves onto "Experiences" and
 * then decides to click it does so 400–800ms later, outside any window short
 * enough to still feel like a toggle. What distinguishes the two clicks is
 * not how long the menu has been open but whether anyone has asked for it
 * yet, so that is what is recorded.
 *
 * ==========================================================================
 * ONE PANEL AT A TIME, ACROSS ALL THREE
 * ==========================================================================
 *
 * Each menu used to be its own island, and the grace period made islands
 * overlap. Measured at 1440 with a mouse sliding from "Experiences" to
 * "About": 60ms after arriving, all three triggers said `aria-expanded="true"`
 * — each one passed over was still inside its 220ms — and 600ms later the
 * About panel hung under a bar that had gone transparent. The bar's ground
 * follows ONE shared `onOpenChange` (<HeaderBar>'s `isStrandsOpen`), and the
 * menus left behind reported their late `false` after About had reported its
 * `true`, so the last word was "nothing is open" while something was.
 *
 * So opening one now shuts whichever other is open, at once and before this
 * one reports — `false` then `true`, in that order, every time — and a report
 * that changes nothing is not sent, so a stale timer on a menu that is
 * already shut cannot speak for the bar either. The grace still does its job
 * inside one menu: it was only ever for crossing from a trigger to ITS panel.
 *
 * EXCEPT FROM A PANEL THAT HOLDS THE FOCUS. Shutting a panel makes it
 * `inert`, and a focused element inside an inert one is blurred to <body> —
 * measured at 1440: focus on About, ArrowDown onto "About the Maison", then
 * the mouse passing over "Experiences" swapped the panels and left
 * `document.activeElement` on BODY, so the next Tab started from the top of
 * the document. A pointer passing a word is not a request; a keyboard
 * visitor standing in a panel is. So a hover neither opens another menu over
 * a panel that holds focus nor lets that panel's own grace timer shut it —
 * `holdsFocus` below. Focus leaving it, Escape, a press outside and a click
 * on another trigger all still close it, because each of those moves the
 * focus (or the visitor) on first.
 *
 * THE WORD OPENS IT, NOT ITS COLUMN — which is what made that safe. Each
 * region is the full 88px of the bar, and the panels all hang 2px under it.
 * With the whole column opening on hover, a pointer cutting diagonally from
 * "About" down to "About the Maison" (the leftmost door, under "Experiences")
 * passed through the bottom of "Private events"' column on the way, and
 * under one-at-a-time that swapped the panel out from under it: measured,
 * About shut and Private events opened. So only the trigger itself — the
 * 39px word — opens on hover; the rest of the column, and the panel, only
 * keep an open menu open. The 25px strip between the words and the panels
 * is free to cross, which is where a pointer heading down goes.
 */
/*
  The menu that is open right now, whichever of the three it is — or none.
  Module scope because the three are siblings with no parent that owns their
  state, and it is only ever written from an event, never during a render,
  so the server never sees it hold anything.
*/
interface MenuEntry {
  close: () => void;
  /** Whether focus is inside this menu's panel — see "EXCEPT FROM A PANEL". */
  holdsFocus: () => boolean;
}
let openMenu: MenuEntry | null = null;

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
  /*
    THE OPEN STATE AS OF RIGHT NOW, not as of the last render. One tap fires
    `mouseenter`, `focus` and `click` back to back, and whether React has
    re-rendered between them depends on each event's priority — so a click
    handler reading `isOpen` from its closure can be reading a state two
    events old. Every decision below reads this instead.
  */
  const openRef = useRef(false);
  /*
    Whether the visitor has ASKED for this menu — a click, Enter, Space or
    ArrowDown on the trigger — rather than passed over it. Hover and focus
    open it unclaimed; the first click on an unclaimed open menu claims it
    instead of closing it; only a click on a claimed one closes. Cleared on
    every close. See the note at the top of the file.
  */
  const claimed = useRef(false);
  /*
    The kind of pointer that last came onto the page. A touch is followed by
    emulated mouse events (`mouseenter`, `mouseleave`) that are not hover,
    and the hover handlers have to be able to tell. Pointer events always
    arrive before the mouse events emulated from them, so by the time a
    `mouseenter` lands this already says which it was.
  */
  const pointerType = useRef("mouse");
  /* ArrowDown asks for focus to move into the panel once it is open. */
  const focusFirst = useRef(false);
  /*
    This menu's entry in `openMenu`: a stable identity for the comparison,
    with its `close` pointed at `closeNow` and its `holdsFocus` at the one
    below by an effect once those exist.
  */
  const self = useRef<MenuEntry>({ close: () => {}, holdsFocus: () => false });

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const report = useCallback(
    (open: boolean) => {
      // No change, no report — see "ONE PANEL AT A TIME" at the top. A grace
      // timer firing on a menu something else already shut lands here.
      if (openRef.current === open) return;
      openRef.current = open;
      if (open) {
        // The other one first, so the shared `onOpenChange` hears its
        // `false` before this `true` and ends on the truth.
        if (openMenu && openMenu !== self.current) openMenu.close();
        openMenu = self.current;
      } else {
        claimed.current = false;
        if (openMenu === self.current) openMenu = null;
      }
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

  /*
    Focus is in the PANEL — anywhere in the region but the trigger. The
    trigger sits outside <MenuCard>, which is the part that goes `inert` when
    the menu shuts, so a focused trigger loses nothing and does not count.
    See "EXCEPT FROM A PANEL THAT HOLDS THE FOCUS" at the top.
  */
  const holdsFocus = useCallback(() => {
    const active = document.activeElement;
    return Boolean(active && active !== trigger.current && region.current?.contains(active));
  }, []);

  /*
    HOVER, BUT ONLY A REAL ONE. These are what the trigger, the region and
    the card wire to the pointer arriving and leaving. A touch's emulated
    `mouseenter` is not somebody resting a pointer on the word, and a touch's
    `mouseleave` — which fires when the finger next lands anywhere else — is
    not somebody moving away from it; the tap and the outside-press handler
    below speak for a finger instead.

    `hoverOpen` is the word's: it opens. `hoverStay` is the rest of the
    column's and the panel's: it only disarms a pending close on a menu that
    is already open — see "THE WORD OPENS IT" at the top.
  */
  const hoverOpen = useCallback(() => {
    if (pointerType.current === "touch") return;
    // Passing over this word must not shut a panel the keyboard is in.
    if (openMenu && openMenu !== self.current && openMenu.holdsFocus()) return;
    openNow();
  }, [openNow]);

  const hoverStay = useCallback(() => {
    if (pointerType.current !== "touch" && openRef.current) cancelClose();
  }, [cancelClose]);

  const hoverClose = useCallback(() => {
    // Nor may the pointer drifting out of the region shut it from under them.
    if (pointerType.current === "touch" || holdsFocus()) return;
    closeSoon();
  }, [closeSoon, holdsFocus]);

  /** The first link in the panel — the region holds the trigger and the card,
      and the trigger is a button, so the first anchor in it is the panel's. */
  const focusFirstLink = useCallback(() => {
    region.current?.querySelector<HTMLElement>("a[href]")?.focus();
  }, []);

  /*
    THE TRIGGER'S CLICK, which is also Enter and Space — a <button> turns
    both into a click. Closed: open it, claimed. Open in passing: claim it
    and leave it open. Open and already claimed: close it. Reads the refs,
    not the render, for the reason given on `openRef`.
  */
  const onTriggerClick = useCallback(() => {
    if (!openRef.current) {
      claimed.current = true;
      openNow();
      return;
    }
    if (!claimed.current) {
      claimed.current = true;
      cancelClose();
      return;
    }
    closeNow();
  }, [openNow, cancelClose, closeNow]);

  /*
    ArrowDown is the disclosure-menu convention for "take me into it". Open
    already (focus will have opened it in passing): move focus now. Closed:
    open it and let the effect below move focus once the panel has rendered
    and lost its `inert` — focusing an inert element does nothing.
  */
  const onTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      claimed.current = true;
      if (openRef.current) {
        cancelClose();
        focusFirstLink();
        return;
      }
      focusFirst.current = true;
      openNow();
    },
    [cancelClose, focusFirstLink, openNow],
  );

  useEffect(() => {
    if (!isOpen || !focusFirst.current) return;
    focusFirst.current = false;
    focusFirstLink();
  }, [isOpen, focusFirstLink]);

  /* See `pointerType`. Capture, so nothing under it can stop it hearing. */
  useEffect(() => {
    const note = (event: PointerEvent) => {
      pointerType.current = event.pointerType;
    };
    const options = { capture: true, passive: true } as const;
    window.addEventListener("pointerover", note, options);
    window.addEventListener("pointerdown", note, options);
    return () => {
      window.removeEventListener("pointerover", note, options);
      window.removeEventListener("pointerdown", note, options);
    };
  }, []);

  // A pending close must not outlive the component, or it fires against an
  // unmounted tree on the way to another page.
  useEffect(() => cancelClose, [cancelClose]);

  /* Wire this menu's entry to its own close — again whenever `closeNow` is
     rebuilt, which an inline `onOpenChange` would do every render — and to
     its own focus check, which never is. */
  useEffect(() => {
    self.current.close = closeNow;
    self.current.holdsFocus = holdsFocus;
  }, [closeNow, holdsFocus]);

  /* And take it out of `openMenu` on the way out, so a later open never calls
     into an unmounted menu. Mount-only, so a rebuilt `closeNow` above cannot
     drop an open menu from the record. */
  useEffect(() => {
    const entry = self.current;
    return () => {
      if (openMenu === entry) openMenu = null;
    };
  }, []);

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
    /* Keeps, never opens: the column under and around the word is the way
       down to the panel, not a trigger — see "THE WORD OPENS IT". */
    onMouseEnter: hoverStay,
    onMouseLeave: hoverClose,
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
    /*
      FOCUS MOVING TO SOMETHING OUTSIDE THE REGION — which is how a keyboard
      visitor tabbing past the last item closes it. No grace period here:
      focus does not drift across a gap the way a pointer does.

      ONLY TO SOMETHING. This was "focus is no longer in here", and that
      includes focus going nowhere: press anything in the panel that cannot
      take focus — its padding, the gap between two doors, a rail heading
      such as "Create Anytime" or the line under it — and the browser moves
      focus to <body>, `relatedTarget` is null, and the menu shut under the
      press. It used to take a keyboard visitor to get there; once a click or
      a tap opened the menu (and focused the trigger, as Chrome, Edge,
      Firefox and Android do), every pointer visitor did. Measured on all
      three menus, mouse at 1440 and touch at 1024: open, press the panel's
      padding, `aria-expanded` back to "false" and focus on BODY — and about
      a fifth of each panel's area is that kind of surface.

      A null `relatedTarget` is not the keyboard leaving: Tab out of a panel
      always lands on something, because the header is never the last thing
      on a page. The press that really is outside the region is the document
      `pointerdown` listener's to close, and it already does.
    */
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !event.currentTarget.contains(next)) closeNow();
    },
    onFocus: () => {
      // Not when Escape put the focus here — see `dismissed` above.
      if (!dismissed.current) openNow();
    },
  };

  /** Spread onto the trigger <button>; the caller keeps the aria attributes. */
  const triggerProps = {
    ref: trigger,
    /* The one hover that opens. */
    onMouseEnter: hoverOpen,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
  };

  /*
    Spread onto <MenuCard>. The same filtered hover as the region: crossing
    from the bar into the card disarms the pending close, and a finger
    landing in or out of the card does not arm one. It keeps an open panel
    and never opens a shut one — a shut card takes no pointer anyway.
  */
  const cardProps = {
    onMouseEnter: hoverStay,
    onMouseLeave: hoverClose,
  };

  return { isOpen, mounted, shown, closeNow, regionProps, triggerProps, cardProps };
}
