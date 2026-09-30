import Image from "next/image";
import Link from "next/link";

import { NavLabel } from "@/components/layout/NavLabel";
import { BlobButton } from "@/components/ui/BlobButton";
import { DOODLE_PLAN, DRAW_ORDER, type DoodlePlan } from "@/components/sections/hero/composition";
import { resolveIcon } from "@/components/sections/hero/doodles";
import styles from "@/components/sections/hero/Hero.module.css";
import { HeroIntro } from "@/components/sections/hero/HeroIntro";
import { cn } from "@/lib/utils";

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/*
  Without JavaScript the intro cannot run and nothing opens on scroll, so the
  banner is simply shown composed — every hidden state undone by name, the
  frame no longer held for a scroll that would change nothing, and the two
  actions shown in the place the scroll cue would have had.
*/
const NO_SCRIPT_CSS = [
  "html body:has([data-hero-intro]){background-color:var(--color-surface)!important}",
  "html body:has([data-hero-intro])>header{opacity:1!important;visibility:visible!important}",
  "html body:has([data-hero-intro])>div>footer{visibility:visible!important}",
  `.${styles.introLogo}{display:none!important}`,
  `.${styles.flip}{opacity:1!important;transform:none!important}`,
  `.${styles.ink}{stroke-dashoffset:0!important;fill-opacity:1!important;stroke-opacity:0!important}`,
  `.${styles.bloom}{clip-path:none!important}`,
  `.${styles.cardImage}{transform:none!important}`,
  `.${styles.reveal},.${styles.lineInner}{opacity:1!important;transform:none!important}`,
  `.${styles.track}{height:auto!important}`,
  `.${styles.frame}{position:relative!important}`,
  `.${styles.actions}{opacity:1!important;transform:none!important}`,
  `.${styles.cue}{display:none!important}`,
].join("");

/**
 * The banner's picture, and how it is framed.
 *
 * `position` is the crop, per breakpoint: the resting card is far wider than
 * it is tall, so what a visitor sees is a horizontal band of the file, and the
 * band has to hold the subject at both shapes — a wide card on a desktop and a
 * tall window on a phone.
 *
 * `lift` raises the picture inside the resting card so the window frames the
 * middle of the scene rather than its foreground. It eases to nothing as the
 * card opens.
 */
const HERO_IMAGE = {
  /*
    NOT THE STUDIO'S OWN PHOTOGRAPH — SAY SO BEFORE REUSING IT.

    This is `banner-img.jpg`, supplied on 2026-09-29, and it is the same scene
    as the `hero/studio-laughter.jpg` it replaces: two women laughing in a
    craft studio, one with a painted mug and one with a painted dish. That
    picture was generated with ElevenLabs (bytedance-seedream-5-pro) at the
    client's instruction, because the feedback PDF asked for exactly this and
    supplied a reference for it — "the current image makes the experience feel
    quite kids-focused, whereas we want the visuals to appeal to a wider
    audience, including young adults and adults" — and this file is the same
    composition, so it is to be treated the same way until someone says
    otherwise: NOT the studio's own photograph, NOT its own guests, and never
    captioned as either. Nothing on the page claims it is.

    Its metadata says only that it has been through an Adobe tool: an XMP
    record pointing at a CAI manifest on cai-manifests.adobe.com, which is
    remote and has not been read. That is consistent with a crop and proves
    nothing either way about how the frame was made. See the
    `image-provenance` note for the rest of the site's picture record, and
    replace this with a real frame the moment there is one.

    THE CROP IS THE ONE THING THAT CHANGED. 1600x669 is 2.39:1 against the old
    file's 1.78:1 — a cinema band rather than a wide photograph — so the
    resting card now shows very nearly the whole frame and it is the OPEN,
    full-bleed state that crops, taking the top and bottom off a tall window
    instead of the sides.

    `position` STILL DIFFERS BY BREAKPOINT, and this crop makes the phone's
    case worse rather than better. A 2.39:1 source in a full-bleed portrait
    window is fitted by height, so what a 390px screen sees is about 19% of
    the file's width — 308px of 1600, against 26% for the 1.78:1 file this
    replaces. Centred, that slice lands on the join between the two heads and
    shows half of each face and neither painted piece.

    So the phone takes the left-hand subject whole: 42% puts the slice at
    x528-836, which holds her face and the whole of the dotted mug she is
    holding. One complete subject beats two halves, which is the same call
    the old file's note made for the same reason. The desktop card is wide
    enough to hold the pair and stays centred.
  */
  src: "/images/banner-img.jpg",
  alt: "Two women laughing side by side in a craft studio, one holding up a mug she has painted with coloured dots and squiggles, the other a scallop-edged dish painted with small pink flowers, with shelves of yarn and paint pots behind them.",
  position: { desktop: "50% 50%", mobile: "42% 50%" },
  lift: "-2%",
};
/**
 * ==========================================================================
 * Homepage banner — a photograph that opens, and the words it takes inside
 * ==========================================================================
 *
 * AT REST it is the client's wireframe, centred top to bottom: a wide rounded
 * photograph, the tagline under it, two lines of supporting text, and "scroll
 * down" at the foot of the screen — with the preloader's doodles tucked behind
 * the photograph, showing past its edges.
 *
 * AS THE PAGE SCROLLS the banner is held still while it changes, all of it
 * driven by one number, `--p` (see <HeroIntro> and ./hero/Hero.module.css):
 *
 *   the photograph  opens from its card to the whole screen, its corners
 *                   squaring off and a slight zoom settling as it goes;
 *   the doodles ... drift away from it and are covered;
 *   the words ..... rise into the picture, their ink turning light as a shade
 *                   deepens behind them;
 *   the actions ... arrive beneath the words once they are inside —
 *                   "Explore experiences" and "Plan a private event";
 *   the cue ....... goes as soon as the page moves.
 *
 * Then it rests fully open for a moment, and the page carries on into the
 * creative experiences. Under reduced motion none of it moves: the banner is
 * shown at rest, with the two actions where the cue would be.
 *
 * GROUND. Light Sage, the deck's own, running up behind the navigation — the
 * bar is transparent over it until the page moves (LIGHT_HERO_ROUTES).
 *
 * THE INTRO plays on every load of the page: the logo and the doodles draw
 * themselves as a bouquet on Light Sage, then the doodles fly home behind the
 * card as the photograph blooms open and the words rise.
 */
