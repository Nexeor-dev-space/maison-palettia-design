/**
 * `music-settings` — "Music". Editors.
 *
 * The switch for the site's background-music player and how it behaves. The
 * tracks themselves, with their credits, are the `music-tracks` collection
 * (Content → Music); the player shows only while this is on AND at least one
 * track is in the playlist.
 *
 * NO AUTOPLAY SETTING, on purpose. Browsers block sound until the visitor
 * interacts, and WCAG 1.4.2 asks that audio never start on its own; the
 * player always waits for a press. What the studio controls is whether the
 * button is there, the starting volume, the order, and the pages it stays
 * off (checkout by default: nobody wants a soundtrack while paying).
 */

import type { GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { TAGS } from "@/lib/cms/cache";

import { copy, count, pathList, toggle } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const MUSIC_SETTINGS_SLUG = "music-settings" as const;

export const MusicSettings: GlobalConfig = {
  slug: MUSIC_SETTINGS_SLUG,
  label: "Music",
  admin: {
    group: "Settings",
    description: "The background-music player. Add tracks and their credits under Content → Music.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    afterChange: [settingsAfterChange({ slug: MUSIC_SETTINGS_SLUG, revalidateTag: TAGS.music, watch: [{ path: "enabled" }] })],
  },
  fields: [
    toggle("enabled", "Show the music player", {
      description: "A small play button in the corner of every page. Music only starts when a visitor presses it.",
      defaultValue: false,
    }),
    {
      type: "row",
      fields: [
        count("volume", "Starting volume (%)", {
          description: "Background level; visitors can change it.",
          min: 5,
          max: 100,
          defaultValue: 40,
          admin: { width: "50%" },
        }),
        toggle("shuffle", "Shuffle the playlist", {
          description: "Otherwise tracks play in their display order.",
          admin: { width: "50%" },
        }),
      ],
    },
    copy("label", "Button label", {
      description: "Read by screen readers and shown when the player opens.",
      max: 40,
      defaultValue: "Studio sounds",
    }),
    pathList("excludePaths", "Pages without the player", {
      description: "The player is hidden (and music paused) on these pages.",
      maxRows: 30,
      defaultValue: ["/checkout", "/payment-success", "/booking-status", "/dev"],
    }),
  ],
};
