import { EnquiryLayout } from "@/components/sections/private-events/EnquiryLayout";
import { getCreativeExperiences } from "@/lib/experiences";

import { imageOf, stored, text } from "./helpers";
import { headerWords } from "./PageHeader";
import { brandSteps } from "./Steps";
import type { AdapterProps } from "./types";

/**
 * `enquiryForm` (+ the `pageHeader` before it) → <EnquiryLayout> +
 * <PrivateEventEnquiry> (SPEC §E.1).
 *
 * The header is the form's intro column; the card's face is the header's
 * side picture (the launch photograph when none is picked) over the
 * "what happens next" steps — Brand wording's private-event steps unless the
 * block writes its own. The form's labels, note and success copy are
 * <PrivateEventEnquiry>'s until Phase 3 rebuilds it around the enquiry
 * inbox (SPEC §L, 3F) and reads them from this block.
 */
export async function EnquiryFormAdapter({ block, ctx, header }: AdapterProps<"enquiryForm">) {
  /*
    The studio's own approved list, which is also what /private-events shows.
    One source, so the select can never offer something the page before it did
    not, and a new activity reaches both surfaces with no edit here.

    The client's own flag travels with the name where there is one. Dropping
    "Glass painting" from the list would hide an activity the studio wants
    known about; offering it unmarked would imply it can be had next month. The
    flag in the label is the only version of this that is true.
  */
  const activities = (await getCreativeExperiences()).map((experience) =>
    experience.status ? `${experience.name} (${experience.status})` : experience.name,
  );

  const words = headerWords(header, ctx);
  const h = header ? stored(header) : null;
  const b = stored(block);
  const sidebar = b?.sidebarSteps;
  const steps =
    sidebar?.source === "custom"
      ? (sidebar.steps ?? []).map((step) => ({ title: step.title, detail: step.detail }))
      : (brandSteps(ctx) ?? undefined);

  return (
    <EnquiryLayout
      activities={activities}
      eyebrow={words.eyebrow}
      heading={words.lines.join(" ")}
      lead={words.standfirst}
      image={h ? (imageOf(h.sideImage) ?? undefined) : undefined}
      stepsHeading={b ? text(sidebar?.heading) : undefined}
      steps={steps}
    />
  );
}
