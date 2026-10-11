import { JOURNAL_COPY } from "@/components/journal/copy";
import { PostCard } from "@/components/journal/PostCard";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getLatestPosts, listPosts } from "@/lib/cms/journal";
import type { PostCategory } from "@/payload-types";

import { cta, doc, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `latestJournal` → the newest stories as cards (cms/blocks/LatestJournal.ts).
 *
 * The data is the Journal's own getters, cached under its tags, so a
 * publish refreshes every page carrying this block (the posts hook lists
 * "/" among its paths for exactly this). Nothing is drawn on the public
 * site while the Journal is empty; in draft mode the editor is told why
 * their new block shows no cards.
 *
 * The heading and the button fall back to the house wording when the
 * editor leaves them empty — the one departure from "cleared means
 * nothing" (./helpers.ts), because a row of cards with no heading is not
 * a section.
 */
export async function LatestJournalAdapter({
  block,
  ctx,
}: AdapterProps<"latestJournal">) {
  const b = stored(block);
  const limit = Math.min(6, Math.max(1, b?.limit ?? 3));
  const category = b ? doc<PostCategory>(b.category)?.slug : undefined;
  const posts = category
    ? (await listPosts({ page: 1, perPage: limit, category })).posts
    : await getLatestPosts(limit);
  if (posts.length === 0 && !ctx.draft) return null;

  const eyebrowText = b ? text(b.eyebrow) : JOURNAL_COPY.block.eyebrow;
  const headingLines =
    (b ? lines(b.headingLines) : null) ?? JOURNAL_COPY.block.lines;
  const leadText = b ? text(b.lead) : null;
  const action = (b ? cta(b.cta) : null) ?? JOURNAL_COPY.block.cta;
  const id = `latest-journal-${block.id ?? "launch"}`;

  return (
    <section
      aria-labelledby={id}
      className="relative isolate overflow-clip bg-surface py-[4rem] md:py-section"
    >
      <SectionShapes plan={groundShapes("surface", { count: 4 })} />
      <Container className="relative">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            {eyebrowText ? (
              <Reveal>
                <Eyebrow>{eyebrowText}</Eyebrow>
              </Reveal>
            ) : null}
            <DisplayHeading
              id={id}
              size="compact"
              className={eyebrowText ? "mt-6" : undefined}
              lines={headingLines}
            />
          </div>
          <div className="col-span-12 lg:col-span-5 lg:pb-2">
            <Reveal delay={0.15}>
              {leadText ? (
                <p className="text-lead text-text/85">{leadText}</p>
              ) : null}
              {action ? (
                <PeelNote
                  href={action.href}
                  className={
                    leadText
                      ? "mt-6 min-h-[3.25rem] px-6"
                      : "min-h-[3.25rem] px-6"
                  }
                >
                  {action.label}
                </PeelNote>
              ) : null}
            </Reveal>
          </div>
        </div>

        {posts.length > 0 ? (
          <Stagger
            as="ul"
            className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10"
          >
            {posts.map((post, i) => (
              <Reveal as="li" key={post.slug} className="min-w-0">
                <PostCard
                  post={post}
                  index={i}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                />
              </Reveal>
            ))}
          </Stagger>
        ) : (
          <p className="mt-10 text-body text-text/75">
            No published stories yet — this section appears on the site once the
            first one is live.
          </p>
        )}
      </Container>
    </section>
  );
}
