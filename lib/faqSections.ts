import type { FaqGroup } from "@/lib/constants";
import type { FaqItem } from "@/types";

/**
 * Questions under their sections: each section in order with the questions
 * filed under it (already in their own `order`), and a section with none left
 * out. A question with no section of its own is filed by its old `group`
 * under the section that replaced it — here as well as in the admin's read
 * hook, because the two lists are cached separately and a cached question
 * from before the move has no section yet. A question whose section is not
 * in the list is not printed.
 */
export function groupFaqsBySection<R extends { section: string | null; group: string | null }>(
  sections: readonly { id: string; title: string; legacyKey?: string | null }[],
  rows: readonly R[],
  item: (row: R) => FaqItem,
): FaqGroup[] {
  const inSection = (row: R, section: (typeof sections)[number]) =>
    row.section ? row.section === section.id : Boolean(section.legacyKey) && row.group === section.legacyKey;
  return sections
    .map((section) => ({ title: section.title, items: rows.filter((row) => inSection(row, section)).map(item) }))
    .filter((group) => group.items.length > 0);
}
