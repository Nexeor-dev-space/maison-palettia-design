/**
 * ==========================================================================
 * The admin guide's content model — what a chapter file may contain
 * ==========================================================================
 *
 * Every chapter of the owner's guide is a typed TypeScript file in this
 * folder (`01-welcome.ts` …), listed in order by `index.ts`. The same data
 * renders three ways:
 *
 *   · /admin/docs and /admin/docs/<slug> — the Docs tab inside the admin
 *     (cms/views/docs.tsx, cms/components/docs/*);
 *   · /admin/docs/print — every chapter on A4 pages, which
 *     scripts/build-admin-guide-pdf.mjs turns into the PDF;
 *   · the search index the Docs tab's search box reads (cms/lib/docs).
 *
 * TEXT. Anything typed `Inline` is a plain string with a little markup, so a
 * sentence stays readable in the source:
 *
 *   **bold**              strong words, field names, statuses
 *   *italic*              emphasis
 *   `code`                something typed literally (an address, a code)
 *   [[Publish changes]]   a button or menu item, drawn like the admin's UI
 *   {{Settings > Staff}}  a route through the left menu (" > " separates steps)
 *   ((3))                 a numbered callout circle — matches a screenshot
 *   <<⌘>>                 a keyboard key
 *   [words](#section-id)  a link to another section of the guide (any chapter)
 *   [words](https://…)    an outside link (opens in a new tab)
 *
 * A literal `*`, `[`, `{`, `(`, `<` or `` ` `` can be escaped with a
 * backslash. The parser lives in cms/lib/docs/inline.ts.
 *
 * IDS. Section ids are the guide's anchors and must be unique across the
 * whole guide — links use them without saying which chapter they are in.
 * `npm run docs:pdf` and the Docs tab both fail loudly on a duplicate
 * (see `assertGuide` in cms/lib/docs/guide.ts).
 */

/** A string with the inline markup described above. */
export type Inline = string;

/** The admin roles a chapter or section is written for. */
export type GuideRole = "admin" | "editor" | "front-desk";

export type Callout = {
  /** The number drawn on the screenshot (1, 2, 3 …). */
  n: number;
  /** What that number points at, in a few words. */
  label: Inline;
};

export type Screenshot = {
  type: "screenshot";
  /** File name inside docs/admin-guide/images/ (e.g. "01-login.webp"). */
  file: string;
  /** Intrinsic size of the image, so the page does not jump while it loads. */
  width: number;
  height: number;
  /** One or two sentences under the picture. Also used as the alt text unless `alt` is given. */
  caption: Inline;
  /** Screen-reader description, when it should differ from the caption. */
  alt?: string;
  /** Short title shown in the enlarged view ("Dashboard tour"). */
  title?: string;
  /** The numbered circles drawn on the image, in order. */
  callouts: Callout[];
  /** A phone-sized screenshot (drawn narrower, with rounder corners). */
  phone?: boolean;
  /** Cap the displayed width in CSS pixels (for small dialogs). */
  maxWidth?: number;
};

