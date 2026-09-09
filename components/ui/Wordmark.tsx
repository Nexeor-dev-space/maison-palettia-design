import Image from "next/image";
import Link from "next/link";

import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /**
   * "logo" renders the supplied artwork; "text" sets the brand name in the
   * display face.
   *
   * The artwork is drawn in Light Sage on transparency, so it only reads on a
   * dark or saturated ground — the header's Deep Lilac bar and the hero. Light
   * surfaces (the footer) keep the text form until a dark-on-light cut of the
   * logo is supplied.
   */
  variant?: "logo" | "text";
}

/** Intrinsic size of public/images/logo.png — kept here to reserve the space. */
const LOGO = { src: "/images/logo.png", width: 1015, height: 438 } as const;

/**
 * Brand mark, linking home.
 *
 * The link carries the accessible name, so the image itself is decorative
 * (`alt=""`) — otherwise a screen reader announces the brand twice.
 */
export function Wordmark({ className, variant = "text" }: WordmarkProps) {
  if (variant === "logo") {
    return (
      <Link
        href="/"
        aria-label={`${SITE.name} — home`}
        className={cn(
          "inline-flex items-center transition-opacity duration-200 hover:opacity-80",
          className,
        )}
      >
        <Image
          src={LOGO.src}
          alt=""
          width={LOGO.width}
          height={LOGO.height}
          priority
          className="h-10 w-auto md:h-12"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        // Colour is set by the caller.
        "whitespace-nowrap font-display text-2xl font-normal leading-none tracking-normal transition-colors duration-200 md:text-3xl",
        className,
      )}
    >
      {SITE.name}
    </Link>
  );
}
