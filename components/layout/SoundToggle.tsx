"use client";

import { useEffect, useSyncExternalStore } from "react";

import styles from "@/components/layout/SoundToggle.module.css";
import { initMusic, isMusicPlaying, subscribeMusic, toggleMusic } from "@/lib/backgroundMusic";
import { cn } from "@/lib/utils";

/**
 * The header's music button: a wave that flows while the background music
 * plays and lies flat while it is paused. The music itself — when it starts,
 * how it fades, what is remembered — is lib/backgroundMusic.ts; this only
 * draws the state and hands the press over.
 *
 * ONE NAME, AND A PRESSED STATE. "Background music" is what the control is;
 * `aria-pressed` says whether it is on. A label that swapped between "Play"
 * and "Pause" as well would say the state twice and change the control's
 * name under a screen-reader user's focus. The tooltip says what a press
 * will do, for the pointer.
 */
export function SoundToggle({ className }: { className?: string }) {
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);

  useEffect(() => {
    initMusic();
  }, []);

  return (
    <button
      type="button"
      data-music-toggle
      onClick={toggleMusic}
      aria-pressed={playing}
      aria-label="Background music"
      title={playing ? "Pause the music" : "Play the music"}
      className={cn(styles.toggle, "press-in", className)}
    >
      <svg viewBox="0 0 32 24" aria-hidden className={styles.wave}>
        <g className={styles.amp}>
          <path className={styles.flow} d={WAVE} />
        </g>
      </svg>
    </button>
  );
}

/*
  The wave: a run of quadratic arches, one period every 16 units, drawn three
  times wider than the 32-unit window so sliding it one period to the left
  (the `music-flow` keyframes) is seamless.
*/
const WAVE = (() => {
  let d = "M0 12 Q4 2 8 12";
  for (let x = 16; x <= 96; x += 8) d += ` T${x} 12`;
  return d;
})();
