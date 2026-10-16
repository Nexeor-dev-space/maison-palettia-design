import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { pick, prose, text, whenIs } from "./shared";

/**
 * `eventsBrowser` → components/sections/EventsBody.tsx (events): the two
 * doors, the group heads, the filters and the schedule. SPEC §E.1. A door's
 * note is, by default, the matching Brand wording `journey` entry (the
 * walk-in and scheduled steps); the filter labels and the "no matches" copy
 * are in Settings → Page labels → Events browser.
 *
 * The door titles, the door chips and the two group leads are the product's
 * own names and lines, printed in many places, so they now come from
 * Booking & checkout wording → Event page → Mode labels (lib/modeCopy.ts).
 * The fields below stay (dropping a column is not an additive migration) but
 * are read-only and say where the words are edited.
 */

const MODE_LABELS = "Edited in Settings → Booking & checkout wording → Event page → Mode labels.";

/** A field kept for its stored value but no longer read: shown read-only, pointing at Mode labels. */
const movedToModeLabels = <F extends ReturnType<typeof text>>(field: F): F => ({
  ...field,
  admin: { ...field.admin, readOnly: true, description: MODE_LABELS },
});
export const EventsBrowserBlock: Block = {
  slug: "eventsBrowser",
  interfaceName: "EventsBrowserBlock",
  labels: { singular: "Events browser", plural: "Events browsers" },
  admin: { group: "Events" },
  fields: [
    {
      name: "doors",
      type: "array",
      label: "The two ways to book",
      labels: { singular: "Way to book", plural: "Ways to book" },
      minRows: 2,
      maxRows: 2,
      admin: { description: "Create Anytime first, Create Together second." },
      fields: [
        movedToModeLabels(text("title", "Title", 24, { required: true })),
        pick(
          "noteSource",
          "Note comes from",
          [
            { label: "Brand wording — journey step 1 (walk-in)", value: "journey0" },
            { label: "Brand wording — journey step 2 (scheduled)", value: "journey1" },
            { label: "Typed below", value: "custom" },
          ],
          { required: true, defaultValue: "journey0" },
        ),
        brandCopyLink({ path: "journey", label: "How people experience the Maison", condition: (_, s) => (s as { noteSource?: string })?.noteSource !== "custom" }),
        prose("note", "Note", 200, { condition: whenIs("noteSource", "custom") }),
        movedToModeLabels(text("modeLabel", "Mode label", 24)),
      ],
    },
    {
      name: "groupLeads",
      type: "group",
      label: "Group heads",
      fields: [
        movedToModeLabels(text("diy", "Create Anytime — lead", 80, { defaultValue: "Pick a project. Pick your colours. Just drop in." })),
        movedToModeLabels(text("scheduled", "Create Together — lead", 80, { defaultValue: "A little more planned. Same creative energy." })),
      ],
    },
    text("viewLocationLabel", "“View location” link", 24, { defaultValue: "View location" }),
    text("emptyTitle", "No dates yet — title", 60, { defaultValue: "The next dates are being set." }),
    prose("emptyBody", "No dates yet — body", 160, { defaultValue: "Create Anytime experiences are available in the meantime." }),
  ],
};
