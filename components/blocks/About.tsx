import { Apart, Community, Purpose, Welcome } from "@/components/sections/about/AboutSections";

import { imageOf, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * The four /about blocks (SPEC §E.1). Their words are Brand wording — the
 * tagline and brand story, the mission and vision, the community passage and
 * its journey, the four points that set the Maison apart — so the page and
 * every other surface that prints those sentences change together. The
 * blocks hold only what is the page's own: eyebrows, the Apart heading and
 * the welcome photograph. A missing Brand wording row (a failed read) leaves
 * each section on the wording it shipped with.
 */

/** `aboutWelcome` → <Welcome>: H1 = tagline, paragraphs = brand story. */
export function AboutWelcomeAdapter({ block, ctx }: AdapterProps<"aboutWelcome">) {
  const b = stored(block);
  if (!b) return <Welcome />;
  const brand = ctx.brand;
  const story = brand?.brandStory?.map((row) => row.paragraph).filter(Boolean);
  return (
    <Welcome
      eyebrow={text(b.eyebrow)}
      title={text(brand?.tagline) ?? undefined}
      story={brand ? (story ?? []) : undefined}
      image={imageOf(b.image)}
    />
  );
}

/** `missionVision` → <Purpose>. No fields of its own. */
export function MissionVisionAdapter({ block, ctx }: AdapterProps<"missionVision">) {
  const brand = ctx.brand;
  if (!stored(block) || !brand) return <Purpose />;
  return (
    <Purpose
      missionLabel={text(brand.purposeLabels?.mission) ?? ""}
      mission={text(brand.mission) ?? ""}
      visionLabel={text(brand.purposeLabels?.vision) ?? ""}
      vision={text(brand.vision) ?? ""}
    />
  );
}

/** `communityJourney` → <Community>: the community passage and the journey steps. */
export function CommunityJourneyAdapter({ block, ctx }: AdapterProps<"communityJourney">) {
  const b = stored(block);
  if (!b) return <Community />;
  const brand = ctx.brand;
  if (!brand) return <Community eyebrow={text(b.eyebrow)} />;
  return (
    <Community
      eyebrow={text(b.eyebrow)}
      heading={text(brand.community?.heading) ?? ""}
      body={text(brand.community?.body)}
      closer={text(brand.community?.closer)}
      journey={(brand.journey ?? []).map((step, i) => ({
        slug: step.slug ?? step.id ?? String(i),
        name: step.name,
        description: step.description,
      }))}
    />
  );
}

/** `whatSetsUsApart` → <Apart>: the block's heading over Brand wording's cards. */
export function WhatSetsUsApartAdapter({ block, ctx }: AdapterProps<"whatSetsUsApart">) {
  const b = stored(block);
  if (!b) return <Apart />;
  const brand = ctx.brand;
  return (
    <Apart
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      points={
        brand
          ? (brand.whatSetsUsApart ?? []).map((point, i) => ({
              slug: point.slug ?? point.id ?? String(i),
              name: point.name,
              description: point.description,
            }))
          : undefined
      }
    />
  );
}
