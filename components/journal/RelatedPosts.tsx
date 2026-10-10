import { JOURNAL_COPY } from "@/components/journal/copy";
import { PostCard } from "@/components/journal/PostCard";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { JOURNAL_PATH, type JournalPostCard } from "@/lib/cms/journalShared";

/** Three more stories under a story — the editor's picks, else the category's, else the newest. On Light Sage, the brand field. */
export function RelatedPosts({ posts }: { posts: readonly JournalPostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-labelledby="journal-related"
      className="relative isolate overflow-clip bg-sage py-[4rem] md:py-section"
    >
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <Reveal>
              <Eyebrow>{JOURNAL_COPY.readNextEyebrow}</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="journal-related"
              size="compact"
              className="mt-6"
              lines={JOURNAL_COPY.readNextLines}
            />
          </div>
          <Reveal delay={0.1}>
            <PeelNote href={JOURNAL_PATH} className="min-h-[3.25rem] px-6">
              {JOURNAL_COPY.backToJournal}
            </PeelNote>
          </Reveal>
        </div>

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
      </Container>
    </section>
  );
}
