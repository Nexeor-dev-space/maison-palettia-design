import { cn } from "@/lib/utils";

/**
 * The mark for one social network, keyed by its label, or a plain dot for
 * one this does not know.
 *
 * Drawn here rather than pulled from an icon package: lucide-react v1
 * removed its brand marks, and a brand-icon package would arrive with a
 * thousand more and its own licence notice. Every glyph is `currentColor`
 * throughout, so the anchor around it decides the ink and a hover needs no
 * second rule. Strokes are 1.7–1.9 at a 24-unit box, which is the weight
 * the lucide marks beside them (Mail, Phone) are drawn at.
 *
 * Used by the footer's Follow column (components/layout/Footer.tsx) and the
 * Contact page's details (components/sections/contact/ContactIntro.tsx), so
 * the two cannot drift.
 */
export function SocialGlyph({ name, className }: { name: string; className?: string }) {
  const key = name.trim().toLowerCase();
  const props = {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: "false",
    className: cn("size-5", className),
  } as const;

  if (key === "instagram") {
    return (
      <svg {...props}>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.1" cy="6.9" r="1.25" fill="currentColor" />
      </svg>
    );
  }

  if (key === "facebook") {
    return (
      <svg {...props}>
        <path
          d="M13.9 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6a22 22 0 0 0-2.4-.12c-2.4 0-4 1.45-4 4.12V9.9H8v3.1h2.6V21z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key === "tiktok") {
    /* A note: the stem, the head, and the flag curling off the top. */
    return (
      <svg {...props}>
        <circle cx="10.4" cy="15.3" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13.5 15.3V3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13.5 3.2c.3 2.6 2.1 4.3 4.8 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (key === "pinterest") {
    /* The ring, and the pin's "P" with its tail running down and left. */
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9.6 18.6l2.3-8.2M11.3 13.3c.5.6 1.3 1 2.1 1 1.9 0 3.3-1.5 3.3-3.5 0-2.1-1.7-3.5-4.1-3.5-2.8 0-4.7 1.8-4.7 4.1 0 1 .4 1.9 1.1 2.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key === "linkedin") {
    /* The tile, and "in" set inside it. */
    return (
      <svg {...props}>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.1 10.4v6.2M8.1 7.3v.1" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path
          d="M11.7 16.6v-6.2M11.7 13c0-1.6 1-2.7 2.4-2.7s2.3 1 2.3 2.7v3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key === "youtube") {
    return (
      <svg {...props}>
        <rect x="2.6" y="5.6" width="18.8" height="12.8" rx="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10.2 9.4v5.2l4.4-2.6z" fill="currentColor" />
      </svg>
    );
  }

  if (key === "x") {
    return (
      <svg {...props}>
        <path d="M5.2 4.2l13.6 15.6M18.8 4.2L5.2 19.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  /* An unknown network still gets a mark the same size as the others, so a
     platform added to the CMS later never breaks the row's rhythm. */
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    </svg>
  );
}
