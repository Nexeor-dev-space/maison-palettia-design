"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Container } from "@/components/ui/Container";
import { Eyebrow, forScript } from "@/components/ui/SectionHeader";
import styles from "@/components/gallery/GalleryExperience.module.css";
import { cn } from "@/lib/utils";

/* Mount detection without a setState-in-effect: false on the server, true once
   the client is running. The lightbox portals to <body>, which does not exist
   while rendering on the server. */
const subscribeNoop = () => () => {};

/**
 * ==========================================================================
 * THE GALLERY, AS A WALK THROUGH THE STUDIO — see app/gallery/page.tsx
 * ==========================================================================
 *
 * The page is not one grid. It is three collections of real pictures, each
 * laid out as its own composition rather than as the same cells repeated, with
 * a short script or editorial beat between them — the rhythm of moving from one
 * wall to the next rather than scrolling a contact sheet.
 *
 * WHY THIS IS ONE CLIENT COMPONENT. The lightbox runs across every picture on
 * the page in one order, so the index a tile opens has to be global. Owning all
 * three collections here is what lets a tile in the third collection open at
 * the right place in a list that began in the first. The hero and the closing
 * invitation stay in the server page around it, because they are static.
 *
 * NOTHING HERE INVENTS CONTENT. Titles are the activities' own names; the
 * process frames and the finished pieces carry no title because the project
 * records none, and the lightbox shows their own `alt` as the description
 * instead. See the page for where each set comes from.
 */

export interface GalleryItem {
  src: string;
  alt: string;
  /** The activity's own name. Absent for the process frames and keepsakes. */
  title?: string;
  /** "Any time" / "Scheduled" / "Coming soon". Absent where there is none. */
  meta?: string;
  /** The collection it belongs to, shown as the lightbox's category line. */
  collection: string;
}

export interface GalleryCollection {
  id: "make" | "making" | "keep";
  /** "Collection 01" — a folio, set in the sans so its digits are real. */
  folio: string;
  /** The script heading, already chosen to clear Hapsha's gaps (no I, no 7-9). */
  heading: string;
  /** One descriptive line. Factual, never a claim. */
  lede: string;
  ground: "surface" | "sage" | "cream";
  items: GalleryItem[];
}

/* ==========================================================================
   THE COMPOSITIONS — hand-set per collection, not an algorithm
   ==========================================================================

   Each string is the full responsive span for one picture: two columns on a
   phone (a feature takes both), twelve on a desktop where the real
   art-direction lives. They are complete literals because Tailwind reads the
   source and never sees a class assembled at runtime.

   `make` leads with a tall feature and steps three sizes across two rows.
   `making` opens on a wide frame and closes on a full-width moment. The maths
   is checked: every desktop row adds to twelve. */
const SPANS: Record<GalleryCollection["id"], readonly string[]> = {
  make: [
    "col-span-2 lg:col-span-5 lg:row-span-2",
    "col-span-1 lg:col-span-4",
    "col-span-1 lg:col-span-3",
    "col-span-1 lg:col-span-3",
    "col-span-1 lg:col-span-4",
    "col-span-2 lg:col-span-7",
    "col-span-2 lg:col-span-5",
  ],
  /*
    THE OPENER TAKES TWO ROWS AND THE TAIL IS A TRIO. It used to be a single-row
    8-column opener and a 12-column closer, which at any row height are 3.3:1
    and 4.9:1 — a panorama is a deliberate device but two of them in one
    collection is a letterbox habit. Spanning the opener down a second row
    makes it 929x584, and the six then read as one wide picture with a pair
    beside it and a trio under both. Rows: 8+4, 8+4, 4+4+4 — twelve each.
  */
  making: [
    "col-span-2 lg:col-span-8 lg:row-span-2",
    "col-span-1 lg:col-span-4",
    "col-span-1 lg:col-span-4",
    "col-span-1 lg:col-span-4",
    "col-span-1 lg:col-span-4",
    "col-span-2 lg:col-span-4",
  ],
  keep: [],
};

