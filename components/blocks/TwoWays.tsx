import { TwoWaysToCreate, type TwoWaysRoad } from "@/components/sections/home/TwoWaysToCreate";

import { cta, imageOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `twoWays` → <TwoWaysToCreate> (SPEC §E.1).
 *
 * The two roads in the editor's order. Each road's `ground` says which it
 * is — terracotta the walk-in road, lilac the booked one — and that decides
 * the one fact the component works out for itself (where the studio is / the
 * next date with a seat). The photograph is the card's own upload; a blank
 * one is `null` here, and the component then uses the first activity of that
 * road's kind, as it always did.
 */
export function TwoWaysAdapter({ block }: AdapterProps<"twoWays">) {
  const b = stored(block);
  if (!b) return <TwoWaysToCreate />;

  const roads: TwoWaysRoad[] = (b.roads ?? []).map((road) => ({
    ground: road.ground,
    title: road.title,
    line: road.line,
    photo: imageOf(road.photo),
    facts: (road.facts ?? []).map((fact) => fact.text).filter(Boolean),
    action: cta(road.cta),
  }));

  return <TwoWaysToCreate eyebrow={text(b.eyebrow)} heading={text(b.heading)} lead={text(b.lead)} roads={roads} />;
}
