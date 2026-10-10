/**
 * The seam between the site's two enquiry forms and the CMS Inbox.
 *
 * Both forms — /contact (<ContactForm>) and /private-events/book
 * (<PrivateEventEnquiry>) — call `sendEnquiry`, which POSTs to
 * `/api/site/enquiries`. That route (app/(site)/api/site/enquiries) is a
 * one-line mount of `handlePublicEnquiry` in cms/endpoints/enquiries.ts,
 * where the Inbox owns what an enquiry is: zod validation, the honeypot,
 * 5 per hour per hashed IP, the `site-settings.enquiriesEnabled` switch, and
 * the create into `enquiries` under `context.viaEnquiryEndpoint` (SPEC §H.11).
 *
 * TWO AUDIENCES IMPORT THIS FILE, SO IT IMPORTS NOTHING. The forms are client
 * components; cms/collections/inbox/Enquiries.ts and cms/endpoints/
 * enquiries.ts read `ENQUIRY_TOPICS` from it inside the Payload config. A
 * single import of anything server-only here would break the forms' bundle,
 * and anything client-only would break the config.
 *
 * HONEST OUTCOMES, NOT A SPINNER AND A THANK-YOU. `sendEnquiry` never throws
 * and never resolves `ok` unless the server said the enquiry is stored. Every
 * other answer the route can give — switched off in the admin, rate-limited,
 * a field the server refused, the database unreachable, the network gone —
 * is its own result, and the forms say which one happened in words a
 * customer can act on. A success screen over a message that went nowhere is
 * the one thing these forms must never show.
 */

export interface EnquiryRequest {
  name: string;
  email: string;
  /**
   * Optional on the contract, which is not the same as optional on a form.
   * The contact form leaves it blank-able; the private-event enquiry requires
   * it, because that conversation happens over a call.
   */
  phone?: string;
  topic: EnquiryTopic;
  message: string;
  /**
   * Structured answers a particular form collected, in the order it asked
   * them — printed under the message in the Inbox without the collection
   * knowing what they mean. Only answered questions belong here; a form must
   * not pad this with empty entries.
   */
  details?: readonly { label: string; value: string }[];
  /** Which form sent it — the Inbox's "From" column. */
  source: EnquirySource;
  /**
   * The honeypot: a field humans never see (`website`, visually hidden and
   * out of the tab order). Anything in it means a script filled the form; the
   * server stores the row as possible spam and answers exactly as it would
   * for a person, so the script learns nothing.
   */
  website?: string;
}

export type EnquirySource = "contact" | "private-event";

/**
 * What the enquiry is about.
 *
 * Five options, each matching something this site actually does: the
 * programme at /events, the booking flow that runs off it, the private
 * sessions at /private-events, the collaborations the studio takes on, and
 * everything else. The Inbox's "About" filter is this same list.
 */
export type EnquiryTopic = "event" | "booking" | "private" | "collaboration" | "general";

export const ENQUIRY_TOPICS: { value: EnquiryTopic; label: string }[] = [
  { value: "event", label: "An event" },
  { value: "booking", label: "A booking" },
  { value: "private", label: "A private event" },
  { value: "collaboration", label: "Working together" },
  { value: "general", label: "Something else" },
];

/**
 * Whether there is somewhere for an enquiry to go. True since Phase 3: every
 * enquiry is stored in the Inbox. Whether the forms are offered at all is
 * `site-settings.enquiriesEnabled`, read at request time by the route (and by
 * the contact section, which hides the form while it is off) — this constant
 * only tells lib/constants.ts that a channel exists for "send them your
 * reference" wording.
 */
export const ENQUIRY_CONFIGURED = true;

export type EnquiryResult =
  /** Stored in the Inbox. */
  | { status: "ok" }
  /** The owner has switched enquiries off (Settings → Site details). */
  | { status: "disabled" }
  /** Five an hour per connection; the customer is told to try later. */
  | { status: "rate_limited" }
  /** The server refused a field. `field` names it when it can; `message` is customer-facing. */
  | { status: "invalid"; field?: string; message: string }
  /** Database or network trouble: nothing was stored, try again shortly. */
  | { status: "error" };

const asString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/**
 * Send the enquiry to the Inbox.
 *
 * Returns rather than throws, so the form renders a specific outcome rather
 * than a generic failure, and so the caller cannot mistake silence for
 * success. There is no optimistic state: `ok` means the row exists.
 */
export async function sendEnquiry(request: EnquiryRequest): Promise<EnquiryResult> {
  let response: Response;
  try {
    response = await fetch("/api/site/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...request,
        // Only answered questions travel — see `details` above.
        details: request.details?.filter((entry) => entry.value.trim() !== ""),
        phone: request.phone?.trim() || undefined,
        // The page the form sits on, for the Inbox's "Page" field when the
        // browser sends no Referer. Path only: no query string, no hash.
        page: typeof window === "undefined" ? undefined : window.location.pathname,
      }),
    });
  } catch {
    return { status: "error" };
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    // A proxy error page, or an empty body — judged by the status alone.
  }

  if (response.ok && body.status === "ok") return { status: "ok" };
  if (response.status === 429) return { status: "rate_limited" };
  if (body.status === "disabled") return { status: "disabled" };
  if (body.status === "invalid") {
    return {
      status: "invalid",
      field: asString(body.field),
      message: asString(body.message) ?? "Please check the form and try again.",
    };
  }
  return { status: "error" };
}
