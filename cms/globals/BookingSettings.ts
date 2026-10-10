/**
 * `booking-settings` — "Booking & checkout wording" (SPEC §C.3 row 4; fields
 * from docs/cms/research/01-content-inventory.md §3.4 with the §C.3 changes).
 *
 * Everything a booking *says*, plus the one switch that gates the flow.
 *
 * THE SWITCH REPLACES THREE MODES. The site used to derive a `request` /
 * `recorded` / `paid` mode from build-time flags, each with its own "what a
 * booking is" sentence. With a CMS every booking is recorded and paid, so
 * `bookingsOpen` is the whole story (§N): off, every Book button shows
 * `closedMessage` and links to Contact while staff take desk bookings; on,
 * Book buttons go to checkout and Mamo Pay. Switching it on is refused until
 * email, payments and the site address are ready — the four checks in
 * `refuseUntilReady` below, in the spec's order, first failure wins — because
 * an open shop that cannot send tickets or receive webhooks takes money for
 * nothing.
 *
 * `bookingTerms` is the single sentence printed under Confirm, on the
 * confirmation page and as the FAQ answer to "Am I charged when I book?"
 * (FAQs with `answerSource = bookingTerms` render it), seeded with today's
 * `BOOKING_TERMS.paid` from lib/constants.ts.
 *
 * `lowSeatThreshold` is the only "few seats left" number: site labels and the
 * `low_seats` staff alert both read it (Who gets notified can override the
 * alert's copy, not the number).
 *
 * The form field labels and validation messages ("First name", "Please check
 * this email address.") stay in code — UI chrome, not editorial content.
 *
 * The Tickets tab carries 3C's **Preview ticket PDF** `ui` field
 * (`TicketPreview`), which renders a sample from the unsaved heading/instructions.
 */

