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
 * IT STARTS ON ITS OWN, AS SOON AS THE BROWSER LETS IT — at the client's
 * ask. The track is asked to play the moment the page is up. Where the
 * browser allows sound without a gesture (Chrome, for a site the visitor
 * already uses) that is the start. Where it does not — Safari always,
 * Firefox by default, Chrome for a first visit — no page can override it,
 * so the player waits for the visitor's FIRST tap, click or key anywhere on
 * the page and starts then. They never have to find the button.
 *
 * THE VISITOR'S "OFF" LASTS FOR THE VISIT. Pausing with the button is
 * remembered for this tab (`sessionStorage`): the music stays off through
 * every page and reload of the visit, until they press play again. A new
 * visit starts it by itself again — the client's ask (Oct 2026): it was kept
 * in `localStorage`, so one pause, even while testing, silenced the site in
 * that browser for good. The pause, and the button always on screen, are the
 * control WCAG 1.4.2 asks for when audio starts by itself.
 *
 * IT LIVES IN THE ROOT LAYOUT, which App Router keeps mounted across
 * client-side navigation — so the track carries on from page to page. A
 * full page load (a refresh, an address typed in) would start it over, so
 * the position is kept in `sessionStorage` and the track resumes from it.
 * On a page listed under "Pages without the player" the controls are not
 * drawn and the music pauses; coming back to any other page resumes it,
 * unless the visitor had switched it off.
 *
 * THE CREDIT TRAVELS WITH THE SOUND. While a track plays, a chip beside the
 * button names it and its creator. Opening it shows a SHORT card — title,
 * creator, licence and source, each linked, which is what Creative Commons
 * BY asks for — and a "Full credit" link to /music-credits, where the whole
 * wording lives. The card never prints an editor's long credit itself: a
 * pasted YouTube description filled a phone screen and had no way out
 * (Oct 2026). It closes with its × button, Escape, a tap anywhere outside
 * the player, the chip again, or a navigation.
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

/** This visit's "music off" (the visitor paused it), and the tab's place in the track. */
const OFF_KEY = "mp:music-off";
const POSITION_KEY = "mp:music-position";

/* Storage can throw (private modes, blocked site data); music must not. */

/* The permanent "off" an earlier version kept in `localStorage`: cleared, so
   the browsers that paused once get the music back on their next visit. */
function clearLegacyOff() {
  try {
    window.localStorage.removeItem(OFF_KEY);
  } catch {
    /* nothing to clear */
  }
}
function readOff(): boolean {
  try {
    return window.sessionStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}
function writeOff(off: boolean) {
  try {
    if (off) window.sessionStorage.setItem(OFF_KEY, "1");
    else window.sessionStorage.removeItem(OFF_KEY);
  } catch {
    /* nothing to keep it in */
  }
}
function readPosition(): { src: string; time: number } | null {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(POSITION_KEY) ?? "null");
    return saved && typeof saved.src === "string" && Number.isFinite(saved.time) ? saved : null;
  } catch {
    return null;
  }
}
function writePosition(src: string, time: number) {
  try {
    window.sessionStorage.setItem(POSITION_KEY, JSON.stringify({ src, time }));
  } catch {
    /* nothing to keep it in */
  }
}

/* The events a browser counts as the visitor activating the page — the
   ones `play()` is allowed from. `touchend` and `pointerup` are the tap on a
   phone (a scroll does not count, and the attempt is simply repeated on the
   next one); `click` and `keydown` cover everything else. */
