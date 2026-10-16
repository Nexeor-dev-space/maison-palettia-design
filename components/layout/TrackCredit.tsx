import type { MusicTrack } from "@/lib/music";

/**
 * The credit with its links: the creator to their page, the source to the
 * track's page, the licence to its deed. An editor-typed credit line is
 * printed as written, with the source link after it when there is one.
 */
export function TrackCredit({ track }: { track: MusicTrack }) {
  const link = "underline underline-offset-2 hover:text-primary";
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

  if (track.creditIsCustom) {
    return (
      <>
        {track.credit}
        {track.sourceUrl ? (
          <>
            {" "}
            <a href={track.sourceUrl} className={link} {...ext}>
              Source
            </a>
          </>
        ) : null}
      </>
    );
  }

  return (
    <>
      “{track.sourceUrl ? <a href={track.sourceUrl} className={link} {...ext}>{track.title}</a> : track.title}” by{" "}
      {track.artistUrl ? (
        <a href={track.artistUrl} className={link} {...ext}>
          {track.artist}
        </a>
      ) : (
        track.artist
      )}
      {track.sourceName ? ` (${track.sourceName})` : null}
      {track.licence ? (
        <>
          , licensed under{" "}
          {track.licence.url ? (
            <a href={track.licence.url} className={link} {...ext}>
              {track.licence.name}
            </a>
          ) : (
            track.licence.name
          )}
        </>
      ) : null}
      .{track.modified ? " Edited for this site." : null}
    </>
  );
}
