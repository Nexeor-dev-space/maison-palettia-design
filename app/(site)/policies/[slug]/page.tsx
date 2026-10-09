import Link from "next/link";

import { groundShapes } from "@/components/motion/groundShapes";
import { PolicyBody } from "@/components/policies/PolicyBody";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { labelLines, loadTemplateCopy, policyCopy } from "@/components/blocks/templateCopy";
import { redirectOr404 } from "@/lib/cms/redirects";
import { getPolicies, getPolicyBySlug } from "@/lib/policies";
import { getMetadata } from "@/lib/seo";

/**
 * Every policy is known at build time and none of them changes between
 * requests, so all eight are static. Same device as /private-events/[slug].
 */
/*
  Every published policy is prerendered; one published after the build
  renders on its first request (`dynamicParams` defaults on) and the policies
  hook revalidates it from then on.
*/
export async function generateStaticParams() {
  return (await getPolicies()).map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug);
  if (!policy) return getMetadata({ title: "Policy", description: "Maison Palettia policies.", path: "/policies" });

  return getMetadata({
    title: policy.title,
    description: policy.summary,
    path: `/policies/${policy.slug}`,
  });
}

/* ==========================================================================
   TWO MARKS, AND THEY ARE IN THE MARGINS

   The column is 34rem and the band has no cap, so at 1440 there is about
   500px of clear White Rock down each side — more room than any other page
   on this site gives a shape, which is why these are the only two rather
   than the four /faq carries. A policy page with marks every 300px down both
   gutters reads as a page trying to distract you from itself.

   `desktopOnly` SHRINKS rather than hides — see <SectionShapes> — so a phone
   keeps them at 72% and the page is not bare below lg.
   ========================================================================== */
const POLICY_SHAPES: readonly ShapePlan[] = groundShapes("cream");

/**
 * One policy.
 *
 * ==========================================================================
 * THE SAME THREE GROUNDS AS EVERY OTHER PAGE, IN THE SAME ORDER
 * ==========================================================================
 *
 * Light Sage banner, White Rock body, Deep Lilac close. /faq, /about,
 * /locations and /private-events all run exactly this, and a policy page
 * that invented a fourth arrangement would be the generic legal page the
 * brief asked these not to be — the tell is never the typeface, it is that
 * the page stops belonging to the site.
 *
 * The body is White Rock rather than the sage /faq uses, because the one
 * object inside a policy — the callout — is Light Sage, and a sage card on a
 * sage field is 1.03:1 and not a card at all. The two neutrals swap, which is
 * what <PartnerPlate> documents at length.
 *
 * THE TITLE IS SET IN THE SCRIPT LIKE EVERY OTHER PAGE TITLE, broken into
 * two lines by hand. `lines` is why: a policy's name is two or three words
 * and the face is wide, so left to the measure "Cancellation & Rescheduling"
 * breaks after the ampersand and reads as a fragment.
 */
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug);
  // A renamed policy's old address redirects; anything else is the 404.
  if (!policy) return redirectOr404(`/policies/${slug}`);

  await loadTemplateCopy();
  const copy = policyCopy();

  return (
    <>
      {/* ---- the banner ------------------------------------------------- */}
      <section
        aria-labelledby="policy-title"
        className="relative isolate overflow-clip bg-sage pb-[3rem] pt-[4rem] md:pb-[3.5rem] md:pt-[5.5rem]"
      >
        <SectionShapes plan={groundShapes("sage")} />
        <span
          aria-hidden
          className="pointer-lift pointer-events-none absolute -right-6 top-[16%] deco-mark w-24 -rotate-12 xl:w-28"
          style={{ "--ax": 0.9, "--lift": 0.18 } as React.CSSProperties}
        >
          <DoodleMark name="bean" color={INK.lavender} treatment="draw" delay={420} depth={16} />
        </span>

        <Container className="relative">
          {/*
            THE CRUMB IS A REAL ONE. A policy is the page people land on from
            a footer link three pages deep into a booking, so "all policies"
            has to be reachable without the browser's back button — and it is
            the only navigation this page needs.
          */}
          <Reveal>
            <Link
              href="/policies"
              className="group inline-flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text/75 transition-colors duration-300 ease-soft hover:text-text"
            >
              <span
                aria-hidden
                className="transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
              >
                &#8592;
              </span>
              {copy.backLabel}
            </Link>
          </Reveal>

          <div className="mt-7 grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
              <Reveal>
                <Eyebrow>{copy.eyebrow}</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="policy-title"
                className="mt-8 md:mt-10"
                lines={titleLines(policy.title)}
              />
            </div>

            <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-3">
              {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
              <p className="text-statement text-text/85">{policy.summary}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---- the policy -------------------------------------------------- */}
      <section
        aria-label={policy.title}
        className="relative isolate overflow-clip bg-cream pb-[4rem] pt-[3rem] md:pb-section md:pt-[4rem] lg:pb-section-lg"
      >
        <SectionShapes plan={POLICY_SHAPES} />

        <Container className="relative">
          <PolicyBody sections={policy.sections} />
        </Container>
      </section>

      {/* ---- the way on -------------------------------------------------- */}
      <section
        aria-labelledby="policy-close"
        className="relative isolate overflow-clip bg-primary py-[4.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
      >
        <SectionShapes plan={groundShapes("lilac")} />
        <Container className="text-center">
          <div className="mx-auto max-w-[44rem]">
            <DisplayHeading id="policy-close" ground="lilac" lines={labelLines(copy.closeHeading)} />

            <Reveal delay={0.2}>
              <p className="mx-auto mt-7 max-w-[40ch] text-lead text-surface">{copy.closeBody}</p>
            </Reveal>

            <Reveal delay={0.3}>
              {/*
                TWO DOORS, AND THE SECOND IS THE ONE THIS PAGE OWES. A reader
                who opened the cancellation policy almost always wants one
                other policy next, and the footer is a long scroll away on a
                phone.
              */}
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <BlobButton href="/contact" tone="cream" className="min-h-[3.25rem] px-7">
                  {copy.closeCta}
                </BlobButton>
                <PeelNote href="/policies" className="min-h-[3.25rem] px-7">
                  {copy.backLabel}
                </PeelNote>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * The title, broken for the display face.
 *
 * Two lines where the name has a natural hinge — an ampersand, or a leading
 * article — and one line otherwise. It is a function rather than another
 * field on {@link Policy} because it is a TYPESETTING decision about this
 * page's measure, and lib/policies.ts is content: a second site rendering
 * the same policies at a different width would break them somewhere else.
 */
function titleLines(title: string): readonly string[] {
  const amp = title.indexOf(" & ");
  if (amp > 0) return [title.slice(0, amp + 2), title.slice(amp + 3)];

  const words = title.split(" ");
  if (words.length < 3) return [title];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}
