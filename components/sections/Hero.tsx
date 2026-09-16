import Image from "next/image";

import { MaskedText } from "@/components/motion/MaskedText";
import { Reveal } from "@/components/motion/Reveal";
import { RuledLink } from "@/components/ui/Action";
import { Container } from "@/components/ui/Container";
import { HERO_IMAGE, WORKSHOPS_HREF } from "@/lib/constants";

/**
 * Homepage hero — one image, one moment, one statement.
 *
 * WHAT THIS REPLACES. The hero was a triptych: a painting, a looping video of
 * a potter's wheel and a still of unglazed cups, each under its own brand
 * wash, with the name typeset across all three. It was a constructed thing —
 * three competing subjects and a collage seam down the middle — and its centre
 * panel was the most prominent piece of pottery on a site that is no longer
 * about pottery.
 *
 * In its place: one photograph, full bleed, of somebody painting. A hand, a
 * brush, a loaded palette, a canvas of coral and teal. It is the opening image
 * of a brand rather than a display of what the brand sells, which is the whole
 * point of the change.
 *
 * THE BLOCK IS BOTTOM-LEFT, NOT CENTRED, and that is not a style preference.
 * The header's mark is centred and sits transparent over this image on the
 * homepage; a centred hero mark would stack directly beneath it and read as
 * the same logo printed twice. Anchoring low and left also leaves the painter
 * and her canvas — the top two thirds — completely uncovered, which is what
 * makes the photograph read as a photograph rather than as a backdrop.
 *
 * THE INLINE WORDMARK IS GONE for the same reason the block is not centred:
 * the header already carries the mark, centred and transparent, over this
 * same photograph, so this block used to repeat it a second time, bottom-left,
 * within 200px of the first — the same logo printed twice on one screen. The
 * `h1` is the only thing that now announces the name here, and the block was
 * re-spaced so the heading sits where it lands rather than floating under a
 * gap sized for the asset that used to sit above it.
 *
 * Still `sticky top-0 z-0`: app/page.tsx wraps this with the two sections that
 * rise over and cover it, and that behaviour is not part of this redesign.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="sticky top-0 z-0 isolate -mt-header flex h-svh flex-col justify-end overflow-hidden bg-text [--color-focus:var(--color-cream)] md:-mt-header-lg"
    >
      {/*
        One image, and the page's LCP — `priority`, and `sizes="100vw"` because
        it is full bleed at every width.
      */}
      <Image
        src={HERO_IMAGE.src}
        alt={HERO_IMAGE.alt}
        fill
        priority
        sizes="100vw"
        style={{ objectPosition: HERO_IMAGE.position }}
        className="object-cover"
      />

      {/*
        The head wash exists for the navigation, not for the hero. The bar is
        transparent over this image on the homepage, and the top right of this
        photograph — where Search and Contact sit — is a white wall behind a
        bare easel. Solved the same way as the foot: the header's own rects at
        each breakpoint, worst pixel under each. 17px White Rock links owe
        4.5:1 and need 0.75 ink; the centred Light Sage mark owes 3:1 and needs
        0.65; the phone's icon buttons need 0.61.

        IT HAS TO PLATEAU, NOT RAMP. A wash that starts at its darkest and
        fades immediately is already down to 0.47 by the bottom of the nav row
        — which is what the previous one did, and why the right-hand links
        failed at 1024 and 1440 on this image. So it holds flat past the nav
        (two stops at the same alpha) and only then falls away. The fade is
        long — 90px of hold and 134px of fall at desktop — so it reads as light
        behind the bar rather than as a bar.
      */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-text/70 via-text/70 via-45% to-transparent md:h-56 md:from-text/80 md:via-text/80 md:via-40%"
      />

      {/*
        The foot rise the type sits on. Solved, not judged, and the numbers are
        worth keeping because the photograph is a hard case: it runs from
        near-black foliage to white canvas and pale rose petals, and the mark
        is Light Sage while the type is White Rock — both light on light.

        Method: take the real bounding box of every element from the live DOM
        at 360x640, 390x700, 768x900, 1024x768 and 1440x820, composite the
        shipped crop underneath it, and for each box solve the smallest ink
        alpha at which the WORST pixel in it still clears the bar — 3:1 for the
        mark and for the heading (it is 36-52px, so large text), 4.5:1 for the
        12px link. That came back at 0.47-0.58 under the mark and heading and
        0.68 under the link, remarkably flat across all five.

        This gradient answers it with margin: 64% ink 36% of the way up a band
        66% of the hero tall, 90% at the very foot. Worst case anywhere is the
        heading at 1024, where the gradient supplies 0.70 against the 0.57 the
        photograph demands.

        It stays a foot rise rather than an overall overlay because the picture
        has to survive. The ramp only passes 30% ink below 45% of the screen,
        so the painter, her hand and the brush sit on untouched photograph, and
        the darkening reaches full strength over the palette — which is the
        darkest part of the frame anyway.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[66%] bg-gradient-to-t from-text/90 via-text/64 via-36% to-transparent"
      />

      <Container className="relative pb-12 md:pb-16 lg:pb-20">
        <div className="max-w-[46rem]">
          <h1 id="hero-heading">
            <MaskedText
              delay={0.25}
              className="block text-h1 font-light uppercase tracking-[-0.02em] text-cream"
            >
              Art, craft and community.
            </MaskedText>
          </h1>

          <Reveal variant="fadeIn" delay={0.5}>
            {/*
              NO SUPPORTING PARAGRAPH. There was one — "a creative space where
              art, craft and community come together" — and it was the heading
              again with a subject and a verb attached: six of its ten words are
              the headline. It also cost more than it looked like it cost. The
              hero is a photograph of pale roses, and copy has to clear 4.5:1
              over them; that sentence alone needed 80% ink under it, and it
              pushed the block up to 47% of the screen at 1024, which put the
              mark itself over bright canvas. Removing it is what lets the foot
              rise stay a foot rise. One image, one statement, one door.
            */}
            {/*
              One quiet way onward, and deliberately not an offer. The
              reference site sets two small outlined buttons side by side in
              its hero; we ship one ruled link instead. The hero's job is to
              introduce, so this is a door rather than a call to action — no
              button, no filled block. The page's one filled action (see THE
              ONE-ACCENT RULE in app/globals.css) belongs to the booking strip
              in Upcoming Events, where a visitor is actually choosing a date;
              a second filled block here would also duplicate the header's own
              "Book an event" fill, which sits sticky and transparent over this
              same photograph and is already on screen throughout. So this
              stays the same ruled link the rest of the site uses to say
              "there is more of this" — now the shared `RuledLink` primitive,
              `tone="onDark"` for the White Rock label, rule and arrow that a
              charcoal photograph needs (Deep Lilac on it measures 2.37:1).
            */}
            <RuledLink
              label="Explore events"
              href={WORKSHOPS_HREF}
              tone="onDark"
              className="mt-8 md:mt-10"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
