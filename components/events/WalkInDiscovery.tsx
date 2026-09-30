"use client";

import { useMemo, useState } from "react";

import { FindYourVibe } from "@/components/layout/FindYourVibe";
import { Reveal } from "@/components/motion/Reveal";
import { ExperienceCarousel } from "@/components/sections/home/ExperienceCarousel";
import { Container } from "@/components/ui/Container";
import type { CreativeExperience } from "@/lib/experiences";
import { experiencesByVibe, hasVibeTags, vibeCounts, type VibeSlug } from "@/lib/vibes";

/**
 * The walk-in half of /events — discovery, not a product grid.
 *
 * ==========================================================================
 * THE SAME TRACK THE HOME PAGE RUNS — at the client's ask
 * ==========================================================================
 *
 * These five sat on a twelve-column field at three sizes with three of them
 * dropped, in a repeating rhythm of five: an editorial spread rather than a
 * shelf, which was the argument for it. The client's word for the result is
 * "disorganised", and they have asked for this to look like "Pick a colour,
 * pick a table." on the home page instead.
 *
 * They are right, and the reason is worth keeping. A spread works when the
 * pictures are the composition; here they are a CATALOGUE — five things you
 * can come in and make — and a reader is comparing them, not admiring the
 * arrangement. Four different widths, four aspect ratios and three different
 * top edges mean no two cards can be compared without the eye re-measuring
 * them, and with a vibe filter on top the whole composition reshuffles when
 * a chip is pressed.
 *
 * So it is <ExperienceCarousel>, the same object, with the same cards, the
 * same paint flood and the same arrows: one width, one proportion, every
 * other card dropped by a fixed amount. A visitor meets the seven activities
 * on the home page and the five walk-in ones here as the same thing.
 *
 * THE TRACK BLEEDS AND THE CHIPS DO NOT, which is why this component owns its
 * own gutters rather than sitting inside the page's <Container>: the cards run
 * off the right of the screen so it is visible that there are more of them,
 * exactly as <ExperienceDiscovery> sets it up.
 *
 * DISCOVERY SITS OVER THE LISTING, NEVER INSTEAD OF IT. `vibe` is null until
 * a chip is pressed and null means every walk-in activity, in order. Choosing
 * a vibe narrows the same list rather than replacing it with a different
 * arrangement — the same rule the Experiences menu follows, so a visitor who
 * arrives by mood and one who arrives by browsing are reading one page.
 *
 * The chips only appear when the data can answer them: <FindYourVibe> is
 * rendered behind `hasVibeTags`, so an import that ships without vibe tags
 * degrades to the plain listing instead of three chips that all say zero.
 *
 * NOTHING HERE BOOKS ANYTHING. Every plate is a link to the activity's own
 * page. Walk-in experiences have no date, no seat count and no checkout, and
 * this component has no route to one.
 */
export function WalkInDiscovery({ experiences }: { experiences: CreativeExperience[] }) {
  const [vibe, setVibe] = useState<VibeSlug | null>(null);

  const offersVibes = useMemo(() => hasVibeTags(experiences), [experiences]);
  const counts = useMemo(() => {
    const out = {} as Record<VibeSlug, number>;
    for (const { vibe: v, count } of vibeCounts(experiences)) out[v.slug] = count;
    return out;
  }, [experiences]);

  const shown = useMemo(
    () => (vibe ? experiencesByVibe(experiences, vibe) : experiences),
    [experiences, vibe],
  );

  return (
    <>
      {offersVibes ? (
        <Container>
          <Reveal delay={0.1} className="mt-9 md:mt-11">
            <FindYourVibe counts={counts} selected={vibe} onSelect={setVibe} size="full" />
          </Reveal>
        </Container>
      ) : null}

      {/*
        `aria-live` on the count rather than on the list: a screen reader
        should hear "showing four" once, not five plate names re-announced
        every time a chip is pressed.
      */}
      <p aria-live="polite" className="sr-only">
        {shown.length} walk-in {shown.length === 1 ? "experience" : "experiences"} shown
      </p>

      {shown.length === 0 ? (
        <Container>
          <p className="mt-10 max-w-[34rem] text-body leading-[1.85] text-text/85">
            Nothing is tagged that way yet. Clear the filter to see every walk-in experience.
          </p>
        </Container>
      ) : (
        /*
          `pl-gutter` and nothing on the right: the track keeps the page's
          left rail and runs off the screen, which is what says there is more
          of it without a label saying so. The carousel restates the gutter on
          its own arrow row, so those still land on the section's right rail.
        */
        <div className="mt-10 pl-gutter md:mt-12">
          <ExperienceCarousel experiences={shown} />
        </div>
      )}
    </>
  );
}
