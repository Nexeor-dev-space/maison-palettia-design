import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

/*
  THE DESCRIPTION IS THE CLIENT'S OWN SENTENCE, verbatim: the first sentence
  of their p.24 rewrite, which is the first sentence of BRAND_STORY and so the
  first thing the page itself says. It was "a creative lifestyle brand
  celebrating creativity, mindfulness…" — the wording that rewrite retired —
  so search results and shared links (one string feeds the meta, Open Graph
  and Twitter descriptions; see buildMetadata) still described the brand the
  old way. One sentence rather than the paragraph: the paragraph runs to 250
  characters and a result shows about 155. An SEO description written in the
  admin replaces it.
*/
export function generateMetadata() {
  return pageMetadata("about", {
    title: "About",
    description:
      "Maison Palettia is a creative space built for slowing down, switching off and getting your hands busy.",
    path: "/about",
  });
}

/**
 * /about — who the Maison is, in the order its own deck tells it.
 *
 * The page is the `about` document's blocks (SPEC §E.1) — welcome, purpose,
 * community, what sets it apart, the Deep Lilac close — drawn by the sections
 * in components/sections/about/AboutSections.tsx and
 * components/sections/ClosingCta.tsx. The design notes for each section
 * moved there with it.
 *
 * <LittleCreators /> HAS MOVED ON TO /private-events, at the client's ask,
 * and it has now been on three pages: the home page first, here second, and
 * the private events page third — tailored children's activities are
 * something a client books for a birthday or a school, which is the question
 * that page answers.
 */
export default function AboutPage() {
  return <FixedPage slug="about" />;
}
