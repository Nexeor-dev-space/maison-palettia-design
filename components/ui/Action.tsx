import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The homepage's two action shapes, and there are only two.
 *
 * WHAT THIS REPLACES. The page had four ways of asking for a click: the filled
 * Deep Lilac block in the events strip, the ruled "See all upcoming events"
 * line under it, the ruled "Get in touch" line in the FAQ, the ruled "See the
 * location" line in the partners section — each written out inline, each with
 * its own arrow, its own rule opacity and its own idea of a tap target — plus
 * <WorkshopAction>, the aria-hidden span version of the same thing. Five
 * spellings of two ideas. This file is the two ideas.
 *
 *   <FilledAction>  the one dominant action. Deep Lilac fill, white label,
 *                   square corners. Used sparingly: the events section and the
 *                   header. Two of these on one screen and neither is dominant.
 *   <RuledLink>     everything else that navigates. Charcoal label over a Deep
 *                   Lilac rule, with a Deep Lilac arrow.
 *
 * WHITE, NOT WHITE ROCK, ON THE FILLED ONE — and this is a bug fix rather than
 * a preference. The filled control that ships today is `text-on-dark`, which is
 * White Rock, and White Rock on Deep Lilac measures 3.95:1. A 12px control
 * label owes 4.5:1, so the site's single most important button has been failing
 * AA on the one screen it appears. White on Deep Lilac is 5.06:1 and clears it.
 * This is the one place on the homepage where `text-white` is correct, and the
 * reason it is correct is a measurement rather than a taste.
 *
 * THE ACCENT IS DEEP LILAC AND ONLY DEEP LILAC. Every rule and arrow here was
 * Warm Terracotta. Terracotta is 2.44:1 on White Rock and 2.36:1 on Light Sage,
 * against the 3:1 a graphical mark owes — see THE ONE-ACCENT RULE at the top of
 * app/globals.css. Deep Lilac clears it on all three light grounds: 4.89:1 on
 * the page ground, 3.95:1 on White Rock, 3.83:1 on Light Sage.
 *
 * AND NOT ON A DARK ONE. Deep Lilac on Charcoal Slate measures 2.37:1, so
 * `tone="onDark"` is not a nicety — the accent genuinely disappears there, and
 * the rule and the arrow both become White Rock (9.36:1) rather than being
 * dimmed versions of the lilac.
 *
 * Both primitives are server components. <Link> and a `<button>` with an
 * `onClick` supplied by a client parent both work from here without a
 * `"use client"` of their own.
 */

/** Which ground the action is set on. Only the ink one changes any colour. */
export type ActionTone = "default" | "onDark";

/* --------------------------------------------------------------------------
   The arrow, and why it is aria-hidden in every case.

   It is a mark, not a word: the label beside it already says where the link
   goes, and a screen reader announcing "See all upcoming events, right arrow"
   is reading out punctuation. That also settles its contrast bar — an
   aria-hidden glyph is a graphical object owing 3:1, not text owing 4.5:1,
   which is what lets Deep Lilac carry it on Light Sage at 3.83:1.

   A corner arrow for anything that leaves the site and a straight one for
   anything that does not, so the destination is stated in the glyph as well as
   in the announcement and nobody has to discover it by pressing it. The drift
   follows the glyph: the straight one travels along its own axis, the corner
   one lifts.
   -------------------------------------------------------------------------- */

/*
  `group-hover` and `group-focus-within`, never `group-focus-visible`.

  These components have to work in two positions. As the interactive element
  itself they carry `group`, and `:focus-visible` on that element would be the
  precise thing to ask for. As an `asSpan` affordance beside a stretched title
  link they carry nothing, and the group is the surrounding item — whose focus
  never lands on itself but on a descendant, which `:focus-visible` on the
  group does not match and `:focus-within` does. One selector covering both
  positions beats two that each cover one, and the cost is that a mouse click
  briefly drifts the arrow on the way out of the page.

  Both states are spelled out in full in every string in this file, and nothing
  here is assembled from fragments. Tailwind finds classes by scanning the
  source for literal text: a `motion-safe:${prefix}translate-x-1` is legible to
  a reader and invisible to the compiler, and the utility is simply never
  generated — a silent failure with no error and no missing-class warning.
*/
const DRIFT = "transition-transform duration-500 ease-editorial";

/** Onward, along its own axis. */
const DRIFT_ALONG =
  "motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1";

