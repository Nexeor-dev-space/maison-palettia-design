import { EDITORIAL_PANELS } from "@/lib/constants";
import type { ImageAsset, NavItem } from "@/types";

/**
 * The homepage's fixed-backdrop panel, and the seam where it will meet a CMS.
 *
 * <FeaturedFilm> reads this through {@link getFeaturedFilm} and never touches
 * the object below, so pointing it at a query is a change to one function
 * body — the same arrangement lib/partners.ts, lib/passes.ts and lib/recent.ts
 * already use.
 *
 * IT LIVES HERE RATHER THAN IN lib/constants.ts because it is a seam, not a
 * constant. Everything else the homepage reaches for through a getter has its
 * own module; the things in lib/constants.ts are the values that will never be
 * fetched (the nav, the palette of images, the site identity). A film is a
 * piece of content the studio will one day upload, which puts it on this side
 * of the line.
 *
 * The type is declared here rather than in types/index.ts for the same reason
 * `SPREADS` lives inside <EditorialStatement>: nothing else in the project has
 * an opinion about it, and a shared type with one consumer is a shared type
 * waiting to be edited by someone who cannot see who depends on it.
 */
export interface FeaturedFilm {
  /**
   * The clip, or null while there is none. See the TODO below — this is the
   * one field that turns the panel from a still into a film.
   */
  video: string | null;
  /** The still. The reduced-motion fallback, the poster frame, and today the whole panel. */
  poster: ImageAsset;
  /** The small wall label above the statement. */
  eyebrow: string;
  /** The statement, one entry per line. Authored breaks, not wraps. */
  statement: string[];
  /** The one way out of the panel. */
  cta: NavItem;
  /**
   * The clip's running time, printed bottom-right the way the reference does.
   *
   * ABSENT ON PURPOSE AND NOT A GAP. A runtime is a fact about a file, so
   * there cannot be one until there is a file: set it from the real duration
   * when `video` is set, and never before. <FeaturedFilm> renders it only when
   * both this and `video` are present, so the two cannot drift.
   */
  runtime?: string;
}

/* ==========================================================================
   TODO(client): THERE IS NO FILM. THIS PANEL IS A PAINTING UNTIL THERE IS.

   `video` is null, and that is the honest state of the project rather than an
   oversight: there is no .mp4, .webm, .mov, .m4v or .ogv anywhere in this
   repository. The one clip it ever held was thirty-eight seconds of a pot
   being opened on the wheel — see the note on TESTIMONIALS_GROUND in
   lib/constants.ts — and it went when the client took the brand off pottery.

   WHAT TO SUPPLY, AND SETTING `video` IS THE ONLY CHANGE NEEDED:

     - a short silent loop of a session — hands, brushes, a table, people
       making. Ten to twenty seconds, cut so the last frame meets the first;
     - H.264 .mp4 for reach, plus a .webm for weight. Under about 3MB the
       pair, because this sits mid-page and is fetched on every homepage view;
     - a poster frame from the clip itself, replacing `poster` below, so the
       still and the moving picture are the same room rather than two;
     - no dialogue and no music. The panel plays muted and carries no
       controls, so anything on the soundtrack is something nobody will hear.

   The shape takes one `video` because one source is what a single file is. If
   both formats arrive, widen it to an array and map it to `<source>` elements
   in the component — that is one line in each file, and the reduced-motion
   `media` query goes on every source.

   UNTIL THEN THE PANEL IS NOT HEADED "FEATURED FILM", carries no runtime and
   offers nothing to play. A section that advertises a film the studio does not
   have is the one failure a page like this can actually cause: everything else
   here is a placeholder a visitor can ignore, and that would be a promise.
   ========================================================================== */
