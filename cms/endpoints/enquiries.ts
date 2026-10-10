import { APIError, createLocalReq, type Endpoint, type Payload, type PayloadRequest } from "payload";
import { z } from "zod";

import { AFTER_COMMIT } from "@/cms/collections/inbox/hooks";
import { refererPath } from "@/cms/collections/inbox/shared";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/contracts";
import { ENQUIRY_TOPICS, type EnquiryTopic } from "@/lib/enquiry";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Enquiries — the public intake and the Inbox's one action (SPEC §D.4, §H.11)
 * ==========================================================================
 *
 * TWO HALVES, TWO MOUNTS.
 *
 *   · `handlePublicEnquiry(request)` is the body of `POST /api/site/enquiries`
 *     — a Next route handler under app/(site)/api/site/ (SPEC §A.3), which
 *     3F owns and which is one line: `export const POST = (request: Request)
 *     => handlePublicEnquiry(request)`. The logic lives here so the Inbox owns what
 *     an enquiry is, and the site owns only where its form posts.
 *   · `enquiriesEndpoints` is the Payload root endpoint
 *     `POST /api/actions/enquiries/{id}/replied` — the Reply-by-email
 *     button's stamp (admin, editor, front-desk; §J).
 *
 * THE PUBLIC INTAKE, IN ORDER (each step refuses before the next one costs
 * anything):
 *
 *   1. `Sec-Fetch-Site: cross-site` → 403, and a non-JSON content type → 415.
 *      The forms are same-origin `fetch` calls; a plain HTML form on another
 *      site can only send urlencoded/multipart, so requiring JSON also rules
 *      out drive-by posts from pages that are not ours.
 *   2. 5 per hour per hashed IP (SPEC §H rate-limit table) → 429 with Retry-After.
 *   3. Body ≤ 32 KB, then zod. The schema mirrors `EnquiryRequest`
 *      (lib/enquiry.ts) plus `source` and the honeypot `website`.
 *   4. `site-settings.enquiriesEnabled` off → 503 `{ status: "disabled" }`.
 *      That flag is the ONLY gate (§H.11): nobody being subscribed to
 *      `new_enquiry` does not stop an enquiry being stored.
 *   5. Honeypot filled → the row is stored with `meta.honeypotTripped`,
 *      filed as `closed` (so it never inflates the "New" count) and not
 *      announced — and the visitor gets the same 200 as everyone else, so a
 *      bot learns nothing. Browser autofill can, rarely, fill a hidden
 *      field; that is why the row is kept and the Inbox has a "Possible
 *      spam" chip rather than the message being dropped.
 *   6. `payload.create` with `overrideAccess: false` and
 *      `context.viaEnquiryEndpoint` — the collection's `access.create` is
 *      exercised for real, so this path and generic REST are told apart by
 *      the same rule.
 *   7. After the create has COMMITTED, the deferred announcement queued by
 *      the afterChange hook runs (staff alert, optional auto-reply — see
 *      cms/collections/inbox/hooks.ts for why it waits).
 *
 * Responses are `{ status: "ok" | "disabled" | "invalid" | "rate_limited" }`
 * — the first two are the `EnquiryResult` vocabulary the forms already
 * speak; `invalid` carries the first issue for the form's error summary.
 * Nothing in a response echoes stored data.
 */

/** SPEC §H (rate-limit table): `enquiries` 5/h per ipHash. */
export const ENQUIRY_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;
const MAX_BODY_BYTES = 32 * 1024;

const TOPIC_VALUES = ENQUIRY_TOPICS.map((topic) => topic.value) as [EnquiryTopic, ...EnquiryTopic[]];

/** Collapses runs of spaces/tabs and trims; keeps line breaks (messages have paragraphs). */
const clean = (value: string) =>
  value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const line = (max: number) =>
  z
    .string()
    .transform((value) => clean(value).replace(/\n/g, " "))
    .pipe(z.string().max(max));

/** The public body — `EnquiryRequest` + where it came from + the honeypot. */
export const PublicEnquirySchema = z.object({
  source: z.enum(["contact", "private-event"]).default("contact"),
  name: line(120).pipe(z.string().min(1, "Please tell us your name.")),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please check your email address.").max(254)),
  phone: line(32)
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || (value.match(/\d/g)?.length ?? 0) >= 7, "Please add a phone number we can reach you on."),
  topic: z.enum(TOPIC_VALUES),
  message: z
    .string()
    .transform(clean)
    .pipe(z.string().min(1, "Please write a message.").max(5000, "Please keep your message under 5,000 characters.")),
  details: z
    .array(z.object({ label: line(80).pipe(z.string().min(1)), value: line(500).pipe(z.string().min(1)) }))
    .max(20)
    .optional(),
  /** The honeypot. Humans never see it; anything in it means a script filled the form. */
  website: z.string().max(500).optional(),
  /** The page the form sits on, when the browser sent no Referer. */
  page: z.string().max(300).optional(),
});
export type PublicEnquiryBody = z.input<typeof PublicEnquirySchema>;

