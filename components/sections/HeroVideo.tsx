"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface HeroVideoProps {
  src: string;
  label: string;
  /** CSS object-position for the crop. */
  position: string;
  /** First frame. Paints immediately so the panel never opens empty. */
  poster?: string;
  className?: string;
}

/**
 * The centre panel of the hero: the potter's wheel, running silently on a loop.
 *
 * It is treated as artwork rather than as a media player — no controls, no
 * poster button, nothing to click. The element carries the muted/loop/inline
 * attributes browsers require before they will start a video unprompted, and
 * the effect below covers the cases where they still refuse: a rejected
 * `play()` is retried once on the visitor's first interaction with the page,
 * so the panel comes to life instead of sitting frozen.
 *
 * Under `prefers-reduced-motion` it never starts; the first frame stands in as
 * a still photograph, which is the whole point of the setting.
 */
export function HeroVideo({ src, label, position, poster, className }: HeroVideoProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    const gestures = ["pointerdown", "touchstart", "keydown"] as const;

    const play = () => {
      video.play().catch(() => {
        // Either the file is not buffered yet or the browser wants a gesture.
        // Listen for both and let whichever arrives first start the loop.
        video.addEventListener("canplay", play, { once: true });
        gestures.forEach((type) =>
          window.addEventListener(type, play, { once: true, passive: true }),
        );
      });
    };

    play();

    return () => {
      video.removeEventListener("canplay", play);
      gestures.forEach((type) => window.removeEventListener(type, play));
    };
  }, [prefersReducedMotion]);

  return (
    <video
      ref={ref}
      aria-label={label}
      src={src}
      poster={poster}
      autoPlay={!prefersReducedMotion}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      controls={false}
      tabIndex={-1}
      style={{ objectPosition: position }}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
