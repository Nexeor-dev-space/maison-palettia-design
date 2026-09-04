import Link from "next/link";

import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

/**
 * Brand wordmark, linking home.
 *
 * PLACEHOLDER: the client has not supplied a logo asset yet. This renders the
 * brand name in the display face. When the artwork arrives, drop it in
 * `public/images/brand/` and swap the text for a <Image> here — every
 * consumer (header, footer) picks the change up automatically.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        "font-display text-2xl font-normal leading-none tracking-normal text-text transition-colors duration-200 hover:text-primary md:text-3xl",
        className,
      )}
    >
      {SITE.name}
    </Link>
  );
}
