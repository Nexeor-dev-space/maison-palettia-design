import { FaqBody } from "@/components/sections/faq/FaqBody";
import type { FaqGroup } from "@/lib/constants";
import { getFaqGroups, getFaqSectionGroups, type FaqGroupKey } from "@/lib/constants.server";

import { stored } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `faqList` → <FaqList> (SPEC §E.1).
 *
 * The sections, their headings and their order are the FAQ sections
 * collection (`getFaqSectionGroups`); each section's questions are the `faqs`
 * documents filed under it, in their own order (an answer in "booking terms"
 * mode prints Booking settings' current terms). A section with no questions
 * is left out rather than printed as an empty heading.
 *
 * Until the one-time move has created those sections in a database, the
 * block's own `groups` list orders and titles the three old ones, as below.
 */
const KEY_ORDER: readonly FaqGroupKey[] = ["coming", "booking", "groups"];

export async function FaqListAdapter({ block }: AdapterProps<"faqList">) {
  // The sections editors manage (Content → FAQ sections). Before the one-time
  // move has made them, the block's own list below decides, as it always did.
  const sections = await getFaqSectionGroups();
  if (sections) return <FaqBody groups={sections} />;

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
