/**
 * ==========================================================================
 * Page labels (global `template-copy`) — SPEC §F.6
 * ==========================================================================
 *
 * The fixed words of the template routes (event, programme and policy pages,
 * the /events filters, the 404), verbatim from the route files at git
 * 2e1651b. Several of the global's Phase 1 defaults came from the content
 * inventory, which was written against an earlier tree ("About this
 * experience", "More events", "Still Wondering?" + a different body…); the
 * route files are the source of truth for what the site prints today, so
 * those fields are set here. Fields for things the site does not have yet
 * (the waitlist panel, "Upcoming dates" on an experience page) keep their
 * defaults.
 */

export const TEMPLATE_COPY = {
  eventDetail: {
    // The crumb that names the events list: Home / Events / {category} (:350-352).
    breadcrumbRoot: "Events", // app/(site)/events/[slug]/page.tsx:351
    whenTerm: "Date", // app/(site)/events/[slug]/page.tsx:1426
    timeTerm: "Time", // app/(site)/events/[slug]/page.tsx:1434
    durationTerm: "Duration", // app/(site)/events/[slug]/page.tsx:1445
    whereTerm: "Location", // app/(site)/events/[slug]/page.tsx:1455
    priceTerm: "Price", // app/(site)/events/[slug]/page.tsx:1466
    perPersonLabel: "per person", // app/(site)/events/[slug]/page.tsx:1470
    howItRunsTerm: "Experience", // app/(site)/events/[slug]/page.tsx:1474
    statusTerm: "Status", // app/(site)/events/[slug]/page.tsx:688
    aboutHeading: "About This Experience", // app/(site)/events/[slug]/page.tsx:1209
    locationHeadingScheduled: "Where It Happens", // app/(site)/events/[slug]/page.tsx:1543
    locationHeadingDiy: "Your Next Creative Stop.", // app/(site)/events/[slug]/page.tsx:1544
    directionsNote: "Full directions for this centre are confirmed with your booking.", // app/(site)/events/[slug]/page.tsx:1687
    moreEventsHeading: "More Events", // app/(site)/events/[slug]/page.tsx:1845
    soloEyebrow: "Scheduled session", // app/(site)/events/[slug]/page.tsx:1941
    soloCta: "View this session", // app/(site)/events/[slug]/page.tsx:1992
  },
  programmeDetail: {
    eyebrow: "Who it is for", // app/(site)/private-events/[slug]/page.tsx:340 (the back link above it reads "Private events", :334)
    activitiesHeading: "Pick Your Creative", // app/(site)/private-events/[slug]/page.tsx:574
    activitiesLead:
      "Choose from the Maison’s creative experiences, or let us help you find the one that fits your group, occasion and vibe.", // app/(site)/private-events/[slug]/page.tsx:591-592
    stepsEyebrow: "How it works", // app/(site)/private-events/[slug]/page.tsx:658
    closeHeading: "Let’s Make It Happen.", // app/(site)/private-events/[slug]/page.tsx:673 (two lines: "Let’s Make It" / "Happen.")
    ctaPrimaryLabel: "Enquire about a session", // app/(site)/private-events/[slug]/page.tsx:376 (masthead button)
    ctaSecondaryLabel: "Start an enquiry", // app/(site)/private-events/[slug]/page.tsx:817 (closing button)
  },
  policyDetail: {
    eyebrow: "Policy", // app/(site)/policies/[slug]/page.tsx:118
    backLabel: "All policies", // app/(site)/policies/[slug]/page.tsx:113
    closeHeading: "Still Wondering?", // app/(site)/policies/[slug]/page.tsx:158 (two lines: "Still" / "Wondering?")
    closeBody: "If anything here does not cover what you need, ask us before you book.", // app/(site)/policies/[slug]/page.tsx:162-163
    closeCta: "Ask the Maison", // app/(site)/policies/[slug]/page.tsx:176
  },
  eventsBrowser: {
    dateFilterLabel: "Date", // components/events/EventFilters.tsx:64
    typeFilterLabel: "Type", // components/events/EventFilters.tsx:65
    locationFilterLabel: "Location", // components/events/EventFilters.tsx:66
    clearFilterLabel: "Clear filter", // components/events/EventFilters.tsx:123 ("Clear filters" when more than one is set)
    clearAllLabel: "Clear all filters", // components/events/EventsBrowser.tsx:142
    emptyTitle: "No events match those filters.", // components/events/EventsBrowser.tsx:130
    emptyBody: "The programme is small and runs a few dates at a time. Clearing the filters shows everything that is scheduled.", // components/events/EventsBrowser.tsx:133-134
    doorModeLabels: {
      diy: "No booking", // app/(site)/events/page.tsx:416
      scheduled: "Booked online", // app/(site)/events/page.tsx:416
    },
    datePassedLabel: "Date passed", // components/events/EventCard.tsx:140
    fullyBookedLabel: "Fully booked", // lib/workshops.ts:236
  },
  notFound: {
    eyebrow: "Page not found", // app/(site)/not-found.tsx:65
    heading: "This page has | wandered off.", // app/(site)/not-found.tsx:71 (lines joined with " | ", the field's line-break mark)
    body: "The address may have changed, or it was never one of ours. The programme and the studio are a step away.", // app/(site)/not-found.tsx:79-80
    cta: "Back to the homepage", // app/(site)/not-found.tsx:84
  },
};
