import type { BrandCopy, Page } from "@/payload-types";

import type { DefaultBlock } from "./helpers";

/** One entry of `pages.blocks`, as payload-types.ts names it. */
export type PageBlock = NonNullable<Page["blocks"]>[number];
export type BlockType = PageBlock["blockType"];
export type BlockOf<T extends BlockType> = Extract<PageBlock, { blockType: T }>;

/**
 * A block as the renderer receives it: either the stored block, or a
 * launch-layout stand-in (./layouts.ts) that carries only its type.
 */
export type RenderBlock = PageBlock | ({ blockType: BlockType; id?: string | null } & DefaultBlock);

/**
 * What every adapter is told about where it is standing.
 *
 * `page` is the slug of the page being rendered (`home`, `about`, … or a
 * free landing page's slug). Several fixed pages draw the same block in
 * different compositions — six closing panels, seven page headers — and the
 * adapter picks the composition the page has always had from this, so the
 * site renders exactly as it did before the CMS (the Phase 2 parity gate)
 * and a new landing page gets the house default.
 *
 * `blocks` is the whole list, for the two places one section of the original
 * page carried another block's words (the loyalty steps print the passes
 * block's footer sentence; see components/blocks/Steps.tsx).
 */
export interface BlockContext {
  page: string;
  draft: boolean;
  brand: BrandCopy | null;
  blocks: readonly RenderBlock[];
}

/** Props every adapter takes. `header` is a page header folded into the block after it (see BlockRenderer). */
export interface AdapterProps<T extends BlockType> {
  block: BlockOf<T> | ({ blockType: T; id?: string | null } & DefaultBlock);
  ctx: BlockContext;
  header?: BlockOf<"pageHeader"> | ({ blockType: "pageHeader"; id?: string | null } & DefaultBlock);
}
