import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { getRecentAdditions } from "@/lib/recent";
import { cn } from "@/lib/utils";
import type { RecentItem } from "@/types";

/**
 * The heading. A step below the workshops heading above it, because this
 * section is the lighter one — a shelf of recent things, not a programme.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[1.9rem] xs:text-[2.2rem] sm:text-[2.6rem] md:text-[2.4rem] lg:text-[2.9rem] xl:text-[3.25rem]";

/**
 * The crop each shape is shown in, and how much width it is given.
 *
 * The two go together. A landscape frame is handed more width than a portrait
 * one so the pair land at roughly the same height — matching heights are what
 * make the row read as objects set out on a shelf rather than as tiles of
 * unequal size. The three proportions sit deliberately close together for the
 * same reason; a wilder spread would read as masonry.
 *
 * Widths are viewport-relative below `xl` so the next item is always cut by
 * the right edge, whatever the screen, and fixed at the top end so the
 * collection stops growing once the page has reached its full width.
 *
 * The four steps are tuned against the gutters rather than picked for
 * roundness: at `sm` and `lg` the obvious values put an item's right edge
 * within a few pixels of the screen edge, which reads as a row that happens to
 * end there rather than one that carries on. Each step leaves at least a
 * visible sliver of the following item at its narrowest width.
 */
const SHAPE: Record<RecentItem["shape"], { aspect: string; width: string; drop: string }> = {
  portrait: {
    aspect: "aspect-[4/5]",
    width: "w-[62vw] sm:w-[36vw] md:w-[34vw] lg:w-[24vw] xl:w-[20rem]",
    drop: "",
  },
  landscape: {
    aspect: "aspect-[3/2]",
    width: "w-[76vw] sm:w-[46vw] md:w-[44vw] lg:w-[30vw] xl:w-[26rem]",
    drop: "mt-10 sm:mt-16 lg:mt-20",
  },
  square: {
    aspect: "aspect-square",
    width: "w-[68vw] sm:w-[40vw] md:w-[38vw] lg:w-[27vw] xl:w-[22.5rem]",
    drop: "mt-5 sm:mt-8 lg:mt-10",
  },
};

/**
 * Homepage section 07 — just added.
 *
 * After a section that gave one experience the whole page, this is the
 * opposite gesture: six small glimpses of what the studio has been making,
 * set out in a row and cut off by the right edge of the screen so it is
 * obvious the collection carries on past it.
 *
 * It is a strip, not a carousel. There are no arrows, no dots and no snapping
 * — the row is a plain scroll container, which means it already works with a
 * trackpad, a touch screen, a mouse wheel and the tab key without any of them
 * being special-cased. The only affordance is the item bleeding off the edge,
 * which is the honest one.
 *
 * Nothing here is a card. The images carry the section and each caption is two
 * short lines of type sitting directly under its photograph, on the page's own
 * ground — no borders, no panels, no shadows, nothing to make six pictures
 * look like six products.
 *
 * Server component, awaited in place for the same reason as the workshops
 * section: a <Suspense> boundary would stream this in at the end of the
 * document and leave a visitor without JavaScript holding an empty strip.
 */
export async function JustAdded() {
  const items = await getRecentAdditions();

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="just-added-heading"
      className="bg-surface py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead />
      </Container>

      {/*
        The strip sits outside the container so it can run to the edge of the
        screen, and rebuilds the container's left inset itself so its first
        item still lines up under the heading. The right inset is on the list's
        end padding instead, where it stops the last item sitting flush against
        the edge once the row is scrolled to its end.
      */}
      <Reveal delay={0.15} className="mx-auto mt-14 w-full md:mt-20 lg:mt-24">
        <Collection items={items} />
      </Reveal>
    </section>
  );
}

/**
 * Label and heading left, the line of introduction and the way out right —
 * the same spread as the workshops section, so the two read as siblings.
 */
