import { DOODLE_PLAN, RING_ORDER } from "@/components/sections/hero/composition";

/*
  ===================================================================
    THE HOMEPAGE INTRO'S CLOCK, AND THE ONE FUNCTION THAT RUNS IT
  ===================================================================

  WHY THIS FILE EXISTS. The intro used to start when <HeroIntro> hydrated:
  the head script (./intro.ts) wrote `play`, the pen wrote the mark from the
  first paint because that part is CSS, and then everything after it — the
  wells, the burst, the lift, the words rising — waited for React. On a slow
  phone that wait was most of Lighthouse's 24 seconds of "element render
  delay" on the banner's lead paragraph: the mark finished writing and then
  stood still until the JavaScript arrived, and the words were hidden behind
  it the whole time.

  So the clock now starts at first paint. The head script carries the whole
  runtime — fitting the banner's foot, measuring the ring, aiming the mark at
  the header, and the phase chain — and runs it the moment the hero has been
  parsed. <HeroIntro> adopts the sequence when it hydrates instead of starting
  one, and the designed timing is back on every device, however late the
  JavaScript is.

  ONE FUNCTION, TWO USES, SO THE TWO CANNOT DRIFT. `introRuntime` is
  stringified into the head script by `introScript()`, and imported by
  <HeroIntro> as ordinary code ("core" mode) for the helpers it still needs
  after the intro — the foot's fit and the bar's band. Being stringified is
  what sets the rules for writing it:

    - nothing from outside it: no imports, no module constants, no closures.
      Everything it needs is either declared inside it or arrives in `cfg`;
    - plain syntax only — `var`, `function`, index loops — so no build step
      can lower it into a helper that lives somewhere else (a `for...of`, a
      spread or an optional chain could, depending on the target);
    - and the long notes live HERE, above it, not inside it: everything
      between its braces is shipped as text in the <head> of every page.

  tests/unit/introCore.test.ts parses the generated script and runs it
  against a stub page, so a reference that escapes the function fails there
  rather than in a visitor's browser.
*/

/*
  ===================================================================
    0.0 - 0.2s   the background is clean, and the logo fades in at the centre
    0.2 - 0.6s   the icons burst out from behind the logo, spreading outward
                 in a smooth, quick motion
    0.6 - 0.8s   all icons are now in place, around the logo
    0.8 - 1.0s   the logo gently moves up from the centre towards the bar
    1.0 - 1.3s   as the logo settles in the bar, the icons gently drift
                 outward and scatter across the screen
    1.3 - 1.5s   the website is fully loaded, the logo in the top bar and the
                 icons continuing to live throughout the design

  WHAT THIS REPLACES, AND WHY NONE OF IT SURVIVES. The entrance before it ran
  for five seconds: the mark wrote itself from its own vector, letter by
  letter, while eighteen cut-outs waited off-screen and flew in one at a time —
  and a visitor could sweep a paintbrush cursor across the screen to call them
  in early, each one stamping a splash where it landed. It was a good moment
  and it is the wrong one now. Every part of it contradicts the note above:
  handwriting cannot be short, an invitation to paint cannot be seamless, and
  a canvas that waits for a hand is the opposite of transitioning naturally
  into the site. So the pen, the splashes, the brush cursor and the clock that
  fed them are gone rather than retimed.

  WHAT IS KEPT. The artwork — the mark is still the client's own vector and the
  icons are still the deck's own cut-outs, in the six approved colours (see
  ./logoArt.ts and ./doodles.ts). The landing is still measured rather than
  guessed: the mark flies to the exact box of the logo in the header bar. And
  an escape is still offered, because an intro must never hold someone who
  wants to be in — see THE WAY OUT below.

  These are starts, in milliseconds from the first frame. ./Hero.module.css
  owns every individual transition; this only decides when each phase begins.
*/
/*
  AND A BEAT BETWEEN THE MARK AND THE ICONS, at the client's ask: "we need the
  dots animation we used before for the letter P, after that the doodle pop
  come." The six paint wells in the "P" were part of the opening before the
  handwriting was replaced by a fade, and they went with it. They are back,
  and they are their own phase rather than something running under the burst —
  the note is explicit that the icons come AFTER them.

  It costs about 380ms, so the entrance runs to roughly 1.9s rather than the
  storyboard's 1.5. That is the trade the ask makes, and it is the cheapest
  version of it: the wells are stepped at 62ms rather than the 200 the old
  opening used, which would have cost a second on its own.
*/
/*
  AND THE MARK IS WRITTEN AGAIN, letter by letter, at the client's ask — see
  <LogoReveal>. The pen runs from the first frame on the `play` state and
  takes WRITE_MS; everything after it moves back by the same amount, so the
  dots still follow a finished mark and the icons still follow the dots.

  WRITE_MS IS KEPT SHORT ON PURPOSE. The original writing took 2.5 seconds
  and was cut for it; 900ms is quick enough to read as a confident hand and
  still lets every letter be seen arriving. The whole entrance now composes
  by about 2.55s, against 1.88 with the fade — the cost of the writing, and
  no more. The dots start a hair before the last letter's outline settles,
  so there is no dead beat between the two.
*/
/*
  THE WHOLE OPENING RUNS TO ABOUT FOUR SECONDS, at the client's ask: "reduce
  the pace of the loading animation, extend it to 4 sec". Every beat is
  slower in proportion — the writing, the wells, the ring's hold — rather
  than one beat padded, so it still reads as one movement, only unhurried.
*/
const WRITE_MS = 800; // the pen writes "Maison Palettia", first stroke to last
const DOTS_AT = WRITE_MS - 40; // the mark is written; the wells start filling
const DOT_STEP = 95; // one well after another — see `.pDot` in Hero.module.css
const BURST_AT = DOTS_AT + 240; // frame 2: the icons leave the logo
const LIFT_AT = BURST_AT + 250; // frame 4: the mark starts for the bar, the icons follow
const SETTLE_MS = 760; // frame 6: ... and the page is composed by ~2000ms

