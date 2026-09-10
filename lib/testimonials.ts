import type { Testimonial } from "@/types";

/**
 * What guests have said, and the seam the section reads it through.
 *
 * Same shape as `lib/workshops.ts` and `lib/recent.ts`: the component calls
 * `getTestimonials` and never touches the array, so pointing this at a CMS is
 * a change to one function body.
 */

/* ==========================================================================
   TODO(client): INVENTED CONTENT — MUST NOT SHIP.

   Read this before anything else in the file.

   Nobody said these things. They were written to give the section realistic
   shapes to be designed against, and they are the one kind of placeholder on
   this site that is genuinely dangerous: a made-up workshop title is obviously
   a stand-in, and a made-up quote from a customer is a fabricated endorsement
   the moment it reaches production. Every other placeholder in this project is
   a convenience. This one is a liability.

   Two rules while it stands:

   1. No names. Each quote is attributed to the workshop it came from, never to
      a person, because inventing a person is the part that cannot be walked
      back. Do not add names until there are real ones with real permission.
   2. Replace, do not edit. These are not drafts to be polished into something
      shippable — they are spacers, and the section renders nothing at all when
      the array is empty, so shipping with no testimonials is a supported state
      and a safer one than shipping with these.
   ========================================================================== */
const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    id: "first-time-at-the-wheel",
    quote:
      "I had never touched a wheel before and nobody made me feel like a beginner. I left with a bowl that leans a little, and I like it more than anything I own.",
    attribution: "Throwing on the Wheel",
  },
  {
    id: "two-hours-off-a-screen",
    quote:
      "It is the only two hours in my week where I am not looking at a screen. I did not expect a painting class to be the thing that fixed that.",
    attribution: "Watercolour in Bloom",
  },
  {
    id: "an-afternoon-that-ran-long",
    quote:
      "I came in to make one thing and stayed until the light went. There is no rush in that room, which turns out to be the whole point.",
    attribution: "Glaze & Finish",
  },
];

/**
 * The quotes to show, in the order the studio wants them read.
 *
 * Async for the same reason as the other two: the signature is already the one
 * a CMS fetch needs, so nothing downstream changes shape when the data goes
 * remote.
 *
 * Three is what the panel is composed for — enough that the section is a set
 * of voices rather than one endorsement, few enough that the controls stay a
 * line of small numerals. The section renders whatever it is given, and
 * nothing at all when it is given nothing.
 *
 * TODO(client): replace the body with the CMS query, filtered to quotes the
 * studio holds written permission to print.
 */
export async function getTestimonials(limit = 3): Promise<Testimonial[]> {
  return PLACEHOLDER_TESTIMONIALS.slice(0, limit);
}