/* Which picture in each collection gets the lean, and which way it leans. The
   feature carries a doodle on its far corner too — the brand's cut-out at the
   edge of the block, the way the deck hangs them. */
const FEATURE: Record<GalleryCollection["id"], { index: number; tilt: "left" | "right"; mark: DoodleName; color: string } | null> = {
  make: { index: 0, tilt: "left", mark: "splash", color: INK.lilac },
  making: { index: 0, tilt: "right", mark: "starburst", color: INK.terracotta },
  keep: null,
};

/* The ground each section is set on, and the padding it keeps. The order the
   page renders them in — surface, sage, cream, surface, sage — never repeats a
   colour across a seam, so each collection reads as its own room. */
const GROUND: Record<GalleryCollection["ground"], string> = {
  surface: "bg-surface",
  sage: "bg-sage",
  cream: "bg-cream",
};

export function GalleryExperience({ collections }: { collections: GalleryCollection[] }) {
  const flat = collections.flatMap((collection) => collection.items);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback((index: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }, []);

  const go = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + flat.length) % flat.length)),
    [flat.length],
  );

  /* The running start index of each collection in the flat list, so a tile
     opens the lightbox at its true place in the whole gallery. Computed
     purely — a `let` accumulated in a `.map` is a render-time reassignment
     the React Compiler rejects. */
  const starts = collections.map((_, ci) =>
    collections.slice(0, ci).reduce((sum, c) => sum + c.items.length, 0),
  );

  return (
    <>
      {collections.map((collection, ci) => (
        <div key={collection.id}>
          <GallerySection
            collection={collection}
            start={starts[ci]}
            onOpen={open}
          />
          {ci < STATEMENTS.length ? <GalleryStatement {...STATEMENTS[ci]} /> : null}
        </div>
      ))}

      <Lightbox items={flat} index={openIndex} onClose={close} onStep={go} />
    </>
  );
}

/* ==========================================================================
   ONE COLLECTION
   ========================================================================== */

function GallerySection({
  collection,
  start,
  onOpen,
}: {
  collection: GalleryCollection;
  start: number;
  onOpen: (index: number, el: HTMLButtonElement) => void;
}) {
  const framed = collection.id === "keep";
  const feature = FEATURE[collection.id];
  const spans = SPANS[collection.id];

  return (
    <section
      aria-labelledby={`collection-${collection.id}`}
      className={cn(
        "relative isolate overflow-clip",
        GROUND[collection.ground],
        "py-[4rem] md:py-[5.5rem] lg:py-[7rem]",
      )}
    >
      <SectionShapesFor ground={collection.ground} seed={collection.id} />

      <Container className="relative">
        {/* ---- the collection's own head ---- */}
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-[34rem]">
            <Reveal>
              <Eyebrow>{collection.folio}</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2
                id={`collection-${collection.id}`}
                className="heading-script mt-5 pb-[0.26em] text-script-compact text-text"
              >
                {forScript(collection.heading)}
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-2 max-w-[40ch] text-lead text-text/80">
                {collection.lede}
              </p>
            </Reveal>
          </div>
        </div>

        {/* ---- the pictures ---- */}
        {framed ? (
          <Stagger
            as="ul"
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 md:mt-14 md:gap-7"
          >
            {collection.items.map((item, i) => (
              <Reveal as="li" key={item.src} variant="settle" delay={i * 0.08}>
                <FramedTile item={item} index={start + i} i={i} onOpen={onOpen} />
              </Reveal>
            ))}
          </Stagger>
        ) : (
          <Stagger
            as="ul"
            className={cn(
              "mt-10 grid gap-2.5 md:mt-14 md:gap-3.5",
              "grid-cols-2 lg:grid-cols-12",
              /*
                THE ROW IS THE PICTURE'S HEIGHT, and it was set far too short.
                Measured at 1440 before this: a row of 194px against a 4-column
                cell 457px wide is 2.35:1, a 7-column cell 4.17:1 and the
                making collection's wide opener 4.78:1 — letterbox strips
                rather than photographs, which is what the client is looking
                at.

                19.8vw is the figure the old gallery wall arrived at for the
                same grid and the same reason: at 1440 it puts the row at 285,
                so the commonest cell (4 columns, 457 wide) lands at 1.60:1 —
                near enough the 3:2 these photographs were taken at — and the
                tall feature, which spans two rows and the gap, comes out
                575x584, a true portrait. The cap is high enough to stay out of
                the way on an ordinary display and the vw does the work, so a
                cell keeps its proportion instead of flattening as the screen
                grows.
              */
              "auto-rows-[clamp(11rem,52vw,20rem)] lg:auto-rows-[clamp(12rem,19.8vw,24rem)]",
            )}
          >
            {collection.items.map((item, i) => (
              <Reveal
                as="li"
                key={item.src}
                variant="fadeIn"
                delay={Math.min(i, 4) * 0.05}
                className={cn("relative", spans[i] ?? "col-span-1 lg:col-span-4")}
              >
                <Tile
                  item={item}
                  index={start + i}
                  onOpen={onOpen}
                  feature={feature?.index === i ? feature : null}
                />
              </Reveal>
            ))}
          </Stagger>
        )}
      </Container>
    </section>
  );
}

