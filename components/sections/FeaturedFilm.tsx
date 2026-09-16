import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { RuledLink } from "@/components/ui/Action";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { getFeaturedFilm } from "@/lib/featuredFilm";

/** The heading's id, and the section's `aria-labelledby`. One value, two places. */
const HEADING_ID = "featured-statement-heading";

/**
 * The fixed backdrop — one picture held to the window, and a statement over it.
 *
 * WHAT THE CLIENT ASKED FOR, AND WHAT WE CAN HONESTLY GIVE THEM. The brief is
 * the reference site's FEATURED FILM band: a full-bleed block with a video
 * playing silently behind centred type. We are building that block exactly,
 * and it is a painting today, because there is no film. Verified: no .mp4,
 * .webm, .mov, .m4v or .ogv anywhere in this repository, and the only footage
 * the project ever had — thirty-eight seconds of a pot on the wheel — went
 * when the brand came off pottery. See the TODO at the top of
 * lib/featuredFilm.ts for what to supply and why `video` is the only field
 * that has to change.
 *
 * SO IT IS NOT HEADED "FEATURED FILM". It carries no runtime, no play control
 * and no transparent full-size `<button>` over the block — the reference has
 * one of those to open the real film, and ours would open nothing. The label
 * above the statement names what is actually on screen, the way a gallery
 * captions a plate. Everything else about the composition is the reference's:
 * full bleed, the type held in the vertical middle, one quiet way out.
 *
 * LEFT, NOT CENTRED. The reference centres its overlay type. This site does
 * not centre type anywhere — the hero, the shared <SectionHead> every section
 * on this page is built from, and both editorial spreads are all left-aligned
 * off the page gutter — and a centred block here would read as a slide
 * borrowed from another site. It keeps the
 * reference's vertical placement, which is the part carrying the meaning: the
 * statement sits in the middle of the picture rather than settled into its
 * foot, which is what makes this a pause rather than a captioned photograph.
 *
 * SERVER COMPONENT, and that is a decision rather than a default — see THE
 * REDUCED-MOTION RULE below, which is where a `"use client"` would normally
 * come from. Nothing here needs state, a ref or a browser API.
 */
