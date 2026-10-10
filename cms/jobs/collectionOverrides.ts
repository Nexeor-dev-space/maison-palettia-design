import { APIError, type CollectionConfig, type Endpoint, type PayloadRequest } from "payload";

import { isAdmin, roleOf } from "@/cms/access/roles";
import { requireRole } from "@/cms/lib/contracts";

import { scrubError } from "./logic";

/**
 * ==========================================================================
 * payload-jobs in the admin: "System → Background jobs", with Retry (§H.9, §I)
 * ==========================================================================
 *
 * Payload creates the `payload-jobs` collection itself and hides it with
 * every access set to false. This override makes it a read-only log that
 * ADMINS can see — what ran, when, how often it was tried, the error of the
 * last attempt, each step's output — and adds one action, **Retry**, on a
 * job that failed for good (`cms/components/jobs/RetryButton.tsx`).
 *
 * WHAT RETRY DOES. It queues a NEW job with the same task or workflow, the
 * same input and the same queue, and leaves the failed one as it was, so
 * the history stays readable ("failed at 10:02, retried at 10:15, passed").
 * Every task is safe to run again by design: steps are idempotent, and
 * `process-refund` re-enters at its claim, which only proceeds for a refund
 * still `approved` — Retry can never post a refund twice. The new job gets
 * the task's own concurrency key, so it waits for anything still running on
 * the same order, payment or session.
 *
 * Retry is `POST /api/payload-jobs/:id/retry`: admin only (`requireRole`,
 * which also refuses cross-site requests), and only for a job whose
 * `hasError` is set — a job that is pending or running is left to finish.
 *
 * WHAT IS DELIBERATELY NOT CHANGED:
 *   · `defaultSort` — `runJobs` picks jobs in the collection's default sort
 *     (FIFO by createdAt); a "newest first" list order would make the
 *     queue run LIFO. The admin list can still be sorted by clicking.
 *   · hooks — the job runner writes with direct database calls, so
 *     collection hooks on this collection would never run (and Payload
 *     warns if they are added); nothing here relies on them.
 *   · create / update / delete stay `false` for everyone: jobs are written by
 *     the queue only; old rows are removed by `purge-retention` (Phase 4).
 */

const RETRY_COMPONENT = "@/cms/components/jobs/RetryButton#RetryButton";

type JobRow = {
  id: string | number;
  taskSlug?: string | null;
  workflowSlug?: string | null;
  input?: unknown;
  queue?: string | null;
  hasError?: boolean | null;
  completedAt?: string | null;
};

const retryEndpoint: Endpoint = {
  path: "/:id/retry",
  method: "post",
  handler: async (req: PayloadRequest) => {
    requireRole(req, ["admin"]);
    const id = String(req.routeParams?.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id) && !/^\d+$/.test(id)) throw new APIError("Unknown job.", 404, undefined, true);

    const job = (await req.payload
      .findByID({ collection: "payload-jobs", id, depth: 0, overrideAccess: true, disableErrors: true, req })
      .catch(() => null)) as JobRow | null;
    if (!job) throw new APIError("Unknown job.", 404, undefined, true);
    if (!job.hasError) {
      throw new APIError(
        job.completedAt ? "This job already completed — nothing to retry." : "This job has not failed (it is waiting or running) — let it finish.",
        409,
        undefined,
        true,
      );
    }
    const slug = job.workflowSlug || job.taskSlug;
    const registered = job.workflowSlug
      ? req.payload.config.jobs.workflows?.some((w) => w.slug === job.workflowSlug)
      : req.payload.config.jobs.tasks?.some((t) => t.slug === job.taskSlug);
    if (!slug || slug === "inline" || !registered) throw new APIError("This kind of job can no longer be run.", 409, undefined, true);

    try {
      // Cast: queue() is typed from the generated TypedJobs; the slug was checked against the live config above.
      const queue = req.payload.jobs.queue as unknown as (args: Record<string, unknown>) => Promise<{ id: string | number }>;
      const next = await queue({
        ...(job.workflowSlug ? { workflow: job.workflowSlug } : { task: job.taskSlug }),
        input: (job.input ?? {}) as Record<string, unknown>,
        queue: job.queue || "default",
        req,
      });
      req.payload.logger.info({ msg: "jobs: retried from the admin", jobId: String(job.id), newJobId: String(next.id), slug, by: String(req.user?.id ?? "") });
      return Response.json(
        { ok: true, id: String(next.id), message: "Queued again — it runs within a minute (emails within 20 seconds)." },
        { headers: { "cache-control": "no-store" } },
      );
    } catch (error) {
      throw new APIError(`Could not queue the job again: ${scrubError(error)}`, 500, undefined, true);
    }
  },
};

