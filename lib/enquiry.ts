/**
 * The seam between the contact form and somewhere an enquiry could actually
 * go — and, as with lib/booking.ts, an honest account of the fact that it is
 * not connected to anything.
 *
 * AUDITED, NOT ASSUMED. The project has no mail service, no API route, no
 * server action and no database; `CONTACT.email` and `CONTACT.phone` in
 * lib/constants.ts are both still `null`, and every entry in `SOCIAL_LINKS`
 * has a `null` href. There is no address to forward a message to even if
 * there were something to forward it with.
 *
 * So the form is built complete and truthful up to the moment a message would
 * leave the browser, and stops there deliberately — the same line the booking
 * flow draws in the same place, for the same reason. A success screen over a
 * form that goes nowhere is indistinguishable from a working one to the person
 * who just typed their question into it, and the studio would never learn that
 * the enquiries had stopped arriving because they would never have started.
 *
 * Wiring it up is one function and one flag.
 */

export interface EnquiryRequest {
  name: string;
  email: string;
  /** Optional — the form does not require it. */
  phone?: string;
  topic: EnquiryTopic;
  message: string;
}

/**
 * What the enquiry is about.
 *
 * Four options, each matching something this site actually does: the
 * programme at /events, the booking flow that runs off it, the collaborations
 * the studio takes on, and everything else. No "sales", no "support", no
 * "press" — the studio has no such desks, and a dropdown that implies
 * otherwise is an invented org chart.
 */
export type EnquiryTopic = "event" | "booking" | "collaboration" | "general";

export const ENQUIRY_TOPICS: { value: EnquiryTopic; label: string }[] = [
  { value: "event", label: "An event" },
  { value: "booking", label: "A booking" },
  { value: "collaboration", label: "Working together" },
  { value: "general", label: "Something else" },
];

/**
 * Whether an enquiry can be delivered anywhere.
 *
 * A constant rather than a runtime check because there is nothing to check:
 * no transport exists. Read by the form so that the interface changes the
 * moment one is wired, rather than needing a second edit here and there.
 *
 * TODO(client): set true once there is somewhere for a message to go — a mail
 * service, a server action writing to the CMS, or an inbox behind an API
 * route. Whichever it is, the studio's own address still needs to exist:
 * `CONTACT.email` in lib/constants.ts is `null`.
 */
export const ENQUIRY_CONFIGURED = false;

export type EnquiryResult =
  | { status: "unconfigured" }
  | { status: "ok" };

/**
 * Send the enquiry.
 *
 * Returns rather than throws, so the form can render a specific, honest
 * explanation instead of a generic failure — and so the caller cannot mistake
 * silence for success. There is no optimistic state and no `catch` that
 * quietly resolves.
 *
 * TODO(client): the real implementation must run server-side — a mail service
 * key is a secret and cannot be shipped to the browser — validate the payload
 * again there rather than trusting this one, and rate-limit by IP. Only then
 * return `ok`.
 */
export async function sendEnquiry(request: EnquiryRequest): Promise<EnquiryResult> {
  void request;

  if (!ENQUIRY_CONFIGURED) return { status: "unconfigured" };

  // Unreachable while the flag above is false. Left as the shape the real
  // integration returns rather than as a stub that could be mistaken for one.
  throw new Error("sendEnquiry: enquiries are marked configured but no transport is implemented.");
}
