/**
 * ==========================================================================
 * The Journal's house wording — one place, so the admin can take it over
 * ==========================================================================
 *
 * Every sentence the Journal prints that is not a post's own lives here:
 * the listing's masthead, the featured panel's label, the empty state, the
 * closing invitation. They are constants for now, exactly as the other
 * template routes started (components/blocks/templateCopy.ts); when
 * Settings → Page labels grows a `journal` group these are its fallbacks
 * and nothing in the components changes.
 *
 * SCRIPT LINES CARRY NO DIGITS. The masthead, the empty state and the close
 * are set in Hapsha, whose 7, 8 and 9 are placeholder marks — a heading
 * here must never hold a number or a date (components/ui/SectionHeader.tsx).
 */
export const JOURNAL_COPY = {
  /** The listing's masthead (/journal). */
  eyebrow: "Journal",
  headingLines: ["Notes from", "the Table."] as readonly string[],
  standfirst:
    "Stories from the studio: what we are making, who we are making it with, and the small things we learn along the way.",

  /** The listing's sections. */
  featuredEyebrow: "Featured story",
  readStory: "Read the story",
  allStories: "All stories",
  latestEyebrow: "Latest",
  filterLabel: "Browse by",
  allChip: "All",

  /** The reading page. */
  breadcrumbRoot: "Journal",
  writtenBy: "Written by",
  shareLabel: "Share this story",
  copyLink: "Copy link",
  copied: "Link copied",
  readNextEyebrow: "Keep reading",
  readNextLines: ["More from", "the Journal."] as readonly string[],
  previousStory: "Previous story",
  nextStory: "Next story",
  backToJournal: "All stories",

  /** No posts yet — or none in a category. */
  empty: {
    eyebrow: "Journal",
    lines: ["Stories are", "on their way."] as readonly string[],
    body: "We are writing up what has been happening at the table. Until the first story lands, the programme is the best place to see what we make.",
    categoryBody:
      "Nothing has been filed here yet. Every other story is a step away.",
    cta: { label: "Explore experiences", href: "/events" },
    secondary: { label: "All stories", href: "/journal" },
  },

  /** The Deep Lilac close under the listing. */
  close: {
    lines: ["From the page", "to the table."] as readonly string[],
    body: "Every story here started with somebody making something. Pick an experience and come make your own.",
    primary: { label: "Explore experiences", href: "/events" },
    secondary: { label: "Plan a private event", href: "/private-events" },
  },

  /** The `latestJournal` block's launch wording. */
  block: {
    eyebrow: "Journal",
    lines: ["Latest from", "the Journal."] as readonly string[],
    cta: { label: "Read the Journal", href: "/journal" },
  },
} as const;

/** "4 min read" — whole minutes, never under one. Montserrat only: it is a number. */
export function readingLabel(minutes: number): string {
  return `${Math.max(1, Math.round(minutes))} min read`;
}
