import { resolveLink } from "@/cms/fields/link";
import { WaysToExperience, type Door, type WaysGroup } from "@/components/sections/home/WaysToExperience";

import { doc, imageOf, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `waysToTakePart` → <WaysToExperience> + <WaysTrail> (SPEC §E.1).
 *
 * The four ways in, each a name, a lede, a photograph, a tint and its doors.
 * A door goes where its link says; a door tied to a programme and left
 * without a link goes to that programme's page, so a renamed programme
 * never strands the homepage on an old address. The two "creating" doors
 * keep the walk-in / scheduled mark, which is what `noteSource` = a count
 * tells this adapter they are.
 */
export function WaysToTakePartAdapter({ block }: AdapterProps<"waysToTakePart">) {
  const b = stored(block);
  if (!b) return <WaysToExperience />;

  const groups: WaysGroup[] = (b.groups ?? []).map((group) => ({
    name: group.name,
    lede: group.lede,
    photo: imageOf(group.photo)?.src ?? null,
    tint: group.tint,
    doors: (group.doors ?? [])
      .map((door): Door | null => {
        const programme = doc(door.programme);
        const href = resolveLink(door.link) ?? (programme ? `/private-events/${programme.slug}` : null);
        if (!href) return null;
        return {
          label: door.label,
          href,
          note: text(door.note) ?? undefined,
          mode: door.noteSource === "diyCount" ? "diy" : door.noteSource === "scheduledCount" ? "scheduled" : undefined,
        };
      })
      .filter((door): door is Door => door !== null),
  }));

  return <WaysToExperience eyebrow={text(b.eyebrow)} lines={lines(b.headingLines)} lead={text(b.lead)} groups={groups} />;
}
