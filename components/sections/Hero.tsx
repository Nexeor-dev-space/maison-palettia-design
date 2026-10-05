import Image from "next/image";
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

    This is `image.png`, supplied 2026-10-01 at the client's ask, and it
    replaces `banner-img.jpg`. Same scene family as its predecessor — two
    women laughing behind the ceramics they have painted — but a closer,
    more playful frame: a mug dotted in blue and a scallop-edged tray in
    small pink flowers, held up over their faces, with shelves of plain
    ware behind them.

    ITS ORIGIN IS UNKNOWN. Checked with `strings`: no C2PA manifest, no XMP
    record, no Adobe, Figma or SynthID marker. That absence proves nothing
    either way — the two frames it follows were both AI-generated — so it
    is treated exactly as they were: NOT the studio's own photograph, NOT
    its own guests, and never captioned as either. Nothing on the page
    claims it is. See the `image-provenance` note, and replace this with a
    real frame the moment there is one.

    THE CROP CHANGED BACK TO A WIDE PHOTOGRAPH. 1920x1080 is 1.78:1 against
    the old file's 2.39:1, so the resting card now crops the sides rather
    than showing very nearly the whole frame, and the OPEN, full-bleed
    state has half again as much height to work with — the case the cinema
    band made worst.

    `position` STILL DIFFERS BY BREAKPOINT, and the wider source eases the
    phone rather than fixing it. A 1.78:1 source in a full-bleed portrait
    window is fitted by height, so a 390px screen sees about 26% of the
    file's width — 500px of 1920. Centred, that slice lands on the join
    between the two heads and shows half of each face and neither piece.

    So the phone takes the left-hand subject whole: 38% puts the slice at
    x480-980, which holds her face and the whole of the dotted mug. One
    complete subject beats two halves, which is the call both earlier files'
    notes made for the same reason. The desktop card is wide enough to hold
    the pair and stays centred.
  */
  src: "/images/image.png",
  alt: "Two women laughing behind the ceramics they have painted, one holding up a mug dotted with small blue flowers, the other a scallop-edged tray patterned with little pink blooms, with shelves of plain crockery behind them.",
  position: { desktop: "50% 50%", mobile: "38% 50%" },
  lift: "-2%",

  /*
    THE PHONE GETS ITS OWN FILE, at the client's ask — `mobile-hero.png`,
    supplied 2026-10-03. It is the third file to stand here that day, after a
    portrait `mobile-banner.png` and a landscape `mobile-banner-bg.png`, and
    it is the one that actually fits: 768x1376, 0.558:1, against a phone
    window of about 0.46:1.

    WHY THE SHAPE IS THE WHOLE STORY. A 1.78:1 file covering a portrait
    window is fitted by HEIGHT, so a 390px phone renders it about 1591px
    across and shows 413 — a quarter of the width, which is why the landscape
    file could only ever hold one of the two women. At 0.558:1 the picture
    renders 499px across and gives up 86: the frame keeps both of them, both
    painted pieces, and the shelves behind.

    IT IS AI-GENERATED, AND NOT AMBIGUOUSLY. The C2PA manifest is signed by
    Google ("Google C2PA Media Services", "Google Media Processing Services")
    and carries SynthID, `c2pa.created` and `c2pa.edited` actions, and TWO
    source types: `trainedAlgorithmicMedia` and `composite`. The bottom half
    of the frame — the empty tabletop — is the composite part: the scene has
    been extended downward. Flagged to the client, who asked for it anyway.
    Never captioned as the studio's own photograph or its own guests, and
    nothing on the page claims it is. See `image-provenance`.
  */
  mobile: {
    src: "/images/mobile-hero.png",
    alt: "Two women laughing behind the ceramics they have painted, one holding up a mug dotted with small blue flowers, the other a scallop-edged tray patterned with little pink blooms, at a wooden table with shelves of plain crockery behind them.",
    /*
      CENTRED, AND FOR ONCE THAT IS SIMPLY RIGHT. The picture gives up 86px of
      its 499 to the window, split evenly, and the pair is centred in the
      frame — none of the 33-38% correction the landscape files needed to hold
      one subject whole. Y is inert here as it is for every file in this slot:
      the source is the wider ratio, so `cover` fits it by height and the
      entire height is on screen.
    */
    position: "50% 50%",
    /*
      WHICH LEAVES `lift` AS THE VERTICAL CONTROL, and this file barely needs
      it. The resting card is a horizontal band through the full-height
      picture, running about 11% to 51% at 390x844; the two women and their
      ceramics sit at about 12% to 52%. -2% lines those up almost exactly, and
      it is the same value the landscape file above uses, which is a fair sign
      the framing is doing the work rather than the correction.
    */
    lift: "-2%",
  },
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
              {/*
                ONE OF THESE IS DRAWN, AND ONLY ONE IS FETCHED.

                `display: none` is what makes that true — see the pair in
                Hero.module.css. A picture hidden any other way (opacity,
                visibility, a clip) is still laid out, and a laid-out image is
                one the browser downloads: a phone would have pulled the
                1920x1080 landscape file as well as its own, which is the
                entire cost this change exists to avoid.

                `loading="lazy"` ON THE DESKTOP FILE IS WHAT STOPS IT. With
                `eager` there, a 390px viewport fetched BOTH banners — a
                hidden-but-eager image is still an image the browser wants.
                Lazy and hidden, it is never asked for: measured at 390, the
                landscape file now gets zero requests.

                THE PRELOAD GOES TO THE PHONE. `priority` emits a
                `<link rel="preload">` with no media query on it, so it is
                worth exactly one of the two. It goes to the phone — the
                constrained device, and the one the banner is most certainly
                the LCP element on. The cost is a desktop browser also pulling
                one small variant of the portrait file it will never draw
                (~630px wide, measured); the alternative, preloading the
                landscape file, would have put a far bigger wasted download on
                the phone instead. Desktop loads its own file from layout, a
                beat later than a preload would start it, on the connection
                that can afford the beat.
              */}
              <Image
                src={HERO_IMAGE.mobile.src}
                alt={HERO_IMAGE.mobile.alt}
                fill
                priority
                /*
                  A WIDTH DERIVED FROM THE HEIGHT, like the landscape file
                  below — but a much smaller one, because the shape is
                  different. `sizes` is a WIDTH hint and this picture is
                  fitted to the window's HEIGHT, so what has to be requested
                  is 0.558 x that height plus headroom for the 1.06 rest
                  scale: 70vh, against the 190vh a 1.78:1 file needs. Asking
                  for 190 here would fetch nearly three times the pixels the
                  window can show.
                */
                sizes="70vh"
                style={
                  {
                    "--pos-m": HERO_IMAGE.mobile.position,
                    "--lift": HERO_IMAGE.mobile.lift,
                  } as Vars
                }
                className={cn(styles.cardImage, styles.cardImageMobile)}
              />

              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                loading="lazy"
                fetchPriority="high"
                /*
                  ==========================================================
                  THE COVER CROP SETS THE WIDTH, NOT THE ELEMENT
                  ==========================================================

                  `100vw` was wrong by a factor of six on a phone, and it is
                  the one defect a visitor cannot miss: the card is the full
                  height of the window, and a 1.78:1 photograph fitted to that
                  height is rendered about 1800px wide at 320 — of which the
                  window shows 320. The browser was asked for a 320px-wide
                  file and it obliged, so the slice it had to draw was scaled
                  up six times. A blurred half-face, on the first screen of
                  the site.

                  `sizes` is a WIDTH hint, so the height has to be expressed
                  through it: the picture needs about 1.78 x the viewport
                  height, and `vh` is a perfectly good unit here. 190vh is
                  that with headroom for the 1.06 rest scale.

                  Desktop asks for 110vw rather than 100 for the same reason
                  in miniature — at 1440x900 the cover render is 1601px wide,
                  not 1440.
                */
                sizes="(max-width: 1023px) 190vh, 110vw"
                style={
                  {
                    "--pos-d": HERO_IMAGE.position.desktop,
                    "--pos-m": HERO_IMAGE.position.mobile,
                    "--lift": HERO_IMAGE.lift,
                  } as Vars
                }
                className={cn(styles.cardImage, styles.cardImageDesktop)}
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
                /*
                  A STEP DOWN ON A PHONE, and it is a measurement rather than
                  a preference. At `lead` this set to 20px and wrapped to TWO
                  lines at 390; at `body` it is 17 and holds on one. The line
                  it saves is 32px of the banner's foot, which is part of the
                  budget the second action needs — see the note on the row
                  below. From `md` there is room for the larger step and it
                  takes it.
                */
                "text-body md:text-lead",
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
                /*
                  Same step, same reason. `statement` is 22px and this sentence
                  took FOUR lines of it at 390 — 128px of an 844px screen. At
                  `lead` it is 20 and takes three. The client's note was that
                  the banner's type is too big on a phone, and these two
                  paragraphs together were 192px of it.
                */
                "text-lead md:text-statement",
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
                /*
                  52px ON A PHONE, 60 FROM `md`. The pair stacks below `md` —
                  323px and 285px of pill cannot share a 350px measure — so
                  every pixel of height is paid twice. 52 is still well over
                  the 44 a touch target owes.
                */
                className="min-h-[3.25rem] px-9 shadow-[0_10px_30px_-12px_rgb(35_31_32/0.5)] md:min-h-[3.75rem]"
              >
                Explore experiences
              </BlobButton>
              {/*
                THE SECOND ACTION IS A BRUSHSTROKE, AND `tone="painted"` IS
                WHAT DRAWS IT — the client sent back a picture of what this
                used to be and asked for the stroke itself, not a pill wearing
                a paint colour. `painted` puts the label on a dragged sweep
                (`shape="sweep"` in PaintStroke.module.css) with bristles
                drawn across it under the pointer, and it is the site's
                secondary action everywhere now, so the banner and the links
                that became buttons are one device. The note that replaced the ghost pill said the
                second action "is a painted blot now and carries its own
                opaque ground" — it did not. `tone="secondary"` is
                `--blob-rest: transparent` with a 1.5px Deep Lilac ring, and a
                hairline over a photograph is the first thing the picture
                takes: the client's word for the result was that the button is
                missing.

                `cream` rests on a ground drawn from <BlobButton>'s own blobs,
                which is the brush the rest of the site paints its labels with
                — the swatch this action used to carry under its word when it
                was a link. Charcoal on cream is 9.4:1 and the pill is opaque,
                so it reads over the shaded photograph and over the Light Sage
                the banner opens on.

                THE HIERARCHY SURVIVES TWO FILLS because they are not the same
                weight: the primary beside it is Deep Lilac, the darkest thing
                on the band, and this is the palest. Lilac leads.

                NO ARROW ON THIS ONE. The pair already has the primary's, and
                two travelling arrows on one line read as two primaries.
              */}
              <BlobButton
                href="/private-events"
                tone="painted"
                arrow={false}
                className="min-h-[3.25rem] px-8 md:min-h-[3.75rem]"
              >
                Plan a private event
              </BlobButton>
            </div>
          </div>

          {/* ---- the way down, until the page moves ---- */}
          <div data-hero-cue className={styles.cue}>
            <a
              href="#experience-discovery"
              aria-label="Scroll down to Creative experiences"
              className={cn(
                styles.reveal,
                "flex flex-col items-center gap-3 whitespace-nowrap text-label font-medium uppercase tracking-eyebrow text-text/80 transition-colors duration-300 ease-soft hover:text-text",
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
