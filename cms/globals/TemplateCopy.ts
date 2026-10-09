/**
 * `template-copy` — "Page labels (events, policies, 404)" (SPEC §C.3 row 5).
 *
 * The fixed-template routes (§E.3: `/events/[slug]`, `/private-events/[slug]`,
 * `/policies/[slug]`, the 404 page, and the filter chrome of `/events`) are
 * not page-builder pages: their layout is code, and only the words in it
 * change. Those words are here, grouped by route, so an editor who wants the
 * fact term "Where" to read "Venue" has one place to look and the five routes
 * that print it stay in step.
 *
 * What is *not* here: anything derived from data (a session's title, its
 * price), anything that is UI chrome (aria-labels, "Previous picture"), and
 * the booking bar's copy, which belongs to Booking & checkout wording.
 *
 * Defaults are the literals the routes print today, so wiring a route to this
 * global (Phase 2) changes nothing visible.
 */

import type { GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { TAGS } from "@/lib/cms/cache";

import { copy, panel, prose, section } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const TEMPLATE_COPY_SLUG = "template-copy" as const;

export const TemplateCopy: GlobalConfig = {
  slug: TEMPLATE_COPY_SLUG,
  label: "Page labels (events, policies, 404)",
  admin: {
    group: "Settings",
    description: "Fixed labels on event, programme and policy pages and the 404 page.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    afterChange: [settingsAfterChange({ slug: TEMPLATE_COPY_SLUG, revalidateTag: TAGS.template })],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Event page",
          fields: [
            section("eventDetail", "Event page", [
              copy("breadcrumbRoot", "Breadcrumb root", { max: 24, defaultValue: "All events" }),
              // Field names follow §C.3 (`whenTerm`, `whereTerm`, `priceTerm`,
              // `perPersonLabel`, `howItRunsTerm`, `statusTerm`); the panel is
              // layout only so they stay direct children of `eventDetail`.
              panel("Fact terms", [
                {
                  type: "row",
                  fields: [
                    copy("whenTerm", "When", { max: 16, defaultValue: "Date", admin: { width: "25%" } }),
                    copy("timeTerm", "Time", { max: 16, defaultValue: "Time", admin: { width: "25%" } }),
                    copy("durationTerm", "Duration", { max: 16, defaultValue: "Duration", admin: { width: "25%" } }),
                    copy("whereTerm", "Where", { max: 16, defaultValue: "Location", admin: { width: "25%" } }),
                  ],
                },
                {
                  type: "row",
                  fields: [
                    copy("priceTerm", "Price", { max: 16, defaultValue: "Price", admin: { width: "25%" } }),
                    copy("perPersonLabel", "Per person", { max: 16, defaultValue: "per person", admin: { width: "25%" } }),
                    copy("howItRunsTerm", "How it runs", { max: 16, defaultValue: "Experience", admin: { width: "25%" } }),
                    copy("statusTerm", "Status", { max: 16, defaultValue: "Status", admin: { width: "25%" } }),
                  ],
                },
              ]),
              copy("aboutHeading", "About section heading", { max: 40, defaultValue: "About this experience" }),
              {
                type: "row",
                fields: [
                  copy("locationHeadingScheduled", "Location heading — scheduled", {
                    max: 40,
                    defaultValue: "Where It Happens",
                    admin: { width: "50%" },
                  }),
                  copy("locationHeadingDiy", "Location heading — walk-in", {
                    max: 40,
                    defaultValue: "Your Next Creative Stop.",
                    admin: { width: "50%" },
                  }),
                ],
              },
              prose("directionsNote", "Directions note", { max: 160 }),
              copy("moreEventsHeading", "More events heading", { max: 40, defaultValue: "More events" }),
              {
                type: "row",
                fields: [
                  copy("soloEyebrow", "Solo-session eyebrow", {
                    description: "Over the title when the experience has only this one date.",
                    max: 24,
                    defaultValue: "One date",
                    admin: { width: "50%" },
                  }),
                  copy("soloCta", "Solo-session button", { max: 30, defaultValue: "See all experiences", admin: { width: "50%" } }),
                ],
              },
              copy("upcomingDatesHeading", "Upcoming dates heading", { max: 40, defaultValue: "Upcoming dates" }),
              panel(
                "Waitlist",
                [
                  copy("waitlistHeading", "Heading", { max: 40, defaultValue: "Join the waitlist" }),
                  prose("waitlistBody", "Body", {
                    max: 200,
                    defaultValue: "This date is full. Leave your details and we will email you if a place opens up.",
                  }),
                  copy("waitlistCta", "Button", { max: 30, defaultValue: "Join the waitlist" }),
                  prose("waitlistSuccess", "After joining", {
                    max: 200,
                    defaultValue: "You are on the list. We will email you if a place opens up.",
                  }),
                ],
                { description: "Shown in place of the Book button when a session is full or set to Waitlist." },
              ),
            ]),
          ],
        },
        {
          label: "Programme page",
          fields: [
            section("programmeDetail", "Programme page (/private-events/…)", [
              copy("eyebrow", "Eyebrow", { max: 24, defaultValue: "Private events" }),
              copy("activitiesHeading", "Activities heading", { max: 40, defaultValue: "Pick Your Creative" }),
              prose("activitiesLead", "Activities lead", { max: 200 }),
              copy("stepsEyebrow", "Steps eyebrow", { max: 24, defaultValue: "How it works" }),
              copy("closeHeading", "Closing heading", { max: 40, defaultValue: "Let’s Make It Happen." }),
              {
                type: "row",
                fields: [
                  copy("ctaPrimaryLabel", "Primary button", { max: 30, defaultValue: "Plan a private event", admin: { width: "50%" } }),
                  copy("ctaSecondaryLabel", "Secondary button", { max: 30, defaultValue: "Contact us", admin: { width: "50%" } }),
                ],
              },
            ]),
          ],
        },
        {
          label: "Policy page",
          fields: [
            section("policyDetail", "Policy page (/policies/…)", [
              {
                type: "row",
                fields: [
                  copy("eyebrow", "Eyebrow", { max: 24, defaultValue: "Policy", admin: { width: "50%" } }),
                  copy("backLabel", "Back link", { max: 30, defaultValue: "All policies", admin: { width: "50%" } }),
                ],
              },
              copy("closeHeading", "Closing heading", { max: 40, defaultValue: "Still Wondering?" }),
              prose("closeBody", "Closing body", {
                max: 200,
                defaultValue: "If something here does not answer your question, ask the Maison.",
              }),
              copy("closeCta", "Closing button", { max: 30, defaultValue: "Ask the Maison" }),
            ]),
          ],
        },
        {
          label: "Events browser",
          fields: [
            section(
              "eventsBrowser",
              "Events page filters and empty states",
              [
                {
                  type: "row",
                  fields: [
                    copy("dateFilterLabel", "Date filter", { max: 16, defaultValue: "Date", admin: { width: "33%" } }),
                    copy("typeFilterLabel", "Type filter", { max: 16, defaultValue: "Type", admin: { width: "33%" } }),
                    copy("locationFilterLabel", "Location filter", { max: 16, defaultValue: "Location", admin: { width: "33%" } }),
                  ],
                },
                {
                  type: "row",
                  fields: [
                    copy("clearFilterLabel", "Clear one filter", { max: 24, defaultValue: "Clear filter", admin: { width: "50%" } }),
                    copy("clearAllLabel", "Clear all filters", { max: 24, defaultValue: "Clear all filters", admin: { width: "50%" } }),
                  ],
                },
                copy("emptyTitle", "No matches — title", { max: 60, defaultValue: "Nothing matches those filters" }),
                prose("emptyBody", "No matches — body", {
                  max: 200,
                  defaultValue: "Try a different date, type or location.",
                }),
                section("doorModeLabels", "Door mode labels", [
                  {
                    type: "row",
                    fields: [
                      copy("diy", "Walk-in door", { max: 24, defaultValue: "No booking", admin: { width: "50%" } }),
                      copy("scheduled", "Scheduled door", { max: 24, defaultValue: "Booked online", admin: { width: "50%" } }),
                    ],
                  },
                ]),
                copy("datePassedLabel", "Date passed chip", { max: 20, defaultValue: "Date passed" }),
                copy("fullyBookedLabel", "Fully booked chip", { max: 20, defaultValue: "Fully booked" }),
              ],
              { description: "The doors' own titles and notes are on the Events page itself (page builder)." },
            ),
          ],
        },
        {
          label: "404",
          fields: [
            section("notFound", "Page not found", [
              copy("eyebrow", "Eyebrow", { max: 24, defaultValue: "Page not found" }),
              copy("heading", "Heading", {
                description: "Use | to break the line, e.g. “This page has | wandered off.”",
                max: 60,
                defaultValue: "This page has | wandered off.",
              }),
              prose("body", "Body", {
                max: 200,
                defaultValue: "There is no page at this address on the Maison Palettia site.",
              }),
              copy("cta", "Button", { max: 30, defaultValue: "Back to the homepage" }),
            ]),
          ],
        },
      ],
    },
  ],
};