/*
  One icon after another on the way out, and again on the way back.

  DELIBERATELY SMALL. At 40ms the nine read as a queue leaving a door; the
  client's word is "burst", and a burst is nine things leaving together with
  just enough lag to see which went first. 12ms puts the last one 96ms behind
  the first, so the whole ring is in the air inside a tenth of a second and
  every icon is home by 696ms — inside the 0.6-0.8s the storyboard gives frame
  3 for them to be in place.
*/
const BURST_STEP = 18;
/*
  The scatter, which is the same gesture reversed. It starts 150ms into the
  last phase rather than with it, so the eye follows the mark up to the bar
  first and the icons move once it has arrived — frame 5 is explicit that the
  drift happens "as the logo settles in the navigation bar", not before it.

  150 + 8 x 11 = 238, so the last icon leaves at 1038ms and is home at 1438ms.
*/
const SCATTER_AT = 150;
const SCATTER_STEP = 16;
/*
  And the shapes that are NOT in the ring come up later still, behind the
  photograph as it opens over them. See TUCKED below.
*/
const TUCKED_AT = 400;

/*
  The short entrance, for the homepage shown again by a link inside the site.

  It has always been a different, quieter thing than the opening — nobody
  arriving from another page should be made to watch the logo fly — and it is
  now cut to match the opening's own pace. It is the icons settling in, and
  nothing else. <HeroIntro> runs it; it never reaches the head script.
*/
const ENTER_MS = 900;
const ENTER_STEP = 20;

/** Every start and step of the entrance, in milliseconds. <HeroIntro> and <LogoReveal> read these. */
export const INTRO_TIMING = {
  WRITE_MS,
  DOTS_AT,
  DOT_STEP,
  BURST_AT,
  LIFT_AT,
  SETTLE_MS,
  BURST_STEP,
  SCATTER_AT,
  SCATTER_STEP,
  TUCKED_AT,
  ENTER_MS,
  ENTER_STEP,
} as const;

/** Fired on the banner's frame whenever its foot is refitted — see `refit` in <HeroIntro>. */
export const REFIT_EVENT = "hero-refit";

