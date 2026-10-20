"use client";

import dynamic from "next/dynamic";

/*
  Layout effects that draw nothing a visitor can see at load, loaded after the
  page has hydrated instead of in the same bundle as it.

  Each of these renders nothing (PointerField, LoopPause) or something hidden
  until a pointer moves over the page (CursorLayer's brush and paint canvas),
  so leaving them out of the server HTML changes nothing on screen. What it
  changes is how much JavaScript the browser must download, parse and run
  before the homepage hydrates — and the banner's intro cannot start until it
  has, which is what Lighthouse measures as the largest paint.

  `ssr: false` is only allowed from a client module, hence this file rather
  than `dynamic()` in the root layout itself.
*/
export const CursorLayer = dynamic(() => import("@/components/motion/CursorLayer").then((m) => m.CursorLayer), {
  ssr: false,
});

export const PointerField = dynamic(() => import("@/components/motion/PointerField").then((m) => m.PointerField), {
  ssr: false,
});

export const LoopPause = dynamic(() => import("@/components/motion/LoopPause").then((m) => m.LoopPause), {
  ssr: false,
});
