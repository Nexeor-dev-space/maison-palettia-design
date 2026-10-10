import { handlePublicEnquiry } from "@/cms/endpoints/enquiries";

/**
 * POST /api/site/enquiries — the contact and private-event forms (SPEC §H.11).
 *
 * The site owns only WHERE the forms post; what an enquiry is belongs to the
 * Inbox (cms/endpoints/enquiries.ts, 3G): `Sec-Fetch-Site` and JSON-only,
 * 5 per hour per hashed IP, zod, the `website` honeypot, the
 * `site-settings.enquiriesEnabled` switch, and the create under
 * `context.viaEnquiryEndpoint`. It never throws — every outcome is a JSON
 * response that `sendEnquiry` (lib/enquiry.ts) turns into something the form
 * can say.
 *
 * Node runtime (the default) because the handler reaches Postgres through
 * the Local API; never cached, because every call writes.
 */
export const dynamic = "force-dynamic";

export const POST = (request: Request) => handlePublicEnquiry(request);
