import { ClosingStatement } from "@/components/sections/home/ClosingStatement";

import { cta, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `closingInvitation` → <ClosingStatement> (SPEC §E.1).
 *
 * The block holds the two buttons only. The words are Brand wording's —
 * the tagline as the eyebrow, `closing.heading` and `closing.body` — which
 * is why click-to-edit sends an editor to the global for this section
 * (BlockRenderer → brandCopyPath).
 */
export function ClosingInvitationAdapter({ block, ctx }: AdapterProps<"closingInvitation">) {
  const b = stored(block);
  if (!b) return <ClosingStatement />;

  const brand = ctx.brand;
  return (
    <ClosingStatement
      eyebrow={brand ? text(brand.tagline) : undefined}
      heading={brand ? text(brand.closing?.heading) : undefined}
      body={brand ? text(brand.closing?.body) : undefined}
      primary={cta(b.primaryCta)}
      secondary={cta(b.secondaryCta)}
    />
  );
}
