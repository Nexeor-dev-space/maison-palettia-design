import { TAGS } from "@/lib/cms/cache";
import { toAudience } from "@/lib/cms/mappers";
import { contentReader, findDocs, getGlobal } from "@/lib/cms/query";
import {
  PRIVATE_EVENT_AUDIENCES,
  PRIVATE_EVENT_STEPS,
  type PrivateEventAudience,
  type PrivateEventStep,
} from "@/lib/privateEvents";
import { withStaticBlurs } from "@/lib/staticBlur";

/**
 * lib/privateEvents.ts, from the CMS (SPEC §G.1).
 *
 * The four audiences are the `programmes` collection; the three numbered
 * steps are Brand wording → `privateEventSteps`, printed on three routes
 * (/private-events, each programme page, the enquiry sidebar) and edited
 * once. Same shapes as `PRIVATE_EVENT_AUDIENCES` and `PRIVATE_EVENT_STEPS`.
 *
 * SERVER ONLY — lib/privateEvents.ts is imported by client components (the
 * Private events menu, the mobile menu, the enquiry form), so the getters
 * live in this companion module and those components get the result as
 * props from a server parent.
 */

/** Published programmes in display order (`order`), the ink key turned into the renderer's hex. */
const readProgrammes = contentReader("programmes", [TAGS.programmes], async (draft) => {
  const docs = await findDocs("programmes", draft, { drafts: true, sort: "order", depth: 1 });
  return docs.map(toAudience);
});

/** `PRIVATE_EVENT_AUDIENCES`: every programme, in the studio's order. */
export async function getPrivateEventAudiences(): Promise<PrivateEventAudience[]> {
  const fromCms = await readProgrammes();
  // The in-file programmes only when the CMS could not be read (null).
  // The code-held banners get their blurred stand-ins (lib/staticBlur.ts).
  return withStaticBlurs(
    (fromCms ? [...fromCms] : PRIVATE_EVENT_AUDIENCES.map((audience) => ({ ...audience }))).map(holdBannerInCode),
  );
}

/*
  A PROGRAMME PAGE'S BANNER, SET HERE RATHER THAN IN THE CMS — at the client's
  ask (Oct 2026), the Birthday Parties page opens on a new photograph. Laid
  over whatever the CMS answers, so it ships with the code; it goes in
  `pageImage`, so the programme's card on /private-events keeps its own
  picture. To hand it back to the CMS, delete the entry and set the
  photograph on the programme in the admin.

  PROVENANCE: a Shutterstock image ("Lucky Business/Shutterstock", read from
  the supplied file's own metadata, Oct 2026). It may only stay with a
  licence — and it is stock, never the studio's own party or its guests.
*/
const PAGE_BANNERS_IN_CODE: Record<string, NonNullable<PrivateEventAudience["pageImage"]>> = {
  "birthday-parties": {
    src: "/images/experience/birthday-parties-hero.jpg",
    alt: "Three children in paper party hats at a craft table with clay and wooden tools, a smiling grown-up in a party hat leaning in to help.",
  },
  /* Corporate Events (Oct 2026). Supplied with no source in its metadata, so
     not known to be the studio's own session — never caption it as one. */
  "corporate-events": {
    src: "/images/experiences/corporate/corporate-img.jpg",
    alt: "A group of adults painting small canvases on mini easels around a long table, purple paper plates of paint and drinks between them.",
  },
  /* School Programs (Oct 2026). Supplied with no source in its metadata, and
     not the studio's own session; it shows CHILDREN'S FACES, so it needs a
     licence or release that covers them before it ships. */
  "school-programs": {
    src: "/images/experiences/school-program/school-programs-hero.jpg",
    alt: "Two young girls in canvas aprons laughing as they dip their brushes into a water pot, paper, paint pots and a watercolour set across the table.",
    position: "50% 40%",
  },
  /*
    Mall & Community Activations (Oct 2026). A screenshot of an Instagram
    carousel at 874px: the "5/8" counter cropped off its top and the rest
    enlarged 2x (Lanczos, light sharpening) so it holds at banner size. The
    volunteer wears a Times Square Center shirt, so this reads as the studio's
    own activation there — and it shows a CHILD'S FACE: keep it only with the
    family's consent to publish.
  */
  "mall-and-community-activations": {
    src: "/images/experiences/malls/mall-activation-hero.jpg",
    alt: "A young girl colouring with a marker at a craft table while a smiling volunteer in a green Times Square Center shirt leans in beside her.",
    position: "50% 20%",
  },
};

function holdBannerInCode(audience: PrivateEventAudience): PrivateEventAudience {
  const pageImage = PAGE_BANNERS_IN_CODE[audience.slug];
  return pageImage ? { ...audience, pageImage } : audience;
}

/**
 * One programme by slug, or null — the route's cue for `redirectOr404`
 * (lib/cms/redirects.ts). Note `school-programs`, US spelling, is a live URL;
 * the slug is the CMS's and is never "corrected" here.
 */
export async function getPrivateEventAudience(slug: string): Promise<PrivateEventAudience | null> {
  return (await getPrivateEventAudiences()).find((audience) => audience.slug === slug) ?? null;
}

/**
 * `PRIVATE_EVENT_STEPS`, numbered "01", "02"… from their position — the
 * number is the row's place, never a field an editor could get out of step.
 */
export async function getPrivateEventSteps(): Promise<PrivateEventStep[]> {
  const rows = (await getGlobal("brand-copy", 0))?.privateEventSteps;
  // The in-file steps only when Brand wording could not be read.
  if (!rows) return PRIVATE_EVENT_STEPS.map((step) => ({ ...step }));
  return rows.map((row, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: row.title,
    detail: row.detail ?? "",
  }));
}