export async function FeaturedFilm() {
  const film = await getFeaturedFilm();
  // Render nothing rather than a hole: a pause with no ground under it and
  // nothing to say on it is a tall empty charcoal band. See the note on
  // `getFeaturedFilm`.
  if (!film) return null;

  /*
    Truthy, not `!== null`.

    `video` is typed `string | null` and this file's own note tells whoever
    supplies the clip that setting that one field is the only change needed —
    which makes `video: ""` a realistic slip rather than a hypothetical one.
    Against `!== null` an empty string reads as "there is a film": the section
    would render a <video> with an empty <source> that can never play, AND
    blank the poster's alt text, because it would believe the still is only a
    fallback behind real footage. A silent broken element over an undescribed
    photograph is exactly the hole this codebase refuses to render.
  */
  const videoSrc = film.video?.trim() ? film.video : null;
  const hasVideo = videoSrc !== null;

  return (
    <Section
      id={HEADING_ID}
      ground="ink"
      bleed
      /*
        LAYOUT ONLY, per the <Section> contract — the ground and the vertical
        padding are the primitive's. `ground="ink"` also re-points
        `--color-focus` to White Rock, which this section genuinely needs: Deep
        Lilac on Charcoal Slate is 2.37:1.

        `min-h-[max(30rem,80svh)]` is the brief's "around 80vh, and not 100vh" —
        this is a pause in the page, not a second hero — with a 480px floor so a
        short laptop window still gets the whole composition rather than a
        squeezed one. `svh` rather than `vh` so a phone's collapsing URL bar
        does not resize the panel mid-scroll.

        THE CLIP IS THE MECHANISM, not decoration. See THE PINNING below.
      */
      className="relative isolate flex min-h-[max(30rem,80svh)] flex-col overflow-hidden [clip-path:inset(0)]"
    >
      {/*
        THE PINNING, and what happens where it does not hold.

        The media layer is `fixed inset-0`, so its box is the viewport rather
        than this section, and the section — clipped to its own rectangle —
        becomes a window that travels over a picture standing still. That is
        the effect the client means by "fixed video background".

        What does the work is the CLIP, not a containing block. `clip-path`
        clips an element's whole subtree, fixed descendants included, while
        leaving their containing block alone; so the media stays viewport-
        relative and simply cannot paint outside this section. If a browser
        instead treats the clip as establishing a containing block for fixed
        children, the layer resolves against this section's own box and the
        result is indistinguishable from the `absolute` base — pinned effect
        lost, nothing broken. Both readings are contained, which is the whole
        reason this is worth doing rather than a transform.

        THREE THINGS FALL BACK, deliberately and in this order:

          1. `absolute` is the base and `fixed` is the promotion, so anything
             that does not reach the promotion gets a picture that fills the
             panel and scrolls with it. That is <EditorialStatement>'s
             behaviour, which is the rest of this site's normal.
          2. The promotion is inside `supports-[clip-path:inset(0)]`. Without
             the clip a fixed layer would escape and cover the page, which is
             the one failure mode here that is worse than losing the effect —
             `overflow-hidden` above does not catch it, because overflow never
             clips a fixed descendant whose containing block is outside it.
          3. It is also `md:` and up. This is not a guess about phones: an
             earlier version of <EditorialStatement> pinned its plate the same
             way and the note there records that it could not be done on a
             phone at all. A viewport-fixed layer fights iOS momentum scrolling
             and the collapsing URL bar, and the panel is barely a window wide
             enough to show the effect at that size anyway. `md` is also
             exactly where the authored statement lines stop flowing and become
             blocks, which is what the scrim below is measured against — so the
             two switch together rather than nearly together.
      */}
      <div className="absolute inset-0 md:supports-[clip-path:inset(0)]:fixed">
        {/*
          The still. It is three things at once: the whole picture today, the
          poster frame behind a clip that has not started, and the thing a
          reader who has asked for reduced motion sees instead of a loop.

          `sizes="100vw"` is honest in both positions — the layer is the width
          of the window whether it is pinned or not. No `priority`: this is
          mid-page and asking for it early comes out of the hero's budget.

          The alt empties out once there is a film. Then this is a poster frame
          behind a decorative loop and the eyebrow names the film rather than
          the painting, so describing the wallpaper only delays the statement —
          the reasoning already recorded on TESTIMONIALS_GROUND.
        */}
        <Image
          src={film.poster.src}
          alt={hasVideo ? "" : film.poster.alt}
          fill
          sizes="100vw"
          style={{ objectPosition: film.poster.position }}
          className="object-cover"
        />

        {hasVideo ? (
          /*
            THE REDUCED-MOTION RULE, and why it is a media query on the source
            rather than a hook.

            `prefers-reduced-motion: reduce` sits on the `<source>`, so under
            that preference no candidate matches, the resource selection
            algorithm finds nothing to load, and the element never fetches a
            byte or plays a frame — the still underneath is what remains. A CSS
            media query cannot do this: CSS can hide a video, and a hidden
            `<video autoplay>` is still downloading and still playing, which is
            precisely what the preference asks to stop. `useReducedMotion` could
            also do it, and would cost this section its server rendering and put
            the whole panel in the client bundle for one boolean.

            Two things this arrangement does not do, both stated rather than
            hidden. It is evaluated when the element loads and not re-evaluated
            if the preference changes under it — a reload settles that, and no
            reader changes this setting mid-page. And should a browser ignore
            `media` on a media-element source, `motion-reduce:hidden` still
            takes the moving picture off the screen and leaves the still; the
            clip would be playing unseen, which is a battery cost rather than a
            visual one. If that ever turns out to be a real browser rather than
            a hypothetical one, the fix is to split the media layer into its own
            client component using `useReducedMotion` — the seam is already
            here, this is the only element that would move.

            `aria-hidden`, because it is decoration: the statement above carries
            the meaning, the clip is silent, and there is nothing in it to
            announce. No `controls` and no `poster` — the <Image> above is the
            poster, already optimised and already fetched, and setting the
            attribute as well would download the same frame twice. One thing to
            check when real footage lands: a `<video>` with nothing loaded is
            transparent in Chrome and Firefox and lets that <Image> through, and
            Safari has been reported to paint the box instead. If it does, the
            fix is `poster` on this element and dropping the <Image> in this
            branch — not both, which is the same frame fetched twice.
          */
          <video
            aria-hidden
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          >
            <source src={videoSrc} media="(prefers-reduced-motion: no-preference)" />
          </video>
        ) : null}
      </div>

      {/*
        THE SCRIM. Measured against the shipped plate, not judged, because type
        over a photograph on this site is solved the way the hero's two
        gradients are.

        METHOD. Composite the real crop under each element's own box — the
        eyebrow row, each statement line and the link, at their real type sizes
        and measures — and take the WORST pixel in each, not the average. White
        Rock ink is 0.7701 relative luminance; the statement is 28-36px, so it
        owes 3:1 as large text, and the 11px eyebrow and 12px link owe 4.5:1.

        WHAT MAKES THIS HARDER THAN THE HERO. The hero's type sits in a fixed
        corner of a fixed crop, so a foot rise can be solved once. Here the
        media is pinned while the panel travels over it, so the type passes over
        EVERY row of the plate on the way through — a vertical gradient cannot
        promise anything. The scrim is therefore horizontal and full-height, sits
        on the frame rather than on the plate (so it stays with the panel's edge
        while the picture stands still beneath it), and is measured against the
        worst pixel in each element's COLUMNS across the whole image.

        Bare, this plate is a hard case: cream over it is 51.8% under 4.5:1 and
        26.5% under 3:1, running from near-black foliage to blown highlights in
        the dappled light. The columns the type occupies need 0.72-0.76 ink for
        the small type and 0.58-0.62 for the statement.

        TWO LAYERS RATHER THAN ONE, because one cannot be both. A single
        three-stop gradient strong enough for the 12px link out to 375px has to
        still be at 0.62 at 560px where the longest statement line ends, and no
        stop ordering does that without holding full strength across two thirds
        of the frame — which flattens the painting. So: a wide field carrying the
        statement, and a shorter column laid over it carrying the small type.
        The stops are pixel-anchored (the layers have fixed widths and the stops
        are fractions of those) rather than percentages of the viewport, because
        what they have to cover is a block of type whose width barely changes
        between 768 and 1920 — 356px of link, 561px of statement — while a
        percentage would track the window instead and either miss at 768 or veil
        half a 1920 screen.

        RESULT, worst pixel anywhere, at 768x1024, 1024x768, 1280x800, 1440x900
        and 1920x1080: the eyebrow and the link never fall below 5.10:1 against
        their 4.5 bar, and the statement never below 3.82:1 against its 3.0 —
        nothing under bar at any of the five. The picture survives from about
        1024 up: at 1440 the right 36% of the frame is untouched photograph and
        44% is under a tenth of ink; at 1920 it is 52% and 58%. At 768 the type
        itself occupies 71% of the measure, so the wash necessarily covers the
        frame there, and the panel reads as a dark painted ground.
      */}
      {/*
        BELOW `md` IT IS A FLAT VEIL INSTEAD, and that is the honest answer
        rather than a lazy one. The authored statement lines flow inline there
        (see <SectionHead>), so the type spans the whole measure and there is no
        left column to wash; and the media is `absolute`, so the crop is fixed
        and the block is centred in it. 0.78 ink clears every element anywhere in
        the middle 60% of the panel — worst 4.75:1 against the 4.5 bar at 414,
        430 and 767, 5.13:1 at 360 — and taking the worst over a band that wide
        rather than over the block's computed position means the figure survives
        the block landing a little high or low. A vertical band would need four
        stops to hold flat across the type and fall away at both ends, which is
        two gradient layers to save a picture nobody is reading at 390px.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-text/78 md:hidden" />
      {/* The field: carries the statement's 3:1 out past its longest line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58rem] bg-gradient-to-r from-text/66 via-text/66 via-64% to-transparent md:block"
      />
      {/* The column: the extra ink the 11px and 12px type needs for 4.5:1. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[34rem] bg-gradient-to-r from-text/42 via-text/42 via-72% to-transparent md:block"
      />

      {/*
        `bleed` means no <Container>, so the gutter is rebuilt here with the
        same token the rest of the page is held in by — the media and the two
        washes are what wanted the full width.
      */}
      <div className="relative flex flex-1 flex-col justify-center px-gutter">
        <SectionHead
          id={HEADING_ID}
          /*
            The runtime joins the label rather than being pinned bottom-right
            the way the reference pins it, and only ever alongside a real file.

            The reference can put type in an unmeasured corner because it has
            art-directed against its own film. We will not have seen a frame of
            ours, and the only region of this panel whose contrast is solved for
            any picture is the washed left column — so the one fact the corner
            was carrying moves into it. `Label · value` is this site's own
            eyebrow idiom; <UpcomingEvents> sets "Now booking · N dates" the
            same way.
          */
          eyebrow={
            hasVideo && film.runtime ? `${film.eyebrow} · ${film.runtime}` : film.eyebrow
          }
          /*
            An array, so the break lands between the clauses from `md` up and
            the sentences flow below it. `text-h2` like every other heading on
            the page — the reference sets a large serif here and this project
            has two faces, neither of them a serif, so the statement is the
            house heading rather than a third face imported for one block.
          */
          title={film.statement}
          ground="ink"
        />

        {/*
          <SectionHead> sets no bottom margin, so the gap belongs to the block
          that follows it. `self-start` because <RuledLink> sets no width and
          would otherwise stretch across this flex column.
        */}
        <Reveal variant="fadeIn" delay={0.35} className="mt-section-gap self-start">
          <RuledLink label={film.cta.label} href={film.cta.href} tone="onDark" />
        </Reveal>
      </div>
    </Section>
  );
}
