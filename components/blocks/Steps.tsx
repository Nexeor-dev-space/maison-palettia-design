import { LOYALTY_STEPS, StepsList } from "@/components/sections/loyalty/LoyaltySections";
import { HowItWorks } from "@/components/sections/private-events/PrivateEventsSections";

import { lines, stored, text } from "./helpers";
import { passesFooter } from "./PassesList";
import type { AdapterProps, BlockContext } from "./types";

/**
 * `steps` → the cards on /private-events (<HowItWorks>) or the ruled list on
 * /loyalty (<StepsList>) (SPEC §E.1).
 *
 * `source` picks the steps: Brand wording's private-event steps (shared with
 * the enquiry page's sidebar and the programme pages) or the block's own.
 * `variant` picks the drawing. On /loyalty the list closes on the passes
 * block's footer sentence, which the page always printed under the steps.
 */
export function StepsAdapter({ block, ctx }: AdapterProps<"steps">) {
  const b = stored(block);
  if (!b) {
    return ctx.page === "loyalty" ? (
      <StepsList footer={passesFooter(ctx.blocks)} />
    ) : (
      <HowItWorks steps={brandSteps(ctx) ?? undefined} />
    );
  }

  const steps =
    b.source === "custom"
      ? (b.steps ?? []).map((step) => ({ title: step.title, detail: step.detail }))
      : (brandSteps(ctx) ?? (ctx.page === "loyalty" ? LOYALTY_STEPS : undefined));

  if (b.variant === "list") {
    return <StepsList eyebrow={text(b.eyebrow)} steps={steps} footer={passesFooter(ctx.blocks)} />;
  }
  return <HowItWorks eyebrow={text(b.eyebrow)} lines={lines(b.headingLines)} steps={steps} />;
}

/** Brand wording's private-event steps, or null when the global could not be read. */
export function brandSteps(ctx: BlockContext): { title: string; detail?: string | null }[] | null {
  const rows = ctx.brand?.privateEventSteps;
  if (!ctx.brand || !rows?.length) return null;
  return rows.map((row) => ({ title: row.title, detail: row.detail }));
}