/** Away, off the corner it points to. */
const DRIFT_UP =
  "motion-safe:group-hover:-translate-y-0.5 motion-safe:group-focus-within:-translate-y-0.5";

function Arrow({ external, className }: { external?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn(DRIFT, external ? DRIFT_UP : DRIFT_ALONG, className)}>
      {external ? "↗" : "→"}
    </span>
  );
}

/*
  WHY THE SPAN VERSIONS ARE `pointer-events-none`.

  An `asSpan` affordance sits beside a title that is a stretched link — an
  anchor whose `after:absolute after:inset-0` covers the whole item. That
  overlay is a positioned element, so it paints above ordinary in-flow content
  and below any *later* positioned sibling. <RuledLink> needs `relative` on its
  label to hang the rule off, which makes it exactly such a sibling: the one
  part of the card that looks most clickable would be the only part that is
  not. Taking the span out of hit-testing entirely is the fix, and it is the
  honest description of the thing anyway — it is a picture of an action, and
  the action is the title.
*/
const AFFORDANCE = "pointer-events-none";

/* --------------------------------------------------------------------------
   FILLED ACTION
   -------------------------------------------------------------------------- */

/*
  44px exactly, and the arithmetic is worth writing down because it is the one
  thing a later `py-*` edit would quietly break: `text-action` is 12px, held to
  a 12px line box by `leading-none`, and 16px of padding on each side makes 44.
  `min-h-11` is the floor that survives someone changing the padding anyway.

  NO WIDTH UTILITY IN THE BASE, on purpose. Width is the one property a caller
  legitimately needs to set — `w-full sm:w-auto` for a phone-width control, or
  a column span — and leaving it unset means `className` can supply it without
  fighting anything. `cn` only concatenates, so a `w-full` passed in against a
  `w-fit` here would be settled by stylesheet order rather than by the caller.
  The cost: in a stretching container (a `flex flex-col`, a grid cell) this
  stretches, and the caller adds `self-start` if that is not what they wanted.
*/
const FILLED =
  "inline-flex min-h-11 items-center justify-center gap-2.5 bg-primary px-8 py-4 " +
  "text-action font-medium uppercase leading-none tracking-eyebrow text-white " +
  "transition-colors duration-300 ease-soft " +
  "group-hover:bg-primary/90 group-focus-within:bg-primary/90";

type FilledActionBase = {
  label: string;
  /** Width and placement only. Never the fill, the label colour or the radius. */
  className?: string;
};

/**
 * Three shapes, discriminated so the wrong combination does not compile:
 * a link needs a destination, a button needs none, and an affordance beside a
 * stretched link must not be given one.
 */
type FilledActionProps = FilledActionBase &
  (
    | { asSpan: true; href?: never; onClick?: never; type?: never }
    | { asSpan?: false; href: string; onClick?: () => void; type?: never }
    | { asSpan?: false; href?: never; onClick?: () => void; type?: "button" | "submit" }
  );

/**
 * The one dominant action on the page.
 *
 * Square corners rather than the `rounded-pill` the older shared <Button>
 * carries. The pill is the booking journey's language; the homepage sets
 * everything on square edges — the photographs, the plates, the grounds — and a
 * pill in the middle of that reads as a control borrowed from somewhere else.
 *
 * `asSpan` renders the identical block as an aria-hidden `<span>`, for use
 * inside an item whose title is already a stretched link. That is not a
 * convenience: a second anchor to the same destination puts the item in the tab
 * order twice and reads out twice in a list of links, for nothing. The span is
 * the affordance that says the item is clickable; the title is the thing that
 * is. Generalised from <WorkshopAction>, which did this for one section.
 */
