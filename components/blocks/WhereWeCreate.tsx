import { WhereWeCreate } from "@/components/sections/home/WhereWeCreate";
import { getMallPartners } from "@/lib/partners";

import { lines, partnerOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `whereWeCreate` → <WhereWeCreate> (SPEC §E.1).
 *
 * The line under the heading is Brand wording's `findUsLine` while "Use the
 * find-us line" is on — the same sentence /locations, the FAQ and /events
 * print — and the block's own `lead` when it is off. The map shows the venue
 * the editor picked, or the first current venue when none is picked.
 */
export async function WhereWeCreateAdapter({ block, ctx }: AdapterProps<"whereWeCreate">) {
  const b = stored(block);
  if (!b) return <WhereWeCreate />;

  const partners = await getMallPartners();
  // No Brand wording row at all (a failed read) leaves the shipped sentence.
  const lead = b.useFindUsLine !== false ? (ctx.brand ? text(ctx.brand.findUsLine) : undefined) : text(b.lead);

  return (
    <WhereWeCreate
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines)}
      lead={lead}
      findUsNowLabel={text(b.findUsNowLabel)}
      venue={b.venue ? partnerOf(b.venue, partners) : (partners[0] ?? null)}
    />
  );
}
