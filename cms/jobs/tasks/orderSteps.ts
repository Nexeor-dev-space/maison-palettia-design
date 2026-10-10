import { issueInvoice, issueTickets, renderInvoicePdf } from "@/cms/lib/contracts";

import { defineTask, idOf } from "../shared";

/**
 * ==========================================================================
 * The three document steps of a confirmed order (SPEC §H.7, §H.9)
 * ==========================================================================
 *
 * `issue-tickets`, `issue-invoice` and `generate-invoice-pdf` run as steps
 * of the `finalize-order` workflow, and can also be queued alone (an admin
 * "re-issue" action, the Retry button). Each one is idempotent — run it
 * twice and the second run changes nothing — because a workflow retry
 * re-runs any step that did not record success, and a crash can land
 * between "did the work" and "recorded success":
 *
 *   · tickets: `issueTickets` (3E) creates only the seats that have no
 *     ticket yet (§O: "idempotent");
 *   · invoice: `issueInvoice` (3A-1) returns the existing invoice for the
 *     order instead of numbering a second one — the gapless counter must
 *     never skip or double (§H.7);
 *   · PDF: skipped when the invoice already has a file; an orphan file from
 *     a crash between "stored the PDF" and "linked it" is re-linked rather
 *     than rendered again.
 *
 * Concurrency keys (§H.9): `order:<id>` for the first two — the same key as
 * `finalize-order`, so a stand-alone re-issue waits for a running finalize
 * instead of racing it. The PDF step only knows the invoice id (§O input
 * shape), so it keys on `invoice:<id>`; inside the workflow the job's
 * `order:` key already serialises it.
 */

const STEP_RETRIES = 3;

export const issueTicketsTask = defineTask({
  slug: "issue-tickets",
  label: "Issue tickets",
  retries: STEP_RETRIES,
  concurrency: ({ input }) => `order:${input.orderId}`,
  inputSchema: [{ name: "orderId", type: "text", required: true }],
  alert: "job",
  alertRefs: (input) => ({ order: input.orderId }),
  run: async ({ input, req }) => issueTickets(req, input.orderId),
});

export const issueInvoiceTask = defineTask({
  slug: "issue-invoice",
  label: "Issue invoice",
  retries: STEP_RETRIES,
  concurrency: ({ input }) => `order:${input.orderId}`,
  inputSchema: [{ name: "orderId", type: "text", required: true }],
  alert: "job",
  alertRefs: (input) => ({ order: input.orderId }),
  run: async ({ input, req }) => issueInvoice(req, input.orderId),
});

export const generateInvoicePdfTask = defineTask({
  slug: "generate-invoice-pdf",
  label: "Generate invoice PDF",
  retries: STEP_RETRIES,
  concurrency: ({ input }) => `invoice:${input.invoiceId}`,
  inputSchema: [{ name: "invoiceId", type: "text", required: true }],
  alert: "job",
  run: async ({ input, req }) => {
    const invoice = (await req.payload.findByID({ collection: "invoices", id: input.invoiceId, depth: 0, overrideAccess: true, req })) as {
      id: string;
      number: string;
      file?: unknown;
    };
    const existing = idOf(invoice.file);
    if (existing) return { fileId: existing, rendered: false };

    // A crash after storing the file but before linking it leaves an orphan; link it instead of rendering twice.
    const orphan = await req.payload.find({
      collection: "invoice-files",
      where: { invoice: { equals: invoice.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    let fileId = orphan.docs[0] ? String(orphan.docs[0].id) : null;
    let rendered = false;

    if (!fileId) {
      const pdf = await renderInvoicePdf(req, invoice.id);
      const created = await req.payload.create({
        collection: "invoice-files",
        data: { invoice: invoice.id },
        file: { data: pdf, mimetype: "application/pdf", name: `${invoice.number}.pdf`, size: pdf.length },
        overrideAccess: true,
        req,
      });
      fileId = String(created.id);
      rendered = true;
    }

    // `file` and `generatedAt` are the two fields an issued invoice may still
    // receive (the invoices immutability hook, 3A-1, must allow them).
    await req.payload.update({
      collection: "invoices",
      id: invoice.id,
      data: { file: fileId, generatedAt: new Date().toISOString() },
      overrideAccess: true,
      req,
      context: { invoiceDocumentAttach: true },
    });
    return { fileId, rendered };
  },
});
