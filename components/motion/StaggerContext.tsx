"use client";

import { createContext, useContext } from "react";

/**
 * True when a <Reveal> is rendered inside a <Stagger>. In that case the child
 * must not declare its own initial/whileInView — Framer Motion drives it from
 * the parent's variant state, which is what makes staggerChildren work.
 */
export const StaggerContext = createContext(false);

export function useIsInStagger() {
  return useContext(StaggerContext);
}
