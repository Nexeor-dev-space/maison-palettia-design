import { TAGS } from "@/lib/cms/cache";
import { toVibe } from "@/lib/cms/mappers";
import { contentReader, findDocs } from "@/lib/cms/query";
import { VIBES, type Vibe } from "@/lib/vibes";

/**
 * lib/vibes.ts, from the CMS: the `vibes` collection (SPEC §D.2), in display
 * order, cached under `collection:vibes`.
 *
 * SERVER ONLY — lib/vibes.ts is imported by client components ("Find your
 * vibe", the walk-in discovery, the mobile menu), which receive this list as
 * a prop and pass it to `vibeCounts(experiences, vibes)` / `getVibe(slug,
 * vibes)`; both still default to the in-file `VIBES`.
 *
 * Which activities carry which vibe is not here: it is each experience's
 * `vibes` relation, mapped to slugs by `getCreativeExperiences`.
 */

const readVibes = contentReader("vibes", [TAGS.vibes], async (draft) => {
  const docs = await findDocs("vibes", draft, { drafts: false, sort: "order", depth: 0 });
  return docs.map(toVibe);
});

/** `VIBES`: the taxonomy, in the order the filter shows it. */
export async function getVibes(): Promise<Vibe[]> {
  const fromCms = await readVibes();
  // The in-file taxonomy only when the CMS could not be read (null).
  return fromCms ? [...fromCms] : VIBES.map((vibe) => ({ ...vibe }));
}