/* ==========================================================================
   A TILE — a picture that opens the lightbox
   ========================================================================== */

function Tile({
  item,
  index,
  onOpen,
  feature,
}: {
  item: GalleryItem;
  index: number;
  onOpen: (index: number, el: HTMLButtonElement) => void;
  feature: { tilt: "left" | "right"; mark: DoodleName; color: string } | null;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(index, e.currentTarget)}
      aria-label={item.title ? `View ${item.title}` : `View picture: ${item.alt}`}
      data-tilt={feature ? feature.tilt : undefined}
      className={cn(styles.tile, "group h-full w-full text-left", feature ? styles.lean : null)}
    >
      <span className={styles.frame}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 46vw, (min-width: 640px) 50vw, 100vw"
          className={styles.image}
        />
      </span>

      {item.title ? (
        <span className={styles.caption}>
          <span className="text-[0.95rem] font-semibold leading-tight">{item.title}</span>
          {item.meta ? (
            <span className="text-[0.7rem] font-medium uppercase tracking-eyebrow text-on-dark/80">
              {item.meta}
            </span>
          ) : null}
        </span>
      ) : null}

      {feature ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-3 z-10 deco-mark w-[3.25rem] rotate-[-8deg] lg:-right-4 lg:-top-4 lg:w-[4.25rem]"
        >
          <DoodleMark name={feature.mark} color={feature.color} treatment="stamp" delay={200} />
        </span>
      ) : null}
    </button>
  );
}

/* A framed, contained picture — the keepsakes, set on a White Rock mat rather
   than bled to the edge, so the finished pieces read as kept things. */
function FramedTile({
  item,
  index,
  i,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  i: number;
  onOpen: (index: number, el: HTMLButtonElement) => void;
}) {
  const tilt = ["lg:rotate-[-1.5deg]", "lg:rotate-[1deg]", "lg:rotate-[-0.6deg]"][i % 3];
  return (
    <button
      type="button"
      onClick={(e) => onOpen(index, e.currentTarget)}
      aria-label={`View picture: ${item.alt}`}
      className={cn(
        "plate group block w-full rounded-[1.25rem] bg-cream p-3 text-left transition-transform duration-[520ms] ease-editorial md:p-3.5",
        "cursor-zoom-in motion-safe:hover:-translate-y-1 lg:hover:rotate-0 motion-reduce:transition-none",
        tilt,
      )}
    >
      <span className={cn(styles.tile, "block aspect-[4/5] w-full")}>
        <span className={styles.frame}>
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(min-width: 640px) 30vw, 92vw"
            className={styles.image}
          />
        </span>
      </span>
    </button>
  );
}

/* ==========================================================================
   A BEAT BETWEEN COLLECTIONS
   ==========================================================================

   Approved copy only. The first is the opening statement's own closer, set in
   the script; the second is the community line, set in the sans because it
   opens on "It's" and Hapsha draws a capital I like a J. */
