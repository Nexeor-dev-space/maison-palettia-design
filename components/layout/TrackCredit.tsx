import type { ReactNode } from "react";

import type { MusicTrack } from "@/lib/music";

const link = "underline underline-offset-2 hover:text-primary";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** `text`, or a link to `href` when there is one. */
const maybeLink = (text: string, href: string | null) =>
  href ? (
    <a href={href} className={link} {...ext}>
      {text}
    </a>
  ) : (
    text
  );

/*
  An editor's own credit line is often pasted from a video description, URLs
  and all. On the credits page those addresses become links (and may break
  anywhere, so a long one cannot push the card wider than the screen); the
  rest is printed as written, line breaks kept.
*/
const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

function withLinks(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} className={link} {...ext}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/**
 * A track's credit, two ways.
 *
 * `full` (the default, /music-credits): the whole credit. The built line
 * links the title to the track's page, the creator to theirs and the licence
 * to its deed; an editor-typed line is printed verbatim with its URLs linked.
 *
 * `short` (the player's card): one line of creator, licence and source, each
 * linked — enough for Creative Commons' title/author/source/licence while the
 * title sits just above it — and never the editor's long wording, which can
 * run to a screenful. The card links to the full credit on /music-credits.
 */
export function TrackCredit({ track, variant = "full" }: { track: MusicTrack; variant?: "full" | "short" }) {
  if (variant === "short") {
    const parts: ReactNode[] = [<span key="by">by {maybeLink(track.artist, track.artistUrl)}</span>];
    if (track.licence) parts.push(<span key="licence">{maybeLink(track.licence.name, track.licence.url)}</span>);
    if (track.sourceName || track.sourceUrl) parts.push(<span key="source">{maybeLink(track.sourceName || "Source", track.sourceUrl)}</span>);
    if (track.modified) parts.push(<span key="edited">edited</span>);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 ? " · " : null}
            {part}
          </span>
        ))}
      </>
    );
  }

  if (track.creditIsCustom) {
    return (
      <span className="whitespace-pre-line [overflow-wrap:anywhere]">
        {withLinks(track.credit)}
        {track.sourceUrl && !track.credit.includes(track.sourceUrl) ? (
          <>
            {" "}
            <a href={track.sourceUrl} className={link} {...ext}>
              Source
            </a>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <>
      “{maybeLink(track.title, track.sourceUrl)}” by {maybeLink(track.artist, track.artistUrl)}
      {track.sourceName ? ` (${track.sourceName})` : null}
      {track.licence ? <>, licensed under {maybeLink(track.licence.name, track.licence.url)}</> : null}
      .{track.modified ? " Edited for this site." : null}
    </>
  );
}
