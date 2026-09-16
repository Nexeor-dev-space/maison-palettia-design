import { SOCIAL_LINKS } from "@/lib/constants";

/**
 * The studio's social presence, as marks rather than words.
 *
 * WHY THE GLYPHS ARE INLINE. lucide-react is the project's icon set and it
 * carries no brand marks — Instagram and Facebook are not in its 4,114 icons,
 * because brand logos were removed from the library. Adding a second icon
 * dependency for two shapes is not worth it, so the paths are here, drawn in
 * lucide's own idiom: a 24 unit box, stroked rather than filled, 1.75 weight,
 * round caps and joins. They sit beside <Search> and <Menu> in the header
 * without looking like they came from somewhere else. The same decision, for
 * the same reason, as the WhatsApp glyph in <WhatsAppWidget>.
 *
 * WHAT HAPPENS WITHOUT A URL. Every href in `SOCIAL_LINKS` is currently null.
 * A social icon is only ever a link — it has no text to read, so an icon that
 * cannot be clicked is a shape with no meaning and no accessible name worth
 * giving it. So a platform without a URL keeps the plain-text treatment the
 * footer already used: readable, honest, obviously not a link. Fill in the
 * hrefs in lib/constants.ts and each one becomes an icon on its own.
 */

const GLYPHS: Record<string, React.ReactNode> = {
  Instagram: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  Facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
};

export function SocialIcons() {
  const linked = SOCIAL_LINKS.filter((link) => link.href);
  const unlinked = SOCIAL_LINKS.filter((link) => !link.href);

  if (SOCIAL_LINKS.length === 0) return null;

  return (
    <>
      {linked.length > 0 ? (
        <ul className="-ml-3 flex flex-wrap items-center gap-1">
          {linked.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href as string}
                target="_blank"
                rel="noopener noreferrer"
                // The name is on the link because the glyph is decorative —
                // otherwise a screen reader announces the platform twice.
                aria-label={`${label} — opens in a new tab`}
                className={
                  "inline-flex size-11 items-center justify-center rounded-sm text-current/75 " +
                  "transition-colors duration-300 ease-soft hover:bg-current/10 hover:text-sage"
                }
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  {GLYPHS[label] ?? <circle cx="12" cy="12" r="9" />}
                </svg>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {unlinked.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {unlinked.map(({ label }) => (
            <li key={label} className="text-body text-current/75">
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
