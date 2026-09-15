import type { RecentItem } from "@/types";

/**
 * The "Just Added" collection and the helpers that render it.
 *
 * Same seam as `lib/workshops.ts`: the section reads through
 * `getRecentAdditions` and never touches the array below, so pointing this at
 * a CMS is a change to one function body.
 */

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   The titles below are editorial names given to photographs, not facts about
   the studio, and every one of them must be replaced before launch. Nothing
   here asserts a date, a session, an artist or an availability, because none
   of that is known yet — see the note on `date` below.

   The photographs are stand-ins cropped from assets the project already
   holds, and the pool is genuinely exhausted: the same still life and the
   same painting are already in use above this section, and a collection whose
   whole job is to say "here is what is new" is the worst place to re-cut them.

   FOUR ITEMS, NOT SIX. Two were photographs of the potter's wheel — "Slip &
   Water" and "In the Making" — and the client has taken the brand off the
   wheel, so they are gone rather than re-captioned. Nothing was substituted
   in, because there is nothing left in the project to substitute. The strip
   renders whatever it is given.

     TODO(client): this section needs its own shoot more than any other on the
     page — recent finished work, pieces in progress, hands mid-making. Six to
     eight frames, genuinely different subjects.
   ========================================================================== */
const PLACEHOLDER_ITEMS: RecentItem[] = [
  {
    slug: "late-blooms",
    title: "Late Blooms",
    subtitle: "Still life",
    href: "/gallery",
    shape: "portrait",
    image: {
      src: "/images/recent/late-blooms.jpg",
      alt: "Pale blush and white lilies opening against a bare wall, petals curling back as they age.",
    },
  },
  {
    slug: "vessel-and-bloom",
    title: "Vessel & Bloom",
    subtitle: "Painted ceramic",
    href: "/gallery",
    shape: "portrait",
    image: {
      src: "/images/recent/vessel-and-bloom.jpg",
      alt: "A cream ceramic vase painted with blue and ochre scrollwork, spent lilies leaning from its neck.",
    },
  },
  {
    slug: "blue-study",
    title: "Blue Study",
    subtitle: "Watercolour",
    href: "/gallery",
    shape: "square",
    image: {
      src: "/images/recent/blue-study.jpg",
      alt: "A watercolour passage of deep blue and violet washes breaking into soft yellow-green.",
    },
  },
  {
    slug: "petals-fallen",
    title: "Petals, Fallen",
    subtitle: "Studio detail",
    href: "/gallery",
    shape: "landscape",
    image: {
      src: "/images/recent/petals-fallen.jpg",
      alt: "Two dropped petals resting on a dark wooden table beside the foot of a painted vase.",
    },
  },
];

/**
 * The collection, newest first.
 *
 * Async for the same reason as `getUpcomingWorkshops`: the signature is
 * already the one a CMS fetch needs, so nothing downstream changes shape when
 * the data goes remote.
 *
 * The default of six is what the strip is composed for — enough that the row
 * runs past the right edge at every breakpoint, few enough that it stays a
 * curation rather than a gallery. The section renders whatever it is given.
 *
 * TODO(client): replace the body with the CMS query, sorted newest first.
 */
export async function getRecentAdditions(limit = 6): Promise<RecentItem[]> {
  return PLACEHOLDER_ITEMS.slice(0, limit);
}