const FEATURED_FILM: FeaturedFilm = {
  video: null,

  /*
    The plate, freed by unmounting <Testimonials>.

    It is the same file TESTIMONIALS_GROUND points at, referenced rather than
    moved: that constant stays where it is so the parked section still
    compiles, and this one names the path itself so neither section is reading
    the other's data. Two references to one asset is not the duplication this
    project worries about — a path both files agree on cannot disagree.

    IT IS THE RIGHT STILL FOR A VIDEO-SHAPED BLOCK, for four reasons already
    recorded against it in lib/constants.ts: it is 2000x1125, exactly the 16:9
    a frame of footage would be; it was cut from the FOOT of an impressionist
    oil precisely so it carries brushwork rather than faces, which is what a
    ground wants; it is already tonally calm; and it is no longer doing another
    job. 307KB against the 4MB the deleted clip cost.

    NOT editorial/mood-bg.jpg, which is the other orphan in the project and is
    unglazed ceramic vessels — it reads as pottery-making, which is the thing
    the brand moved away from.
  */
  poster: {
    src: "/images/testimonials/orchard-in-oil.jpg",
    /*
      A real description rather than the empty alt TESTIMONIALS_GROUND carries,
      and the difference is the eyebrow. That plate was wallpaper behind quotes
      and describing it only delayed them; this one is named on the page
      ("Orchard in oil"), and a picture with a caption is content. The wording
      is the one already recorded for this crop in lib/constants.ts, not a new
      reading of it.

      It goes empty again the day `video` is set: the still is then a poster
      frame behind a decorative loop, the eyebrow names the film instead, and
      the component swaps it — see the note on the <Image> there.
    */
    alt: "The foot of an impressionist oil — skirt, grass and dappled light, in loose brushwork.",
    /*
      Centred, and it has to be: when the media is pinned the panel crops this
      to the whole viewport, which is wider than 16:9 on a desktop window and
      far taller than it on a phone. The band has no subject to hold either
      way, which is the point of having cut it from the foot of the painting.
    */
    position: "50% 50%",
  },

  /*
    A wall label naming what is actually on screen, which is the truthful head
    for this panel while it is a painting.

    The reference's own label here reads FEATURED FILM. Ours cannot, and the
    alternative is not a quieter brand line — it is the caption a gallery would
    print beside the picture, which is the idiom this project already uses for
    its plates ("Late lilies, studio wall", "Colour, still wet", "Pigment into
    paper" in EXPERIENCE_IMAGES). The words are the asset's own name and the
    description already recorded against it, not a claim about the studio.

    TODO(client): this becomes the film's own label the day `video` is set.
  */
  eyebrow: "Orchard in oil",

  /*
    BORROWED, NOT WRITTEN. This is the `making` editorial panel's approved
    statement, referenced rather than retyped so the two can never drift into
    slightly different versions of one approved line.

    It is the only copy in the project composed for exactly this job — three
    authored lines meant to be laid over a full-bleed artwork behind a measured
    scrim — and it is not flagged as placeholder wording, which MAISON_PHILOSOPHY
    and PLAN_YOUR_VISIT both are. Nothing new is asserted here: a panel that has
    no film has no business inventing a brand claim to put over the gap.

    It also appears at the foot of /about, where <EditorialStatement> renders
    the same panel. That is a route apart, and the homepage and /about already
    share ABOUT_TEASER's paragraph on the same understanding.

    TODO(client): if the studio approves a line of its own for this panel,
    replace this reference with the strings. Nothing else has to change.
  */
  statement: EDITORIAL_PANELS.making.statement,

  /*
    The way out, and the same approved pairing the statement came from:
    "The Maison Palettia Experience" → /events.

    A <RuledLink>, never the filled action — the page has one of those and it
    belongs to the booking strip. And deliberately not a play control: there is
    nothing to play, and a panel that looks like a player is a panel that has
    promised one.
  */
  cta: {
    label: EDITORIAL_PANELS.making.linkLabel,
    href: EDITORIAL_PANELS.making.linkHref,
  },
};

/**
 * The panel, or null when there is nothing to make one out of.
 *
 * Async on purpose, for the reason `getUpcomingWorkshops` is: the object
 * resolves immediately but the signature is already the one a CMS fetch needs,
 * so nothing downstream changes shape when the data goes remote.
 *
 * NULLABLE ON PURPOSE TOO. This panel is a pause in the page rather than
 * content, and a pause with no ground under it and nothing to say on it is a
 * tall empty charcoal band — the "render nothing rather than render a hole"
 * contract every other section here keeps. <FeaturedFilm> returns null on it.
 *
 * TODO(client): replace the body with the CMS query.
 */
export async function getFeaturedFilm(): Promise<FeaturedFilm | null> {
  if (!FEATURED_FILM.poster.src || FEATURED_FILM.statement.length === 0) return null;
  return FEATURED_FILM;
}
