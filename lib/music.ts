/**
 * ==========================================================================
 * Background music: the licences, and the credit line each one needs
 * ==========================================================================
 *
 * Shared by the `music-tracks` collection (which shows an editor the credit
 * a track will carry) and the site (the player and /music-credits print it),
 * so the two can never disagree about what a track is credited as.
 *
 * CLIENT-SAFE: no Payload or Next imports. The CMS getter lives in
 * lib/music.server.ts.
 *
 * WHY THE LICENCE IS A LIST, NOT FREE TEXT. "Copyright-free" music is almost
 * always licensed, and what the site owes the creator depends on which
 * licence: Creative Commons BY wants the title, the creator, the source, the
 * licence with a link, and a note if the track was edited (TASL); CC0 and
 * Pixabay's own licence ask for nothing but welcome a credit. A fixed list
 * lets the site build the right line and link the right deed. Non-commercial
 * (-NC) licences are deliberately missing: this is a business's website, and
 * NC music cannot be used on it at all.
 */

export const MUSIC_LICENCES = [
  { value: "cc-by-4.0", label: "Creative Commons Attribution 4.0 (CC BY 4.0)", short: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/", attribution: true },
  { value: "cc-by-sa-4.0", label: "Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)", short: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/", attribution: true },
  { value: "cc-by-3.0", label: "Creative Commons Attribution 3.0 (CC BY 3.0)", short: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/", attribution: true },
  { value: "cc0", label: "Public domain (CC0)", short: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/", attribution: false },
  { value: "pixabay", label: "Pixabay Content License", short: "Pixabay Content License", url: "https://pixabay.com/service/license-summary/", attribution: false },
  { value: "other", label: "Other (give the licence link or the exact credit line)", short: "", url: "", attribution: true },
] as const;

export type MusicLicence = (typeof MUSIC_LICENCES)[number]["value"];

export const licenceOf = (value: string | null | undefined) => MUSIC_LICENCES.find((l) => l.value === value);

/** A track as the site plays and credits it — plain data, safe to hand to a client component. */
export interface MusicTrack {
  id: string;
  src: string;
  mimeType: string | null;
  title: string;
  artist: string;
  artistUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  licence: { name: string; url: string | null } | null;
  /** The whole credit as one line of text (the editor's own wording when they gave one). */
  credit: string;
  /** True when the editor typed the credit themselves; the site then prints it verbatim instead of building linked parts. */
  creditIsCustom: boolean;
  modified: boolean;
}

/** What the player needs (lib/music.server.ts builds it in the root layout). */
export interface MusicConfig {
  /** False unless Settings → Music is on AND there is at least one track to play. */
  enabled: boolean;
  label: string;
  /** 0–1, as `HTMLMediaElement.volume` takes it. */
  volume: number;
  shuffle: boolean;
  excludePaths: string[];
  tracks: MusicTrack[];
}

/** The fields of a `music-tracks` document the credit is built from. */
export interface CreditFields {
  title?: string | null;
  artist?: string | null;
  sourceName?: string | null;
  licence?: string | null;
  licenceName?: string | null;
  modified?: boolean | null;
  creditOverride?: string | null;
}

/**
 * The licence's display name: the catalogue's short name, or what the editor
 * typed for "Other".
 */
export function licenceName(fields: Pick<CreditFields, "licence" | "licenceName">): string {
  const known = licenceOf(fields.licence);
  if (known && known.value !== "other") return known.short;
  return fields.licenceName?.trim() || "";
}

/**
 * The credit line, e.g. `"Morning Light" by Ana Vale (Free Music Archive),
 * licensed under CC BY 4.0. Edited for this site.` — Creative Commons' own
 * recommended TASL order. An editor-supplied line wins outright: some
 * sources (Incompetech, Uppbeat, Bensound) publish the exact words they want.
 */
export function buildCredit(fields: CreditFields): string {
  const custom = fields.creditOverride?.trim();
  if (custom) return custom;

  const title = fields.title?.trim() || "Untitled";
  const artist = fields.artist?.trim();
  const source = fields.sourceName?.trim();
  const licence = licenceName(fields);

  let line = `“${title}”`;
  if (artist) line += ` by ${artist}`;
  if (source) line += ` (${source})`;
  if (licence) line += `, licensed under ${licence}`;
  line += ".";
  if (fields.modified) line += " Edited for this site.";
  return line;
}
