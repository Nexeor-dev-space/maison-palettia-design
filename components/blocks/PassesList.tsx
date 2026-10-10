import { PassesSection, type StepsFooter } from "@/components/sections/loyalty/LoyaltySections";
import { getPasses, PASSES_CONFIGURED } from "@/lib/passes";

import { cta, stored, text } from "./helpers";
import type { AdapterProps, BlockOf, RenderBlock } from "./types";

/**
 * `passesList` → <PassesSection> + <PassOffer> (SPEC §E.1).
 *
 * The block's intro, list heading and preview disclaimer are wired here.
 * Its labels for the offer itself (`addLabel`, `notOnSale`, `addedNote`, the
 * empty state…) belong to <PassOffer>, which Phase 3 rebuilds around the
 * checkout (SPEC §L, 3F) and wires to these fields then; until then the
 * component keeps its own wording, which is what the seed stores.
 */
export async function PassesListAdapter({ block }: AdapterProps<"passesList">) {
  const passes = await getPasses();
  const b = stored(block);
  if (!b) return <PassesSection passes={passes} showDisclaimer={!PASSES_CONFIGURED} />;

  return (
    <PassesSection
      passes={passes}
      showDisclaimer={!PASSES_CONFIGURED}
      eyebrow={text(b.eyebrow)}
      heading={b.heading}
      lead={text(b.lead)}
      listHeading={text(b.listHeading)}
      previewDisclaimer={text(b.previewDisclaimer)}
    />
  );
}

/**
 * The passes block's footer sentence, for the steps that close the page
 * (components/blocks/Steps.tsx): it was always printed under the steps, so
 * it is drawn there, from the passes block standing on the same page.
 */
export function passesFooter(blocks: readonly RenderBlock[]): StepsFooter | null | undefined {
  const passes = blocks.find((block) => block.blockType === "passesList");
  if (!passes) return null;
  const b = stored(passes as BlockOf<"passesList">);
  if (!b) return undefined;
  if (!b.footerBefore && !b.footerFirstLink?.label && !b.footerSecondLink?.label) return null;
  const first = cta(b.footerFirstLink);
  const second = cta(b.footerSecondLink);
  // The space before each link is the sentence's, not the editor's: an
  // admin text field is easy to save without its trailing space, and
  // "something?Go to your booking" is the result.
  const lead = (value: string | null | undefined, link: unknown) =>
    value && link ? `${value.trimEnd()} ` : (value ?? "");
  return {
    before: lead(b.footerBefore, first),
    first,
    between: lead(b.footerBetween, second),
    second,
    after: b.footerAfter ?? "",
  };
}
