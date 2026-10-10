/**
 * ==========================================================================
 * Menus & footer (global `navigation`) — SPEC §F.6
 * ==========================================================================
 *
 * The lists from lib/constants.ts (MAIN_NAV, PRIMARY_CTA, FOOTER_NAV,
 * LEGAL_NAV) and the words the menu, footer and search components carry as
 * their own literals, copied verbatim with the `file:line` they come from
 * (git 2e1651b). Links use the cms/fields/link.ts shape: an internal path
 * with its anchor kept apart ("/events" + "scheduled" prints
 * "/events#scheduled").
 */

export const NAVIGATION = {
  primary: [
    // lib/constants.ts:147
    { label: "Experiences", link: { type: "internal", url: "/events" }, menu: "experiences", mobileSurface: "bar", secondary: false, utility: false },
    // lib/constants.ts:148 — the bottom bar's short label, components/layout/BottomNav.tsx:214
    {
      label: "Private events",
      link: { type: "internal", url: "/private-events" },
      menu: "private-events",
      mobileSurface: "bar",
      mobileShortLabel: "Private",
      secondary: false,
      utility: false,
    },
    // lib/constants.ts:196
    { label: "About", link: { type: "internal", url: "/about" }, menu: "about", mobileSurface: "sheet", secondary: false, utility: false },
    // lib/constants.ts:197
    { label: "Locations", link: { type: "internal", url: "/locations" }, menu: "none", mobileSurface: "sheet", secondary: true, utility: false },
    // lib/constants.ts:198
    { label: "Gallery", link: { type: "internal", url: "/gallery" }, menu: "none", mobileSurface: "sheet", secondary: true, utility: false },
    // lib/constants.ts:199
    { label: "Contact", link: { type: "internal", url: "/contact" }, menu: "none", mobileSurface: "sheet", secondary: true, utility: false },
  ],
  // lib/constants.ts:259-260
  primaryCta: { label: "Book a session", link: { type: "internal", url: "/events", anchor: "scheduled" } },
  bottomBar: {
    contactLabel: "Contact", // components/layout/BottomNav.tsx:162
    aboutLabel: "About", // components/layout/BottomNav.tsx:461
    bookLabel: "Book", // components/layout/BottomNav.tsx:785 (its aria-label is "Book a Session", :235)
  },
  bookSheet: {
    heading: "What would you like to create?", // components/booking/BookingSheet.tsx:252
    lead: "Choose a scheduled experience to start your booking.", // components/booking/BookingSheet.tsx:255
    anytimeNote: "Prefer to come anytime?", // components/booking/BookingSheet.tsx:307
    anytimeLinkLabel: "Browse all experiences", // components/booking/BookingSheet.tsx:313
  },
  skipLink: "Skip to content", // app/(site)/layout.tsx:77
  experiencesMenu: {
    groups: [
      { kind: "diy", title: "Create Anytime", note: "No booking needed. Create at your own pace." }, // components/layout/WorkshopsMenu.tsx:68-69
      { kind: "scheduled", title: "Create Together", note: "Scheduled workshops, booked online." }, // components/layout/WorkshopsMenu.tsx:73-74
    ],
    // components/layout/WorkshopsMenu.tsx:298-300 (href: the scheduled half of /events)
    door: { title: "Upcoming dates", sub: "Guided sessions you can book.", link: { type: "internal", url: "/events", anchor: "scheduled" } },
    previewActionDiy: "See the activity", // components/layout/WorkshopsMenu.tsx:354
    previewActionScheduled: "See the session", // components/layout/WorkshopsMenu.tsx:354
  },
  privateEventsMenu: {
    railTitle: "Made for Your Kind of Crowd", // components/layout/PrivateEventsMenu.tsx:131
    railNote: "Don’t see yours? That’s probably a conversation worth having.", // components/layout/PrivateEventsMenu.tsx:132
    previewEyebrow: "Private events", // components/layout/PrivateEventsMenu.tsx:168
    previewAction: "See this programme", // components/layout/PrivateEventsMenu.tsx:172
    doors: [
      // components/layout/PrivateEventsMenu.tsx:197
      { title: "All private events", sub: "Every programme, in one place.", link: { type: "internal", url: "/private-events" }, accent: false },
      // components/layout/PrivateEventsMenu.tsx:202-207 (PRIVATE_EVENT_ENQUIRY_HREF, lib/privateEvents.ts:155)
      { title: "Plan a private event", sub: "Have something in mind?", link: { type: "internal", url: "/private-events/book" }, accent: true },
    ],
  },
  aboutMenu: {
    doors: [
      { name: "About the Maison", sub: "Why we do it.", link: { type: "internal", url: "/about" } }, // components/layout/AboutMenu.tsx:62-65
      { name: "Locations", sub: "Where to find us.", link: { type: "internal", url: "/locations" } }, // components/layout/AboutMenu.tsx:69-71
      { name: "Gallery", sub: "What gets made.", link: { type: "internal", url: "/gallery" } }, // components/layout/AboutMenu.tsx:75-79
      { name: "Contact", sub: "Write to us.", link: { type: "internal", url: "/contact" } }, // components/layout/AboutMenu.tsx:83-85
    ],
  },
  mobile: {
    privateEventsCta: "Book a private event", // components/layout/MobileNav.tsx:551
  },
  footer: {
    groups: [
      {
        title: "Create", // lib/constants.ts:282
        items: [
          { label: "All experiences", link: { type: "internal", url: "/events" } }, // lib/constants.ts:284
          { label: "Private events", link: { type: "internal", url: "/private-events" } }, // lib/constants.ts:285
          { label: "Gallery", link: { type: "internal", url: "/gallery" } }, // lib/constants.ts:289
        ],
      },
      {
        title: "The Maison", // lib/constants.ts:293
        items: [
          { label: "About", link: { type: "internal", url: "/about" } }, // lib/constants.ts:295
          { label: "Locations", link: { type: "internal", url: "/locations" } }, // lib/constants.ts:296
        ],
      },
      {
        title: "Help", // lib/constants.ts:300
        items: [
          { label: "Contact", link: { type: "internal", url: "/contact" } }, // lib/constants.ts:302
          { label: "FAQ", link: { type: "internal", url: "/faq" } }, // lib/constants.ts:303
          { label: "Check a booking", link: { type: "internal", url: "/booking-status" } }, // lib/constants.ts:304
        ],
      },
    ],
    findUsHeading: "Find us", // components/layout/Footer.tsx:580
    studioHeading: "The studio", // components/layout/Footer.tsx:652
    whyHeading: "Why we do it", // components/layout/Footer.tsx:696
    followHeading: "Follow", // components/layout/Footer.tsx:703
    policiesHeading: "Policies", // components/layout/Footer.tsx:876
    directionsLabel: "Get directions", // components/layout/Footer.tsx:630
    policiesBlurb: "How sessions run, what we ask of visitors, and what happens if plans change.", // components/layout/Footer.tsx:882-883
    backToTop: "Back to top", // components/layout/BackToTop.tsx:64
  },
  // lib/constants.ts:328-346 — empty: Privacy and Terms have not been written.
  legal: [],
  utilityBar: {
    heading: "More from Maison Palettia", // components/layout/PageUtilityBar.tsx:138
  },
  search: {
    triggerLabel: "Search experiences", // components/layout/SearchTrigger.tsx:205
    heading: "Search Maison Palettia", // components/layout/SearchPanel.tsx:426
    placeholderWide: "Search events by name, type or location", // components/layout/SearchPanel.tsx:124
    placeholderNarrow: "Search by name, type or place", // components/layout/SearchPanel.tsx:125
    popularHeading: "Popular searches", // components/layout/SearchPanel.tsx:517
    sessionsHeading: "Sessions with dates", // components/layout/SearchPanel.tsx:570
    activitiesHeading: "Activities", // components/layout/SearchPanel.tsx:603
    viewAllLabel: "View all events", // components/layout/SearchPanel.tsx:551
    noResultsTitle: "No events found", // components/layout/SearchPanel.tsx:541
    noResultsBody: "Try searching for another event, location, or activity.", // components/layout/SearchPanel.tsx:543
  },
};