export interface IntroInk {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The two header cuts' ink boxes, which is all the flight needs of Site details' logo. */
export interface IntroLogoCuts {
  ink: IntroInk;
  onLight: { width: number; ink: IntroInk };
}

/** One icon of the ring, in RING_ORDER: its centre and width in logo widths, and its turn. */
export interface IntroRingEntry {
  id: string;
  x: number;
  y: number;
  width: number;
  rotate: number;
}

/** Everything `introRuntime` knows about the page, serialised into the head script. */
export interface IntroConfig {
  ring: IntroRingEntry[];
  /** Every shape in the collage, ring or not. */
  ids: string[];
  timing: typeof INTRO_TIMING;
  logo: IntroLogoCuts;
  refitEvent: string;
}

/**
 * The running intro, published on `window.__mpIntro` for <HeroIntro> to adopt.
 *
 *   phase ......... the `data-intro` it last wrote.
 *   lifted ........ the mark has left (or is about to leave) for the bar.
 *   locked ........ the page's scroll is held.
 *   adopt() ....... <HeroIntro> has hydrated and takes the scroll lock's
 *                   release, and the foot's fit, from here on.
 *   cancel() ...... the old effect teardown: nothing left running, nothing of
 *                   the flight left written, the scroll released. Never
 *                   forces `done`.
 *   onLock/onUnlock  Lenis's pause and resume, once there is a Lenis.
 *   pendingCancel . a deferred cancel() that a remount clears — see the
 *                   cleanup in <HeroIntro>.
 */
export interface IntroController {
  hero: Element;
  phase: string;
  lifted: boolean;
  locked: boolean;
  adopted: boolean;
  cancelled: boolean;
  wantsUnlock: boolean;
  onLock: (() => void) | null;
  onUnlock: (() => void) | null;
  pendingCancel: number;
  adopt: () => void;
  cancel: () => void;
}

/** The helpers <HeroIntro> borrows after the intro: the foot's fit and the bar's band. */
export interface IntroCore {
  navBand: () => number;
  footPad: (band?: number) => number;
  cardFloor: (frameHeight: number) => number;
  insetTop: (frame: HTMLElement) => number;
  fitFoot: (frame: HTMLElement, copy: HTMLElement, cue: HTMLElement) => void;
  onViewportResize: (fn: () => void) => () => void;
}

declare global {
  interface Window {
    __mpIntro?: IntroController | null;
  }
}

/*
  ===================================================================
    THE NOTES FOR WHAT IS INSIDE `introRuntime`, IN ITS ORDER
  ===================================================================

  NAV BAND — the height <BottomNav> covers, in pixels, or 0 where there is no
  bar.

    READ FROM THE TOKEN, NOT THE BAR. The bar is `fixed`, so it is not in the
    banner's flow and nothing about the layout says it is there — and its
    painted box is not the figure anyway: `--bottom-nav-h` is 4.9rem where the
    element measures 53px, because the token reserves the band the wave rises
    into as well. It is what <main> pads by, so it is what the banner should
    clear.

    THROUGH A PROBE, BECAUSE `getPropertyValue` DOES NOT RESOLVE IT. A custom
    property hands back its specified value — here the literal string
    `calc(4.9rem + env(safe-area-inset-bottom))` — and `parseFloat` of that is
    NaN. Applying it as a length and reading the box back is what makes the
    browser do the arithmetic, `env()` and all. The probe is out of flow and
    removed on the same tick, so it cannot affect what the caller then measures.

    0 from `lg`, where the token is `0px` and there is no bar.

  FOOT PAD — breathing room under the banner's last control, on a phone only.

    `navBand()` makes the copy CLEAR the bar; it does not give it any air. The
    client's note is that there is no bottom padding in the mobile banner, and
    they are right: the second action was finishing 36px off the bar at 375,
    which is a gap rather than a margin — the pair reads as having been pushed
    up against something.

    1.5rem on top of the band. A phone only, keyed off the band itself rather
    than off a second media query, because the two answer the same question:
    `--bottom-nav-h` is 0 from `lg`, and so is this.

  CARD FLOOR — the resting photograph's minimum height: about a third of a
  short desktop window (200px at 640), less on a phone, where the words are
  taller.

  INSET TOP — `--wt` in pixels: the bar plus the air under it.

  CUE CLEARANCE — clear air kept between the supporting line and the scroll
  cue under the resting card.

    IT SCALES WITH THE TYPE, and it did not use to. A flat 10px was set when the
    foot was trimmed to give the photograph every pixel it could have — but the
    supporting line is sized in `vw`, so on a wide screen 10px sits under 26px
    text set on a 39px line, and the cue's label came up against the descenders
    of "mindfulness, and community." On the machine it was measured on it cleared
    by 13.9px; a slightly different face, a text-size preference or a rounding
    difference closes that, and the client saw the two collide.

    So the floor is 20px and the real figure is a fraction of the line the words
    are actually set on, which holds the same proportion at every width. The cost
    is about 3% of the photograph's height — the smallest amount that makes the
    cue a separate thing from the sentence above it.

  FIT FOOT — sizes the banner's foot, the space under the resting card, to
  exactly what sits in it, so the photograph takes the rest of the screen and
  nothing under it can overlap at any height.

    What sits there: the gap, the tagline and its supporting line, clear air,
    and the scroll cue at the bottom edge. Under reduced motion the cue is not
    shown and the two actions are, so the whole block of words counts instead.

    Read from layout — `offsetTop` and `offsetHeight` — rather than from
    on-screen boxes, which include the intro's transforms: the words are still
    rising out of their masks when this first runs.

    THE LAST PARAGRAPH, NOT THE FIRST. This was `copy.querySelector("p")`,
    which is the first one — correct for as long as there was exactly one line
    under the script. There are two now: the client's mock-up sets "There's no
    wrong shade of creativity." above the sentence, and the foot went on being
    reserved down to the bottom of THAT, leaving the sentence below it
    uncounted. The words then sat in space the card had not been told to give
    them, and ran straight into the scroll cue. Measuring to the bottom of the
    last one is the version that does not care how many there are, which is
    what this should have been.

    THE LAST THING IN THE BLOCK, NOT THE LAST PARAGRAPH, which is the same
    correction the note above made one step short of. The actions sit UNDER
    the final paragraph, so reserving to that paragraph's foot left the row
    itself uncounted. It did not show while the second action was a word on
    the primary's own line — the row was 60px and the clearance and the cue
    happened to cover it. It is a second pill now, and below `md` the two
    stack: 116px at 390, of which only the cue's worth was ever reserved. The
    row ran off the foot of the banner and under the bottom bar, which is what
    the client is looking at. Measuring to the bottom of the actions when
    there are any is the version that does not care what the block ends with.

    `lineHeight` computes to a pixel length in every engine that matters; if
    it ever answers `normal`, the floor applies. It is the LAST line's,
    because that is the one the cue has to clear.

    THE BAR'S OWN BAND IS ALREADY IN HERE. <BottomNav> is fixed over the
    window's foot on a phone, and the cue's `bottom` is `0.75rem +
    --bottom-nav-h` (see `.cue`), so measuring the cue from the edge counts
    the bar once. This used to add `navBand()` on top, counting it twice:
    68px of the photograph went to empty air on every phone, and on a short
    one (375x667) the card had no height left at all and the tagline slid
    up under the header. Where the cue is hidden — a short phone, see `.cue` —
    its height is 0 and its `bottom` still carries the bar, so the sum holds.

    A FLOOR UNDER THE PHOTOGRAPH, at the client's ask. The foot is whatever
    the words need, and on a short window (a laptop at ~1350x640 with its
    toolbars) that left the resting photograph a 60px strip. It now keeps at
    least `cardFloor()` — about 200px there — and when the words need more
    than the screen has left, they start lower and run past the fold. They
    are not lost: as the page scrolls the photograph opens and `--copy-shift`
    carries the whole block up into view, exactly as before.

    `--wf` keeps the foot's NATURAL height, so the doodles placed in it
    (`zone: "foot"`) stay laid out against the words rather than squeezed
    into the shorter visible band. `data-short` hides the scroll cue, which
    is pinned to the window's foot and would otherwise sit on the buttons.

  VIEWPORT RESIZE — a window `resize` listener that ignores a phone's toolbar.

    ON A PHONE, SCROLLING RESIZES THE WINDOW. Safari and Chrome both shrink their
    address bar as the page starts to move and bring it back when it turns, and
    each time `innerHeight` changes and `resize` fires — which is to say, in the
    middle of the banner's opening, every time the reader changes direction.
    Every listener here answered with a full refit: probes appended to <body>,
    forced layouts, and (on the scroll timeline) every scrubbed animation
    cancelled and built again. That was a dropped run of frames at exactly the
    moment the photograph was opening under the reader's thumb.

    None of it can have changed. The frame is `100svh`, the SMALL viewport, which
    is the same height whichever state the toolbar is in, and every measurement
    the banner takes is against the frame. So on a touch screen a resize that
    leaves the width alone (the toolbar, or the keyboard) is dropped; a rotation
    still refits. A pointer device keeps every resize: a desktop window dragged
    taller really does change the frame. Bursts are folded into one call per
    frame either way.

  THE HEAD'S DECISION — unchanged from the inline script it replaces, branch
  for branch: every other page gets `data-loader="write"` (unless reduced
  motion) and nothing else; reduced motion on "/" gets `done`; otherwise scroll
  restoration goes off and `play` goes on; anything that throws gets `skip`.
  See ./intro.ts.

  WAITING FOR THE HERO. The script runs in <head>, before the body exists, so
  it watches the parser (one MutationObserver, disconnected as soon as it has
  its answer) until the banner's <section> has been parsed WHOLE — something
  after it exists in the document, or the document has finished parsing.
  Measuring half a banner would place the ring against a foot that is not
  there yet. A section inside a `hidden` container is a streamed segment not
  yet swapped into place, and is waited for too. If the document finishes
  without a banner, nothing starts, and <HeroIntro> runs this itself on
  hydration if `play` is still standing.

  THE FIRST FRAME, which is what <HeroIntro>'s layout effect used to do
  before the paint: fit the foot, put the page at the top (instantly — the
  page's `scroll-behavior: smooth` would otherwise glide it up under the ring;
  it can only have moved if someone scrolled while it was still loading),
  hold the scroll, measure the ring, and promote the banner's layers
  (`data-live`, which <HeroIntro>'s observer would set at once anyway).

  THE SECOND FRAME, a paint later: the clock starts, and the way out opens.
  Every phase is timed from that one moment.

  KEEPING THE FOOT RIGHT UNTIL <HeroIntro> ARRIVES. The fonts land, the words
  reflow, the window turns: until hydration this keeps the foot fitted itself,
  on the same three signals <HeroIntro>'s fit effect listens to, and hands the
  job over on adoption. A refit before the icons have left the mark measures
  the ring again, since their resting places are laid out against the foot;
  once they are moving it is left alone.

  THE RING IS NOW A SUBSET, so every shape has to be told which it is.
  `data-ring` is what the stylesheet branches on: an icon carrying it bursts
  out of the logo and scatters back; an icon without it is simply not part of
  the entrance and waits, invisible, at its resting place until the page
  composes around it. It is written here rather than in the markup because it
  is a property of the entrance, not of the shape — <Hero> renders the same
  collage whether this runs or not.

  The ring is measured in widths of the logo at its centre, so it keeps the
  same close orbit around the mark at every size. `offsetWidth` is its
  laid-out width — the fade changes opacity only, never the box — and the
  fallback only covers a logo that has somehow not been laid out.

  WHERE EVERY ICON WAITS, AND WHERE IT IS GOING. A shape with no box is one
  the width has taken out of the layout (`desktopOnly` below 768) and is left
  out of both, or the ring could never be finished.

    EVERY ICON IS MEASURED WHERE IT LIES, NOT WHERE IT IS WAITING. `play`
    carries the behind-the-logo transform, which means an element that has
    been through this once is translated to the middle of the screen and
    scaled down when the loop reads its box — and this runs again on a refit
    and on any remount. The flight's own properties therefore come off first,
    in one pass over all of them, so the single forced layout the next read
    triggers is paid once rather than eighteen times.

  HOW FAR OUT THE RING SITS, MEASURED RATHER THAN GUESSED.

    This was a constant with a breakpoint in it — 0.93 of the radius below
    640 and 1 above — and the constant was wrong in the way constants of this
    kind always are. At 375 the coral, which is both the widest icon and the
    one furthest out, still finished 11px past the right edge: pulling the
    ring in moves an icon's CENTRE and does nothing to its WIDTH, so the
    shape at the edge keeps occupying half of itself past whatever radius it
    is given. Turning 0.93 into 0.90 made it worse, not better, because the
    figure was never about the radius.

    So the radius is derived from the shapes instead. Every icon's box in the
    ring is known before anything moves — the width is `flower.width` in
    units of the mark and the height follows from the shape's own aspect —
    and an icon turned by `flower.rotate` needs the box that turn sweeps out,
    which for a w x h box at an angle is (w|cos| + h|sin|) across and
    (w|sin| + h|cos|) down. From there the largest radius that still leaves
    every icon inside the screen is arithmetic, and the ring takes it.

    THIS FITS WHERE THE ICONS COME TO REST, NOT THE TOP OF THEIR BOUNCE, and
    that is a deliberate choice rather than an oversight. The burst eases on
    `--ease-pop`, a spring that carries a shape 9.78% past its target before
    settling back, so at 375 the coral — the widest icon and the one furthest
    out — swings about 9px past the right edge for roughly a tenth of a
    second at the top of its arc. Fitting the ring to that peak instead was
    tried and is worse: it pulls the radius to 0.85 and the coral then SITS
    against the end of "Palettia" for the whole of frames 3 and 4. A ring
    resting on the mark is a composition problem; a decorative shape grazing
    the edge at the top of a bounce is what a spring looks like.

    It is capped at 1, so on a screen with room this changes nothing at all
    and the composition is the one the client has already approved — at 1440
    it computes to 1 and the ring is untouched. At 375 it lands on 0.94,
    which is within a point of the 0.93 that was hand-tuned there, and that
    agreement is the reason to trust the arithmetic on the widths nobody
    measured by hand. The floor of 0.6 is a guard against a screen so small
    that the honest answer would be to collapse the ring into the mark.

    The vertical reach is `portraitStretch()` in ./composition.ts, written out
    again inside because nothing may be imported there; the unit test checks
    the two agree.

  TUCKED — not in the entrance, and not meant to be seen arriving either.

    Every shape outside the ring rests wholly behind the photograph — that
    is the rule that decides the ring in the first place — so it is held
    invisible and then faded up BEHIND THE BLOOM rather than in front of
    it. At `SCATTER_AT` it came up while the picture was still opening,
    and for about 170ms a handful of pale cut-outs stood in the middle of
    the screen with nothing covering them yet.

    The bloom finishes at 1440ms; this starts the fade at 1200 and ends
    it at 1520, by which time the photograph is over them. See `.flip` in
    ./Hero.module.css.

  BEHIND THE LOGO, WHICH IS THE WHOLE OF FRAME 2. Not off-screen, which is
  where these used to wait: the storyboard says the icons "burst out from
  behind the logo", so every one of them starts stacked at the middle of the
  screen, under the mark. `.introLogo` is z-index 50 and a doodle is 20 while
  the entrance runs, so the mark genuinely covers them until they leave it.
  And turned off its resting angle on the way, alternating, so the icons turn
  out of the mark rather than sliding out of it. Deterministic, from the
  order: nothing here is random.

  WHERE THE LOGO LANDS: the logo in the header bar, measured while the bar is
  hidden but still laid out.

    INK TO INK. The intro's mark is the vector, whose box is the lettering
    alone; the header's is a PNG with transparent margins around the same
    lettering — different ones in each cut. So the flight aims at the
    letters inside the header's image, not at its box: the image's rect
    is trimmed by the margins measured for whichever cut it is showing
    (the `width` attribute is the file's own, so it tells the two apart),
    and the scale is the ratio of the two inks. Landed, the vector's
    letters sit on the PNG's to within a pixel, and the handover is
    invisible.

  THE WAY OUT, AND IT IS THE ONLY THING A HAND CAN DO HERE NOW.

    The entrance before this one was a canvas: a paintbrush cursor, pieces
    called in by sweeping, a splash stamped wherever one landed. None of that
    belongs to a movement that is over in a second and a half, and the client
    has asked for it to be seamless rather than interactive.

    What is kept is the escape. Anything that says "I want to be in the site"
    — a key, a wheel, a tap — ends the entrance where it stands and composes
    the page. At 1.5s almost nobody will reach for it, and the one thing an
    intro must never do is hold someone who did.

  FRAMES 4 TO 6, which are one movement: the mark lifts to the bar, the icons
  scatter to their places behind it, the photograph blooms open and the words
  rise. The stylesheet holds each of those on its own delay inside `settle`.

    NOT BEFORE THE FACES HAVE ARRIVED. `settle` is when the words rise, and a
    face swapping in after they are on screen moves them — layout shift on
    the one element Lighthouse watches. On a page load that has only just
    painted, the script face may still be on its way, so `settle` waits for
    the fonts, but never more than FONT_WAIT_MS: a font that never comes must
    not hold the page either. When they are already there, which is the usual
    case and always was once React had hydrated, it does not wait at all.

    THE SCROLL IS RELEASED AT THE LATER OF THE LIFT AND HYDRATION. Every
    flight is relative to layout, not to the screen, so the page may scroll
    while the icons finish arriving — but the banner's opening on scroll is
    <HeroIntro>'s, and a page scrolled before it has hydrated would move
    under a photograph that cannot open yet. So the lock is let go when both
    have happened, and SAFETY_MS after the lift whatever has happened: a
    script that never loads must not leave the page held.
*/

/**
 * The homepage intro, self-contained. See the notes above for every part.
 *
 *   "core" ....... returns the fit helpers and does nothing else.
 *   "boot" ....... the head script's decision, then the intro on the hero once
 *                  it has been parsed. Returns null (it starts later).
 *   "boot", hero . <HeroIntro>'s fallback when no head script started one: the
 *                  intro on that hero, now. Returns the controller.
 */
export function introRuntime(cfg: IntroConfig | null, mode: "core"): IntroCore;
export function introRuntime(cfg: IntroConfig, mode: "boot", heroArg?: Element): IntroController | null;
export function introRuntime(
  cfg: IntroConfig | null,
  mode: "boot" | "core",
  heroArg?: Element,
): IntroCore | IntroController | null {
  const REDUCED = "(prefers-reduced-motion: reduce)";
  const CUE_CLEARANCE_MIN = 20;
  const CUE_CLEARANCE_RATIO = 0.7;
  const RING_MARGIN = 8;
  const FONT_WAIT_MS = 1500;
  const SAFETY_MS = 8000;
  const FLIGHT_VARS = ["--bx", "--by", "--br", "--fx", "--fy", "--fs", "--fr"];

  /* NAV BAND */
  function navBand(): number {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;left:-9999px;top:0;width:0;visibility:hidden;height:var(--bottom-nav-h,0px)";
    document.body.appendChild(probe);
    const h = probe.offsetHeight;
    probe.remove();
    return h;
  }

  /* FOOT PAD */
  function footPad(band?: number): number {
    if (band === undefined) band = navBand();
    if (band === 0) return 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * 1.5;
  }

  /* CARD FLOOR */
  function cardFloor(frameHeight: number): number {
    const clamp = function (lo: number, v: number, hi: number) {
      return Math.min(hi, Math.max(lo, v));
    };
    return window.matchMedia("(min-width: 768px)").matches
      ? clamp(160, frameHeight * 0.31, 256)
      : clamp(128, frameHeight * 0.22, 192);
  }

  /* INSET TOP */
  function insetTop(frame: HTMLElement): number {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;width:0;height:var(--wt)";
    frame.appendChild(probe);
    const h = probe.offsetHeight;
    probe.remove();
    return h;
  }

  /* FIT FOOT, with CUE CLEARANCE */
  function fitFoot(frame: HTMLElement, copy: HTMLElement, cue: HTMLElement) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const raw = getComputedStyle(frame).getPropertyValue("--copy-gap").trim();
    const gap = raw.endsWith("rem") ? parseFloat(raw) * rem : parseFloat(raw) || 0;

    let foot: number;
    if (window.matchMedia(REDUCED).matches) {
      const band = navBand();
      foot = gap + copy.offsetHeight + rem + band + footPad(band);
    } else {
      const lines = copy.querySelectorAll("p");
      const line = lines.length ? lines[lines.length - 1] : null;
      const tail = (copy.querySelector("[data-hero-actions]") as HTMLElement | null) || line;
      const words = tail ? tail.offsetTop + tail.offsetHeight : copy.offsetHeight;
      const lead = line ? parseFloat(getComputedStyle(line).lineHeight) : NaN;
      const clearance = Math.max(CUE_CLEARANCE_MIN, Math.round((lead || 0) * CUE_CLEARANCE_RATIO));
      const cueFromEdge = parseFloat(getComputedStyle(cue).bottom) || 0;
      foot = gap + words + clearance + cue.offsetHeight + cueFromEdge + footPad();
    }
    const room = frame.offsetHeight - insetTop(frame) - cardFloor(frame.offsetHeight);
    const short = foot > room;
    frame.style.setProperty("--wf", Math.ceil(foot) + "px");
    frame.style.setProperty("--wb", Math.ceil(short ? Math.max(0, room) : foot) + "px");
    if (short) frame.setAttribute("data-short", "");
    else frame.removeAttribute("data-short");
  }

