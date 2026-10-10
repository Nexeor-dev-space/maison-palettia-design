import Image from "next/image";
import Link from "next/link";

import { JOURNAL_COPY, readingLabel } from "@/components/journal/copy";
import { CategoryChip } from "@/components/journal/CategoryChip";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import {
  JOURNAL_PATH,
  formatJournalDate,
  type JournalPost,
} from "@/lib/cms/journalShared";

/**
 * The top of a story: the trail it belongs to, its category, the title,
 * the excerpt as a standfirst, who wrote it and when, and the cover
 * across the full width under all of that.
 *
 * TITLE IN MONTSERRAT, NOT THE SCRIPT. A headline is the one display line
 * on the site an editor writes freely, and it may carry a number ("5
 * things…") — the script cannot set one. The h1 size from the ladder, with
 * the display tracking, so it is plainly the page's title without being
 * the brand's handwriting.
 *
 * THE COVER IS FULL-BLEED AND CAPPED. It runs gutter to gutter on a phone
 * and to the viewport's edge from `md`, cropped to a wide frame at its
 * focal point, and never taller than 70vh so the first paragraph is
 * always within a scroll. `priority`: it is the largest thing above the
 * fold.
 */
export function ArticleHeader({
  post,
  draft,
}: {
  post: JournalPost;
  draft: boolean;
}) {
  const cover = post.heroImage ?? post.coverImage;
  const attrs = (path: string) =>
    draft
      ? {
          "data-cms-path": path,
          "data-cms-doc": post.id,
          "data-cms-collection": "posts",
          "data-cms-type": path,
        }
      : {};

  return (
    <header className="relative isolate overflow-x-clip">
      <Container className="relative pt-[2.5rem] md:pt-[3.5rem] lg:pt-[4.5rem]">
        <Breadcrumb post={post} />

        <div className="relative mx-auto mt-10 max-w-[52rem] md:mt-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-10 hidden deco-mark w-[4rem] rotate-[12deg] lg:block xl:-right-24"
          >
            <DoodleMark
              name="coral"
              color={INK.lavender}
              treatment="draw"
              delay={300}
            />
          </span>

          <Reveal>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {post.category ? (
                <CategoryChip
                  category={post.category}
                  href={post.category.href}
                  size="md"
                />
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1
              {...attrs("title")}
              className="mt-6 text-balance text-h1 font-semibold tracking-display text-text [overflow-wrap:anywhere]"
            >
              {post.title}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p
              {...attrs("excerpt")}
              className="mt-6 text-statement text-text/85"
            >
              {post.excerpt}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div
              {...attrs("author")}
              className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-fine text-text/80"
            >
              <span className="flex items-center gap-3">
                <Portrait name={post.author.name} photo={post.author.photo} />
                <span className="font-semibold text-text">
                  {post.author.name}
                </span>
                {post.author.role ? (
                  <span className="text-text/70">{post.author.role}</span>
                ) : null}
              </span>
              <span
                aria-hidden
                className="h-1 w-1 rounded-pill bg-terracotta"
              />
              <time dateTime={post.publishedAt}>
                {formatJournalDate(post.publishedAt)}
              </time>
              <span
                aria-hidden
                className="h-1 w-1 rounded-pill bg-terracotta"
              />
              <span>{readingLabel(post.readingTime)}</span>
            </div>
          </Reveal>
        </div>
      </Container>

      <Reveal variant="imageReveal" delay={0.1} className="mt-10 md:mt-14">
        <figure
          {...attrs("coverImage")}
          className="relative mx-gutter overflow-clip rounded-[1.5rem] md:mx-0 md:rounded-none"
        >
          <div className="relative aspect-[4/3] max-h-[70vh] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              priority
              sizes="100vw"
              style={{ objectPosition: cover.position ?? "50% 50%" }}
              className="object-cover"
            />
          </div>
        </figure>
      </Reveal>
    </header>
  );
}

/** A small round portrait, or the author's initial on Deep Lilac when there is none. */
function Portrait({
  name,
  photo,
}: {
  name: string;
  photo?: { src: string; alt: string; position?: string };
}) {
  if (photo) {
    return (
      <span className="plate relative block h-10 w-10 shrink-0 overflow-clip rounded-pill bg-cream">
        <Image
          src={photo.src}
          alt=""
          fill
          sizes="40px"
          style={{ objectPosition: photo.position ?? "50% 50%" }}
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-primary text-action font-semibold text-on-primary"
    >
      {name.trim().charAt(0).toUpperCase() || "M"}
    </span>
  );
}

/** Home / Journal / the category / this story — the trail the event page prints, in the same style. */
function Breadcrumb({ post }: { post: JournalPost }) {
  return (
    <Reveal>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label font-medium uppercase tracking-eyebrow text-text/75">
          <Crumb href="/">Home</Crumb>
          <Crumb href={JOURNAL_PATH}>{JOURNAL_COPY.breadcrumbRoot}</Crumb>
          {post.category ? (
            <Crumb href={post.category.href}>{post.category.name}</Crumb>
          ) : null}
          <li className="min-w-0 truncate text-text" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>
    </Reveal>
  );
}

function Crumb({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <Link
        href={href}
        className="-my-3.5 py-3.5 transition-colors duration-300 ease-soft hover:text-text focus-visible:text-text"
      >
        {children}
      </Link>
      <span aria-hidden className="text-text/70">
        /
      </span>
    </li>
  );
}
