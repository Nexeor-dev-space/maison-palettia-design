"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { isExcludedPath } from "@/cms/collections/analytics/shared";
import styles from "@/components/layout/MusicPlayer.module.css";
import { TrackCredit } from "@/components/layout/TrackCredit";
import type { MusicConfig, MusicTrack } from "@/lib/music";

/**
 * ==========================================================================
 * The background-music player — Content → Music, Settings → Music
 * ==========================================================================
 *
 * IT NEVER STARTS ON ITS OWN. Browsers refuse sound before a gesture, and
 * WCAG 1.4.2 asks that audio never begin unbidden, so the round button is
 * the only way in. `preload="none"` and no `src` until that press: a page
 * load downloads no music for the visitors (most of them) who never ask.
 *
 * IT LIVES IN THE ROOT LAYOUT, which App Router keeps mounted across
 * client-side navigation — so the track carries on from page to page.
 * On a page listed under "Pages without the player" the controls are not
 * drawn and the music pauses; the <audio> element stays, so coming back
 * resumes where it was if the visitor presses play again.
 *
 * THE CREDIT TRAVELS WITH THE SOUND. While a track plays, a chip beside the
 * button names it and its creator; opening it shows the full credit line
 * with the creator's, source's and licence's links, which is what Creative
 * Commons BY asks for. /music-credits lists every track for anyone who
 * wants them all.
 *
 * PLACEMENT. Bottom LEFT, opposite <ContactWidget> on the right, z-30 like
 * it. Below `lg` it rides above <BottomNav> (and its wave), and it steps
 * aside wherever <EventBookingBar> is drawn — that bar spans the width just
 * above the nav, and it is the page's primary action. See the module CSS.
 *
 * PERFORMANCE (issue #70). No scroll or pointer listeners; a keydown
 * listener only while the panel is open. The equaliser bars are a
 * transform-only CSS animation that runs only while music is playing.
 */

/** Fisher–Yates over the indices; run in a click handler, never in render, so hydration sees no randomness. */
function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function MusicPlayer({ config }: { config: MusicConfig }) {
  const { enabled, label, volume: startVolume, shuffle, excludePaths, tracks } = config;
  const pathname = usePathname();
  const hidden = !enabled || isExcludedPath(pathname, excludePaths);

  const audioRef = useRef<HTMLAudioElement>(null);
  const failuresRef = useRef(0);
  const [order, setOrder] = useState<number[] | null>(null); // fixed on the first press (shuffled or not)
  const [position, setPosition] = useState(0); // index into the play order
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(startVolume);
  const panelId = useId();

  const track: MusicTrack | undefined = tracks[order ? order[position % order.length] : position % tracks.length];

  /** Point the element at the track at `next` in the play order and start it. */
  const playAt = useCallback(
    (next: number) => {
      const audio = audioRef.current;
      if (!audio || tracks.length === 0) return;
      const playOrder = order ?? (shuffle ? shuffled(tracks.length) : tracks.map((_, i) => i));
      const at = ((next % tracks.length) + tracks.length) % tracks.length;
      const target = tracks[playOrder[at]];
      if (!order) setOrder(playOrder);
      setPosition(at);
      if (audio.getAttribute("src") !== target.src) audio.src = target.src;
      audio.volume = volume;
      audio.play().catch(() => setPlaying(false));
    },
    [order, shuffle, tracks, volume],
  );

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) audio.pause();
    else if (audio.getAttribute("src")) audio.play().catch(() => setPlaying(false));
    else playAt(position);
  };

  const next = useCallback(() => playAt(position + 1), [playAt, position]);

  // Leaving for an excluded page pauses; the playlist and position stay.
  useEffect(() => {
    if (hidden) audioRef.current?.pause();
  }, [hidden]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Escape closes the panel; only listening while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The phone's lock screen and the OS media keys name the track too.
  useEffect(() => {
    if (!playing || !track || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: label });
    navigator.mediaSession.setActionHandler("nexttrack", next);
    return () => navigator.mediaSession.setActionHandler("nexttrack", null);
  }, [playing, track, label, next]);

  if (tracks.length === 0) return null;

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          failuresRef.current = 0;
        }}
        onPause={() => setPlaying(false)}
        onEnded={next}
        onError={() => {
          // A missing or unplayable file skips ahead, once round the list at most.
          failuresRef.current += 1;
          if (failuresRef.current < tracks.length) next();
          else setPlaying(false);
        }}
      />

      {hidden ? null : (
        <div
          data-music-fab=""
          className={
            styles.dock +
            " fixed left-[max(1rem,env(safe-area-inset-left))] z-30 flex items-end gap-2 " +
            "lg:left-[max(1.5rem,env(safe-area-inset-left))]"
          }
        >
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className={styles.fab + " grid size-12 shrink-0 place-items-center bg-sage text-text lg:size-14"}
          >
            {playing ? (
              <span aria-hidden className={styles.bars}>
                <span />
                <span />
                <span />
              </span>
            ) : (
              <NoteIcon />
            )}
          </button>

          {playing || open ? (
            <div className="relative min-w-0">
              {open && track ? (
                <div
                  id={panelId}
                  role="region"
                  aria-label={`${label}: now playing`}
                  className={
                    styles.panel +
                    " absolute bottom-full left-0 mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg bg-cream p-4 text-fine text-text"
                  }
                >
                  <p className="text-action font-medium uppercase tracking-eyebrow text-muted">{label}</p>
                  <p className="mt-2 font-medium">{track.title}</p>
                  <p className="text-muted">{track.artist}</p>

                  <p className="mt-3 border-t border-line pt-3 leading-relaxed">
                    <TrackCredit track={track} />
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" onClick={toggle} className={styles.control} aria-label={playing ? "Pause" : "Play"}>
                      {playing ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    {tracks.length > 1 ? (
                      <button type="button" onClick={next} className={styles.control} aria-label="Next track">
                        <NextIcon />
                      </button>
                    ) : null}
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="sr-only">Volume</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        className="w-full accent-primary"
                      />
                    </label>
                  </div>

                  <Link href="/music-credits" className="mt-3 inline-block underline underline-offset-2 hover:text-primary">
                    All music credits
                  </Link>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                className={
                  styles.chip +
                  " flex h-10 max-w-[min(16rem,calc(100vw-6rem))] items-center gap-2 rounded-pill bg-cream px-4 text-fine text-text"
                }
              >
                <span className="truncate">
                  {track ? (
                    <>
                      <span className="font-medium">{track.title}</span> · {track.artist}
                    </>
                  ) : (
                    label
                  )}
                </span>
                <span className="sr-only">{open ? "— hide credits" : "— show credits and controls"}</span>
              </button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function NoteIcon() {
  return (
    <svg {...svg} width={22} height={22}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg {...svg}>
      <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg {...svg}>
      <path d="M8 5v14M16 5v14" strokeWidth={3} />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg {...svg}>
      <path d="M5 5l10 7-10 7z" fill="currentColor" />
      <path d="M19 5v14" strokeWidth={2.4} />
    </svg>
  );
}
