import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

/**
 * Which ground a heading is set on. The ink follows from it — on this palette
 * the ink is never a free choice, so it is never a prop a caller picks.
 *
 *   light ... page off-white, White Rock, Light Sage — Charcoal Slate ink
 *   lilac ... Deep Lilac — the near-white `surface`, the one light ink that
 *             clears 4.5:1 on that field (4.90); White Rock is 3.95 and Light
 *             Sage 3.83, both fine for display type and both failing a label
 *   dark .... Charcoal Slate or a photograph under a scrim — White Rock
 */
export type Ground = "light" | "lilac" | "dark";

const INK: Record<Ground, { text: string; soft: string; rule: string }> = {
  light: { text: "text-text", soft: "text-text/80", rule: "bg-terracotta" },
  lilac: { text: "text-surface", soft: "text-surface", rule: "bg-sage" },
  dark: { text: "text-cream", soft: "text-cream/90", rule: "bg-sage" },
};

/** The ink classes for a ground, for sections that set their own body copy. */
export function inkFor(ground: Ground) {
  return INK[ground];
}

/**
 * The small label that opens a section, with the short rule before it.
 *
 * The rule is Warm Terracotta on light grounds — the palette's accent used the
 * way the brand guide describes it, as a small highlight rather than a field —
 * and Light Sage on dark ones, where terracotta disappears.
 */
export function Eyebrow({
  children,
  ground = "light",
  as: Tag = "p",
  id,
  className,
}: {
  children: React.ReactNode;
  ground?: Ground;
  /**
   * A paragraph by default, because an eyebrow is usually a label over a
   * heading. Where the eyebrow IS the section's heading — a section whose
   * content is a list rather than a statement — pass "h2" and an `id`, so
   * `aria-labelledby` has something real to point at.
   */
  as?: "p" | "h2" | "h3";
  id?: string;
  className?: string;
}) {
  const ink = INK[ground];
  return (
    <Tag
      id={id}
      className={cn(
        "flex items-center gap-4 text-label font-semibold uppercase tracking-eyebrow",
        ink.text,
        className,
      )}
    >
      <span aria-hidden className={cn("h-px w-8 shrink-0 md:w-10", ink.rule)} />
      {children}
    </Tag>
  );
}

const SIZES = {
  /** Section statements — the voice of the page. */
  section: "text-script-section",
  /** Quieter headings inside a section or on a sub-page. */
  compact: "text-script-compact",
} as const;

/**
 * Copy made ready for Hapsha Sophia Script.
 *
 * The face has no curly quotes, so a ’ or “ would be drawn from a fallback
 * serif in the middle of a script word. Its straight quotes are drawn curled,
 * so they are the right glyphs here — swapped at render, so the copy itself
 * keeps correct typography everywhere else it is used.
 *
 * Numerals are not handled, and must not be set in the script: its 7, 8 and 9
 * are placeholder marks rather than figures.
 */
export function forScript(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

/**
 * A short title for a script heading, with any initialism set in Montserrat.
 *
 * Hapsha's capitals are swash forms and its I is drawn like a J, so "DIY" in
 * the script reads "DJY" — and the face has no alternate to swap in. A run of
 * capitals is therefore set the way the site sets its labels: the sans, small,
 * semibold and tracked, sitting on the script's baseline.
 */
export function ScriptTitle({ children }: { children: string }) {
  const parts = forScript(children).split(/\b([A-Z]{2,})\b/);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-sans text-[0.4em] font-semibold tracking-eyebrow">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

/**
 * A section heading as masked lines, each rising into place.
 *
 * Set in the brand's script, upright and in sentence case — see
 * `heading-script` in globals.css. The size is set on the heading itself
 * rather than on each line, because each line's mask measures its reach in the
 * heading's own ems.
 *
 * Lines are passed rather than one string because where a statement breaks is
 * a design decision on this site, not something left to the measure. Between
 * lines the heading carries a real space, so the accessible name reads as a
 * sentence rather than as words run together.
 */
export function DisplayHeading({
  id,
  lines,
  ground = "light",
  tone = "ink",
  size = "section",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  lines: readonly string[];
  ground?: Ground;
  /**
   * Which ink, within the ground's own pairing.
   *
   *   ink ...... the ground's reading colour. The default, and right for a
   *              statement that is the section's main voice.
   *   accent ... Deep Lilac, for a statement set as a brand moment rather
   *              than as a heading. Only offered on `light`: on the lilac
   *              ground it would be invisible, and on a dark one it measures
   *              3.02:1 — under the 3:1 even large text owes.
   *
   * IT IS A PROP RATHER THAN SOMETHING A CALLER PASSES IN `className`, and
   * that is a bug fix. `cn` is plain concatenation — "we only need
   * concatenation, not Tailwind conflict resolution", per lib/utils — so a
   * `text-primary` handed in through `className` does not override the ink
   * chosen here. The two utilities have equal specificity and the stylesheet's
   * own order decides, which meant a caller asking for the accent silently
   * got charcoal with `text-primary` sitting in the class list doing nothing.
   */
  tone?: "ink" | "accent";
  size?: keyof typeof SIZES;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const ink = INK[ground];
  const color = tone === "accent" && ground === "light" ? "text-primary" : ink.text;
  return (
    <Tag id={id} className={cn("heading-script", SIZES[size], color, className)}>
      <Stagger>
        {lines.map((line, i) => (
          <span key={line} className="script-mask">
            <Reveal as="span" variant="maskUp" className="block">
              {forScript(line)}
              {i < lines.length - 1 ? " " : null}
            </Reveal>
          </span>
        ))}
      </Stagger>
    </Tag>
  );
}
