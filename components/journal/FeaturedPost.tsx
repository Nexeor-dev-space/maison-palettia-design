import Image from "next/image";
import Link from "next/link";

import { JOURNAL_COPY, readingLabel } from "@/components/journal/copy";
import { CategoryChip } from "@/components/journal/CategoryChip";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow } from "@/components/ui/SectionHeader";
import {
  JOURNAL_CHIP_TOKENS,
  formatJournalDate,
  type JournalPostCard,
} from "@/lib/cms/journalShared";

/**
 * The story the editor ticked "feature": one White Rock plate at the top
 * of the Journal, the cover large on the left and the words beside it.
 *
 * The photograph sits in its own tilted frame on the plate with a dab of
 * the category's paint under one corner and a cut-out on the other — the
 * deck's way of laying a picture on paper, the same devices the gallery
 * masthead and the location plates use. The title is Montserrat at the
 * h2 size: a headline can hold a number, and the script cannot.
 *
 * THREE WAYS IN, ONE TAB STOP FOR THE WORDS. The photograph, the title and
 * the button all go to the story. The title is the accessible link; the
 * picture's link is taken out of the tab order so a keyboard does not land
 * on the same story three times in a row.
 */
export function FeaturedPost({ post }: { post: JournalPostCard }) {
  const paint = post.category
    ? JOURNAL_CHIP_TOKENS[post.category.colour].bg
    : INK.lilac;

  return (
    <Container
      as="section"
      aria-labelledby="journal-featured"
      className="relative"
    >
      <Reveal variant="fadeIn">
        <article className="plate relative isolate overflow-visible rounded-[1.75rem] bg-cream px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="grid grid-cols-12 items-center gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="relative col-span-12 lg:col-span-7">
              <Link
                href={post.href}
                tabIndex={-1}
                aria-hidden="true"
                className="group block focus-visible:outline-none"
              >
                <span className="plate relative block aspect-[4/3] w-full overflow-clip rounded-[1.25rem] bg-surface rotate-[-1deg] transition-transform duration-500 ease-editorial motion-safe:group-hover:rotate-0">
                  <Image
                    src={post.coverImage.src}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 54vw, 92vw"
                    style={{
                      objectPosition: post.coverImage.position ?? "50% 50%",
                    }}
                    className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.03]"
                  />
                </span>
              </Link>

              {/* The paint under the corner: the category's own ink, laid as a brush dab. Decorative. */}
              <span
                aria-hidden
                className="dab pointer-events-none absolute -bottom-5 -left-5 -z-10 h-8 w-36 sm:-bottom-6 sm:-left-7 sm:h-10 sm:w-48"
                style={
                  { "--paint": paint, "--tilt": "-3deg" } as React.CSSProperties
                }
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-5 deco-mark w-[3.5rem] rotate-[10deg] sm:-right-5 sm:w-[4.5rem]"
              >
                <DoodleMark
                  name="splash"
                  color={INK.terracotta}
                  treatment="draw"
                  delay={260}
                />
              </span>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <Eyebrow>{JOURNAL_COPY.featuredEyebrow}</Eyebrow>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-fine text-text/75">
                {post.category ? (
                  <CategoryChip
                    category={post.category}
                    href={post.category.href}
                  />
                ) : null}
                <time dateTime={post.publishedAt}>
                  {formatJournalDate(post.publishedAt)}
                </time>
              </div>

              <h2
                id="journal-featured"
                className="mt-4 text-h2 font-semibold tracking-display text-text [overflow-wrap:anywhere]"
              >
                <Link
                  href={post.href}
                  className="transition-colors duration-300 ease-soft hover:text-primary focus-visible:text-primary"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="mt-4 text-lead text-text/85">{post.excerpt}</p>

              <p className="mt-5 text-fine text-text/75">
                {post.author.name}
                <span
                  aria-hidden
                  className="mx-2.5 inline-block h-1 w-1 translate-y-[-0.2em] rounded-pill bg-terracotta"
                />
                {readingLabel(post.readingTime)}
              </p>

              <BlobButton
                href={post.href}
                className="mt-8 min-h-[3.25rem] px-7"
              >
                {JOURNAL_COPY.readStory}
              </BlobButton>
            </div>
          </div>
        </article>
      </Reveal>
    </Container>
  );
}
