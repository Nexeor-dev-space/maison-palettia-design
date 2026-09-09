import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { AvailabilityMarker, WorkshopMetaLine } from "@/components/workshops/WorkshopMeta";
import { WorkshopAction } from "@/components/workshops/WorkshopAction";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { cn } from "@/lib/utils";
import { workshopActionLabel, workshopHref } from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * Photography sizes: the entries run five and four columns wide from `md` up,
 * and keep a hand's width of margin on one side at phone width rather than
 * running to both edges — the feature above them is the only picture that
 * does that.
 */
const ENTRY_SIZES = "(min-width: 1440px) 540px, (min-width: 768px) 38vw, 88vw";

interface WorkshopEntryProps {
  workshop: Workshop;
  /** Position in the collection, rendered as "02", "03" — the feature is 01. */
  index: number;
  /** Proportion of the plate. Varied between entries on purpose. */
  aspect: string;
  /** Which edge the photograph pulls away from at phone width. */
  inset: "left" | "right";
  /**
   * Lays a soft Sage block behind the lower-left of the photograph. Used once
   * in the section, where it has an empty column to sit in.
   */
  accent?: boolean;
}

/**
 * A supporting workshop.
 *
 * Same information as the feature, a third of the volume: the index and
 * category share one line, the facts collapse onto one more, and the
 * photograph carries a different proportion from every other picture on the
 * page. Nothing here is a card — no border, no fill, no shadow, and no shared
 * height with its neighbour.
 */
export function WorkshopEntry({
  workshop,
  index,
  aspect,
  inset,
  accent = false,
}: WorkshopEntryProps) {
  const label = String(index).padStart(2, "0");

  return (
    <article className="group relative">
      <Reveal variant="fadeIn">
        <p className="flex items-center gap-4">
          <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/70">
            {label}
          </span>
          <span aria-hidden className="h-px w-6 shrink-0 bg-terracotta" />
          <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/70">
            {workshop.category}
          </span>
        </p>
      </Reveal>

      <figure
        className={cn(
          "relative mt-5",
          inset === "right" ? "mr-10 md:mr-0" : "ml-10 md:ml-0",
        )}
      >
        {accent ? (
          <span
            aria-hidden
            className="absolute -bottom-5 -left-8 hidden h-1/2 w-2/3 bg-sage/40 md:block lg:-left-10"
          />
        ) : null}
        <WorkshopPhoto image={workshop.image} aspect={aspect} sizes={ENTRY_SIZES} />
      </figure>

      <Reveal delay={0.15}>
        <h3 className="mt-8 text-[1.15rem] font-semibold leading-[1.25] tracking-[-0.01em] lg:text-[1.3rem]">
          <Link
            href={workshopHref(workshop)}
            aria-label={`${workshop.title} — ${workshopActionLabel(workshop).toLowerCase()}`}
            className="transition-colors duration-300 ease-soft after:absolute after:inset-0 hover:text-primary"
          >
            {workshop.title}
          </Link>
        </h3>

        <WorkshopMetaLine workshop={workshop} className="mt-3.5" />

        <p className="mt-4 max-w-[26rem] text-[0.9rem] leading-[1.8] text-text/75">
          {workshop.excerpt}
        </p>

        <AvailabilityMarker workshop={workshop} className="mt-6" />

        <WorkshopAction label={workshopActionLabel(workshop)} className="mt-6" />
      </Reveal>
    </article>
  );
}