export function Hero() {
  const delay = (ms: number): Vars => ({ "--reveal-delay": `${ms}ms` });

  return (
    <section
      data-hero-intro
      aria-labelledby="hero-heading"
      className={cn(styles.hero, "relative z-0 isolate -mt-header bg-sage md:-mt-header-lg")}
    >
      {/* Whether the intro plays is decided in <head> before this paints —
          see ./hero/intro.ts. */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: NO_SCRIPT_CSS }} />
      </noscript>

      <HeroIntro />

      <div data-hero-track className={styles.track}>
        <div data-hero-frame className={styles.frame}>
          {/* ---- the doodles, placed in the resting card's box ---- */}
          <div className={styles.window}>
            {DOODLE_PLAN.map((plan) => (
              <DoodleShape key={plan.id} plan={plan} />
            ))}
          </div>

          {/* ---- the photograph, full size, shown through the card ---- */}
          <div className={styles.card}>
            <div className={styles.bloom}>
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                priority
                sizes="100vw"
                style={
                  {
                    "--pos-d": HERO_IMAGE.position.desktop,
                    "--pos-m": HERO_IMAGE.position.mobile,
                    "--lift": HERO_IMAGE.lift,
                  } as Vars
                }
                className={styles.cardImage}
              />
            </div>
            <div aria-hidden className={styles.scrim} />
          </div>

          {/* ---- the words: under the card, then inside the picture ---- */}
          <div data-hero-copy className={styles.copy}>
            <h1 id="hero-heading" className={cn(styles.headline, "heading-script")}>
              {/* TITLE CASE, AT THE CLIENT'S ASK — "make sure these are
                  capitalize like this", against a mock-up that sets the line
                  as "A Palette of Creativity for Everyone." The small words
                  stay lower case, which is what their own mock-up does and
                  what title case means. */}
              <span className={styles.line} style={delay(0)}>
                <span className={styles.lineInner}>A Palette of</span>
              </span>{" "}
              <span className={styles.line} style={delay(90)}>
                <span className={cn(styles.lineInner, styles.accent)}>Creativity</span>
              </span>{" "}
              <span className={styles.line} style={delay(180)}>
                <span className={styles.lineInner}>for Everyone.</span>
              </span>
            </h1>

            {/*
              TWO LINES NOW, BOTH THE CLIENT'S OWN WORDS.

              Their mock-up sets a short line in italic under the headline —
              "There's no wrong shade of creativity." — and then rewrites the
              sentence beneath it. The old line ("Hands-on experiences that
              blend art, mindfulness, and community.") is replaced outright,
              which is what "text can be changed to this" asked for.

              `script-lede` rather than a margin of its own: the gap between a
              script heading and the sans under it is one decision, made in
              globals.css. It stays on the FIRST of the two, because that is
              the one now sitting under the script.
            */}
            <p
              className={cn(
                styles.reveal,
                styles.sub,
                "script-lede mx-auto max-w-[42rem] italic",
                "text-lead leading-[1.5]",
              )}
              style={delay(240)}
            >
              There&rsquo;s no wrong shade of creativity.
            </p>

            <p
              className={cn(
                styles.reveal,
                styles.sub,
                "mx-auto mt-3 max-w-[46rem] md:mt-4",
                "text-statement leading-[1.5]",
              )}
              style={delay(320)}
            >
              Pick your palette, get your hands busy and make something that&rsquo;s
              completely yours.
            </p>

            <div data-hero-actions className={styles.actions}>
              {/* The banner stands on the photograph, not on Light Sage, so it
                  takes the brand's own Light Sage flood. It was briefly `deep`
                  on a bad measurement: the probe sampled the ground here while
                  <HeroIntro> was still covering the banner, and read the
                  intro's own sage backdrop instead of the picture. */}
              <BlobButton
                href="/events"
                tone="sage"
                className="min-h-[3.75rem] px-9 shadow-[0_10px_30px_-12px_rgb(35_31_32/0.5)]"
              >
                Explore experiences
              </BlobButton>
              {/* The navigation's own link treatment: no rule at rest, and the
                  hand-drawn line wiping in from the left on hover or focus. */}
              <Link
                href="/private-events"
                className="group/nav inline-flex min-h-12 items-center text-action font-semibold uppercase tracking-eyebrow"
              >
                <NavLabel isActive={false}>Plan a private event</NavLabel>
              </Link>
            </div>
          </div>

          {/* ---- the way down, until the page moves ---- */}
          <div data-hero-cue className={styles.cue}>
            <a
              href="#experience-discovery"
              aria-label="Scroll down to Creative experiences"
              className={cn(
                styles.reveal,
                "flex flex-col items-center gap-3 whitespace-nowrap text-label font-semibold uppercase tracking-eyebrow text-text/80 transition-colors duration-300 ease-soft hover:text-text",
              )}
              style={delay(380)}
            >
              Scroll down
              {/* Two of the three drops are this span's own pseudo-elements;
                  the third is the child, because there are only two to a box.
                  See `.cueLine` in Hero.module.css. */}
              <span aria-hidden className={styles.cueLine}>
                <span className={styles.cueDrop} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One doodle, in its five boxes — see `.doodle` in Hero.module.css. Decorative. */
function DoodleShape({ plan }: { plan: DoodlePlan }) {
  /* The colour the composition gives this icon chooses which of the client's
     ten arrives, in its own colours — see ./hero/doodles.ts. */
  const shape = resolveIcon(plan.name, plan.color);
  const mobile = plan.mobile ?? plan.desktop;
  // Which way it drifts as the card opens over it: away from the card's centre.
  const dirx = plan.desktop.left + plan.desktop.width / 2 < 50 ? -1 : 1;
  const diry = plan.desktop.top < 50 ? -1 : 1;
  const vars: Vars = {
    "--d-left": `${plan.desktop.left}%`,
    "--d-top": `${plan.desktop.top}%`,
    "--d-width": `${plan.desktop.width}%`,
    "--m-left": `${mobile.left}%`,
    "--m-top": `${mobile.top}%`,
    "--m-width": `${mobile.width}%`,
    "--depth": plan.depth,
    "--float": `${plan.float}s`,
    "--float-delay": `${-(DRAW_ORDER.indexOf(plan.id) * 1.37).toFixed(2)}s`,
    "--dirx": dirx,
    "--diry": diry,
  };

  return (
    <div
      aria-hidden
      data-doodle={plan.id}
      /* Only the six that ring the logo fly in the intro — see `entrance` in
         ./hero/composition.ts. The rest wait at their resting places. */
      className={cn(styles.doodle, styles.flip, plan.mobile ? undefined : styles.desktopOnly)}
      style={vars}
    >
      <div className={styles.drift}>
        <div className={styles.parallax}>
          <div className={styles.float}>
            <svg
              viewBox={`0 0 ${shape.w} ${shape.h}`}
              className={styles.svg}
              style={{ "--rotate": `${plan.desktop.rotate}deg` } as Vars}
              focusable="false"
            >
              {/* The sheet's own colours, one path per part. */}
              {shape.parts.map((part, i) => (
                <path
                  key={i}
                  d={part.d}
                  pathLength={1}
                  fill={part.fill}
                  stroke={part.fill}
                  className={styles.ink}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
