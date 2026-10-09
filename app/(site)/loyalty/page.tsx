import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";
import { PASSES_CONFIGURED } from "@/lib/passes";

/*
  ======================================================================
  OUT OF THE INDEX FOR EXACTLY AS LONG AS THE PRICES ARE INVENTED
  ======================================================================

  lib/passes.ts marks its own catalogue "PLACEHOLDER CONTENT — DEVELOPMENT
  ONLY ... the names, the prices, the session counts and the validity
  periods are invented ... nothing here has been agreed with the studio",
  and this page was being served `index, follow`. A search engine was free
  to take AED 320, 1,400 and 2,600 off it and show them beside the
  studio's name, on figures nobody has agreed to.

  The page itself stays. The client asked for passes to come out of the
  footer — see FOOTER_NAV — and that is their call, not something to
  quietly undo; this only stops a page nothing links to being found by a
  route nobody chose.

  TIED TO THE FLAG RATHER THAN SET BY HAND, so it lifts itself: the day
  `PASSES_CONFIGURED` turns true the real catalogue is in and the page
  goes back into the index with it. (An editor can also hide the page from
  its SEO tab; either is enough.)
*/
export function generateMetadata() {
  return pageMetadata("loyalty", {
    title: "Passes",
    description: "Maison Palettia passes: hold your sessions in advance and check out as a guest.",
    path: "/loyalty",
    noindex: !PASSES_CONFIGURED,
  });
}

/**
 * The loyalty page — choose a pass, add it to the booking, check out.
 *
 * The page is the `loyalty` document's blocks (SPEC §E.1): the passes, then
 * how it works — components/sections/loyalty/LoyaltySections.tsx, where the
 * reasoning for its commercial shape now lives.
 */
export default function LoyaltyPage() {
  return <FixedPage slug="loyalty" />;
}