import type { GlobalBeforeValidateHook, GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { link } from "@/cms/fields/link";
import { isPlaceholderPublicUrl } from "@/cms/lib/publicUrl";
import { TAGS } from "@/lib/cms/cache";

import { copy, count, prose, rows, section, toggle } from "./copyFields";
import {
  gatewayReadiness,
  isAcceptablePublicUrl,
  readGlobal,
  settingsAfterChange,
  settingsError,
  type EmailSettingsLike,
  type PaymentSettingsLike,
  type SiteSettingsLike,
} from "./settingsHooks";

export const BOOKING_SETTINGS_SLUG = "booking-settings" as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* "Bookings open" preconditions                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Runs only on the off → on transition, so an admin editing wording while
 * bookings are already open is never blocked by a check that has since
 * drifted (e.g. an email verification that expired). Turning bookings *off*
 * is always allowed — it is the safe direction.
 */
const refuseUntilReady: GlobalBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const switchingOn = data?.bookingsOpen === true && originalDoc?.bookingsOpen !== true;
  if (!switchingOn) return data;

  const refuse = (message: string) => settingsError(req, BOOKING_SETTINGS_SLUG, "bookingsOpen", message);

  const [email, payments, site] = await Promise.all([
    readGlobal<EmailSettingsLike>(req, "email-settings"),
    readGlobal<PaymentSettingsLike>(req, "payment-settings"),
    readGlobal<SiteSettingsLike>(req, "site-settings"),
  ]);

  // 1. Customers must be able to receive their tickets. `lastVerify.ok` alone
  // goes stale when the host or key changes after verifying; the mailer's
  // readiness also compares the verified config hash (lazy: avoids an import cycle).
  const { emailReadiness } = await import("@/cms/lib/mailer");
  if (email.provider === "log-only" || email.provider === undefined || !(await emailReadiness(req)).ok) {
    throw refuse("Set up Email first so customers receive their tickets (Settings → Email sending → Verify)");
  }

  // 2. The gateway for the active mode must have answered "Test connection".
  const mode = payments.mode ?? "test";
  const readiness = gatewayReadiness(payments, mode, site.publicUrl);
  if (!readiness.keyVerified) {
    throw refuse("Set up Payments first (Settings → Payments → Test connection)");
  }

  // 3. Return URLs and webhook URLs are built from the site address.
  if (!isAcceptablePublicUrl(site.publicUrl) || (await isPlaceholderPublicUrl(req))) {
    throw refuse("Set the site address first (Settings → Site details → Advanced)");
  }

  // 4. Mamo must be able to reach us at that address.
  if (!readiness.webhookRegistered) {
    throw refuse("Register the Mamo webhook first (Settings → Payments)");
  }

  return data;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Reusable shapes                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const statusWording = (name: string, label: string, defaults: { label: string; note: string }) =>
  section(name, label, [
    copy("label", "Label", { max: 16, defaultValue: defaults.label }),
    prose("note", "Note", { max: 160, defaultValue: defaults.note }),
  ]);

const utilityBar = (name: string, label: string, description: string) =>
  section(
    name,
    label,
    [
      prose("note", "Note", { max: 200 }),
      rows("links", "Links", [copy("label", "Label", { max: 24, required: true }), link({ name: "link", label: "Destination" })], {
        maxRows: 4,
      }),
    ],
    { description },
  );

export const BookingSettings: GlobalConfig = {
  slug: BOOKING_SETTINGS_SLUG,
  label: "Booking & checkout wording",
  admin: {
    group: "Settings",
    description:
      "What a booking says, status wording, checkout/basket labels, ticket PDF text. The Bookings open/closed switch is admin-only.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    beforeValidate: [refuseUntilReady],
    afterChange: [
      settingsAfterChange({
        slug: BOOKING_SETTINGS_SLUG,
        revalidateTag: TAGS.booking,
        watch: [{ path: "bookingsOpen", notify: true }, { path: "referencePrefix" }],
      }),
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Bookings",
          fields: [
            toggle("bookingsOpen", "Bookings open", {
              description:
                "On: Book buttons go to checkout and Mamo Pay. Off: Book buttons show the message below and link to the contact page; staff can still create bookings at the desk. Switching on is refused until Email, Payments and the site address are set up.",
              defaultValue: false,
              lock: true,
            }),
            copy("closedMessage", "Message while closed", {
              description: "Shown on every Book button and booking bar while bookings are closed.",
              max: 120,
              defaultValue: "Online bookings open soon.",
            }),
            {
              type: "row",
              fields: [
                copy("closedCtaLabel", "Closed-state button label", {
                  max: 30,
                  defaultValue: "Enquire",
                  admin: { width: "40%" },
                }),
                link({
                  name: "closedCtaLink",
                  label: "Closed-state button link",
                  defaultValue: { type: "internal", url: "/contact" },
                }),
              ],
            },
            prose("bookingTerms", "What a booking is", {
              description:
                "One sentence, printed under the Confirm button, on the confirmation page and as the FAQ answer to “Am I charged when I book?”.",
              max: 240,
              defaultValue: "Your booking is confirmed once your payment has gone through.",
            }),
            {
              type: "row",
              fields: [
                copy("referencePrefix", "Booking reference prefix", {
                  description: "Two to four capital letters, optionally ending in a hyphen. Every reference and the lookup hint start with it.",
                  max: 5,
                  defaultValue: "MP-",
                  lock: true,
                  validate: (value) =>
                    typeof value === "string" && /^[A-Z]{2,4}-?$/.test(value)
                      ? true
                      : "Two to four capital letters, optionally followed by a hyphen (e.g. MP-).",
                  admin: { width: "50%" },
                }),
                count("lowSeatThreshold", "“Few seats left” threshold", {
                  description:
                    "At or below this many seats a session is flagged on the site and the low-seats staff alert fires.",
                  min: 1,
                  max: 20,
                  defaultValue: 4,
                  admin: { width: "50%" },
                }),
              ],
            },
            section(
              "statusCopy",
              "Booking status wording",
              [
                statusWording("confirmed", "Confirmed", {
                  label: "Confirmed",
                  note: "Your place is held. Come to the venue at the time below.",
                }),
                statusWording("pending", "Pending", {
                  label: "Pending",
                  note: "This booking is waiting on confirmation from the Maison.",
                }),
                statusWording("completed", "Completed", {
                  label: "Completed",
                  note: "This event has already taken place. We hope you took something home.",
                }),
                statusWording("cancelled", "Cancelled", {
                  label: "Cancelled",
                  note: "This booking is no longer held.",
                }),
              ],
              { description: "Confirmation page, status lookup and emails. The colour is secondary; the word is always printed." },
            ),
            copy("purchaseConfirmedNote", "Pass-only purchase note", {
              max: 80,
              defaultValue: "Your purchase is confirmed.",
            }),
          ],
        },
        {
          label: "Checkout",
          fields: [
            section("checkout", "Checkout page", [
              copy("heading", "Heading", { max: 60, defaultValue: "Complete Your Booking." }),
              copy("backLabel", "Back link", { max: 30, defaultValue: "Back" }),
              copy("detailsHeading", "Details heading", { max: 40, defaultValue: "Your details" }),
              prose("detailsLead", "Details lead", { max: 200 }),
              prose("carriedOverNote", "Carried-over details note", {
                description: "Shown when the details from the booking step were carried into checkout.",
                max: 200,
              }),
              {
                type: "row",
                fields: [
                  copy("confirmLabel", "Confirm button", { max: 30, defaultValue: "Confirm booking", admin: { width: "50%" } }),
                  copy("confirmingLabel", "Confirm button while working", {
                    max: 30,
                    defaultValue: "Confirming…",
                    admin: { width: "50%" },
                  }),
                ],
              },
              copy("emptyTitle", "Empty basket — title", { max: 60, defaultValue: "Nothing to confirm yet" }),
              prose("emptyBody", "Empty basket — body", {
                max: 200,
                defaultValue: "Choose an event to start a booking.",
              }),
              copy("emptyCta", "Empty basket — button", { max: 30, defaultValue: "Browse events" }),
              prose("errorGeneric", "Error — something went wrong", {
                max: 200,
                defaultValue:
                  "We could not complete your booking just now. Nothing has been charged. Please try again in a moment.",
              }),
              prose("errorEmpty", "Error — nothing in the booking", {
                max: 200,
                defaultValue: "There is nothing in your booking to confirm. Choose an event to continue.",
              }),
              prose("errorPassed", "Error — a date has passed", {
                max: 200,
                defaultValue:
                  "A date in your booking has already passed, so it cannot be confirmed. Remove it to continue.",
              }),
              prose("errorFields", "Error — details need a look", {
                max: 200,
                defaultValue: "Some details need a look before you continue. Each one is marked beside its field.",
              }),
            ]),
            section("cart", "Basket", [
              copy("heading", "Heading", { max: 30, defaultValue: "Your booking" }),
              copy("addAnother", "Add another link", { max: 30, defaultValue: "Add another event" }),
              copy("removeLabel", "Remove link", { max: 20, defaultValue: "Remove" }),
              copy("passedLine", "Date-passed line", { max: 80, defaultValue: "This date has passed" }),
              {
                type: "row",
                fields: [
                  copy("subtotalLabel", "Subtotal label", { max: 20, defaultValue: "Subtotal", admin: { width: "50%" } }),
                  copy("totalLabel", "Total label", { max: 20, defaultValue: "Total", admin: { width: "50%" } }),
                ],
              },
            ]),
            copy("basketLinkLabel", "Header basket link", {
              description: "The small link in the header once something is in the basket.",
              max: 12,
              defaultValue: "Booking",
            }),
            section("passCodeCopy", "Pass / promo code box", [
              {
                type: "row",
                fields: [
                  copy("label", "Label", { max: 40, defaultValue: "Pass or promo code", admin: { width: "40%" } }),
                  copy("placeholder", "Placeholder", { max: 20, defaultValue: "Enter code", admin: { width: "30%" } }),
                  copy("apply", "Apply button", { max: 12, defaultValue: "Apply", admin: { width: "30%" } }),
                ],
              },
              section("messages", "Messages", [
                copy("empty", "No code entered", { max: 160, defaultValue: "Enter a code to apply it." }),
                copy("unavailable", "Codes switched off", {
                  max: 160,
                  defaultValue: "Codes are not active on this site yet, so nothing has been applied and your total is unchanged.",
                }),
                copy("invalid", "Code not recognised", {
                  max: 160,
                  defaultValue: "We do not recognise that code. Check it and try again.",
                }),
                copy("applied", "Code applied", { max: 160, defaultValue: "Code applied to this booking." }),
              ]),
            ]),
          ],
        },
        {
          label: "Booking step",
          fields: [
            section("bookStep", "Booking step (details before checkout)", [
              copy("heading", "Heading", { max: 60, defaultValue: "Book Your Place." }),
              prose("lead", "Lead", { max: 200 }),
              copy("backLabel", "Back link", { max: 30, defaultValue: "Back to the event" }),
              rows("steps", "Step names", [copy("label", "Step", { max: 20, required: true })], {
                maxRows: 3,
                defaultValue: [{ label: "Your details" }, { label: "Confirm" }],
              }),
              {
                type: "row",
                fields: [
                  copy("continueLabel", "Continue button", {
                    max: 30,
                    defaultValue: "Continue to checkout",
                    admin: { width: "50%" },
                  }),
                  copy("openingLabel", "Continue button while working", {
                    max: 30,
                    defaultValue: "Opening checkout…",
                    admin: { width: "50%" },
                  }),
                ],
              },
              prose("summaryError", "Form error summary", {
                max: 200,
                defaultValue: "Some details need a look before you continue. Each one is marked beside its field.",
              }),
              copy("notesLabel", "Notes field label", { max: 60, defaultValue: "Anything we should know (optional)" }),
              copy("passedTitle", "Session passed — title", { max: 60, defaultValue: "This date has passed" }),
              prose("passedBody", "Session passed — body", {
                description: "{title} and {date} are replaced with the session's name and date.",
                max: 240,
                defaultValue: "{title} on {date} has already taken place, so it can no longer be booked.",
              }),
              copy("passedCta", "Session passed — button", { max: 30, defaultValue: "Browse all experiences" }),
            ]),
            section(
              "confirmation",
              "Confirmation page",
              [
                copy("heading", "Heading", { max: 60, defaultValue: "Your reference is ready." }),
                {
                  type: "row",
                  fields: [
                    copy("viewEventsLabel", "View events button", { max: 30, defaultValue: "Browse events", admin: { width: "50%" } }),
                    copy("checkStatusLabel", "Check status link", {
                      max: 30,
                      defaultValue: "Check a booking",
                      admin: { width: "50%" },
                    }),
                  ],
                },
                copy("notFoundHeading", "Not found — heading", { max: 60, defaultValue: "Find your booking." }),
                copy("notFoundTitle", "Not found — title", { max: 60, defaultValue: "No booking to show" }),
                prose("notFoundBodyWithRef", "Not found — body (reference known)", {
                  description: "{reference} is replaced with the reference.",
                  max: 240,
                  defaultValue: "We could not find a booking with the reference {reference}. Check it and try again.",
                }),
                prose("notFoundBodyNoRef", "Not found — body (no reference)", {
                  max: 240,
                  defaultValue: "Open the link from your confirmation email, or look up your booking by its reference.",
                }),
              ],
              { description: "/payment-success — the page a customer lands on after paying." },
            ),
            section(
              "status",
              "Booking status page",
              [
                copy("heading", "Heading", { max: 60, defaultValue: "Check Your Booking." }),
                prose("lead", "Lead", { max: 200, defaultValue: "Enter the reference from your confirmation." }),
                {
                  type: "row",
                  fields: [
                    copy("fieldLabel", "Field label", { max: 30, defaultValue: "Booking reference", admin: { width: "50%" } }),
                    copy("placeholder", "Placeholder", {
                      description: "{prefix} is replaced with the reference prefix.",
                      max: 20,
                      defaultValue: "{prefix}4K7XY",
                      admin: { width: "50%" },
                    }),
                  ],
                },
                copy("hint", "Hint", {
                  description: "{prefix} is replaced with the reference prefix.",
                  max: 120,
                  defaultValue: "It looks like {prefix} followed by six characters.",
                }),
                copy("cta", "Look-up button", { max: 30, defaultValue: "Find my booking" }),
                copy("noneTitle", "Nothing found — title", { max: 60, defaultValue: "No booking found" }),
                prose("noneBody", "Nothing found — body", {
                  max: 200,
                  defaultValue: "Check the reference and try again, or get in touch and we will look it up.",
                }),
                copy("noneCta", "Nothing found — button", { max: 30, defaultValue: "Contact us" }),
              ],
              { description: "/booking-status — look up a booking by reference." },
            ),
          ],
        },
        {
          label: "Event page",
          fields: [
            section("eventPage", "Event page action copy", [
              {
                type: "row",
                fields: [
                  copy("bookLabel", "Book button", { max: 20, defaultValue: "Book", admin: { width: "33%" } }),
                  copy("passedLabel", "Date passed chip", { max: 20, defaultValue: "Date passed", admin: { width: "33%" } }),
                  copy("perPersonLabel", "Per-person label", { max: 20, defaultValue: "per person", admin: { width: "33%" } }),
                ],
              },
              copy("closedFullFact", "Closed — full", { max: 60, defaultValue: "This date is full" }),
              copy("closedPassedFact", "Closed — passed", { max: 60, defaultValue: "This date has passed" }),
              copy("noneOpenSuffix", "No other dates open", { max: 120, defaultValue: "No other dates are open right now." }),
              copy("othersOpenSuffix", "Other dates open", { max: 120, defaultValue: "Other dates are open." }),
              copy("seeOpenLabel", "See open dates link", { max: 30, defaultValue: "See open dates" }),
              copy("diyTitle", "Walk-in — title", { max: 60, defaultValue: "No booking needed" }),
              prose("diyBody", "Walk-in — body", {
                max: 240,
                defaultValue: "Come when the experience is available and start creating.",
              }),
              copy("diyCta", "Walk-in — button", { max: 30, defaultValue: "Find us" }),
              prose("comingSoonNote", "Coming soon note", { max: 160, defaultValue: "This experience is coming soon." }),
              copy("readyHeading", "“Ready for you” heading", { max: 60, defaultValue: "Everything Is Ready." }),
              prose("readyBody", "“Ready for you” body", {
                description: "The “everything provided” promise — keep it in step with the DIY policy's materials clause.",
                max: 200,
                defaultValue: "Everything is laid out before you arrive. You bring nothing but yourself.",
              }),
              prose("utilityNote", "Foot-of-page note", {
                max: 200,
                defaultValue: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.",
              }),
            ]),
            section(
              "labels",
              "Mode labels",
              [
                {
                  type: "row",
                  fields: [
                    copy("createAnytime", "Walk-in product name", {
                      max: 20,
                      defaultValue: "Create Anytime",
                      admin: { width: "50%" },
                    }),
                    copy("createTogether", "Scheduled product name", {
                      max: 20,
                      defaultValue: "Create Together",
                      admin: { width: "50%" },
                    }),
                  ],
                },
                {
                  type: "row",
                  fields: [
                    copy("anyTime", "Walk-in short label", { max: 20, defaultValue: "Any time", admin: { width: "50%" } }),
                    copy("scheduled", "Scheduled short label", { max: 20, defaultValue: "Scheduled", admin: { width: "50%" } }),
                  ],
                },
                {
                  type: "row",
                  fields: [
                    copy("noBooking", "Walk-in chip", { max: 20, defaultValue: "No booking", admin: { width: "33%" } }),
                    copy("bookedOnline", "Scheduled chip", { max: 20, defaultValue: "Booked online", admin: { width: "33%" } }),
                    copy("scheduledSession", "Card eyebrow", {
                      max: 20,
                      defaultValue: "Scheduled session",
                      admin: { width: "33%" },
                    }),
                  ],
                },
                copy("diyLine", "Walk-in one-liner", {
                  max: 80,
                  defaultValue: "Pick a project. Pick your colours. Just drop in.",
                }),
                copy("scheduledLine", "Scheduled one-liner", {
                  max: 80,
                  defaultValue: "A little more planned. Same creative energy.",
                }),
              ],
              { description: "The two product names appear in about twenty places; change them here once." },
            ),
            section("utilityBars", "“More from…” bars", [
              utilityBar("eventDetail", "Event page", "The note and links at the foot of every event page."),
              utilityBar("checkout", "Checkout", "The note and links at the foot of checkout."),
            ]),
          ],
        },
        {
          label: "Tickets",
          fields: [
            section(
              "ticket",
              "Ticket PDF",
              [
                copy("heading", "Heading", { max: 60, defaultValue: "Show this at the table." }),
                prose("instructions", "Instructions", {
                  max: 300,
                  defaultValue:
                    "Please arrive ten minutes before your session starts. Showing this ticket on your phone is fine.",
                }),
              ],
              { description: "Printed on every QR ticket, under the session details." },
            ),
            // 3C's "Preview ticket PDF" button: renders a sample ticket from the
            // heading/instructions currently in the form (unsaved edits included).
            {
              name: "ticketPreview",
              type: "ui",
              admin: { components: { Field: "@/cms/components/settings/TicketPreview#TicketPreview" } },
            },
          ],
        },
      ],
    },
  ],
};