  /* VIEWPORT RESIZE */
  function onViewportResize(fn: () => void): () => void {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let queued = 0;
    const onResize = function () {
      const changed = window.innerWidth !== width || (!touch && window.innerHeight !== height);
      width = window.innerWidth;
      height = window.innerHeight;
      if (!changed || queued) return;
      queued = requestAnimationFrame(function () {
        queued = 0;
        fn();
      });
    };
    window.addEventListener("resize", onResize);
    return function () {
      cancelAnimationFrame(queued);
      window.removeEventListener("resize", onResize);
    };
  }

  if (mode === "core") {
    return {
      navBand: navBand,
      footPad: footPad,
      cardFloor: cardFloor,
      insetTop: insetTop,
      fitFoot: fitFoot,
      onViewportResize: onViewportResize,
    };
  }

  const conf = cfg as IntroConfig;
  const html = document.documentElement;

  /* WAITING FOR THE HERO */
  function parsedHero(): Element | null {
    const hero = document.querySelector("[data-hero-intro]");
    if (!hero || hero.closest("[hidden]")) return null;
    if (document.readyState !== "loading") return hero;
    for (let n: Node | null = hero; n && n !== document.body; n = n.parentNode) {
      if (n.nextSibling) return hero;
    }
    return null;
  }

  function waitForHero() {
    let observer: MutationObserver | null = null;
    let settled = false;
    const check = function () {
      if (settled) return;
      const hero = parsedHero();
      if (!hero && document.readyState === "loading") return;
      settled = true;
      if (observer) observer.disconnect();
      document.removeEventListener("DOMContentLoaded", check);
      if (hero && html.getAttribute("data-intro") === "play") start(hero);
    };
    check();
    if (settled) return;
    observer = new MutationObserver(check);
    observer.observe(html, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", check);
  }

  function start(hero: Element): IntroController {
    const existing = window.__mpIntro;
    if (existing && existing.hero === hero && !existing.cancelled) return existing;

    const T = conf.timing;
    const logo = hero.querySelector("[data-intro-logo]") as HTMLElement | null;
    const frame = hero.querySelector("[data-hero-frame]") as HTMLElement | null;
    const copy = hero.querySelector("[data-hero-copy]") as HTMLElement | null;
    const cue = hero.querySelector("[data-hero-cue]") as HTMLElement | null;
    const doodles = Array.prototype.slice.call(hero.querySelectorAll("[data-doodle]")) as HTMLElement[];

    /* Every shape in the plan, and for the ring's, its place and its order. */
    const plans: Record<string, { ring: boolean; order: number; flower: IntroRingEntry | null }> = Object.create(null);
    let i: number;
    for (i = 0; i < conf.ids.length; i++) plans[conf.ids[i]] = { ring: false, order: -1, flower: null };
    for (i = 0; i < conf.ring.length; i++) plans[conf.ring[i].id] = { ring: true, order: i, flower: conf.ring[i] };

    const timers: number[] = [];
    const frames: number[] = [];
    let safety = 0;
    let fitting = false;
    const stopFit: Array<() => void> = [];

    const api: IntroController = {
      hero: hero,
      phase: html.getAttribute("data-intro") || "play",
      lifted: false,
      locked: false,
      adopted: false,
      cancelled: false,
      wantsUnlock: false,
      onLock: null,
      onUnlock: null,
      pendingCancel: 0,
      adopt: adopt,
      cancel: cancel,
    };
    window.__mpIntro = api;

    /* Anything that throws ends the sequence and hands the page back. */
    function guard(fn: () => void) {
      return function () {
        try {
          fn();
        } catch {
          cancel();
        }
      };
    }
    function later(fn: () => void, ms: number) {
      timers.push(window.setTimeout(guard(fn), ms));
    }
    function clearTimers() {
      for (let k = 0; k < timers.length; k++) window.clearTimeout(timers[k]);
      timers.length = 0;
    }
    function setPhase(phase: string) {
      api.phase = phase;
      html.setAttribute("data-intro", phase);
    }

    function lock() {
      api.locked = true;
      html.style.overflow = "hidden";
      if (api.onLock) api.onLock();
    }
    function unlock() {
      window.clearTimeout(safety);
      safety = 0;
      if (!api.locked) return;
      api.locked = false;
      html.style.removeProperty("overflow");
      if (api.onUnlock) api.onUnlock();
    }
    /* The later of the lift and hydration, or SAFETY_MS — see FRAMES 4 TO 6. */
    function wantUnlock() {
      api.wantsUnlock = true;
      if (api.adopted) unlock();
      else if (!safety && api.locked) safety = window.setTimeout(unlock, SAFETY_MS);
    }

    /* KEEPING THE FOOT RIGHT UNTIL <HeroIntro> ARRIVES */
    function refit() {
      if (!frame || !copy || !cue) return;
      fitFoot(frame, copy, cue);
      frame.dispatchEvent(new Event(conf.refitEvent));
    }
    function onRefit() {
      if (api.phase === "play" || api.phase === "dots") measureRing();
    }
    function attachFit() {
      if (fitting || api.adopted || !frame || !copy || !cue) return;
      fitting = true;
      let live = true;
      if (document.fonts) {
        document.fonts.ready.then(function () {
          if (live) guard(refit)();
        });
      }
      stopFit.push(function () {
        live = false;
      });
      stopFit.push(onViewportResize(guard(refit)));
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(guard(refit));
        ro.observe(copy);
        stopFit.push(function () {
          ro.disconnect();
        });
      }
    }
    function detachFit() {
      for (let k = 0; k < stopFit.length; k++) stopFit[k]();
      stopFit.length = 0;
    }

    /* THE RING, measured where every icon lies */
    function measureRing() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const unit = (logo && logo.offsetWidth) || Math.min(vw, vh) * 0.4;
      let k: number;
      let j: number;
      let el: HTMLElement;

      for (k = 0; k < doodles.length; k++) {
        for (j = 0; j < FLIGHT_VARS.length; j++) doodles[k].style.removeProperty(FLIGHT_VARS[j]);
        doodles[k].removeAttribute("data-ring");
      }

      const measured: { el: HTMLElement; plan: { ring: boolean; order: number; flower: IntroRingEntry | null }; box: DOMRect }[] = [];
      for (k = 0; k < doodles.length; k++) {
        el = doodles[k];
        const plan = plans[el.getAttribute("data-doodle") || ""];
        const box = el.getBoundingClientRect();
        if (!plan || box.width === 0) continue;
        measured.push({ el: el, plan: plan, box: box });
      }

      /* HOW FAR OUT THE RING SITS */
      let ring = 1;
      let fitY = Infinity;
      for (k = 0; k < measured.length; k++) {
        const flower = measured[k].plan.flower;
        if (!measured[k].plan.ring || !flower) continue;
        const w = flower.width * unit;
        const h = w * (measured[k].box.height / measured[k].box.width);
        const turn = (flower.rotate * Math.PI) / 180;
        const halfW = (w * Math.abs(Math.cos(turn)) + h * Math.abs(Math.sin(turn))) / 2;
        const halfH = (w * Math.abs(Math.sin(turn)) + h * Math.abs(Math.cos(turn))) / 2;
        const reachX = Math.abs(flower.x) * unit;
        const reachY = Math.abs(flower.y) * unit;
        if (reachX > 0) ring = Math.min(ring, (vw / 2 - halfW - RING_MARGIN) / reachX);
        if (reachY > 0) ring = Math.min(ring, (vh / 2 - halfH - RING_MARGIN) / reachY);
        if (reachY > 0) fitY = Math.min(fitY, (vh / 2 - halfH - RING_MARGIN) / reachY);
      }
      ring = Math.max(0.6, ring);
      /* portraitStretch(ring, fitY, vw, vh) */
      const tall = vh / vw;
      const ringY = tall <= 1.1 ? ring : Math.max(ring, Math.min(fitY, ring * Math.min(1.9, tall * 0.85)));

      for (k = 0; k < measured.length; k++) {
        el = measured[k].el;
        const p = measured[k].plan;
        const b = measured[k].box;
        if (!p.ring || !p.flower) {
          /* TUCKED */
          el.style.setProperty("--settle-delay", T.TUCKED_AT + "ms");
          continue;
        }
        el.setAttribute("data-ring", "");
        const f = p.flower;
        const x = vw / 2 + f.x * unit * ring;
        const y = vh / 2 + f.y * unit * ringY;
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        el.style.setProperty("--fx", x - cx + "px");
        el.style.setProperty("--fy", y - cy + "px");
        el.style.setProperty("--fs", String((f.width * unit) / b.width));
        el.style.setProperty("--fr", f.rotate + "deg");
        /* BEHIND THE LOGO */
        el.style.setProperty("--bx", vw / 2 - cx + "px");
        el.style.setProperty("--by", vh / 2 - cy + "px");
        el.style.setProperty("--br", f.rotate + (p.order % 2 ? -1 : 1) * 26 + "deg");
        el.style.setProperty("--burst-delay", p.order * T.BURST_STEP + "ms");
        el.style.setProperty("--settle-delay", T.SCATTER_AT + p.order * T.SCATTER_STEP + "ms");
      }
    }

