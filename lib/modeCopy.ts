/**
 * ==========================================================================
 * The walk-in / scheduled wording — Booking & checkout wording → Event page
 * ==========================================================================
 *
 * `booking-settings.labels` (Mode labels), `.eventPage` (Event page action
 * copy) and `.walkIn` (Create Anytime section) hold the words the site uses
 * for its two ways in: the product names, the chips, the one-liners, the
 * event page's action copy and the walk-in cards on /events. The defaults
 * below are exactly what the components printed before the fields were
 * wired (the seed wrote the same words into the global; some of the fields'
 * own `defaultValue`s are older drafts of them).
 *
 * CLIENT-SAFE. Types, defaults and the merge only — no CMS import. The read
 * lives in lib/modeCopy.server.ts; the root layout hands the result to client
 * components through <SiteChromeProvider> (`useModeCopy()`), and server
 * components await `getModeCopy()` directly.
 */

export interface ModeLabels {
  createAnytime: string;
  createTogether: string;
  anyTime: string;
  scheduled: string;
  noBooking: string;
  bookedOnline: string;
  scheduledSession: string;
  diyLine: string;
  scheduledLine: string;
}

export interface EventPageCopy {
  bookLabel: string;
  passedLabel: string;
  perPersonLabel: string;
  closedFullFact: string;
  closedPassedFact: string;
  noneOpenSuffix: string;
  othersOpenSuffix: string;
  seeOpenLabel: string;
  diyTitle: string;
  diyBody: string;
  diyCta: string;
  comingSoonNote: string;
  readyHeading: string;
  readyBody: string;
  utilityNote: string;
}

export interface WalkInStep {
  title: string;
  body: string;
}

export interface WalkInCopy {
  howHeading: string;
  steps: WalkInStep[];
  openGroupTitle: string;
  soonGroupTitle: string;
  cardAction: string;
  cardSoonAction: string;
  emptyNote: string;
}

export interface ModeCopy {
  labels: ModeLabels;
  eventPage: EventPageCopy;
  walkIn: WalkInCopy;
}

export const MODE_COPY_DEFAULTS: ModeCopy = {
  labels: {
    createAnytime: "Create Anytime",
    createTogether: "Create Together",
    anyTime: "Any time",
    scheduled: "Scheduled",
    noBooking: "No booking",
    bookedOnline: "Booked online",
    scheduledSession: "Scheduled session",
    diyLine: "Pick a project. Pick your colours. Just drop in.",
    scheduledLine: "A little more planned. Same creative energy.",
  },
  eventPage: {
    bookLabel: "Book this experience",
    passedLabel: "Date passed",
    perPersonLabel: "per person",
    closedFullFact: "This date is full",
    closedPassedFact: "This date has passed",
    noneOpenSuffix: ", and nothing else is open just now.",
    othersOpenSuffix: ". Other sessions are open.",
    seeOpenLabel: "See what is open",
    diyTitle: "Come on a day we are there.",
    diyBody: "Just drop in when the experience is available and start creating.",
    diyCta: "See where we are set up",
    comingSoonNote: "Not running yet. It will appear in the programme when it opens.",
    readyHeading: "Ready to Create?",
    readyBody: "Everything is laid out before you arrive. You bring nothing but yourself.",
    utilityNote: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.",
  },
  walkIn: {
    howHeading: "How it works",
    steps: [
      { title: "Choose a project", body: "Browse the activities below and pick the one you would like to make." },
      { title: "Drop in", body: "No booking needed. Just come in to the studio." },
      { title: "Make it yours", body: "Pick your colours and create at your own pace." },
    ],
    openGroupTitle: "Open for drop-ins",
    soonGroupTitle: "Coming soon",
    cardAction: "View details",
    cardSoonAction: "Take a look",
    emptyNote: "Nothing is tagged that way yet. Clear the filter to see every Create Anytime experience.",
  },
};

type Stored<T> = Partial<Record<keyof T, unknown>> | null | undefined;

/** Stored strings over the defaults, key by key; a cleared field keeps the default. */
function over<T extends object>(defaults: T, stored: Stored<T>): T {
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = stored?.[key];
    // Untrimmed: the two suffixes are appended to a fact and open with their own punctuation.
    if (typeof value === "string" && value.trim() !== "") out[key] = value as T[keyof T];
  }
  return out;
}

export interface StoredModeCopy {
  labels?: Stored<ModeLabels>;
  eventPage?: Stored<EventPageCopy>;
  walkIn?: (Stored<Omit<WalkInCopy, "steps">> & { steps?: Array<{ title?: string | null; body?: string | null }> | null }) | null;
}

/** The global's three sections over the defaults. An empty step list keeps the default steps: a path of no steps is a broken section. */
export function mergeModeCopy(stored: StoredModeCopy | null | undefined): ModeCopy {
  const d = MODE_COPY_DEFAULTS;
  const steps = (stored?.walkIn?.steps ?? [])
    .map((step) => ({ title: step?.title?.trim() ?? "", body: step?.body?.trim() ?? "" }))
    .filter((step) => step.title !== "");
  return {
    labels: over(d.labels, stored?.labels),
    eventPage: over(d.eventPage, stored?.eventPage),
    walkIn: { ...over({ ...d.walkIn, steps: undefined } as Omit<WalkInCopy, "steps">, stored?.walkIn), steps: steps.length ? steps : d.walkIn.steps },
  };
}
