import { cache } from "react";

import { WhereWeSetUp } from "@/components/events/WhereWeSetUp";
import { EventsBody, type EventsDoor } from "@/components/sections/events/EventsBody";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import { getAllWorkshops, serverClock } from "@/lib/workshops";

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
  const [experiences, workshops, partners] = await Promise.all([
    getCreativeExperiences(),
    getAllWorkshops(),
    getMallPartners(),
  ]);
  return { experiences, sessions: workshops.filter((w) => w.kind !== "diy"), partners };
}

/** A door's note: the first or second Brand wording journey step, or the block's own. */
function doorNote(source: "journey0" | "journey1" | "custom", own: string | null | undefined, ctx: BlockContext) {
  if (source === "custom") return text(own);
  const step = ctx.brand?.journey?.[source === "journey0" ? 0 : 1];
  return step ? text(step.description) : null;
}

/** `eventsBrowser` (+ the `pageHeader` before it) → <EventsBody> + <EventsBrowser>. */
export async function EventsBrowserAdapter({ block, ctx, header }: AdapterProps<"eventsBrowser">) {
  const [{ experiences, sessions, partners }, renderedAt] = await Promise.all([programme(), renderClock()]);
  const words = headerWords(header, ctx);
  const b = stored(block);

  const doors: EventsDoor[] | undefined = b
    ? (b.doors ?? []).map((door) => ({
        title: door.title,
        note: doorNote(door.noteSource, door.note, ctx),
        modeLabel: text(door.modeLabel),
      }))
    : undefined;

  return (
    <EventsBody
      experiences={experiences}
      sessions={sessions}
      partners={partners}
      renderedAt={renderedAt}
      eyebrow={words.eyebrow}
      lines={words.lines}
      doors={doors}
      groupLeads={b ? { diy: text(b.groupLeads?.diy), scheduled: text(b.groupLeads?.scheduled) } : undefined}
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
