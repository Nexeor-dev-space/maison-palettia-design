import { TAGS } from "@/lib/cms/cache";
import { toTestimonial } from "@/lib/cms/mappers";
import { contentReader, findDocs } from "@/lib/cms/query";
import type { Testimonial } from "@/types";

/**
 * What guests have said, and the seam the section reads it through.
 *
 * Same shape as `lib/workshops.ts` and `lib/recent.ts`: the component calls
 * `getTestimonials` and never touches the data, so pointing this at a CMS was
 * a change to one function body. Since Phase 2 that body reads the
 * `testimonials` collection (SPEC §D.2) through `cached` under the
 * testimonials tag, draft-aware in preview.
 *
 * ==========================================================================
 * NO IN-FILE FALLBACK HERE, UNLIKE EVERY OTHER GETTER IN lib/ — ON PURPOSE.
 * ==========================================================================
 *
 * The other getters fall back to the copy that used to live in their file
 * while the CMS has nothing published, so the site reads exactly as before
 * the seed runs. This file held two INVENTED quotes, flagged "MUST NOT
 * SHIP": nobody said them, and a made-up quote from a customer is a
 * fabricated endorsement the moment it reaches production. The seed creates
 * no testimonials for that reason (SPEC §F.5), so a fallback would have
 * served the invented quotes indefinitely. They are deleted instead. Nothing
 * renders testimonials today, and the section renders nothing at all when it
 * is given nothing — the supported, safer state.
 *
 * Only quotes the studio holds written permission to print are returned
 * (`permissionOnFile`); the collection's publish gate (2A-1) enforces the
 * same rule at save time, and this is the second line.
 */

const readTestimonials = contentReader("testimonials", [TAGS.testimonials], async (draft) => {
  const docs = await findDocs("testimonials", draft, {
    drafts: true,
    sort: "-createdAt",
    depth: 0,
    where: { permissionOnFile: { equals: true } },
  });
  return docs.map(toTestimonial);
});

/**
 * The quotes to show, newest first.
 *
 * Three is what the panel is composed for — enough that the section is a set
 * of voices rather than one endorsement, few enough that the controls stay a
 * line of small numerals. The section renders whatever it is given, and
 * nothing at all when it is given nothing — including when the CMS cannot be
 * read.
 */
export async function getTestimonials(limit = 3): Promise<Testimonial[]> {
  return ((await readTestimonials()) ?? []).slice(0, limit);
}
