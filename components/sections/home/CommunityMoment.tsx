import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import styles from "@/components/sections/home/CommunityMoment.module.css";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { COMMUNITY } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Creating community through creativity — one screen, one claim.
 *
 * ==========================================================================
 * IT IS THE PICTURE AND THE SENTENCE, AND NOTHING ELSE
 * ==========================================================================
 *
 * This used to carry three things: the photograph, the deck's four
 * differentiators set as type beside the brand's marks, and a tilted collage
 * of three event photographs. All three were good and only the first belongs
 * on a homepage.
 *
 * THE FOUR POINTS AND THE COLLAGE HAVE MOVED TO /about, at the client's ask,
 * where <Apart> already carried the same four points from `lib/brand.ts` in a
 * plainer arrangement — so the move replaced that arrangement rather than
 * duplicating it, and the homepage does not now say twice what the About page
 * says once.
 *
 * What is left is the strongest thing the section had: a screen-high
 * photograph the page slides over, with the deck's heading and closing line on
 * it. `COMMUNITY.body` — the three-sentence middle — is still not set here and
 * is still set in full in <Community> on /about.
 */

export function CommunityMoment() {
  return (
    <section
      aria-labelledby="community-heading"
      className="relative isolate overflow-hidden bg-sage"
    >
      {/*
        ==================================================================
        THE HELD PICTURE
        ==================================================================

        HOW "FIXED" IS DONE, because the obvious way does not work here.
        `background-attachment: fixed` is the usual answer and it stutters
        badly under the smoothed scroll this site runs. So the picture is a
        `position: fixed` layer the size of the window, and the band around it
        carries `clip-path: inset(0)` — a clip establishes a containing block
        for fixed descendants, so the layer is trimmed to exactly this band
        while staying pinned to the viewport. The page slides over a picture
        that never moves, and nothing is repainted as it scrolls.

        `clip-path` rather than a transform for the same job: a transform on
        the ancestor would also contain the fixed child, but it would take the
        photograph with it and the whole point is that it holds still.

        THE WORDS SIT ON THE PICTURE rather than in a panel laid over its
        foot, and they are centred on it. Nothing is laid over the frame at
        all now — see the module stylesheet for the three overlays that have
        come off this band and for what holds the type up instead.

        THE COPY IS SHORTER BY SELECTION, NOT BY REWRITING. The client asked
        for it cut down. `COMMUNITY.body` — the three-sentence middle — is not
        set here any more; the heading and the closing line are, both verbatim
        from lib/brand.ts. Not one word of the deck's copy has been edited,
        and the body it drops is still set in full in <Community> on /about,
        so nothing is lost from the site.

        TODO(client): the photograph is /images/hero/img.png, supplied and
        chosen by the client. It carries C2PA content credentials signed by
        Google LLC with `trainedAlgorithmicMedia` and a SynthID watermark —
        it is AI-generated, and that is publicly inspectable by anyone who
        downloads it. Flagged rather than swapped: the client asked for this
        frame specifically. A real photograph of a Maison table would replace
        it with a change to one `src`.
      */}
      {/*
        A FULL SCREEN OF PICTURE, WITH THE WORDS ON IT.

        The picture is pinned to the viewport and the section scrolls over it,
        so the frame holds still while the page moves — `clip-path: inset(0)`
        on the wrapper is what makes a `fixed` child stay inside this band
        instead of covering the whole document. `motion-safe:` only: under
        reduced motion it falls back to a normal background and the band is
        simply a photograph.

        THE BAND IS ONE VIEWPORT TALL, at the client's ask: `100svh`, the small
        viewport height, so a phone with a retracting address bar never leaves
        a strip of the next section showing under the picture.

        THE WORDS ARE CENTRED ON THE PICTURE AND NOTHING SHADES IT. The band
        has carried three overlays and the client has asked for each of them
        off, the last being the ramp at the foot. There is no layer over the
        photograph now; the type carries its own shadow instead, which darkens
        the letters and not the frame. ./CommunityMoment.module.css has the
        measurement and is honest about what it does and does not fix.

        WORTH KNOWING BEFORE THE NEXT CHANGE: centred type lands on the two
        faces and the white keepsake card, which are both the subject of the
        photograph and its brightest pixels. Sampled across that middle third,
        White Rock runs 1.32:1 at worst and 3.45:1 median against the picture.
        The shadow makes that readable rather than compliant. If it needs to
        be genuinely legible, the answer is a frame whose middle is dark — a
        different crop or a different photograph — not more shadow.
      */}
      <div className="relative isolate [clip-path:inset(0)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 motion-safe:fixed">
          <Image
            src="/images/hero/img.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "50% 42%" }}
          />
        </div>

        {/*
          THE WASH. Even, full-frame, and absolute rather than fixed: the
          picture is pinned to the viewport and the words scroll, so a shade
          pinned with the picture would let the type slide out of it on the
          way past. Tied to the band, the two travel together.
        */}
        <span aria-hidden className={styles.scrim} />

        <Container className="relative flex min-h-[100svh] items-center justify-center py-24">
          <Reveal
            delay={0.06}
            /*
              Centred on the picture, at the client's ask, and `text-center`
              as well as centred as a block — a left-ragged column sitting in
              the middle of a frame reads as misplaced rather than as placed.
              `styles.lift` is inherited from here, so the shadow is on every
              line of type in the block and nowhere else.
            */
            className={cn("w-full max-w-[34rem] text-center md:max-w-[38rem]", styles.lift)}
          >
            <p className="flex items-center justify-center gap-3 text-label font-bold uppercase tracking-eyebrow text-cream">
              {/*
                Soft Lavender, not Deep Lilac. The mark is on Ink now rather
                than on White Rock, and lilac on that ground is 2.7:1 — a dot
                nobody can see. Lavender reads at 13.8:1.
              */}
              <span aria-hidden className="block w-4 shrink-0">
                <DoodleMark name="dot" color={INK.lavender} />
              </span>
              The Maison experience
            </p>

            {/*
              Bigger than it was, because it is no longer boxed: a full screen
              of photograph will swallow a 48px line. White Rock, which is the
              pairing the banner's headline already uses.
            */}
            <h2
              id="community-heading"
              className="heading-script mx-auto mt-5 max-w-[15ch] text-[clamp(2rem,1.25rem+2.9vw,3.5rem)] leading-[1.14] text-cream"
            >
              {COMMUNITY.heading}
            </h2>

            {/*
              Montserrat, at the client's ask, and right on its own terms: two
              lines of running text belong to the text face. The heading above
              keeps the script, which is what a display face is for.

              Full strength White Rock rather than /85 — on a photograph a
              transparent ink is a different ratio in every pixel it crosses,
              and this one is now unshaded.
            */}
            <p className="mx-auto mt-5 max-w-[40ch] text-[clamp(1rem,0.95rem+0.35vw,1.1875rem)] leading-[1.7] text-cream">
              {COMMUNITY.closer}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
