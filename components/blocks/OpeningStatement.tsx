import { OpeningStatement } from "@/components/sections/home/OpeningStatement";

import { imageOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `openingStatement` → <OpeningStatement> → <BrandStory> (SPEC §E.1).
 *
 * "Use Brand wording" on (the default): the statement and the lilac panel
 * are the `openingStatement` group of Brand wording, which /gallery's
 * header also prints. Off: the block's own heading, body, closer and panel.
 */
export function OpeningStatementAdapter({ block, ctx }: AdapterProps<"openingStatement">) {
  const b = stored(block);
  if (!b) return <OpeningStatement />;

  const source = b.useBrandCopy !== false ? ctx.brand?.openingStatement : b;
  // No Brand wording row at all (a failed read) — keep the shipped wording.
  if (!source) return <OpeningStatement eyebrow={text(b.eyebrow)} panelImage={imageOf(b.panelImage)} />;

  return (
    <OpeningStatement
      eyebrow={text(b.eyebrow)}
      words={{ heading: text(source.heading), body: text(source.body), closer: text(source.closer) }}
      panel={{
        heading: text(source.panel?.heading),
        body: text(source.panel?.body),
        signOff: text(source.panel?.signOff),
      }}
      panelImage={imageOf(b.panelImage)}
    />
  );
}
