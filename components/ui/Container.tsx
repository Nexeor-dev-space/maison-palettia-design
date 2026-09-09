import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerWidth = "site" | "reading";

interface ContainerProps {
  children: ReactNode;
  /** "site" is the full 1440px editorial width; "reading" narrows long-form copy. */
  width?: ContainerWidth;
  as?: ElementType;
  className?: string;
}

const widths: Record<ContainerWidth, string> = {
  /*
    No ceiling. The page runs the full width of the display and is held in
    only by the gutter, so the measure keeps growing with the screen instead
    of parking at 1440 and letting the margins swell to 300px on a wide
    monitor. --container-site is still in the theme if a stop is ever wanted.
  */
  site: "",
  reading: "max-w-reading",
};

/**
 * The single horizontal layout primitive. Every section should sit inside one
 * of these rather than defining its own max-width and padding.
 *
 * The gutter is `--spacing-gutter`, not a stepped set of paddings. Anything
 * that has to line up with it — a photograph bleeding to the edge, a strip
 * that rebuilds the inset for itself — must use the same token (`-mx-gutter`,
 * `pl-gutter`) rather than restating the numbers, or the two drift the moment
 * one of them changes.
 */
export function Container({
  children,
  width = "site",
  as: Tag = "div",
  className,
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-gutter", widths[width], className)}>
      {children}
    </Tag>
  );
}