/**
 * Plain words for Payload's own job fields (4B review: the list read "Task
 * slug, Workflow slug, Has error false, Processing false"). Only labels and
 * the two yes/no columns' chips change — the fields themselves are Payload's.
 */
const JOB_LABELS: Record<string, string> = {
  taskSlug: "Task",
  workflowSlug: "Workflow",
  queue: "Queue",
  hasError: "Result",
  processing: "Running now",
  totalTried: "Attempts",
  completedAt: "Finished",
  waitUntil: "Not before",
};

const JOB_CELLS: Record<string, { labels: Record<string, string>; tones: Record<string, string> }> = {
  hasError: { labels: { true: "Failed", false: "OK" }, tones: { true: "bad", false: "ok" } },
  processing: { labels: { true: "Running", false: "—" }, tones: { true: "lilac", false: "muted" } },
};

// Payload keeps these fields inside an unnamed tabs/row layout, so walk the
// presentational containers (never into named arrays: the log's own
// `taskSlug` is a different field and keeps its label).
const plainJobFields = (fields: CollectionConfig["fields"]): CollectionConfig["fields"] =>
  fields.map((field) => {
    if (field.type === "tabs") return { ...field, tabs: field.tabs.map((tab) => ("name" in tab && tab.name ? tab : { ...tab, fields: plainJobFields(tab.fields) })) };
    if (field.type === "row" || field.type === "collapsible") return { ...field, fields: plainJobFields(field.fields) };
    if (!("name" in field) || !field.name || !(field.name in JOB_LABELS)) return field;
    const cell = JOB_CELLS[field.name];
    const admin = (field as { admin?: Record<string, unknown> }).admin ?? {};
    const components = (admin.components as Record<string, unknown> | undefined) ?? {};
    return {
      ...field,
      label: JOB_LABELS[field.name],
      admin: cell ? { ...admin, components: { ...components, Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: cell } } } : admin,
    } as typeof field;
  });

export const jobsCollectionOverrides = ({ defaultJobsCollection }: { defaultJobsCollection: CollectionConfig }): CollectionConfig => ({
  ...defaultJobsCollection,
  labels: { singular: "Background job", plural: "Background jobs" },
  fields: plainJobFields(defaultJobsCollection.fields),
  admin: {
    ...defaultJobsCollection.admin,
    group: "System",
    hidden: ({ user }) => roleOf({ user } as PayloadRequest) !== "admin",
    useAsTitle: "id",
    // Five columns that fit the page (the eighth, Created, was clipped); the rest are on the job itself.
    defaultColumns: ["taskSlug", "hasError", "totalTried", "completedAt", "createdAt"],
    hideAPIURL: true,
    description:
      "What the server did in the background: emails, payment checks, holds, reminders. A job that failed for good shows its error and a Retry button.",
    components: {
      ...defaultJobsCollection.admin?.components,
      // "Failed / Last hour / Everything" above the list: the every-minute checks would otherwise bury the failures.
      beforeListTable: ["@/cms/components/jobs/JobsViews#JobsViews"],
      edit: {
        ...defaultJobsCollection.admin?.components?.edit,
        beforeDocumentControls: [...(defaultJobsCollection.admin?.components?.edit?.beforeDocumentControls ?? []), RETRY_COMPONENT],
      },
    },
  },
  access: {
    ...defaultJobsCollection.access,
    read: isAdmin,
  },
  endpoints: [...(Array.isArray(defaultJobsCollection.endpoints) ? defaultJobsCollection.endpoints : []), retryEndpoint],
});
