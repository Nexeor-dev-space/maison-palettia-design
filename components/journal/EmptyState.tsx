import { JOURNAL_COPY } from "@/components/journal/copy";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";

/**
 * The Journal before its first story — and a category with none yet.
 *
 * A teaching empty state rather than a blank: the brand's cut-outs drawn
 * in beside a script line that says what is coming, and the two doors a
 * visitor came for anyway. Same composition as the site's 404
 * (app/(site)/not-found.tsx) — the heading and its line side by side on
 * the baseline — so it reads as the site's own page, not an error.
 */
export function EmptyState({ categoryName }: { categoryName?: string | null }) {
  const copy = JOURNAL_COPY.empty;
  return (
    <Container
      as="section"
      aria-labelledby="journal-empty"
      className="relative"
    >
      <div className="plate relative isolate overflow-clip rounded-[1.75rem] bg-cream px-6 py-12 sm:px-10 md:py-16 lg:px-14">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-6 deco-mark w-[5.5rem] rotate-[-12deg] md:w-[7rem]"
        >
          <DoodleMark
            name="starburst"
            color={INK.lavender}
            treatment="draw"
            delay={200}
          />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-5 right-[6%] deco-mark w-[4.5rem] rotate-[8deg] md:w-[6rem]"
        >
          <DoodleMark
            name="splash"
            color={INK.terracotta}
            treatment="draw"
            delay={420}
          />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[22%] top-6 hidden deco-mark w-[3rem] rotate-[16deg] md:block"
        >
          <DoodleMark
            name="coral"
            color={INK.lilac}
            treatment="draw"
            delay={560}
          />
        </span>

        <div className="relative grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>{categoryName ?? copy.eyebrow}</Eyebrow>
            </Reveal>
            <DisplayHeading
              as="h2"
              id="journal-empty"
              size="compact"
              className="mt-6 md:mt-8"
              lines={copy.lines}
            />
          </div>
          <div className="col-span-12 lg:col-span-5 lg:pb-2">
            <Reveal delay={0.15}>
              <p className="text-lead text-text/85">
                {categoryName ? copy.categoryBody : copy.body}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <BlobButton
                  href={copy.cta.href}
                  className="min-h-[3.25rem] px-7"
                >
                  {copy.cta.label}
                </BlobButton>
                {categoryName ? (
                  <PeelNote
                    href={copy.secondary.href}
                    className="min-h-[3.25rem] px-7"
                  >
                    {copy.secondary.label}
                  </PeelNote>
                ) : null}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Container>
  );
}
