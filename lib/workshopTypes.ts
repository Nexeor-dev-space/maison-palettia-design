import { TAGS } from "@/lib/cms/cache";
import { toWorkshopType } from "@/lib/cms/mappers";
import { contentReader, findDocs } from "@/lib/cms/query";
import type { ImageAsset } from "@/types";

/**
 * The formats a Create Together experience is run in — a candle theme, a
 * crochet level — read from the `workshop-types` collection
 * (cms/collections/content/WorkshopTypes.ts, which says why the tier
 * exists).
 *
 * SERVER ONLY, like lib/workshops.ts: the reader goes through the Local
 * API. Client components import the type (erased) and nothing else. There
 * is no in-file fallback list: before the client's Oct 2026 update there
 * were no types, so "none" is the honest answer when the CMS cannot be
 * read, and every surface renders exactly as it did before the tier
 * existed.
 */
export interface WorkshopType {
  slug: string;
  name: string;
  /** The experience this is a format of. */
  experienceSlug: string;
  /** "Beginner", "Returning" — printed as a chip when set. */
  level?: string;
  /** One line under the name. Absent until the studio writes it. */
  description?: string;
  /** The long copy, one paragraph per entry. */
  about?: readonly string[];
  image?: ImageAsset;
  /** The studio's own flag, e.g. "New this month". Shown verbatim. */
  status?: string;
  /** The type a customer is best coming from, by slug. */
  recommendedAfterSlug?: string;
  /** "Start here", "After Beginners" — printed beside the name. */
  progressionNote?: string;
  /** The studio's order on the experience page and in the progression. */
  order: number;
}

const readTypes = contentReader("workshop-types", [TAGS.workshopTypes, TAGS.experiences], async (draft) => {
  const docs = await findDocs("workshop-types", draft, { drafts: true, sort: "order", depth: 1 });
  return docs.map(toWorkshopType);
});

/** Every published workshop type, in the studio's order. Empty when there are none. */
export async function getWorkshopTypes(): Promise<WorkshopType[]> {
  return [...((await readTypes()) ?? [])];
}

/** The types of one experience, in order. */
export function typesOfExperience(types: readonly WorkshopType[], experienceSlug: string): WorkshopType[] {
  return types.filter((type) => type.experienceSlug === experienceSlug);
}
