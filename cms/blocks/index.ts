import type { Block } from "payload";

/**
 * The page-builder blocks (SPEC §E), one file per block, registered here.
 *
 * Empty in Phase 1 — Phase 2A-0 lands the block definitions and this list;
 * `pages.blocks` references it. The rule carried from the codebase: blocks
 * only supply data, the existing components stay the renderers
 * (components/blocks/BlockRenderer.tsx).
 */
export const blocks: Block[] = [];
