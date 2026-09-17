"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * The picture half of <StudioFilm>: poster, film, and the one control.
 *
 * WHY THIS IS SPLIT OFF AT ALL. <StudioFilm> is a server component because it
 * reads the brand copy out of `lib/constants`, and the pause control needs a
 * ref and a piece of state. Rather than pull the whole constants module into
 * the browser bundle to get one string, the section stays on the server and
 * hands this component the four things it cannot know: where the film is, what
 * stands in for it, and how long it runs.
 */
interface FilmStageProps {
  src: string;
  poster: string;
  /**
   * The poster's alt text.
   *
   * It is EMPTY on purpose and the prop exists so that stays a decision rather
   * than an oversight. This plate is decorative: everything it says is said in
   * words by the type sitting on top of it, and a screen reader that announces
   * both reads the section twice.
   */
  posterAlt: string;
  /** "1:01" — measured off the file, and also the control's spoken name. */
  duration: string;
}

export function FilmStage({
  src,
  poster,
  posterAlt,
  duration,
}: FilmStageProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  function toggle() {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <>
      {/*
        THE POSTER IS A REAL ELEMENT, NOT THE VIDEO'S `poster` ATTRIBUTE.

        Two reasons. It has to survive `prefers-reduced-motion`, where the film
        is display:none and the attribute goes with it — a reader who has asked
        for less movement should still get the picture, not a black rectangle.
        And as a <next/image> with `priority` off it is served in the size the
        viewport actually needs and in AVIF where that is accepted, which the
        attribute cannot do.
      */}
      <Image
        src={poster}
        alt={posterAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />

      <video
        ref={video}
        src={src}
        aria-hidden
        tabIndex={-1}
        muted
        loop
        playsInline
        autoPlay
        /*
          `preload="none"`, which is stricter than the hero's "metadata" and is
          the right call here: the hero's film is the first thing on the page
          and this one is four sections down, behind a poster that already
          shows what it shows. The browser starts fetching when it decides to
          play, not when it parses the tag.
        */
        preload="none"
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
      />

      {/*
        THE CONTROL EXISTS BECAUSE THE FILM AUTOPLAYS.

        A looping film behind type is motion a reader did not ask for, and the
        media query only covers the readers who have found that setting. This
        is the same escape hatch for everyone else, and it is a real control
        over a real element rather than an ornament: it is the only thing in
        this section that does anything.

        `motion-reduce:hidden` because under that setting there is no film on
        screen to pause, and a control for an element nobody can see is worse
        than no control.
      */}
      <button
        type="button"
        onClick={toggle}
        className="group absolute bottom-8 right-6 z-20 inline-flex items-center gap-3 text-action font-medium uppercase tracking-eyebrow text-cream motion-reduce:hidden md:bottom-10 md:right-10"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/45 transition-colors duration-300 ease-soft group-hover:border-cream group-focus-visible:border-cream"
        >
          {playing ? (
            /* Two bars. Drawn rather than typed: the pause glyph in this
               typeface sits off the optical centre of a round button. */
            <span className="flex gap-[3px]">
              <span className="block h-3 w-[2px] bg-cream" />
              <span className="block h-3 w-[2px] bg-cream" />
            </span>
          ) : (
            <span className="ml-[2px] block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-cream" />
          )}
        </span>
        <span className="border-b border-cream/40 pb-1 transition-colors duration-300 ease-soft group-hover:border-cream group-focus-visible:border-cream">
          {playing ? "Pause" : "Play"}
        </span>
        {/* So the name is "Pause the film (1:01)" and not a word that could
            belong to any of several things on the page. */}
        <span className="sr-only"> the film ({duration})</span>
      </button>
    </>
  );
}
