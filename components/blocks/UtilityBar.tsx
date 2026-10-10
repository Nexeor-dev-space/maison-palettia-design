import { resolveLink } from "@/cms/fields/link";
import { PageUtilityBar } from "@/components/layout/PageUtilityBar";
import type { NavItem } from "@/types";

import { stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `utilityBar` → <PageUtilityBar> (SPEC §E.1): a note and a row of small
 * links at the foot of a page. On the event and checkout templates the bars
 * are configured in Booking settings (`booking-settings.utilityBars`); this
 * block is the same bar for a page built from blocks.
 */
export function UtilityBarAdapter({ block }: AdapterProps<"utilityBar">) {
  const b = stored(block);
  if (!b) return null;
  const links: NavItem[] = (b.links ?? [])
    .map((row) => {
      const href = resolveLink(row.link);
      return href ? { label: row.label, href, ...(row.link?.type === "external" ? { external: true } : {}) } : null;
    })
    .filter((link): link is NavItem => link !== null);
  return <PageUtilityBar note={text(b.note) ?? undefined} links={links} />;
}
