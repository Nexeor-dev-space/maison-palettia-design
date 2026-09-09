"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";

import { HeroVideo } from "@/components/sections/HeroVideo";
import { HERO_TRIPTYCH, type HeroPanel } from "@/lib/constants";
import { EASE_EDITORIAL } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Widest a side panel ever gets, as a share of the viewport. */
const SIDE_SIZES = "(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 100vw";

/**
 * A brand wash per panel — Deep Lilac, Light Sage, White Rock, left to right.
 *
 * Each is two layers rather than one flat fill, which is what stops the
 * treatment reading as a coloured rectangle dropped on a photo:
 *
 * - `hue` blends in `color` mode, which replaces the hue and saturation of
 *   what is underneath while leaving its luminance alone. The brushwork, the
 *   throwing marks and the glaze all survive; only the colour shifts.
 * - `veil` multiplies the same brand colour over the top to put the tint back
 *   in the shadows and give the panel some weight.
 *
 * Strengths are unequal on purpose. Lilac is dark and would swallow the
 * painting at the same weight the two pale colours need; the wheel is the
 * focal point and is held lightest of the three so the clay still reads as
 * clay rather than as something green.
 */
const TINTS = {
  painting: { hue: "bg-primary/48", veil: "bg-primary/18" },
  making: { hue: "bg-sage/32", veil: "bg-sage/12" },
  ceramic: { hue: "bg-cream/58", veil: "bg-cream/20" },
} as const;

interface Tint {
  hue: string;
  veil: string;
}

interface HeroVisualProps {
  /** Sits centred on the moving panel, at every breakpoint. */
  statement?: ReactNode;
  className?: string;
}

/**
 * The hero's image field: painting, making, object — three panels read as one
 * frame.
 *
 * They abut on a hairline rather than floating apart, so the composition holds
 * together as a single installation, and the wheel is always given the largest
 * share because it is the thing in motion and therefore the thing the eye
 * lands on first. The arrangement is re-cut at each breakpoint rather than
 * squeezed:
 *
 * - stacked, wheel dominant, on a phone;
 * - two columns on a tablet — painting over object on the left, the wheel
 *   running the full height on the right, which suits the portrait footage
 *   far better than a third of a narrow viewport would;
 * - the full triptych from 1024px up.
 *
 * Client component: it owns the entry animation and the video.
 */
export function HeroVisual({ statement, className }: HeroVisualProps) {
  const { painting, making, ceramic } = HERO_TRIPTYCH;

  return (
    <div
      className={cn(
        // The hairline gap over the charcoal ground *is* the seam between
        // panels — no borders, no shadows, nothing card-like.
        "grid gap-px bg-text",
        "grid-cols-1 grid-rows-[0.78fr_1.7fr_1.02fr]",
        "md:grid-cols-[1fr_1.5fr] md:grid-rows-2",
        "lg:grid-cols-[1fr_1.36fr_1fr] lg:grid-rows-1",
        className,
      )}
    >
      <Panel delay={0} tint={TINTS.painting} className="md:col-start-1 md:row-start-1 lg:col-start-1">
        <PanelImage panel={painting} sizes={SIDE_SIZES} />
      </Panel>

      <Panel
        delay={0.14}
        tint={TINTS.making}
        className="md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-2 lg:row-span-1"
        overlay={statement}
      >
        <HeroVideo
          src={making.src}
          label={making.alt}
          position={making.position}
          poster={making.poster}
        />
      </Panel>

      <Panel
        delay={0.28}
        tint={TINTS.ceramic}
        className="md:col-start-1 md:row-start-2 lg:col-start-3 lg:row-start-1"
      >
        <PanelImage panel={ceramic} sizes={SIDE_SIZES} />
      </Panel>
    </div>
  );
}

interface PanelProps {
  children: ReactNode;
  delay: number;
  /** Brand wash for this panel. Sits over the media, under any overlay. */
  tint?: Tint;
  /** Type laid on this panel. Held out of the hover drift and the entry scale. */
  overlay?: ReactNode;
  className?: string;
}

/**
 * One cell of the triptych. The outer element owns the mask and the slow
 * settle on load; an inner element owns the hover drift, kept separate so the
 * two transforms never fight over the same node.
 */
function Panel({ children, delay, tint, overlay, className }: PanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      // `isolate` keeps the wash blending against this panel alone.
      className={cn("group relative isolate overflow-hidden bg-text", className)}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 1.4, ease: EASE_EDITORIAL, delay }}
    >
      <motion.div
        className="absolute inset-0"
        initial={prefersReducedMotion ? undefined : { scale: 1.08 }}
        animate={prefersReducedMotion ? undefined : { scale: 1 }}
        transition={{ duration: 2, ease: EASE_EDITORIAL, delay }}
      >
        {/*
          A third node purely for the hover drift: Framer writes its settle
          straight onto the element above as an inline transform, which a
          utility class could never override.
        */}
        <div className="relative h-full w-full transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.035]">
          {children}
        </div>
      </motion.div>

      {tint ? (
        <>
          <div aria-hidden className={cn("absolute inset-0 mix-blend-color", tint.hue)} />
          <div aria-hidden className={cn("absolute inset-0 mix-blend-multiply", tint.veil)} />
        </>
      ) : null}

      {overlay ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          {/*
            A soft pool rather than a scrim: the clay is pale, and cream type
            needs something to sit on without the panel going dim.
          */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(62%_38%_at_50%_50%,color-mix(in_oklab,var(--color-brand-charcoal)_55%,transparent)_0%,transparent_76%)]"
          />
          <div className="relative">{overlay}</div>
        </div>
      ) : null}
    </motion.div>
  );
}

function PanelImage({ panel, sizes }: { panel: HeroPanel; sizes: string }) {
  return (
    <Image
      src={panel.src}
      alt={panel.alt}
      fill
      priority
      sizes={sizes}
      style={{ objectPosition: panel.position }}
      className="object-cover"
    />
  );
}
