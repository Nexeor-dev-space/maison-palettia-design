import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { notifyStaff, publicUrl, sendTemplated } from "@/cms/lib/contracts";
import { ENQUIRY_TOPICS } from "@/lib/enquiry";
import type { Enquiry } from "@/payload-types";

import { enquiryReference, formatDubai } from "./shared";

/**
 * ==========================================================================
 * enquiries hooks — status housekeeping and the "new enquiry" announcement
 * ==========================================================================
 *
 * Two jobs (SPEC §D.4, §D.7):
 *
 *   · `advanceStatus` (beforeChange, update) — a `new` enquiry that someone
 *     has picked up (assigned, or replied to) is no longer new. Moving it to
 *     `in_progress` by hand is the step everyone forgets, and an Inbox whose
 *     "New" count includes answered messages stops being trusted.
 *   · `announceEnquiry` (afterChange, create) — `notifyStaff("new_enquiry")`
 *     and, when Settings → Who gets notified → "Auto-reply to enquiries" is
 *     on, the `enquiry_received` email to the person who wrote in. Skipped
 *     for honeypot rows: a bot's message is stored for the record, never
 *     announced.
 *
 * WHY THE ANNOUNCEMENT WAITS FOR THE COMMIT. An afterChange hook runs inside
 * the create's database transaction. `notifyStaff`/`sendTemplated` (3C)
 * write `notification-log` rows and queue jobs — more statements in the same
 * transaction — and on Postgres ONE failed statement aborts the whole
 * transaction, so a hiccup in the mail plumbing would roll back the
 * enquiry itself and the visitor's message would be lost. SPEC §D.4 says the
 * opposite: every enquiry is stored, emailed or not. So when the creator
 * hands us a queue on `req.context[AFTER_COMMIT]` (the public endpoint
 * always does, cms/endpoints/enquiries.ts), the announcement is pushed onto
 * it and run after `payload.create` has resolved — i.e. after the commit,
 * when the row exists for the log's foreign key and a failure can only lose
 * an email, never the enquiry. Any other creator (a script, a future import)
 * gets the announcement inline, best-effort.
 */

/** `req.context` key: an array of callbacks the creator runs once the create has committed. */
export const AFTER_COMMIT = "inboxAfterCommit";

type Deferred = () => Promise<void>;

const topicLabel = (value: unknown): string => ENQUIRY_TOPICS.find((topic) => topic.value === value)?.label ?? String(value ?? "");

const idOf = (value: unknown): string | null => {
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return value ? String(value) : null;
};

export const advanceStatus: CollectionBeforeChangeHook<Enquiry> = ({ data, originalDoc, operation }) => {
  if (operation !== "update" || !originalDoc || originalDoc.status !== "new") return data;
  // Somebody chose a status in this save — theirs wins, whatever it is.
  if (data.status !== undefined && data.status !== originalDoc.status) return data;
  const assignedNow = data.assignedTo !== undefined && idOf(data.assignedTo) !== null && idOf(data.assignedTo) !== idOf(originalDoc.assignedTo);
  const repliedNow = Boolean(data.repliedAt) && data.repliedAt !== originalDoc.repliedAt;
  if (assignedNow || repliedNow) data.status = "in_progress";
  return data;
};

/** Never throws: a failed email must not surface as a failed enquiry. Logs no personal data. */
async function announce(req: PayloadRequest, doc: Enquiry): Promise<void> {
  const reference = enquiryReference(doc.id);
  const base = await publicUrl(req).catch(() => "");
  const vars = {
    reference,
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    topic: topicLabel(doc.topic),
    source: doc.source === "private-event" ? "Private events form" : "Contact form",
    message: doc.message.length > 2000 ? `${doc.message.slice(0, 2000)}…` : doc.message,
    details: (doc.details ?? []).map(({ label, value }) => ({ label, value })),
    page: doc.meta?.referer ?? "",
    receivedAt: formatDubai(doc.createdAt),
    links: { admin: `${base}/admin/collections/enquiries/${doc.id}` },
  };

  try {
    await notifyStaff(req, "new_enquiry", vars, { enquiry: String(doc.id) });
  } catch (error) {
    req.payload.logger.warn({ msg: "enquiries: staff notification failed", reference, err: (error as Error)?.name });
  }

  try {
    const settings = (await req.payload.findGlobal({ slug: "notification-settings", req, depth: 0 })) as { enquiryAutoReply?: boolean | null };
    if (settings?.enquiryAutoReply) {
      await sendTemplated(req, {
        key: "enquiry_received",
        to: doc.email,
        vars: { reference, name: doc.name, topic: vars.topic },
        refs: { enquiry: String(doc.id) },
      });
    }
  } catch (error) {
    req.payload.logger.warn({ msg: "enquiries: auto-reply failed", reference, err: (error as Error)?.name });
  }
}

export const announceEnquiry: CollectionAfterChangeHook<Enquiry> = async ({ doc, operation, req }) => {
  if (operation !== "create" || doc.meta?.honeypotTripped) return doc;
  const queue = req.context?.[AFTER_COMMIT];
  if (Array.isArray(queue)) {
    (queue as Deferred[]).push(() => announce(req, doc));
  } else {
    await announce(req, doc);
  }
  return doc;
};
