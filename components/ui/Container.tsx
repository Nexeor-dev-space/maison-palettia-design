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
  site: "max-w-site",
  reading: "max-w-reading",
};

/**
 * The single horizontal layout primitive. Every section should sit inside one
 * of these rather than defining its own max-width and padding.
 */
export function Container({
  children,
  width = "site",
  as: Tag = "div",
  className,
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-6 md:px-10 lg:px-16", widths[width], className)}>
      {children}
    </Tag>
  );
}
