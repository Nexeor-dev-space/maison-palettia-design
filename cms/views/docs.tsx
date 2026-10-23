import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { notFound, redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import React from "react";

import { roleOf } from "@/cms/access/roles";
import { ASSET_BASE } from "@/cms/components/docs/Blocks";
import { DocsChapter, DocsHome } from "@/cms/components/docs/DocsPages";
import { DocsPrint } from "@/cms/components/docs/DocsPrint";
import { DocsShell, type TocChapter } from "@/cms/components/docs/DocsShell";
import { Lightbox } from "@/cms/components/docs/Lightbox";
import { GUIDE_PDF_NAME, pdfInfo } from "@/cms/lib/docs/files";
import { chapterBySlug, chapterNum, chapterLabel, chapters, front, searchIndex, warnGuideProblemsOnce } from "@/cms/lib/docs/guide";

import "@/cms/components/docs/docs.scss";

/**
 * ==========================================================================
 * /admin/docs — the owner's guide, inside the admin (signed-in staff only)
 * ==========================================================================
 *
 *   /admin/docs            welcome, how to read, the chapter cards
 *   /admin/docs/<slug>     one chapter (deep links: /admin/docs/orders#refund)
 *   /admin/docs/print      every chapter on A4 pages — the PDF is printed from it
 *
 * One custom view (`admin.components.views.docs`, `exact: false`) answers all
 * three and reads the rest of the address from `params.segments`.
 *
 * Like /admin/check-in and /admin/analytics, Payload renders a custom view
 * without its login redirect (`isCustomAdminView`, @payloadcms/next 3.90),
 * so this component sends signed-out visitors to the login page and back.
 * The screenshots, the PDF and the search index come from
 * /admin-docs/… (app/(payload)/admin-docs/[...path]/route.ts), which checks
 * the sign-in again on every request.
 *
 * The content is typed data in docs/admin-guide/content; nothing here is
 * stored in the database.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const fmtSize = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** A short fingerprint of the search index, so the browser refetches it after a deploy that changes the guide. */
let indexVersion: string | null = null;
function versionOfIndex(): string {
  if (indexVersion) return indexVersion;
  const json = JSON.stringify(searchIndex());
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  indexVersion = (h >>> 0).toString(36);
  return indexVersion;
}

export async function DocsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult;
  const { routes, admin } = req.payload.config;
  const base = `${routes.admin}/docs`;
  const segments = ((params as { segments?: string[] } | undefined)?.segments ?? []).slice(1);
  const here = segments.length ? `${base}/${segments.join("/")}` : base;

  if (!req.user || !roleOf(req)) {
    redirect(`${routes.admin}${admin.routes.login}?redirect=${encodeURIComponent(here)}`);
  }

  warnGuideProblemsOnce((problems) => req.payload.logger.warn({ msg: `admin guide: ${problems.length} content problem(s)`, problems }));

  const info = pdfInfo();
  const pdf = info ? { href: `${ASSET_BASE}/${GUIDE_PDF_NAME}?download`, size: fmtSize(info.bytes), built: fmtDate(info.built) } : null;

  if (segments.length === 1 && segments[0] === "print") {
    return <DocsPrint edition={front.edition} cover="02-dashboard-overview.webp" />;
  }

  const chapter = segments.length === 1 ? chapterBySlug(segments[0]) : undefined;
  if (segments.length > 1 || (segments.length === 1 && !chapter)) notFound();

  const toc: TocChapter[] = chapters.map((c) => ({
    slug: c.slug,
    num: chapterNum(c),
    label: chapterLabel(c),
    title: c.title,
    sections: c.sections.map((s) => ({ id: s.id, title: s.title })),
  }));

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <DocsShell toc={toc} current={chapter?.slug ?? null} base={base} indexUrl={`${ASSET_BASE}/search-index.json?v=${versionOfIndex()}`} pdfHref={pdf?.href ?? null}>
          {chapter ? <DocsChapter chapter={chapter} base={base} checklistKey={String(req.user?.id ?? "anon")} /> : <DocsHome base={base} pdf={pdf} />}
        </DocsShell>
        <Lightbox />
      </Gutter>
    </DefaultTemplate>
  );
}