export type Block =
  /** A paragraph of running text. */
  | { type: "paragraph"; text: Inline }
  /** A small heading inside a section (h4). */
  | { type: "heading"; text: string }
  /** Numbered steps. Reference screenshot callouts with ((n)). */
  | { type: "steps"; items: Inline[] }
  /** A plain bulleted list. */
  | { type: "list"; items: Inline[] }
  | Screenshot
  /** Several phone screenshots side by side. */
  | { type: "phones"; shots: Screenshot[] }
  /**
   * A coloured note. `tip` saves time, `warning` needs a moment's thought,
   * `never` protects customers' money and data, `info` is background.
   * `title` defaults to "Tip", "Good to know", "Never do this" and "Note".
   */
  | { type: "tip" | "warning" | "never" | "info"; title?: string; text: Inline[] }
  /** A simple table. The first row of `rows` is NOT a header — `head` is. */
  | { type: "table"; head: Inline[]; rows: Inline[][] }
  /** The day-one checklist: ticks are remembered per person in their browser. */
  | { type: "checklist"; id: string; steps: ChecklistStep[] }
  /** Who can do what: one column per role. */
  | { type: "roleMatrix"; roles: string[]; groups: RoleGroup[] }
  /**
   * A drawn mock of part of the admin (status chips, a flow, a small form).
   * `html` uses the mock classes styled in cms/components/docs/docs.scss
   * (`panel`, `row`, `split`, `flow`, `chip g|a|r|n`, `field`, `input`,
   * `btn primary`, `check`, `flowline`/`stage`, `track`, `verdicts`, `share`).
   * It is written by us and rendered as-is: never paste untrusted HTML here.
   */
  | { type: "mock"; label?: string; html: string }
  /** The daily / weekly / monthly columns. */
  | { type: "routine"; columns: Array<{ title: string; when: string; items: Array<{ text: Inline; note?: Inline }> }> }
  /** A day told as a timeline ("Morning", "1 hour before" …). */
  | { type: "timeline"; items: Array<{ when: string; title: string; text: Inline }> }
  /** Questions and answers, each one opens on click. */
  | { type: "faq"; items: Array<{ q: string; blocks: Block[] }> }
  /** Terms and their plain meaning. */
  | { type: "glossary"; items: Array<{ term: string; definition: Inline }> }
  /** A key for symbols used just above (✓ / ◐ / — or the severity dots). */
  | { type: "legend"; items: Inline[] };

export type ChecklistStep = {
  title: string;
  /** Roughly how long it takes ("10 minutes"). */
  time?: string;
  /** Where in the admin, as a menu route ("Settings > Site details"). */
  where?: string;
  /** Each item has a stable id — it is the key the tick is remembered under. */
  items: Array<{ id: string; text: Inline }>;
};

/** "yes" = can do it, "view" = can look but not change, "no" = not shown. A note may follow. */
export type RoleCell = "yes" | "view" | "no" | { value: "yes" | "view" | "no"; note: string };

export type RoleGroup = { title: string; rows: Array<{ job: Inline; cells: RoleCell[] }> };

export type Section = {
  /** Unique across the guide. Used for anchors and links: [text](#id). */
  id: string;
  title: string;
  /** The route through the menu to get there ("Content > Sessions"). */
  path?: string;
  /** Which role can do this job ("Owner", "Admin", "Everyone", "Admin · Front desk"). */
  who?: string;
  /** Extra words people might search for that are not in the text. */
  keywords?: string;
  /** Troubleshooting only: how urgent the problem is. */
  severity?: "red" | "amber" | "green";
  /** A one-line sub-title under the section title. */
  hint?: string;
  blocks: Block[];
};

export type Chapter = {
  /** URL segment: /admin/docs/<slug>. Lower case, hyphens. */
  slug: string;
  /** Chapter number as printed ("Chapter 3"). `null` for the "Start here" checklist. */
  number: number | null;
  /** The small line above the title. Defaults to "Chapter NN". */
  eyebrow?: string;
  title: string;
  /** One sentence under the title. */
  lede: Inline;
  /** A short line for the contents cards ("Log in, read the dashboard …"). */
  blurb: string;
  /** "In 30 seconds" — three to five bullets that say the whole chapter. */
  summary: Inline[];
  /** Who the chapter is for. Empty means everyone. */
  roles: GuideRole[];
  /** Extra search words for the whole chapter. */
  keywords?: string;
  /** Blocks shown before the first section (a note, a mock). */
  intro?: Block[];
  sections: Section[];
  /** Draw the chapter as a highlighted "feature" (the day-one checklist). */
  feature?: boolean;
};

/** The front matter of the guide: cover, welcome and the "how to read" key. */
export type GuideFront = {
  title: string;
  kicker: string;
  welcome: { script: string; headline: Inline; lede: Inline };
  facts: Array<{ label: string; value: Inline }>;
  howToRead: Array<{ title: string; text: Inline }>;
  colophon: Inline[];
  /** Shown on the cover and in the PDF's footer: when the screenshots were taken. */
  edition: string;
};
