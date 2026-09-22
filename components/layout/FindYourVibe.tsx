"use client";

import { cn } from "@/lib/utils";
import { VIBES, VIBE_QUESTION, type VibeSlug } from "@/lib/vibes";

interface FindYourVibeProps {
  /** How many activities sit behind each vibe, keyed by slug. */
  counts: Record<VibeSlug, number>;
  selected: VibeSlug | null;
  onSelect: (slug: VibeSlug | null) => void;
  /** Rendered small inside the menu panel, larger on a page. */
  size?: "compact" | "full";
  className?: string;
}

/**
 * "Find your vibe" — the discovery layer, as three questions instead of two
 * categories.
 *
 * ==========================================================================
 * WHY THIS EXISTS
 * ==========================================================================
 *
 * The Experiences menu opens on the studio's structure: walk-in on one side,
 * scheduled on the other. That is the correct answer to "how does this
 * business work" and the wrong answer to "what should I do on Saturday" — it
 * asks a visitor to learn the operating model before they are allowed to
 * browse. This row goes above it and asks the question they already have an
 * answer to: how do you feel like creating today.
 *
 * IT IS A LAYER, NOT A REPLACEMENT. The two groups stay exactly where they
 * are, unfiltered, the moment nothing is selected — see §4 of the brief and
 * the note in <WorkshopsMenu>. Someone who wants to know precisely what is
 * walk-in and what is booked can still read it off the panel without ever
 * touching a chip.
 *
 * ==========================================================================
 * THE EMPTY STATE IS THE IMPORTANT ONE
 * ==========================================================================
 *
 * Nothing in this project records which activities are messy or calm, and
 * lib/vibes.ts explains at length why inventing it is the one thing a mood
 * filter cannot survive. So a chip whose vibe has no members is drawn as
 * unavailable rather than as a live control that disappoints: it is a real
 * `disabled` button, out of the tab order, captioned once underneath so the
 * row explains itself instead of looking broken.
 *
 * That state is temporary by construction. Tag one activity in the CMS and
 * that chip becomes live with a count on it, with no change here.
 */
export function FindYourVibe({
  counts,
  selected,
  onSelect,
  size = "compact",
  className,
}: FindYourVibeProps) {
  const live = VIBES.filter((vibe) => counts[vibe.slug] > 0).length;

  return (
    <div className={className}>
      <p
        className={cn(
          "font-semibold uppercase tracking-eyebrow text-primary",
          size === "full" ? "text-action" : "text-label",
        )}
      >
        Find your vibe
      </p>
      <span aria-hidden className="mt-2.5 block h-px w-8 bg-terracotta" />

      {/*
        The question is the heading of this row, so it is typed as one. It is
        addressed to the visitor — "how do you feel" — which is the whole
        difference between this and the group headings underneath, and the
        reason the row reads as an invitation rather than a filter bar.
      */}
      <p
        className={cn(
          "mt-3.5 font-light leading-[1.15] tracking-[-0.02em] text-text",
          size === "full"
            ? "text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)]"
            : "text-[clamp(1.25rem,1.05rem+0.6vw,1.6rem)]",
        )}
      >
        {VIBE_QUESTION}
      </p>

      {/*
        `group` semantics rather than radios: these are filters over a list
        that is already on the page, not a form to submit, and a visitor can
        leave with none of them chosen — which a radio group cannot express.
      */}
      <div
        role="group"
        aria-label="Find your vibe"
        className={cn("mt-5 flex flex-wrap gap-2.5", size === "full" && "mt-7 gap-3")}
      >
        {VIBES.map((vibe) => {
          const count = counts[vibe.slug] ?? 0;
          const isSelected = selected === vibe.slug;
          const unavailable = count === 0;

          return (
            <button
              key={vibe.slug}
              type="button"
              disabled={unavailable}
              aria-pressed={unavailable ? undefined : isSelected}
              title={vibe.blurb}
              onClick={() => onSelect(isSelected ? null : vibe.slug)}
              className={cn(
                "inline-flex items-center gap-2 rounded-pill border px-4 py-2.5",
                "font-medium uppercase tracking-eyebrow transition-colors duration-300 ease-soft",
                size === "full" ? "text-action px-5 py-3" : "text-label",
                unavailable
                  ? // Charcoal at 55% on the panel's near-white is 6.5:1 — a
                    // disabled control owes no ratio, but this one still has
                    // to be readable, because it is the label that tells a
                    // visitor what is coming rather than furniture.
                    "cursor-not-allowed border-line bg-transparent text-text/55"
                  : isSelected
                    ? "border-primary bg-primary text-on-primary"
                    : "border-text/20 bg-transparent text-text hover:border-primary hover:bg-sage/50",
              )}
            >
              {vibe.label}
              {count > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "tabular-nums",
                    isSelected ? "text-on-primary/75" : "text-text/60",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/*
        Said once, under the row, rather than three times inside it.

        It is deliberately about the studio rather than about the software —
        "not tagged these yet" is a true statement a visitor can understand,
        where anything mentioning a CMS is an apology in public. The panel
        below is unaffected and still shows everything, which the sentence
        says so nobody waits for content that is already on screen.
      */}
      {live === 0 ? (
        <p
          className={cn(
            "mt-4 leading-[1.6] text-text/75",
            size === "full" ? "text-body max-w-[46ch]" : "text-fine max-w-[42ch]",
          )}
        >
          The Maison is still sorting its activities by vibe. Everything on
          offer is below in the meantime.
        </p>
      ) : null}
    </div>
  );
}