    /* WHERE THE LOGO LANDS */
    function aimLogo() {
      const target = document.querySelector('body > header a[aria-label$="home"] img');
      if (!logo || !target) return;
      const cuts = conf.logo;
      const cut = target.getAttribute("width") === String(cuts.onLight.width) ? cuts.onLight : cuts;
      const from = logo.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      if (from.width === 0 || box.width === 0) return;
      const toLeft = box.left + box.width * cut.ink.left;
      const toTop = box.top + box.height * cut.ink.top;
      const toWidth = box.width * cut.ink.width;
      const toHeight = box.height * cut.ink.height;
      logo.style.setProperty("--logo-x", toLeft + toWidth / 2 - (from.left + from.width / 2) + "px");
      logo.style.setProperty("--logo-y", toTop + toHeight / 2 - (from.top + from.height / 2) + "px");
      logo.style.setProperty("--logo-s", String(toWidth / from.width));
    }

    /* THE WAY OUT */
    const onKey = function (event: KeyboardEvent) {
      if (["Shift", "Control", "Alt", "Meta", "Tab"].indexOf(event.key) !== -1) return;
      lift();
    };
    const onWheel = function () {
      lift();
    };
    const onDown = function () {
      lift();
    };
    function attach() {
      window.addEventListener("keydown", onKey);
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
    }
    function detach() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onDown);
    }

    /*
      FRAME 3 — THE BURST, FROM WHERE EVERY ICON WILL REST.

      Each icon flies out of the mark towards its place in the finished page,
      so its starting offset is measured against that place — and the place
      moves when the faces arrive, because the tagline's height decides the
      foot. Measured too early, before the fonts, the ring started up to
      ~50px off the mark on a phone. So the burst waits for the fonts, as the
      lift does and never longer than FONT_WAIT_MS, refits and re-measures,
      commits the new starting offsets in one style pass (the icons are
      invisible in `dots`, so nothing shows), and only then bursts. The lift
      keeps its designed distance behind it.
    */
    function burst() {
      if (api.lifted || api.cancelled) return;
      let gone = false;
      const go = function () {
        if (gone || api.lifted || api.cancelled) return;
        gone = true;
        refit();
        measureRing();
        if (doodles.length) void getComputedStyle(doodles[0]).transform;
        setPhase("burst");
        later(lift, T.LIFT_AT - T.BURST_AT);
      };
      const fonts = document.fonts;
      if (fonts && fonts.status !== "loaded") {
        fonts.ready.then(guard(go), guard(go));
        later(go, FONT_WAIT_MS);
      } else {
        go();
      }
    }

    /* FRAMES 4 TO 6 */
    function lift() {
      if (api.lifted || api.cancelled) return;
      api.lifted = true;
      clearTimers();
      detach();
      const fonts = document.fonts;
      if (fonts && fonts.status !== "loaded") {
        let gone = false;
        const go = function () {
          if (gone) return;
          gone = true;
          guard(settle)();
        };
        fonts.ready.then(go, go);
        later(go, FONT_WAIT_MS);
      } else {
        settle();
      }
    }
    function settle() {
      if (api.cancelled) return;
      aimLogo();
      setPhase("settle");
      wantUnlock();
      later(finish, T.SETTLE_MS);
    }
    function finish() {
      setPhase("done");
      wantUnlock();
      if (frame) frame.removeEventListener(conf.refitEvent, onRefit);
    }

    function adopt() {
      if (api.cancelled) return;
      window.clearTimeout(api.pendingCancel);
      api.pendingCancel = 0;
      api.adopted = true;
      detachFit();
      if (api.wantsUnlock) unlock();
    }

    function cancel() {
      if (api.cancelled) return;
      api.cancelled = true;
      for (let k = 0; k < frames.length; k++) cancelAnimationFrame(frames[k]);
      frames.length = 0;
      clearTimers();
      window.clearTimeout(api.pendingCancel);
      detach();
      detachFit();
      if (frame) frame.removeEventListener(conf.refitEvent, onRefit);
      for (let k = 0; k < doodles.length; k++) {
        doodles[k].removeAttribute("data-ring");
        for (let j = 0; j < FLIGHT_VARS.length; j++) doodles[k].style.removeProperty(FLIGHT_VARS[j]);
      }
      unlock();
      if (window.__mpIntro === api) window.__mpIntro = null;
    }

    /* THE FIRST FRAME */
    frames.push(
      requestAnimationFrame(
        guard(function () {
          refit();
          if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "instant" });
          lock();
          measureRing();
          if (frame) {
            frame.setAttribute("data-live", "");
            frame.addEventListener(conf.refitEvent, onRefit);
          }
          attachFit();
          /* THE SECOND FRAME */
          frames.push(
            requestAnimationFrame(
              guard(function () {
                attach();
                later(function () {
                  setPhase("dots");
                }, T.DOTS_AT);
                later(burst, T.BURST_AT);
              }),
            ),
          );
        }),
      ),
    );

    return api;
  }

  if (heroArg) return start(heroArg);

  /* THE HEAD'S DECISION */
  if (location.pathname !== "/") {
    try {
      if (!window.matchMedia(REDUCED).matches) html.setAttribute("data-loader", "write");
    } catch {}
    return null;
  }
  try {
    if (window.matchMedia(REDUCED).matches) {
      html.setAttribute("data-intro", "done");
      return null;
    }
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    html.setAttribute("data-intro", "play");
  } catch {
    html.setAttribute("data-intro", "skip");
    return null;
  }
  try {
    waitForHero();
  } catch {}
  return null;
}

/**
 * The head script: the runtime above, called in "boot" mode with this page's
 * configuration. `<` is escaped so nothing in the data can close the script.
 */
export function introScript(cfg: IntroConfig): string {
  return "(" + introRuntime.toString() + ")(" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",'boot');";
}

/**
 * What the runtime needs to know about the page: the ring in RING_ORDER with
 * the numbers the measurement uses, every shape's id, the clock, and the two
 * header cuts' ink boxes (from Site details, through the layout's chrome).
 */
export function introConfig(logo: IntroLogoCuts): IntroConfig {
  const plans = new Map(DOODLE_PLAN.map((plan) => [plan.id, plan]));
  const ring: IntroRingEntry[] = [];
  for (const id of RING_ORDER) {
    const plan = plans.get(id);
    if (plan) ring.push({ id, x: plan.flower.x, y: plan.flower.y, width: plan.flower.width, rotate: plan.flower.rotate });
  }
  return {
    ring,
    ids: DOODLE_PLAN.map((plan) => plan.id),
    timing: INTRO_TIMING,
    logo: { ink: logo.ink, onLight: { width: logo.onLight.width, ink: logo.onLight.ink } },
    refitEvent: REFIT_EVENT,
  };
}
