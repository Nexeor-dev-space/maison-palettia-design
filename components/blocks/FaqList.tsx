import { FaqBody } from "@/components/sections/faq/FaqBody";
import type { FaqGroup } from "@/lib/constants";
import { getFaqGroups, type FaqGroupKey } from "@/lib/constants.server";

import { stored } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `faqList` → <FaqList> (SPEC §E.1).
 *
 * The block orders the groups and titles them; each group's questions are
 * the `faqs` collection's documents with that `group` key, in their own
 * order, as the data layer maps them (`getFaqGroups` — an answer in
 * "booking terms" mode prints Booking settings' current terms). A group with
 * no questions is left out rather than printed as an empty heading.
 */
const KEY_ORDER: readonly FaqGroupKey[] = ["coming", "booking", "groups"];

export async function FaqListAdapter({ block }: AdapterProps<"faqList">) {
  const b = stored(block);
  if (!b) return <FaqBody groups={await getFaqGroups()} />;

  const picked = b.groups ?? [];
  const titles = Object.fromEntries(picked.map((group) => [group.key, group.title])) as Partial<Record<FaqGroupKey, string>>;
  const all = await getFaqGroups(titles);

  const groups = picked
    .map((group) => all.find((candidate) => candidate.title === group.title) ?? all[KEY_ORDER.indexOf(group.key)])
    .filter((group): group is FaqGroup => Boolean(group) && group!.items.length > 0);

  return <FaqBody groups={groups} />;
}
