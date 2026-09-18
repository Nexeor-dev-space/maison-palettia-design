import Image from "next/image";
import Link from "next/link";

import { NavLabel } from "@/components/layout/NavLabel";
import { BlobButton } from "@/components/ui/BlobButton";
import { DOODLE_PLAN, DRAW_ORDER, type DoodlePlan } from "@/components/sections/hero/composition";
import { DOODLES } from "@/components/sections/hero/doodles";
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
    The client's own banner artwork, supplied for this frame. Wider than it is
    tall (1672x941, 1.78:1), so the resting card crops it vertically and the
    open, full-bleed state shows very nearly all of it.
  */
  src: "/images/hero/bg-bg.png",
  alt: "A girl in the studio holding up the stained-glass star she has painted, its panels in pink, orange, teal and blue, paint still on her fingers.",
  position: { desktop: "50% 50%", mobile: "50% 50%" },
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
              <span className={styles.line} style={delay(0)}>
                <span className={styles.lineInner}>A palette of</span>
              </span>{" "}
              <span className={styles.line} style={delay(90)}>
                <span className={cn(styles.lineInner, styles.accent)}>creativity</span>
              </span>{" "}
              <span className={styles.line} style={delay(180)}>
                <span className={styles.lineInner}>for everyone.</span>
              </span>
            </h1>

            <p
              className={cn(
                styles.reveal,
                styles.sub,
                "mx-auto mt-1.5 max-w-[42rem] text-[clamp(1.1875rem,1rem+0.72vw,1.625rem)] leading-[1.5] md:mt-2",
              )}
              style={delay(260)}
            >
              {/*
                BROKEN WHERE THE CLIENT ASKED, not where the browser would.
                `text-balance` put the turn after "blend"; the second line is
                to start at "mindfulness". The rule is only worth keeping while
                the first line fits, so below `sm` it comes out and the line
                wraps on its own.
              */}
              Hands-on experiences that blend art,{" "}
              <br aria-hidden className="hidden sm:inline" />
              mindfulness, and community.
            </p>

            <div data-hero-actions className={styles.actions}>
              <BlobButton
                href="/events"
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
              <span aria-hidden className={styles.cueLine} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One doodle, in its five boxes — see `.doodle` in Hero.module.css. Decorative. */
function DoodleShape({ plan }: { plan: DoodlePlan }) {
  const shape = DOODLES[plan.name];
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
              <path
                d={shape.d}
                pathLength={1}
                fill={plan.color}
                stroke={plan.color}
                className={styles.ink}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
