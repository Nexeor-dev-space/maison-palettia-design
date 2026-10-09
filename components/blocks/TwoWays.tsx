import { TwoWaysToCreate, type TwoWaysRoad } from "@/components/sections/home/TwoWaysToCreate";

import { cta, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `twoWays` → <TwoWaysToCreate> (SPEC §E.1).
 *
 * The two roads in the editor's order. Each road's `ground` says which it
 * is — terracotta the walk-in road, lilac the booked one — and that decides
 * the photograph and the one fact the component works out for itself (where
 * the studio is / the next date with a seat), so the block holds only the
 * words a person writes.
 */
export function TwoWaysAdapter({ block }: AdapterProps<"twoWays">) {
  const b = stored(block);
  if (!b) return <TwoWaysToCreate />;

  const roads: TwoWaysRoad[] = (b.roads ?? []).map((road) => ({
    ground: road.ground,
    eyebrow: road.eyebrow,
    title: road.title,
    line: road.line,
    facts: (road.facts ?? []).map((fact) => fact.text).filter(Boolean),
    action: cta(road.cta),
  }));

  return <TwoWaysToCreate eyebrow={text(b.eyebrow)} heading={text(b.heading)} lead={text(b.lead)} roads={roads} />;
}
