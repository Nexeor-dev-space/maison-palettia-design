import type { Metadata } from "next";

import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";

/**
 * ==========================================================================
 * THE SITE'S 404 — rendered inside the site layout, in the site's own voice
 * ==========================================================================
 *
 * WHY THIS FILE HAS TO EXIST NOW. The site used to have one root layout at
 * app/layout.tsx, so Next's default "This page could not be found" at least
 * rendered inside the header and footer. There is no app/layout.tsx any more:
 * the site lives in app/(site) and the CMS admin in app/(payload), each with
 * a root layout of its own (docs/cms/SPEC.md §A.1), and with two root layouts
 * an unmatched URL falls through to Next's bare, unstyled default document —
 * no fonts, no chrome, nothing of the brand (research/00-spike.md, G21).
 *
 * HOW A 404 GETS HERE. Two paths, and both are needed:
 *
 *   · `notFound()` thrown inside the group — /events/not-a-slug,
 *     /policies/nothing — resolves to the nearest not-found.tsx up the tree,
 *     which is this one, wrapped in (site)/layout.tsx.
 *   · A URL that matches NO route at all never enters a route group, so it
 *     cannot find this file on its own. app/(site)/[...slug]/page.tsx is the
 *     net for those: every otherwise-unmatched URL lands in it and it calls
 *     `notFound()`, which brings the request here.
 *
 * WHAT IT SAYS AND HOW. The same masthead the sub-pages open with — eyebrow,
 * a two-line statement in the brand script, a lead paragraph in the right
 * column — so a wrong address reads as a page of this site rather than an
 * interruption of it. Two ways out, in the site's two action shapes: the
 * primary <BlobButton> back to the homepage, and the sticky-note secondary
 * to the programme, which is where most visitors who mistyped an event URL
 * were trying to go.
 *
 * `title` only. Next adds `noindex` to every 404 of its own accord, and the
 * site's defaults deliberately carry no canonical and no og:url, because a
 * 404 is nobody's canonical page (see the note in lib/seo.ts). The share
 * image comes from ./opengraph-image.tsx by convention — the card has to be
 * in this directory for that to work, which is one reason it lives here.
 */
export const metadata: Metadata = {
  title: "Page not found",
  description: "There is no page at this address on the Maison Palettia site.",
};

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative isolate overflow-clip bg-cream pb-[4rem] pt-[4rem] md:pb-section md:pt-[5.5rem] lg:pb-section-lg"
    >
      <SectionShapes plan={groundShapes("cream")} />

      <Container className="relative">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Page not found</Eyebrow>
            </Reveal>
            <DisplayHeading
              as="h1"
              id="not-found-title"
              className="mt-8 md:mt-10"
              lines={["This page has", "wandered off."]}
            />
          </div>

          <div className="col-span-12 lg:col-span-5 lg:pb-3">
            <Reveal delay={0.15}>
              {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
              <p className="text-lead text-text/85">
                The address may have changed, or it was never one of ours. The
                programme and the studio are a step away.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <BlobButton href="/">Back to the homepage</BlobButton>
                {/* A secondary BUTTON, not an underlined word — the site's
                    secondary action is the sticky note; see <PeelNote>. */}
                <PeelNote href="/events" className="min-h-[3.25rem] px-7">
                  Explore upcoming events
                </PeelNote>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
