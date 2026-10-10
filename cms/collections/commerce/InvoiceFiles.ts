import path from "node:path";

import type { CollectionConfig } from "payload";

import { isAdmin, isStaff, systemOnly } from "@/cms/access/roles";
import { PRIVATE_DIR } from "@/cms/lib/paths";

import { sidebarFor, systemField } from "./shared";

/**
 * ==========================================================================
 * invoice-files — the invoice PDFs, on the private disk (SPEC §D.3)
 * ==========================================================================
 *
 * A separate upload collection rather than `media` because these files must
 * NEVER be reachable by URL. `staticDir` is `<repo>/private/invoices`
 * (cms/lib/paths.ts, outside the build output, backed up with the
 * database), `access.read` is staff-only, so `/api/invoice-files/file/…`
 * answers 403 to a customer — and there is deliberately no file-serving
 * handler for a signed URL on this collection: Payload's `checkFileAccess`
 * runs before any handler, so one could never work (verified, §D.3; the §K
 * CI gate greps for it). The only customer download path is
 * `app/(site)/api/site/invoices/[id]/pdf/route.ts`, which verifies `sig`/`exp`
 * and streams the file from disk itself (§H.7).
 *
 * Rows are written by `generate-invoice-pdf`; admins may delete one to force
 * a regeneration. No image sizes, no crop, no focal point: these are PDFs.
 */

export const INVOICE_FILES_DIR = path.join(PRIVATE_DIR, "invoices");

export const InvoiceFiles: CollectionConfig = {
  slug: "invoice-files",
  labels: { singular: "Invoice PDF", plural: "Invoice PDFs" },
  admin: {
    // 4B review: internal bookkeeping lives in the admin-only "System" group, last in the sidebar.
    group: "System",
    useAsTitle: "filename",
    defaultColumns: ["filename", "invoice", "filesize", "createdAt"],
    description: "Generated invoice and credit-note PDFs. Stored privately; customers receive them by email or a signed link.",
    hidden: sidebarFor("admin"),
    listSearchableFields: ["filename"],
  },
  access: {
    read: isStaff,
    create: systemOnly,
    update: systemOnly,
    delete: isAdmin,
  },
  upload: {
    staticDir: INVOICE_FILES_DIR,
    mimeTypes: ["application/pdf"],
    crop: false,
    focalPoint: false,
    pasteURL: false,
    // Keep the generated filename as-is; a second PDF for the same invoice replaces the row, not the name.
    filesRequiredOnCreate: true,
  },
  fields: [
    systemField({
      name: "invoice",
      type: "relationship",
      relationTo: "invoices",
      label: "Invoice",
      index: true,
      admin: { description: "The document this PDF renders." },
    }),
  ],
};
