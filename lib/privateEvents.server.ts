import { TAGS } from "@/lib/cms/cache";
import { toAudience } from "@/lib/cms/mappers";
import { contentReader, findDocs, getGlobal } from "@/lib/cms/query";
import {
  PRIVATE_EVENT_AUDIENCES,
  PRIVATE_EVENT_STEPS,
  type PrivateEventAudience,
  type PrivateEventStep,
} from "@/lib/privateEvents";

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
  return fromCms ? [...fromCms] : PRIVATE_EVENT_AUDIENCES.map((audience) => ({ ...audience }));
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
