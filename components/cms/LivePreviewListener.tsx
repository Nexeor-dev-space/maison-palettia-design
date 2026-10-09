"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

/**
 * ==========================================================================
 * Live preview: re-render this page every time the admin saves (SPEC §G.5)
 * ==========================================================================
 *
 * Mounted by app/(site)/layout.tsx only while Next's draft mode is on — the
 * public site never ships it. Inside the admin's live-preview iframe it tells
 * the admin it is ready, then listens for Payload's "document saved" message
 * (every save and every autosave tick of a draft) and answers with
 * `router.refresh()`: the server components re-run, the getters read the
 * latest draft, and the iframe shows it without a reload or a lost scroll.
 *
 * WHY REFRESH AND NOT MERGE. Payload can also stream the unsaved form into the
 * page (`useLivePreview`), but that needs every component to render from the
 * raw document client-side. Here the CMS supplies data to server components
 * that already map it (components/blocks/*); a server refresh after each
 * autosave (1.5 s, `contentDrafts`) keeps one rendering path for preview and
 * production.
 *
 * `serverURL` is the admin's origin. Payload runs in this process, so it is
 * this page's own origin — read in the browser, where messages are checked
 * against it, rather than configured.
 */
export function LivePreviewListener() {
  const router = useRouter();
  // The browser's answer after hydration, null during the server render.
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => null);

  if (!origin) return null;
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />;
}

const noop = () => () => {};
