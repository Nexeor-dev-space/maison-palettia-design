/**
 * ==========================================================================
 * The site's background music
 * ==========================================================================
 *
 * One looping track (public/music/bg-music.mp3) behind every page, with the
 * wave button in the header to pause and play it — see
 * components/layout/SoundToggle.tsx.
 *
 * A MODULE, NOT A COMPONENT. The <audio> lives here, outside React, so it
 * survives everything React does: a client navigation re-renders the header
 * and a Fast Refresh remounts it, and neither may restart the track or play
 * two copies over each other. The button only reads the state and asks for
 * changes.
 *
 * IT CANNOT START BY ITSELF, AND THAT IS THE BROWSER, NOT A CHOICE. Every
 * browser refuses sound before the visitor has interacted with the page. So
 * the music starts on the visitor's first press or key — anywhere on the
 * page — and from then on the button is in charge. A visitor who pauses it
 * has said so: that is remembered on this device, and the music then waits
 * for the button rather than starting on the next visit's first click.
 *
 * NOTHING IS DOWNLOADED UNTIL IT PLAYS. The track is 3MB; `preload="none"`
 * and a source set only on the first play keep it off the critical path for
 * every visitor who never hears it.
 *
 * QUIET, AND IT EASES. A background, not a soundtrack: it fades up to a
 * modest level and fades out before pausing, so neither press is a jolt. It
 * pauses while the tab is hidden and resumes when it comes back, the way a
 * visitor expects a page they are not looking at to behave.
 */

const SRC = "/music/bg-music.mp3";
const VOLUME = 0.35;
const FADE_MS = 700;
/** Remembered on this device: "off" once the visitor has paused it. */
const PREF_KEY = "mp-music";

type Listener = () => void;

let audio: HTMLAudioElement | null = null;
let playing = false;
let fadeFrame = 0;
let armed = false;
/** Paused by the tab being hidden, as opposed to by the visitor. */
let hiddenPause = false;
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener();
};

const setPlaying = (next: boolean) => {
  if (playing === next) return;
  playing = next;
  emit();
};

const readPref = (): string | null => {
  try {
    return window.localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
};

const writePref = (value: "on" | "off") => {
  try {
    window.localStorage.setItem(PREF_KEY, value);
  } catch {
    /* Private mode or blocked storage: the choice simply is not remembered. */
  }
};

function element(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "none";
  audio.loop = true;
  audio.volume = 0;
  // Kept in step with what the element is actually doing: a track that
  // stalls or is paused by the system (a phone call, AirPods out) shows as
  // paused on the button rather than lying.
  audio.addEventListener("pause", () => {
    if (!hiddenPause) setPlaying(false);
  });
  audio.addEventListener("playing", () => setPlaying(true));
  return audio;
}

/** Ease the volume to `to`, then run `done`. Some browsers (iOS) ignore volume; the pause still happens. */
function fade(to: number, done?: () => void) {
  const el = element();
  cancelAnimationFrame(fadeFrame);
  const from = el.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
    if (t < 1) fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
}

/** Play and fade up. Resolves false when the browser refused (no gesture yet) or the file failed. */
async function start(): Promise<boolean> {
  const el = element();
  if (!el.src) el.src = SRC;
  try {
    await el.play();
    setPlaying(true);
    fade(VOLUME);
    return true;
  } catch {
    setPlaying(false);
    return false;
  }
}

function stop() {
  setPlaying(false);
  fade(0, () => element().pause());
}

/** The button: pause if playing, play if not — and remember which. */
export function toggleMusic(): void {
  disarm();
  if (playing) {
    writePref("off");
    stop();
  } else {
    writePref("on");
    void start();
  }
}

export function isMusicPlaying(): boolean {
  return playing;
}

export function subscribeMusic(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/*
  THE FIRST GESTURE STARTS IT — unless it was on the button itself, whose own
  click does the starting (otherwise one press would start the music and the
  same press would immediately pause it again).
*/
const onFirstGesture = (event: Event) => {
  const target = event.target as Element | null;
  if (typeof target?.closest === "function" && target.closest("[data-music-toggle]")) {
    disarm();
    return;
  }
  disarm();
  // Not every key counts as a gesture for sound (Tab, say, in some
  // browsers); if this one was refused, wait for the next.
  void start().then((ok) => {
    if (!ok && readPref() !== "off") arm();
  });
};

function arm() {
  if (armed) return;
  armed = true;
  window.addEventListener("pointerdown", onFirstGesture, true);
  window.addEventListener("keydown", onFirstGesture, true);
}

function disarm() {
  if (!armed) return;
  armed = false;
  window.removeEventListener("pointerdown", onFirstGesture, true);
  window.removeEventListener("keydown", onFirstGesture, true);
}

const onVisibility = () => {
  if (!audio) return;
  if (document.hidden && playing) {
    hiddenPause = true;
    audio.pause();
  } else if (!document.hidden && hiddenPause) {
    hiddenPause = false;
    void start();
  }
};

let initialised = false;

/**
 * Wire the first-gesture start and the hidden-tab pause, once per page load.
 * Called by the button on mount; safe to call again.
 */
export function initMusic(): void {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  document.addEventListener("visibilitychange", onVisibility);
  if (readPref() === "off") return;
  arm();
}
