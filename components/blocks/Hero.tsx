import { Hero } from "@/components/sections/Hero";

import { cta, imageOf, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `hero` → <Hero> (SPEC §E.1). The homepage banner.
 *
 * With "Use Brand wording" on (the default) the headline is the Brand
 * wording tagline, so the banner, the About title, the footer and the
 * closing eyebrow can never disagree again (01-content-inventory §7 — the
 * banner used to carry its own three-line copy of the sentence).
 */
export function HeroAdapter({ block, ctx }: AdapterProps<"hero">) {
  const b = stored(block);
  if (!b) return <Hero />;

  const useTagline = b.useTagline !== false;
  const tagline = useTagline ? text(ctx.brand?.tagline) : null;
  const fromTagline = tagline ? taglineLines(tagline) : null;
  const own = lines(b.headingLines);

  return (
    <Hero
      lines={fromTagline?.lines ?? own ?? undefined}
      accentLine={fromTagline ? fromTagline.accent : (b.accentLineIndex ?? 1)}
      sub={text(b.sub)}
      lead={text(b.lead)}
      primary={cta(b.primaryCta)}
      secondary={cta(b.secondaryCta)}
      image={imageOf(b.imageDesktop)}
      imageMobile={imageOf(b.imageMobile)}
      scrollCue={b.scrollCueLabel ? { label: b.scrollCueLabel, target: anchorOf(b.scrollCueTarget) } : null}
    />
  );
}

/**
 * The tagline, broken the way the banner has always set it.
 *
 * The banner is three short script lines with the middle one in the accent
 * ink — "A Palette of / Creativity / for Everyone." — and the tagline is one
 * sentence. The break is decided by the sentence's longest word: it becomes
 * the accent line on its own, with everything before it above and everything
 * after it below. That reproduces the hand-set banner exactly from today's
 * tagline, and gives a sensible banner from a re-worded one without asking
 * an editor to learn line-breaking. The banner's lines end on a full stop
 * where the tagline (also printed mid-sentence in the footer) has none.
 */
export function taglineLines(tagline: string): { lines: string[]; accent: number } {
  const words = tagline.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return { lines: [finish(words.join(" "))], accent: 0 };

  let at = 0;
  words.forEach((word, i) => {
    if (word.replace(/[^\p{L}\p{N}]/gu, "").length > words[at].replace(/[^\p{L}\p{N}]/gu, "").length) at = i;
  });
  // The accent never opens or closes the banner; it needs words either side.
  at = Math.min(Math.max(at, 1), words.length - 2);

  const out = [words.slice(0, at).join(" "), words[at], words.slice(at + 1).join(" ")];
  out[2] = finish(out[2]);
  return { lines: out, accent: 1 };
}

function finish(line: string): string {
  return /[.!?…]$/.test(line) ? line : `${line}.`;
}

/**
 * The scroll cue's destination. Editors type a section id ("experience-discovery")
 * or a path; a bare id is an anchor on this page, so it gains its "#" here
 * rather than becoming a relative link to a page of that name.
 */
function anchorOf(target: string | null | undefined): string {
  const value = target?.trim();
  if (!value) return "#experience-discovery";
  return value.startsWith("#") || value.startsWith("/") ? value : `#${value}`;
}
