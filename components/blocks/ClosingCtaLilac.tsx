import { CLOSING_LAUNCH, ClosingCta, type ClosingVariant } from "@/components/sections/ClosingCta";

import { cta, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `closingCtaLilac` → <ClosingCta> (SPEC §E.1). One block, six pages.
 *
 * The page decides the composition (see the note at the top of
 * components/sections/ClosingCta.tsx); the block decides the words and the
 * buttons. A landing page that is not one of the six takes the /about close.
 */
const VARIANT_BY_PAGE: Record<string, ClosingVariant> = {
  about: "about",
  gallery: "gallery",
  faq: "faq",
  policies: "policies",
  "private-events": "privateEvents",
  contact: "contact",
};

export function ClosingCtaLilacAdapter({ block, ctx }: AdapterProps<"closingCtaLilac">) {
  const variant = VARIANT_BY_PAGE[ctx.page] ?? "about";
  const b = stored(block);
  if (!b) return <ClosingCta variant={variant} {...CLOSING_LAUNCH[variant]} />;

  return (
    <ClosingCta
      variant={variant}
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      body={text(b.body)}
      primary={cta(b.primaryCta)}
      secondary={cta(b.secondaryCta)}
    />
  );
}