type Deferred = () => Promise<void>;

const reply = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

async function enquiriesEnabled(payload: Payload): Promise<boolean> {
  try {
    const settings = (await payload.findGlobal({ slug: "site-settings", depth: 0 })) as { enquiriesEnabled?: boolean | null };
    // Unset (a fresh install before Site details was saved) means the default, which is on.
    return settings?.enquiriesEnabled !== false;
  } catch {
    // The settings row cannot be read: store the enquiry rather than turn people away.
    return true;
  }
}

export interface PublicEnquiryDeps {
  /** The Local API. Injectable so the vitest suite needs no database. */
  getPayload: () => Promise<Payload>;
}

// Imported lazily: a static import of lib/cms/payload.ts pulls the whole
// config (and Postgres) into anything that imports this module, tests included.
const defaultDeps: PublicEnquiryDeps = {
  getPayload: () => import("@/lib/cms/payload").then(({ getCms }) => getCms()),
};

/** The body of `POST /api/site/enquiries`. Never throws; every outcome is a JSON Response. */
export async function handlePublicEnquiry(request: Request, deps: PublicEnquiryDeps = defaultDeps): Promise<Response> {
  const headers = request.headers;
  if (headers.get("sec-fetch-site") === "cross-site") return reply(403, { status: "forbidden" });
  if (!(headers.get("content-type") ?? "").toLowerCase().includes("application/json")) return reply(415, { status: "invalid", message: "Send the form as JSON." });

  const hashedIp = ipHash(clientIp(headers));
  if (!rateLimit("enquiries", hashedIp, ENQUIRY_RATE_LIMIT)) {
    return reply(429, { status: "rate_limited", message: "Too many messages from this connection. Please try again in an hour." }, { "retry-after": "3600" });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return reply(413, { status: "invalid", message: "That message is too long." });
    raw = JSON.parse(text);
  } catch {
    return reply(400, { status: "invalid", message: "The form could not be read. Please try again." });
  }
  const parsed = PublicEnquirySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return reply(400, { status: "invalid", field: issue?.path?.map(String).join(".") || undefined, message: issue?.message ?? "Please check the form." });
  }
  const body = parsed.data;

  let payload: Payload;
  try {
    payload = await deps.getPayload();
  } catch {
    return reply(503, { status: "unavailable", message: "We could not take your message just now. Please try again shortly." });
  }
  if (!(await enquiriesEnabled(payload))) return reply(503, { status: "disabled" });

  const honeypot = Boolean(body.website?.trim());
  const afterCommit: Deferred[] = [];
  try {
    const req = await createLocalReq({ context: { viaEnquiryEndpoint: true, [AFTER_COMMIT]: afterCommit } }, payload);
    await payload.create({
      collection: "enquiries",
      overrideAccess: false,
      req,
      depth: 0,
      data: {
        status: honeypot ? "closed" : "new",
        source: body.source,
        topic: body.topic,
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
        details: body.details,
        meta: {
          ipHash: hashedIp,
          referer: refererPath(headers.get("referer")) ?? refererPath(body.page),
          userAgent: (headers.get("user-agent") ?? "").slice(0, 300) || undefined,
          honeypotTripped: honeypot,
        },
      },
    });
  } catch (error) {
    payload.logger.error({ msg: "enquiries: could not store an enquiry", err: (error as Error)?.message });
    return reply(500, { status: "error", message: "We could not take your message just now. Please try again shortly." });
  }

  // The row is committed; nothing below can lose it.
  for (const run of afterCommit) {
    await run().catch(() => undefined);
  }
  return reply(200, { status: "ok" });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* POST /api/actions/enquiries/{id}/replied                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const RepliedBody = z.object({}).strict();

/**
 * Stamps `repliedAt = now` (and, through the collection's `advanceStatus`
 * hook, moves a `new` enquiry to `in_progress`). Runs as the signed-in user
 * with `overrideAccess: false`, so the field rules of §J apply exactly as
 * they do in the edit form — all three roles may write `repliedAt` and
 * `status`, nobody may write what the enquirer sent.
 */
async function markReplied(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin", "editor", "front-desk"]);
  await parseBody(req, RepliedBody);
  const id = String(req.routeParams?.id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError("Unknown enquiry.", 404, undefined, true);

  const existing = await req.payload
    .findByID({ collection: "enquiries", id, req, overrideAccess: false, depth: 0, disableErrors: true })
    .catch(() => null);
  if (!existing) throw new APIError("Unknown enquiry.", 404, undefined, true);

  const updated = await req.payload.update({
    collection: "enquiries",
    id,
    req,
    overrideAccess: false,
    depth: 0,
    data: { repliedAt: new Date().toISOString() },
  });
  return json({ id: updated.id, repliedAt: updated.repliedAt, status: updated.status });
}

/** Payload root endpoints; paths are relative to `/api` (SPEC §A.3, §J). */
export const enquiriesEndpoints: Endpoint[] = [{ path: "/actions/enquiries/:id/replied", method: "post", handler: markReplied }];