export function FilledAction(props: FilledActionProps) {
  const { label, className } = props;
  const body = (
    <>
      {label}
      <Arrow />
    </>
  );

  // No `group` on the span: it has to inherit the surrounding item's, so the
  // whole entry lighting up on hover lights this up with it.
  if (props.asSpan) {
    return (
      <span aria-hidden className={cn(FILLED, AFFORDANCE, className)}>
        {body}
      </span>
    );
  }

  if (props.href) {
    return (
      <Link href={props.href} onClick={props.onClick} className={cn("group", FILLED, className)}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={cn("group", FILLED, className)}
    >
      {body}
    </button>
  );
}

/* --------------------------------------------------------------------------
   RULED LINK
   -------------------------------------------------------------------------- */

/*
  THE TAP TARGET IS A PSEUDO-ELEMENT, NOT PADDING.

  This line is 12px type over a 6px gap to its rule — a 20px box, well under
  the 44px an interactive target owes. The pattern the rest of the site reaches
  for is `-my-1.5 py-1.5`, padding plus an equal negative margin so the padded
  box occupies the same layout space as the bare text. Measured, that reaches
  32px and not 44; correcting it to `-my-3 py-3` does reach 44, and then
  collides with the thing every caller actually does, which is set `mt-*` on
  this element to space it from what precedes it — `mt-*` sorts after `-my-*`
  in the generated stylesheet and silently cancels the top half of the
  correction, leaving a link that is 12px lower than it looks.

  `after:-inset-y-3` extends the hit area to 44px and cannot do either. It
  moves nothing, it cancels nothing, and a caller's margins land where they
  were written. The same fix, and the same reasoning, as the footer's links.

  The pseudo-element is on the anchor; the rule under the label is a second
  pseudo-element on the label's own span, so the two never contend.
*/
const RULED =
  "relative inline-flex items-center gap-3 text-action font-medium uppercase tracking-eyebrow";

const HIT_AREA = "after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']";

/*
  The rule strengthens by doubling, not by dropping its opacity at rest.

  A 1px rule is a graphical mark and owes 3:1, and Deep Lilac has no headroom
  to fade: at full strength it is 4.89:1 on the page ground, 3.95:1 on White
  Rock and 3.83:1 on Light Sage, and at the /50 the current links use it fails
  all three. So the resting rule is the accent at full strength on every
  ground, and hover and focus take it from 1px to 2px instead. Drawn as an
  absolutely positioned pseudo-element rather than a `border-b`, so growing it
  moves no type.
*/
const RULE =
  "relative pb-1.5 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-[''] " +
  "after:transition-all after:duration-300 after:ease-soft " +
  "group-hover:after:h-0.5 group-focus-within:after:h-0.5";

const TONES: Record<ActionTone, { label: string; rule: string; arrow: string }> = {
  /** Light grounds: surface, White Rock, Light Sage. Charcoal clears 9:1 on all three. */
  default: { label: "text-text", rule: "after:bg-primary", arrow: "text-primary" },
  /**
   * Charcoal. White Rock label at 9.36:1, and a White Rock rule and arrow
   * because Deep Lilac on Charcoal is 2.37:1 — under the 3:1 a mark owes, so
   * the accent is not dimmed here, it is replaced.
   */
  onDark: { label: "text-on-dark", rule: "after:bg-cream", arrow: "text-on-dark" },
};

type RuledLinkBase = {
  label: string;
  /** Which ground it is set on. Ink grounds swap the ink, the rule and the arrow. */
  tone?: ActionTone;
  /** Leaves the site: corner arrow, new tab, and the announcement that says so. */
  external?: boolean;
  /** Placement and measure only. Never the ink, the rule or the arrow. */
  className?: string;
};

/**
 * A destination, or an affordance with none — never both, and never neither.
 */
type RuledLinkProps = RuledLinkBase &
  ({ asSpan: true; href?: never } | { asSpan?: false; href: string });

/**
 * Every link on the homepage that is not the one filled action.
 *
 * `external` is a real behaviour rather than a style: `target="_blank"` with
 * `rel="noopener noreferrer"`, the corner arrow, and an sr-only "(opens in a
 * new tab)" so the announcement carries what the glyph carries. It also drops
 * to a plain `<a>` — next/link's client router has nothing to prefetch on a
 * destination it does not own.
 *
 * `asSpan` is the same visuals as an aria-hidden `<span>`, for an item whose
 * title is already a stretched link; see the note on <FilledAction> for why a
 * second anchor is the thing being avoided. The span carries no `group` and no
 * hit area — the group is the surrounding item and the target is the title.
 */
export function RuledLink(props: RuledLinkProps) {
  const { label, tone = "default", external, className } = props;
  const ink = TONES[tone];

  const body = (
    <>
      <span className={cn(RULE, ink.rule)}>{label}</span>
      <Arrow external={external} className={ink.arrow} />
    </>
  );

  if (props.asSpan) {
    return (
      <span aria-hidden className={cn(RULED, AFFORDANCE, ink.label, className)}>
        {body}
      </span>
    );
  }

  if (external) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("group", RULED, HIT_AREA, ink.label, className)}
      >
        {body}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={props.href} className={cn("group", RULED, HIT_AREA, ink.label, className)}>
      {body}
    </Link>
  );
}
