import { GalleryHeader, HEADER_LAUNCH, StatementHeader } from "@/components/sections/PageHeader";
import type { BrandCopy } from "@/payload-types";

import { imageOf, isDefaultBlock, lines, stored, text } from "./helpers";
import type { AdapterProps, BlockContext } from "./types";

/**
 * `pageHeader` → <StatementHeader> / <GalleryHeader> (SPEC §E.1).
 *
 * The standfirst is the block's own sentence, or — `standfirstSource` —
 * Brand wording's opening-statement body (/gallery) or "find us" line
 * (/locations), so those pages repeat the shared sentence rather than a
 * copy of it.
 */
export function PageHeaderAdapter({ block, ctx }: AdapterProps<"pageHeader">) {
  const words = headerWords(block, ctx);
  if (ctx.page === "gallery") {
    const b = stored(block);
    return (
      <GalleryHeader
        id="gallery-title"
        {...words}
        image={b ? imageOf(b.sideImage) : undefined}
        inset={b ? imageOf(b.sideImageSecondary) : undefined}
      />
    );
  }
  return (
    <StatementHeader
      id={ctx.page === "faq" || ctx.page === "policies" ? `${ctx.page}-title` : `${ctx.page}-page-title`}
      mark={ctx.page === "policies" ? "splash" : "wave"}
      {...words}
    />
  );
}

/**
 * The header's three slots for a page — shared with the adapters that draw
 * a folded header (LocationsHero, EventsBrowser, EnquiryForm). A missing
 * header, or a launch-layout one, gives the page's launch wording.
 */
export function headerWords(
  block: AdapterProps<"pageHeader">["block"] | undefined,
  ctx: BlockContext,
): { eyebrow: string | null; lines: readonly string[]; standfirst: string | null } {
  const launch = HEADER_LAUNCH[ctx.page];
  if (!block || isDefaultBlock(block)) {
    return {
      eyebrow: launch?.eyebrow ?? null,
      lines: launch?.lines ?? [],
      standfirst: launch?.standfirst || null,
    };
  }
  const b = stored(block)!;
  return {
    eyebrow: text(b.eyebrow),
    lines: lines(b.headingLines) ?? [],
    standfirst: standfirstOf(b.standfirstSource, b.standfirst, ctx.brand, launch?.standfirst),
  };
}

function standfirstOf(
  source: "text" | "openingStatementBody" | "findUsLine" | null | undefined,
  own: string | null | undefined,
  brand: BrandCopy | null,
  launch: string | undefined,
): string | null {
  if (source === "openingStatementBody") return brand ? text(brand.openingStatement?.body) : (launch ?? null);
  if (source === "findUsLine") return brand ? text(brand.findUsLine) : (launch ?? null);
  return text(own);
}
