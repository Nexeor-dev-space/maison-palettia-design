import { TAGS } from "@/lib/cms/cache";
import { contentReader, findDocs, getGlobal } from "@/lib/cms/query";
import { buildCredit, licenceName, licenceOf, type MusicConfig, type MusicTrack } from "@/lib/music";
import type { MusicTrack as MusicTrackDoc } from "@/payload-types";

/**
 * The background-music playlist and the player's settings, from the CMS
 * (`music-tracks` + Settings → Music), cached under their own tags.
 *
 * NO IN-FILE FALLBACK. Every other getter falls back to the copy in its own
 * file when the CMS cannot answer; music has no such copy, so an unreadable
 * CMS (or a database the migration has not reached yet) simply means no
 * player — the safe answer for a feature that makes noise.
 */

const toTrack = (doc: MusicTrackDoc): MusicTrack | null => {
  if (!doc.url || !doc.title) return null;
  const known = licenceOf(doc.licence);
  const name = licenceName(doc);
  return {
    id: String(doc.id),
    src: doc.url,
    mimeType: doc.mimeType ?? null,
    title: doc.title,
    artist: doc.artist,
    artistUrl: doc.artistUrl || null,
    sourceName: doc.sourceName || null,
    sourceUrl: doc.sourceUrl || null,
    licence: name ? { name, url: (known?.value === "other" ? doc.licenceUrl : known?.url) || null } : null,
    credit: buildCredit(doc),
    creditIsCustom: Boolean(doc.creditOverride?.trim()),
    modified: Boolean(doc.modified),
  };
};

const readTracks = contentReader("music-tracks", [TAGS.musicTracks], async (draft) => {
  const docs = await findDocs("music-tracks", draft, {
    drafts: false,
    where: { active: { equals: true } },
    sort: "order",
    depth: 0,
  });
  return docs.map(toTrack).filter((track): track is MusicTrack => track !== null);
});

/** Every track in the playlist, in display order — also what /music-credits lists. */
export async function getMusicTracks(): Promise<MusicTrack[]> {
  return (await readTracks()) ?? [];
}

/** What the player needs. `enabled` is false unless the switch is on AND there is something to play. */
export async function getMusicConfig(): Promise<MusicConfig> {
  const [settings, tracks] = await Promise.all([getGlobal("music-settings", 0), getMusicTracks()]);
  return {
    enabled: Boolean(settings?.enabled) && tracks.length > 0,
    label: settings?.label?.trim() || "Studio sounds",
    volume: Math.min(100, Math.max(5, settings?.volume ?? 40)) / 100,
    shuffle: Boolean(settings?.shuffle),
    excludePaths: (settings?.excludePaths ?? []).map((row) => row.path).filter(Boolean),
    tracks,
  };
}