interface StatementData {
  variant: "script" | "editorial";
  text: string;
  mark: DoodleName;
  color: string;
  ground: "surface" | "sage" | "cream";
}

const STATEMENTS: readonly StatementData[] = [
  {
    variant: "script",
    text: "Come curious. Leave creative.",
    mark: "coral",
    color: INK.lilac,
    ground: "sage",
  },
  {
    variant: "editorial",
    text: "More than something to do, it’s a reason to pause, connect and come back for something new.",
    mark: "wave",
    color: INK.lavender,
    ground: "surface",
  },
];

function GalleryStatement({ variant, text, mark, color, ground }: StatementData) {
  return (
    <section
      className={cn(
        "relative isolate overflow-clip",
        GROUND[ground],
        "py-[4.5rem] md:py-[6rem] lg:py-[7.5rem]",
      )}
    >
      <Container className="relative text-center">
        <span
          aria-hidden
          className="pointer-events-none mx-auto mb-7 block w-[3.5rem] md:mb-9 md:w-[4.5rem]"
        >
          <DoodleMark name={mark} color={color} treatment="draw" delay={120} />
        </span>
        {variant === "script" ? (
          <Reveal>
            <p className="heading-script mx-auto max-w-[18ch] pb-[0.26em] text-script-section text-text">
              {forScript(text)}
            </p>
          </Reveal>
        ) : (
          <Reveal>
            <p className="mx-auto max-w-[24ch] text-[clamp(1.5rem,1.1rem+1.7vw,2.5rem)] font-light leading-[1.3] tracking-[-0.01em] text-text">
              {text}
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

/* ==========================================================================
   SECTION GROUNDS — the brand's cut-outs at the edges, never over a picture
   ==========================================================================

   Which colours show on each ground is measured, and the page comment on the
   old wall recorded it: on Light Sage, Deep Lilac and Charcoal read and the
   pale colours do not; on White Rock, Light Sage vanishes. So the plan is
   chosen per ground. Hidden from the tree, low opacity, behind everything,
   `-z-10`, so no text or picture ever sits on a mark at full strength. */
function SectionShapesFor({
  ground,
  seed,
}: {
  ground: GalleryCollection["ground"];
  seed: string;
}) {
  const marks = SHAPE_PLANS[ground];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
      {marks.map((m, i) => (
        <span
          key={`${seed}-${i}`}
          className="absolute block"
          style={{ top: m.top, bottom: m.bottom, left: m.left, right: m.right, width: m.width, rotate: `${m.rotate}deg`, opacity: m.opacity }}
        >
          <DoodleMark name={m.name} color={m.color} treatment="draw" depth={m.depth} delay={160 + i * 120} />
        </span>
      ))}
    </div>
  );
}

interface ShapePlacement {
  name: DoodleName;
  color: string;
  width: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  opacity: number;
  depth: number;
}

const SHAPE_PLANS: Record<GalleryCollection["ground"], readonly ShapePlacement[]> = {
  surface: [
    { name: "splash", color: INK.lilac, width: "12%", right: "-1%", top: "4%", rotate: -12, opacity: 0.2, depth: 20 },
    { name: "starburst", color: INK.terracotta, width: "6%", left: "2%", bottom: "6%", rotate: 10, opacity: 0.2, depth: 16 },
  ],
  sage: [
    { name: "coral", color: INK.lilac, width: "9%", left: "1%", top: "8%", rotate: 14, opacity: 0.18, depth: 18 },
    { name: "starburst", color: INK.terracotta, width: "7%", right: "2%", bottom: "7%", rotate: 10, opacity: 0.22, depth: 16 },
    { name: "zigzag", color: INK.charcoal, width: "3.5%", right: "12%", top: "6%", rotate: -8, opacity: 0.14, depth: 22 },
  ],
  cream: [
    { name: "splash", color: INK.lilac, width: "11%", right: "-1%", top: "6%", rotate: -14, opacity: 0.16, depth: 20 },
    { name: "starburst", color: INK.terracotta, width: "6%", left: "3%", bottom: "8%", rotate: 12, opacity: 0.2, depth: 16 },
  ],
};

/* ==========================================================================
   THE LIGHTBOX
   ==========================================================================

   A real modal: `role="dialog"`, `aria-modal`, the background held still,
   focus moved in and trapped, Escape and the backdrop and the close control
   all shutting it, arrows and swipe stepping it, and focus handed back to the
   tile that opened it. It sits at `z-[70]`, above the header, the bottom bar
   and the WhatsApp button, which top out at `z-50`. The same contract
   <BookingSheet> keeps, extended with prev/next. */
function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: readonly GalleryItem[];
  index: number | null;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const open = index !== null;
  const item = open ? items[index] : null;

  /*
    PORTALLED TO <body>, AND IT HAS TO BE. This viewer renders inside the
    gallery page, which lives in <main> — and <main> carries `z-10` and so is
    its own stacking context. A child of it cannot paint above the bottom bar
    (`z-40`), the header (`z-50`) or the WhatsApp button (`z-30`) however high
    its own z-index climbs, because the whole of main is pinned at 10 against
    them. The booking sheet and the search panel escape this by being rendered
    at body level; this does the same with a portal, so `z-[70]` means what it
    says. Mounted-gated so the server render stays null and nothing portals
    before <body> exists.
  */
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  /* Keyboard: Escape closes, arrows step, Tab is trapped inside. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onStep(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onStep(-1);
      } else if (e.key === "Tab") {
        const focus = panel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focus || focus.length === 0) return;
        const first = focus[0];
        const last = focus[focus.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onStep]);

  /* Hold the page still. `overflow` on <html>, which is what Lenis reads — the
     same note <BookingSheet> carries. Restore the previous value, not clear it,
     so a lock something else set survives. */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  /* Focus into the panel when it opens. */
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && item ? (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[70] flex flex-col bg-text/92 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.26 }}
        >
          {/* The backdrop tap-target sits behind the controls. */}
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 -z-10 cursor-zoom-out"
          />

          {/* ---- top bar: counter and close ---- */}
          <div className="flex shrink-0 items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pt-6">
            <p className="text-label font-medium uppercase tracking-eyebrow text-on-dark/70 [font-variant-numeric:tabular-nums]">
              {index! + 1} / {items.length}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close gallery viewer"
              className="grid size-11 place-items-center rounded-pill text-on-dark/85 outline-offset-2 transition-colors duration-200 ease-soft hover:bg-on-dark/10 hover:text-on-dark"
            >
              <X size={22} strokeWidth={1.8} aria-hidden />
            </button>
          </div>

          {/* ---- the stage ---- */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-6">
            {/* prev */}
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Previous picture"
              className="absolute left-1 z-20 grid size-11 place-items-center rounded-pill bg-on-dark/10 text-on-dark outline-offset-2 transition-colors duration-200 ease-soft hover:bg-on-dark/20 md:left-3 md:size-12"
            >
              <ChevronLeft size={24} aria-hidden />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={item.src}
                className="relative z-0 flex h-full w-full max-w-[72rem] items-center justify-center"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 72vw, 100vw"
                  className="object-contain"
                  priority
                />
              </motion.figure>
            </AnimatePresence>

            {/* next */}
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Next picture"
              className="absolute right-1 z-20 grid size-11 place-items-center rounded-pill bg-on-dark/10 text-on-dark outline-offset-2 transition-colors duration-200 ease-soft hover:bg-on-dark/20 md:right-3 md:size-12"
            >
              <ChevronRight size={24} aria-hidden />
            </button>
          </div>

          {/* ---- caption ---- */}
          <div className="shrink-0 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-center md:px-6">
            <p className="text-label font-medium uppercase tracking-eyebrow text-sage">
              {item.collection}
            </p>
            <p id={titleId} className="mt-1.5 text-lead font-light leading-snug text-on-dark">
              {item.title ?? item.alt}
            </p>
            {item.title && item.meta ? (
              <p className="mt-1 text-fine text-on-dark/70">{item.meta}</p>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