function SectionHead() {
  return (
    <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
      <div className="col-span-12 md:col-span-6 lg:col-span-7">
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Recently at the Maison
          </p>
        </Reveal>

        <h2 id="just-added-heading" className="mt-8 md:mt-11 lg:mt-14">
          <Stagger>
            <HeadingLine>Just added</HeadingLine>
          </Stagger>
        </h2>
      </div>

      <Reveal
        delay={0.2}
        className="col-span-12 mt-7 md:col-span-5 md:col-start-8 md:mt-0 md:pb-2 lg:col-span-4 lg:col-start-9"
      >
        <p className="max-w-[24rem] text-[0.95rem] leading-[1.85] text-text/80">
          Fresh moments, new pieces and small things happening around the studio.
        </p>
        <SeeAllLink className="mt-7" />
      </Reveal>
    </div>
  );
}

/** One masked line of the heading. The mask needs its own overflow parent. */
function HeadingLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <Reveal as="span" variant="maskUp" className={HEADING_LINE}>
        {children}
      </Reveal>
    </span>
  );
}

/**
 * The row itself.
 *
 * An ordered list, because newest-first is the curation and the order is the
 * only thing telling a visitor what "just added" means.
 *
 * `items-start` is what lets the shelf happen: each item keeps its own height
 * and takes its own drop from the top, so no two captions land on a shared
 * baseline. The drops come from the item's shape rather than its position, so
 * the arrangement holds together whatever order the CMS returns them in.
 *
 * The scroll container is plain, with one concession — a thin scrollbar in the
 * page's own hairline colour. Hiding it outright is the usual move here and
 * the wrong one: on a desktop without a trackpad it is the only thing that
 * says the row scrolls at all.
 */
function Collection({ items }: { items: RecentItem[] }) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden",
        "[scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent]",
      )}
    >
      <ol className="flex w-max items-start gap-6 px-gutter md:gap-8 lg:gap-10">
        {items.map((item, i) => (
          <li key={item.slug} className={cn("shrink-0", SHAPE[item.shape].drop)}>
            <CollectionItem item={item} index={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * One glimpse: a photograph, a title, a line of context.
 *
 * The whole thing is a single link — image and caption together — so there is
 * one tab stop and one focus ring per item rather than two, and no separate
 * button underneath competing with the photograph.
 */
function CollectionItem({ item, index }: { item: RecentItem; index: number }) {
  const { aspect, width } = SHAPE[item.shape];

  return (
    <Link href={item.href} className={cn("group block", width)}>
      <div className={cn("relative w-full overflow-hidden bg-text/5", aspect)}>
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          /*
            Matches the widths above closely enough that the browser never
            fetches a file much larger than the frame it lands in. Everything
            here is below the fold, so nothing is given priority and the images
            further along the row are only fetched as they are scrolled to.
          */
          sizes="(min-width: 1280px) 26rem, (min-width: 1024px) 30vw, (min-width: 768px) 44vw, (min-width: 640px) 46vw, 76vw"
          style={{ objectPosition: item.image.position }}
          className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.035]"
        />
      </div>

      <div className="mt-4 flex items-baseline gap-3 md:mt-5">
        {/*
          The index is the only decoration in the section, and it earns its
          place by saying how far along the row you are — which is the one
          thing a strip with no dots cannot otherwise tell you.
        */}
        <span aria-hidden className="text-[0.65rem] tabular-nums text-text/40">
          {String(index).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-medium leading-snug text-text transition-colors duration-300 ease-soft group-hover:text-primary">
            {item.title}
          </h3>
          {/* /60 measured 3.6:1 at this size — under the 4.5:1 body copy owes. */}
          <p className="mt-1 text-[0.7rem] uppercase tracking-eyebrow text-text/80">
            {item.subtitle}
            {/* Rendered only once the CMS dates an item — see `RecentItem`. */}
            {item.date ? <span className="text-text/40"> · {item.date}</span> : null}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * The way out of the section — a collection link, not a call to action. The
 * same rule-and-arrow the rest of the page uses for "there is more of this".
 */
function SeeAllLink({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/gallery"
        className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
      >
        <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
          See the collection
        </span>
        <span
          aria-hidden
          className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}
