import { cache } from "react";

import { WhereWeSetUp } from "@/components/events/WhereWeSetUp";
import { eventCopy, loadTemplateCopy } from "@/components/blocks/templateCopy";
import { EventsBody, type EventsDoor } from "@/components/sections/events/EventsBody";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { getModeCopy } from "@/lib/modeCopy.server";
import { getMallPartners } from "@/lib/partners";
import { getVibes } from "@/lib/vibes.server";
import { getAllWorkshops, serverClock } from "@/lib/workshops";
import { getWorkshopTypes } from "@/lib/workshopTypes";

import { cta, stored, text } from "./helpers";
import { headerWords } from "./PageHeader";
import type { AdapterProps, BlockContext } from "./types";

/**
 * The /events blocks (SPEC §E.1). The programme itself — the walk-in
 * activities and the dated sessions — is the data layer's; the blocks hold
 * the page's words.
 *
 * ONE CLOCK FOR THE WHOLE RENDER. Every date verdict on the page — each
 * card's "Date passed" and the "Next" line in <WhereWeSetUp> — must be taken
 * against one instant, so no two of them disagree about the same session.
 * The two blocks are separate adapters, so the clock is read once per render
 * through React's request-scoped `cache` (see `renderClock`).
 */

/** The programme, read once per render for both blocks. */
async function programme() {
  const [experiences, workshops, types, partners, vibes] = await Promise.all([
    getCreativeExperiences(),
    getAllWorkshops(),
    getWorkshopTypes(),
    getMallPartners(),
    getVibes(),
  ]);
  return { experiences, sessions: workshops.filter((w) => w.kind !== "diy"), types, partners, vibes };
}

/** A door's note: the first or second Brand wording journey step, or the block's own. */
function doorNote(source: "journey0" | "journey1" | "custom", own: string | null | undefined, ctx: BlockContext) {
  if (source === "custom") return text(own);
  const step = ctx.brand?.journey?.[source === "journey0" ? 0 : 1];
  return step ? text(step.description) : null;
}

/** `eventsBrowser` (+ the `pageHeader` before it) → <EventsBody> + <EventsBrowser>. */
export async function EventsBrowserAdapter({ block, ctx, header }: AdapterProps<"eventsBrowser">) {
  /* The Page labels, for the "per person" a format card prints — loaded here as the event template does. */
  const [{ experiences, sessions, types, partners, vibes }, renderedAt, , modes] = await Promise.all([
    programme(),
    renderClock(),
    loadTemplateCopy(),
    getModeCopy(),
  ]);
  const { labels } = modes;
  const words = headerWords(header, ctx);
  const b = stored(block);

  /* The names, chips and leads are Mode labels' (cms/blocks/EventsBrowser.ts); the block keeps the notes. */
  const doors: EventsDoor[] = [
    { title: labels.createAnytime, modeLabel: labels.noBooking },
    { title: labels.createTogether, modeLabel: labels.bookedOnline },
  ].map((door, i) => {
    const own = b?.doors?.[i];
    return { ...door, note: own ? doorNote(own.noteSource, own.note, ctx) : (ctx.brand?.journey?.[i]?.description ?? WORKSHOP_JOURNEY[i]?.description ?? null) };
  });

  return (
    <EventsBody
      experiences={experiences}
      sessions={sessions}
      types={types}
      partners={partners}
      vibes={vibes}
      renderedAt={renderedAt}
      perPersonLabel={eventCopy().perPersonLabel}
      eyebrow={words.eyebrow}
      lines={words.lines}
      doors={doors}
      groupLeads={{ diy: labels.diyLine, scheduled: labels.scheduledLine }}
      viewLocationLabel={b ? text(b.viewLocationLabel) : undefined}
      emptyTitle={b ? text(b.emptyTitle) : undefined}
      emptyBody={b ? text(b.emptyBody) : undefined}
    />
  );
}

/** `whereWeSetUp` → <WhereWeSetUp>: the venues with an upcoming session, and the next date at each. */
export async function WhereWeSetUpAdapter({ block, ctx }: AdapterProps<"whereWeSetUp">) {
  const [{ sessions }, renderedAt] = await Promise.all([programme(), renderClock()]);
  const b = stored(block);
  if (!b) return <WhereWeSetUp workshops={sessions} renderedAt={renderedAt} />;

  const lead = b.useFindUsLine !== false ? (ctx.brand ? text(ctx.brand.findUsLine) : undefined) : text(b.lead);
  return (
    <WhereWeSetUp
      workshops={sessions}
      renderedAt={renderedAt}
      eyebrow={text(b.eyebrow)}
      heading={text(b.heading)}
      lead={lead}
      nextLabelTemplate={text(b.nextLabelTemplate) ?? undefined}
      cta={cta(b.cta)}
    />
  );
}

/*
  `serverClock()` once per request: React's `cache` memoises per render, so
  both adapters (and anything else on the page that asks) get one instant.
*/
const renderClock = cache(async () => serverClock());