const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;

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
  /** Where to seek once the track's metadata is in — the saved place after a full page load. */
  const pendingSeekRef = useRef<number | null>(null);
  const lastSavedRef = useRef(0);
  const [order, setOrder] = useState<number[] | null>(null); // fixed on the first press (shuffled or not)
  const [position, setPosition] = useState(0); // index into the play order
  const [playing, setPlaying] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  /* The path the card was opened on: it is open only there, so any
     navigation closes it without an effect having to set state. */
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = !hidden && openOn === pathname;
  const setOpen = useCallback((value: boolean) => setOpenOn(value ? pathname : null), [pathname]);
  const [volume, setVolume] = useState(startVolume);
  const panelId = useId();

  const track: MusicTrack | undefined = tracks[order ? order[position % order.length] : position % tracks.length];

  /** Point the element at the track at `next` in the play order, without starting it. */
  const load = useCallback(
    (next: number) => {
      const audio = audioRef.current;
      if (!audio || tracks.length === 0) return null;
      const playOrder = order ?? (shuffle ? shuffled(tracks.length) : tracks.map((_, i) => i));
      const at = ((next % tracks.length) + tracks.length) % tracks.length;
      const target = tracks[playOrder[at]];
      if (!order) setOrder(playOrder);
      setPosition(at);
      if (audio.getAttribute("src") !== target.src) {
        audio.src = target.src;
        // Back in the track this tab was last playing: pick up where it was.
        const saved = readPosition();
        pendingSeekRef.current = saved && saved.src === target.src ? saved.time : null;
      }
      audio.volume = volume;
      return audio;
    },
    [order, shuffle, tracks, volume],
  );

  /** Point the element at the track at `next` in the play order and start it. */
  const playAt = useCallback(
    (next: number) => {
      load(next)
        ?.play()
        .catch(() => setPlaying(false));
    },
    [load],
  );

  /* The button is the visitor's own say: pausing with it switches the music
     off for this browser, playing with it switches it back on. */
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      writeOff(true);
      audio.pause();
      return;
    }
    writeOff(false);
    if (audio.getAttribute("src")) audio.play().catch(() => setPlaying(false));
    else playAt(position);
  };

  const next = useCallback(() => playAt(position + 1), [playAt, position]);

  /* The latest `load`, for the start-up effect below, which must not re-run
     (and re-arm its listeners) every time the play order settles. */
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  /*
    START ON ARRIVAL, OR ON THE FIRST TAP — see the note at the top.

    Runs when the page is up, and again whenever the visitor comes back from
    a page without the player. It asks for the track at once; if the browser
    refuses, it listens (capture phase, so before anything on the page
    handles the same event) for the visitor's first activation anywhere and
    asks again from inside it, until the browser says yes. A press on the
    music button itself is left to the button: starting here too would have
    that same press pause it straight away.
  */
  useEffect(() => {
    clearLegacyOff();
    if (hidden || tracks.length === 0 || readOff()) return;
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;
    if (!audio.getAttribute("src")) loadRef.current(0);

    let armed = false;
    const disarm = () => {
      if (!armed) return;
      armed = false;
      for (const type of GESTURES) window.removeEventListener(type, onGesture, true);
    };
    const onGesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-music-fab]")) return disarm();
      if (readOff() || !audio.paused) return disarm();
      audio.play().then(disarm, () => {
        /* not an activation after all (a scroll): wait for the next one */
      });
    };
    let cancelled = false;
    audio.play().catch(() => {
      if (cancelled || readOff()) return;
      armed = true;
      for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true });
    });
    return () => {
      cancelled = true;
      disarm();
    };
  }, [hidden, tracks.length]);

  // Leaving for an excluded page pauses; the playlist and position stay.
  useEffect(() => {
    if (hidden) audioRef.current?.pause();
  }, [hidden]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Escape, or a press anywhere outside the player, closes the card; only listening while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onPress = (event: PointerEvent) => {
      if (event.target instanceof Node && dockRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [open, setOpen]);

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
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          const seek = pendingSeekRef.current;
          pendingSeekRef.current = null;
          if (seek !== null && seek > 0 && seek < audio.duration - 1) audio.currentTime = seek;
        }}
        onTimeUpdate={(event) => {
          // The place in the track, every couple of seconds, for a full page load to resume from.
          const now = Date.now();
          if (now - lastSavedRef.current < 2000) return;
          lastSavedRef.current = now;
          const audio = event.currentTarget;
          const src = audio.getAttribute("src");
          if (src) writePosition(src, audio.currentTime);
        }}
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
          ref={dockRef}
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
            /* Not `relative`: the card is placed against the whole dock (which is
               `fixed`), so it starts at the screen's gutter rather than at the
               chip and fits a phone's width. */
            <div className="min-w-0">
              {open && track ? (
                <div
                  id={panelId}
                  role="region"
                  aria-label={`${label}: now playing`}
                  className={
                    styles.panel +
                    " absolute bottom-full left-0 mb-2 max-h-[min(24rem,60dvh)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg bg-cream p-4 text-fine text-text"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="pt-1 text-action font-medium uppercase tracking-eyebrow text-muted">{label}</p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="-mr-2 -mt-2 grid size-9 shrink-0 place-items-center rounded-pill hover:bg-sage"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 font-medium [overflow-wrap:anywhere]">{track.title}</p>
                  <p className="mt-2 border-t border-line pt-2 leading-relaxed text-text/85 [overflow-wrap:anywhere]">
                    <TrackCredit track={track} variant="short" />
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

                  <Link
                    href={`/music-credits#track-${track.id}`}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-block underline underline-offset-2 hover:text-primary"
                  >
                    Full credit
                  </Link>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setOpen(!open)}
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
                <span className="sr-only">{open ? "— hide credit and controls" : "— show credit and controls"}</span>
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

function CloseIcon() {
  return (
    <svg {...svg} width={18} height={18}>
      <path d="M6 6l12 12M18 6L6 18" />
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
