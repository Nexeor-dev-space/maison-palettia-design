import type { Block } from "payload";

import { prose, text } from "./shared";
import { stepsSourceFields } from "./Steps";

/**
 * `enquiryForm` → components/private-events/PrivateEventEnquiry.tsx +
 * EnquiryStub.tsx (private-events-book; both stay in place for 3F).
 * SPEC §E.1. The legends, the note, the button and the success state; field
 * labels and validation messages stay in code (01 §8). The sidebar's "What
 * happens next" reuses the steps fields.
 */
export const EnquiryFormBlock: Block = {
  slug: "enquiryForm",
  interfaceName: "EnquiryFormBlock",
  labels: { singular: "Private-event enquiry form", plural: "Private-event enquiry forms" },
  admin: { group: "Private events" },
  fields: [
    text("legendAboutYou", "Form section heading — about you", 32, { defaultValue: "About you" }),
    text("legendAboutEvent", "Form section heading — about the event", 32, { defaultValue: "About the event" }),
    prose("note", "Note above the event questions", 200, {
      defaultValue: "Answer what you know. None of this is required, and nothing here is fixed once you send it.",
    }),
    text("submitLabel", "Send button", 24, { defaultValue: "Send enquiry" }),
    text("successHeading", "Success — heading", 40, { defaultValue: "Enquiry received" }),
    prose("successBody", "Success — body", 240),
    {
      name: "sidebarSteps",
      type: "group",
      label: "Sidebar — what happens next",
      fields: [text("heading", "Heading", 32, { defaultValue: "What happens next" }), ...stepsSourceFields()],
    },
  ],
};
