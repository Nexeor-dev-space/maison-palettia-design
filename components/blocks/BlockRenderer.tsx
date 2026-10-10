import { Fragment, type ComponentType } from "react";

import { ADAPTERS } from "./registry";
import type { AdapterProps, BlockContext, BlockType, RenderBlock } from "./types";

/**
 * ==========================================================================
 * <BlockRenderer> — a page's `blocks`, drawn by the site's own sections
 * ==========================================================================
 *
 * SPEC §E: components stay the renderers; blocks only supply data. This
 * walks the list in order and hands each block to its adapter
 * (./registry.ts), which turns the stored fields into the props the
 * existing section already takes. Nothing here draws anything itself.
 *
 * ONE PAGE HEADER, FOLDED INTO WHAT FOLLOWS IT. Three of the site's pages
 * never had a page header of their own: on /locations the heading, its line
 * and the map share one section; on /events the heading and the two doors
 * share one; on /private-events/book the heading is the form's own intro
 * column. A `pageHeader` stored directly before one of those blocks is
 * therefore not drawn as a band of its own — it is handed to the next
 * block's adapter as `header`, which sets the words where the page has
 * always set them. Anywhere else a `pageHeader` is its own section.
 *
 * NO WRAPPER ON THE PUBLIC SITE. The published HTML is the sections and
 * nothing else, byte for byte what the hand-built pages rendered — the
 * parity gate compares exactly that. Only in draft mode (an editor's
 * preview) is each block wrapped, in a `display: contents` element so the
 * layout still does not see it, carrying the `data-cms-*` attributes the
 * click-to-edit overlay reads (components/cms/ClickToEdit.tsx, SPEC §G.5).
 */

/** Blocks that take the page header standing directly before them. */
const TAKES_HEADER: ReadonlySet<BlockType> = new Set<BlockType>(["locationsHero", "eventsBrowser", "enquiryForm"]);

type Item = { block: RenderBlock; index: number; header?: { block: RenderBlock; index: number } };

function compose(blocks: readonly RenderBlock[]): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];
    if (block.blockType === "pageHeader" && next && TAKES_HEADER.has(next.blockType)) {
      items.push({ block: next, index: i + 1, header: { block, index: i } });
      i++;
      continue;
    }
    items.push({ block, index: i });
  }
  return items;
}

/**
 * Where a section's words live when they are not the block's own: the
 * `brand-copy` field path for a block in "Use Brand wording" mode, so the
 * click-to-edit pill can offer the global instead of an inert override
 * (SPEC §E "Use Brand Copy" fields, §G.5). Null when the block's own fields
 * hold its text.
 */
export function brandCopyPath(block: RenderBlock): string | null {
  const b = block as Record<string, unknown>;
  const on = (key: string) => b.__default === true || b[key] !== false;
  switch (block.blockType) {
    case "hero":
      // The launch banner sets its own three lines, not the tagline.
      return b.__default !== true && b.useTagline !== false ? "tagline" : null;
    case "openingStatement":
      return on("useBrandCopy") ? "openingStatement" : null;
    case "whereWeCreate":
    case "whereWeSetUp":
      return on("useFindUsLine") ? "findUsLine" : null;
    case "pageHeader":
      return b.standfirstSource === "openingStatementBody"
        ? "openingStatement.body"
        : b.standfirstSource === "findUsLine"
          ? "findUsLine"
          : null;
    case "steps":
      return b.__default === true || b.source === "brandCopyPrivateEventSteps" ? "privateEventSteps" : null;
    case "aboutWelcome":
      return "brandStory";
    case "missionVision":
      return "mission";
    case "communityJourney":
      return "community";
    case "whatSetsUsApart":
      return "whatSetsUsApart";
    case "closingInvitation":
      return "closing";
    default:
      return null;
  }
}

export function BlockRenderer({ blocks, ctx, docId }: { blocks: readonly RenderBlock[]; ctx: BlockContext; docId?: string | null }) {
  return (
    <>
      {compose(blocks).map(({ block, index, header }) => {
        const Adapter = ADAPTERS[block.blockType] as ComponentType<AdapterProps<BlockType>> | undefined;
        if (!Adapter) return null;

        const node = (
          <Adapter
            block={block as AdapterProps<BlockType>["block"]}
            ctx={ctx}
            header={header?.block as AdapterProps<BlockType>["header"]}
          />
        );
        const key = block.id ?? `${block.blockType}-${index}`;

        if (!ctx.draft) return <Fragment key={key}>{node}</Fragment>;

        const first = header ?? { block, index };
        const global = brandCopyPath(block) ?? (header ? brandCopyPath(header.block) : null);
        return (
          <div
            key={key}
            style={{ display: "contents" }}
            data-cms-block={first.block.id ?? undefined}
            data-cms-path={`blocks.${first.index}`}
            data-cms-type={block.blockType}
            data-cms-doc={docId ?? undefined}
            data-cms-global={global ? "brand-copy" : undefined}
            data-cms-global-path={global ?? undefined}
          >
            {node}
          </div>
        );
      })}
    </>
  );
}
