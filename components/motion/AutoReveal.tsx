"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * ==========================================================================
 * Scroll reveals for everything that does not already have one
 * ==========================================================================
 *
 * The client's ask, with lusion.co as the reference: every piece of content
 * and every card should arrive as it is scrolled to, not just sit there. The
 * site already reveals a great deal through <Reveal> and <Stagger> — the
 * upgraded `fadeUp` in lib/motion.ts carries those — but whatever a section
 * did not wrap in one simply appeared. This fills those gaps across every
 * page without each section having to be rewritten.
 *
 * WHAT IT PICKS. Inside <main>: headings, paragraphs, list items, articles,
 * figures, block-level links and buttons, images, tables, forms — and of
 * nested candidates only the OUTERMOST, so a card arrives as one object and
 * its title does not then arrive a second time inside it.
 *
 * WHAT IT LEAVES ALONE, and each of these is a rule rather than a taste:
 *   - anything inside, or holding, a [data-reveal] — <Reveal> already owns it;
 *   - the header, the footer, navigation and dialogs;
 *   - anything under a sticky or fixed ancestor — the homepage's held frame,
 *     sticky bars — or inside a sideways-scrolling track (a carousel), whose
 *     movement is the choreography already;
 *   - anything on screen, or above it, when the page is read: hiding what a
 *     visitor can already see would make the page blink. Only what is still
 *     below the fold waits to be revealed;
 *   - inline elements, which cannot be moved, and anything already
 *     translucent, whose own opacity a fade would overwrite;
 *   - [data-no-reveal], the explicit opt-out.
 *
 * HOW IT MOVES — the Lusion register, in this site's brand: unhurried, on a
 * soft ease-out, with a stagger across siblings that arrive together.
 *   headings ... rise with a slight lean that straightens as they land
 *   cards ...... rise and grow the last few percent into place
 *   text ....... rise
 *   photographs  in a frame that clips them, settle out of a gentle zoom
 *
 * THE WEB ANIMATIONS API, NOT CLASSES. The movement is `composite: "add"`,
 * added to whatever transform the element already has — a rotated card stays
 * rotated, a centred badge stays centred — and the animation is cancelled the
 * moment it ends, so nothing is left on the element afterwards: hover states,
 * transitions and the stylesheet are exactly as they were.
 *
 * Off entirely for a reader who has asked for reduced motion. Runs again on
 * every client-side navigation, for the new page.
 */

const CANDIDATES =
  "h1,h2,h3,h4,h5,p,li,article,figure,blockquote,table,form,dl,img,picture,video,a,button,[data-card]";

const SKIP_ANCESTORS = "header,footer,nav,[role=dialog],[aria-modal=true],[data-no-reveal],[data-hero-intro]";

type Kind = "heading" | "card" | "text" | "photo";

const EASE = "cubic-bezier(0.22, 0.8, 0.28, 1)";

const MOTION: Record<Kind, { from: string; duration: number }> = {
  heading: { from: "translateY(46px) skewY(2.2deg)", duration: 1100 },
  card: { from: "translateY(70px) scale(0.965)", duration: 1200 },
  text: { from: "translateY(34px)", duration: 1000 },
  photo: { from: "scale(1.16)", duration: 1500 },
};

/** Between siblings that come into view together. */
const STEP_MS = 90;
const MAX_STEPS = 6;

function kindOf(el: Element): Kind {
  const tag = el.tagName;
  if (tag === "H1" || tag === "H2" || tag === "H3") return "heading";
  if (tag === "IMG" || tag === "PICTURE" || tag === "VIDEO") {
    const parent = el.parentElement;
    const clip = parent ? getComputedStyle(parent).overflow : "visible";
    return clip === "hidden" || clip === "clip" ? "photo" : "card";
  }
  if (tag === "LI" || tag === "ARTICLE" || tag === "FIGURE" || tag === "A" || tag === "BUTTON" || el.hasAttribute("data-card"))
    return "card";
  return "text";
}

export function AutoReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof Element.prototype.animate !== "function") return;

    const held = new Map<Element, Animation[]>();
    let io: IntersectionObserver | null = null;

    /* Sticky, fixed or a sideways track anywhere between the element and <main> — memoised per ancestor. */
    const pinned = new WeakMap<Element, boolean>();
    const underPin = (el: Element, main: Element): boolean => {
      const chain: Element[] = [];
      let node: Element | null = el.parentElement;
      let answer = false;
      while (node && node !== main) {
        const known = pinned.get(node);
        if (known !== undefined) {
          answer = known;
          break;
        }
        chain.push(node);
        const style = getComputedStyle(node);
        // A sideways track (a carousel) is the other kind of choreography: its
        // off-screen cards never cross the viewport on a vertical scroll, so
        // they would wait hidden until swiped to, and the track already
        // brings its cards in as it moves.
        if (style.position === "sticky" || style.position === "fixed" || style.overflowX === "auto" || style.overflowX === "scroll") {
          answer = true;
          break;
        }
        node = node.parentElement;
      }
      for (const n of chain) pinned.set(n, answer);
      return answer;
    };

    const release = (el: Element) => {
      held.get(el)?.forEach((animation) => animation.cancel());
      held.delete(el);
      el.removeAttribute("data-auto-reveal");
    };

    const start = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const fold = window.innerHeight;

      for (const el of main.querySelectorAll<HTMLElement>(CANDIDATES)) {
        // Only the outermost candidate: a chosen ancestor already carries this one.
        if (el.parentElement?.closest("[data-auto-reveal]")) continue;
        if (el.closest("[data-reveal]") || el.querySelector("[data-reveal]")) continue;
        if (el.closest(SKIP_ANCESTORS)) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) continue;
        if (rect.top < fold) continue; // on screen or above it: never hide what can be seen

        const style = getComputedStyle(el);
        if (style.display.startsWith("inline") && style.display !== "inline-block" && style.display !== "inline-flex") continue;
        if (style.display === "contents" || style.visibility === "hidden" || Number(style.opacity) < 0.99) continue;
        if (underPin(el, main)) continue;

        const kind = kindOf(el);
        const { from, duration } = MOTION[kind];
        const timing: KeyframeAnimationOptions = { duration, easing: EASE, fill: "backwards" };
        const move = el.animate([{ transform: from }, { transform: "none" }], { ...timing, composite: "add" });
        const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: Math.round(duration * 0.75) });
        move.pause();
        fade.pause();
        el.setAttribute("data-auto-reveal", kind);
        held.set(el, [move, fade]);
      }

      io = new IntersectionObserver(
        (entries) => {
          // Siblings that arrive in one batch are staggered, in reading order.
          const steps = new Map<Element | null, number>();
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            const animations = held.get(el);
            io?.unobserve(el);
            if (!animations) continue;
            const parent = el.parentElement;
            const step = steps.get(parent) ?? 0;
            steps.set(parent, step + 1);
            const delay = Math.min(step, MAX_STEPS) * STEP_MS;
            for (const animation of animations) {
              animation.effect?.updateTiming({ delay });
              animation.play();
            }
            // Nothing is left on the element once it has landed.
            Promise.all(animations.map((animation) => animation.finished))
              .then(() => release(el))
              .catch(() => {});
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      for (const el of held.keys()) io.observe(el);
    };

    // Two frames: the new page is laid out and painted before anything is measured.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(start);
    });

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      io?.disconnect();
      // Leaving a page, or a development remount: everything shows, as it was.
      for (const el of [...held.keys()]) release(el);
    };
  }, [pathname]);

  return null;
}
