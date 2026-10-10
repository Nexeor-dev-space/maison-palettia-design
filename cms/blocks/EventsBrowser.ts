import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { pick, prose, text, whenIs } from "./shared";

/**
 * `eventsBrowser` → components/sections/EventsBody.tsx (events): the two
 * doors, the group heads, the filters and the schedule. SPEC §E.1. A door's
 * note is, by default, the matching Brand wording `journey` entry (the
 * walk-in and scheduled steps); the filter labels and the "no matches" copy
 * are in Settings → Page labels → Events browser.
 */
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
        text("title", "Title", 24, { required: true }),
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
        text("modeLabel", "Mode label", 24, { description: "The chip on the door, e.g. “No booking” or “Booked online”." }),
      ],
    },
    {
      name: "groupLeads",
      type: "group",
      label: "Group heads",
      fields: [
        text("diy", "Create Anytime — lead", 80, { defaultValue: "Pick a project. Pick your colours. Just drop in." }),
        text("scheduled", "Create Together — lead", 80, { defaultValue: "A little more planned. Same creative energy." }),
      ],
    },
    text("viewLocationLabel", "“View location” link", 24, { defaultValue: "View location" }),
    text("emptyTitle", "No dates yet — title", 60, { defaultValue: "The next dates are being set." }),
    prose("emptyBody", "No dates yet — body", 160, { defaultValue: "Create Anytime experiences are available in the meantime." }),
  ],
};
